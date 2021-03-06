/* global define, $ */
"use strict";

define(function(require, exports, module) {
	const ExtensionManager = require('core/extensionManager');
	
	const Workspace = require('core/workspace');
	const Fn = require('core/fn');
	
	const Editor = require('modules/editor/editor');
	
	const EditorEditors = require('modules/editor/ext/editors');
	const EditorSession = require('modules/editor/ext/session');
	const EditorSplit = require('modules/editor/ext/split');
	
	const SyntaxDetector = require('modules/editor/syntaxDetector');

	const Range = require("ace/range").Range;
	
	const Spectrum = require('./spectrum');
	const Color = require('./color');

	class Extension extends ExtensionManager.Extension {
		constructor() {
			super({
				name: 'css-tools',
				css: [
					'extension',
				]
			});
			
			this.nodes = [];
			this.$el = null;
			this.colorpicker = null;
			this.lastActive = null;
			this.colorpickerChange = false;
			this.columnChangeTimer = null;
			this.colorTooltip = null;
			this.colorActive = null;
			this.colorTimer = null;
			
			this.onBeforeChange = this.onBeforeChange.bind(this);
			this.onChangeColumn = this.onChangeColumn.bind(this);
			this.onClick = this.onClick.bind(this);
			this.onDblClick = this.onDblClick.bind(this);
			this.onScroll = this.onScroll.bind(this);
			this.onFocus = this.onFocus.bind(this);
			this.onClose = this.onClose.bind(this);
			this.onKeyDown = this.onKeyDown.bind(this);
		}
		
		
		settingsChanged(data) {
			
		}
		
		init() {
			super.init();
			
			var self = this;
			
			this.$el = $('<div class="editor-csstools background-color-sidebar">\
				<div class="arrow border-color-sidebar"></div>\
				<div class="csstools-colorpicker">\
					<div class="colorpicker-holder"></div>\
					<ul class="colorpicker-list"></ul>\
				</div>\
			</div>');
			
			Editor.$el.find('.editor-container').append(this.$el);
			
			this.colorpicker = this.$el.find('.colorpicker-holder').spectrum({
				flat: true,
				showInput: false,
				showInitial: true,
				showAlpha: true,
				move: function(tinycolor) {
					var rgba = tinycolor.toRgb();
					if (rgba.a !== 1) {
						self.onColorPicked('rgba(' + rgba.r + ', ' + rgba.g + ', ' + rgba.b + ', ' + rgba.a + ')');
					} else {
						self.onColorPicked('#' + tinycolor.toHex());
					}
				},
			});

			this.$el.find('.colorpicker-list').on("click", '> li', function(e) {
				self.$el.find('.colorpicker-holder').spectrum("set", $(this).attr('data-color'));
				self.onColorPicked($(this).attr('data-color'));
			});
			
			
			EditorEditors.on('session.beforeChange', this.onBeforeChange);
			EditorEditors.on('session.changeColumn', this.onChangeColumn);
			EditorEditors.on('session.click', this.onClick);
			EditorEditors.on('session.dblClick', this.onDblClick);
			EditorEditors.on('session.scroll', this.onScroll);
			EditorSession.on('focus', this.onFocus);
			EditorSession.on('close', this.onClose);
			
			$(document).on("keydown", this.onKeyDown);
		}
		
		destroy() {
			super.destroy();
			
			this.hideColorTooltip();
			this.hideColorPicker();
			
			this.$el.find('.colorpicker-holder').spectrum('destroy');
			this.$el.remove();
			
			this.colorpicker = null;
			this.$el = null;
			this.colorTooltip = null;
			this.colorActive = null;
			this.colorpickerChange = false;
			
			EditorEditors.off('session.beforeChange', this.onBeforeChange);
			EditorEditors.off('session.changeColumn', this.onChangeColumn);
			EditorEditors.off('session.click', this.onClick);
			EditorEditors.off('session.dblClick', this.onDblClick);
			EditorEditors.off('session.scroll', this.onScroll);
			EditorSession.off('focus', this.onFocus);
			EditorSession.off('close', this.onClose);
			
			$(document).off("keydown", this.onKeyDown);
		}
		
		onBeforeChange(e) {
			if (!this.colorpickerChange && this.colorActive) {
				this.hideColorPicker();
			}
		}
		
		onChangeColumn(session, pos) {
			// @deprecated
			// if (Extension.columnChangeTimer) {
			// 	clearTimeout(Extension.columnChangeTimer);
			// 	Extension.columnChangeTimer = null;
			// }
			
			if (this.colorActive) {
				return;
			}
			
			var doc = session.data.doc;

			if (["css", "svg", "less", "scss", "stylus"].indexOf(session.modeAtCursor) === -1) {
				//hide color tooltips for modes that can change inline
				if (session.mode == 'php' || session.mode == 'html') {
					this.hideColorTooltip();
				}
				
				return;
			}
			
			var line = doc.getLine(pos.row);
			var range = session.editor.selection.getRange();
			var color = range.isEmpty() ? this.detect(pos, line) : null;
			
			
			if (color) {
				this.showColorTooltip(session, color);
			} else {
				this.hideColorTooltip();
			}
		}
		
		onClick(session, pos) {
			if (this.colorTooltip &&
				this.colorTooltip.session.id === session.id &&
				this.colorTooltip.range.inside(pos.row, pos.column)
			) {
				if (!this.colorActive) {
					this.openColorPicker();
				}
			} else if (this.colorActive) {
				this.hideColorPicker();
			}
		}
		
		onDblClick(e) {
			this.hideColorTooltip();
		}
		
		onFocus(session) {
			if (this.colorTooltip && this.colorTooltip.session.id !== session.id) {
				this.hideColorPicker();
				this.hideColorTooltip();
			}
		}
		
		onClose(session) {
			if (this.colorTooltip && this.colorTooltip.session.id === session.id) {
				this.hideColorPicker();
				this.hideColorTooltip();
			}
		}
		
		onScroll(session) {
			if (this.colorActive && this.colorActive.session.id === session.id) {
				this.hideColorPicker();
			}
		}
		
		onKeyDown(e) {
			if (!this.colorActive) {
				return;
			}

			// when ESC is pressed, undo all changes made by the colorpicker
			if (e.keyCode === 27) {
				this.hideColorPicker();
			}
		}
		
		detect(pos, line) {
			var colors = line.match(Color.isColor);
			if (!colors || !colors.length) {
				return null;
			}
			
			var start, end;
			var col = pos.column;
			
			for (var i = 0, l = colors.length; i < l; i++) {
				start = line.indexOf(colors[i]);
				end = start + colors[i].length;
				
				if (col >= start && col <= end) {
					return {
						range: Range.fromPoints({
							row: pos.row,
							column: start
						}, {
							row: pos.row,
							column: end
						}),
						color: colors[i]
					};
				}
			}
			return null;
		}
		
		showColorTooltip(session, color) {
			var id = session.id + ':' + color.range.start.row + ':' + color.range.start.column + ':' + color.color;
			
			if (this.colorTooltip) {
				if (this.colorTooltip.id === id) {
					return;
				} else {
					this.hideColorTooltip();
				}
			}
			
			var marker = session.data.addMarker(color.range, "csstools-tooltip", "selection");
			this.colorTooltip = {
				session: session,
				color: color.color,
				range: color.range,
				id: id,
				marker: marker
			};
		}
		
		hideColorTooltip() {
			if (this.colorTooltip) {
				if (this.colorTooltip.session.data) {
					this.colorTooltip.session.data.removeMarker(this.colorTooltip.marker);
				}
				this.colorTooltip = null;
			}
		}
		
		parseColorString(col) {
			var ret = {
				orig: col
			};

			if (typeof Color.names[col] != "undefined") {
				col = Color.fixHex(Color.names[col].toString(16));
			}
			var rgb = col.match(Color.isRgb);
			var hsb = col.match(Color.isHsl);
			if (rgb && rgb.length >= 3) {
				ret.rgb = Color.fixRGB({
					r: rgb[1],
					g: rgb[2],
					b: rgb[3]
				});
				ret.hex = Color.RGBToHex(rgb);
				ret.type = "rgb";
			} else if (hsb && hsb.length >= 3) {
				ret.hsb = Color.fixHSB({
					h: hsb[1],
					s: hsb[2],
					b: hsb[3]
				});
				ret.hex = Color.HSBToHex(hsb);
				ret.type = "hsb";
			} else {
				ret.hex = Color.fixHex(col.replace("#", ""), true);
				ret.type = "hex";
			}

			return ret;
		}
		
		_makeUnique(arr) {
			var i, length, newArr = [];
			for (i = 0, length = arr.length; i < length; i++) {
				if (newArr.indexOf(arr[i]) == -1)
					newArr.push(arr[i]);
			}
			
			arr.length = 0;
			for (i = 0, length = newArr.length; i < length; i++)
				arr.push(newArr[i]);
	
			return arr;
		}
		
		openColorPicker() {
			if (this.colorActive || !this.colorTooltip) {
				return;
			}
			
			var self = this;
			var parsed = this.parseColorString(this.colorTooltip.color);

			// editor.blur();
			
			this.colorActive = {
				session: this.colorTooltip.session,
				color: parsed,
				range: this.colorTooltip.range
			};

			this.$el.show();
			
			// this.$activeColor = {
			// 	color: parsed,
			// 	hex: parsed.hex,
			// 	markerNode: id,
			// 	line: line,
			// 	current: parsed.orig,
			// 	pos: pos,
			// 	marker: this._colors[this.activeColor],
			// 	editor: editor,
			// 	ignore: 0,
			// 	start: editor.session.$undoManager.$undoStack.length,
			// 	listeners: {
			// 		onKeyDown: onKeyDown,
			// 		onScroll: onScroll,
			// 		onCursorChange: onCursorChange
			// 	}
			// };
			
			this.$el.find('.colorpicker-holder').spectrum("set", this.colorTooltip.color);
			this.$el.find('.colorpicker-holder').spectrum("show");

			this.updateColorTools(this.colorActive.session.data);

			this.position();
		}
		
		hideColorPicker(update) {
			if (!this.colorActive) {
				return;
			}
			
			this.colorActive = null;
			this.$el.hide();
			
			this.hideColorTooltip();
		}
		
		updateColorTools(session) {
			var lines = session.getLines(0, 2000);
			var m;
			var colors = [];
			for (var i = 0, l = lines.length; i < l; ++i) {
				if (!(m = lines[i].match(Color.isColor)))
					continue;
				colors = colors.concat(m);
			}
			colors = this._makeUnique(colors);

			var out = [];
			var parsed;
			for (i = 0, l = Math.min(colors.length, 28); i < l; ++i) {
				out.push('<li class="color" data-color="', colors[i], '" title="', colors[i], '"><span style="background-color: ', colors[i], '"></span></li>');
			}
			this.$el.find('.colorpicker-list').html(out.join(""));
		}
		
		onColorPicked(color) {
			var self = this;
			
			if (!this.colorActive) {
				return;
			}
			
			if (this.colorTimer) {
				clearTimeout(this.colorTimer);
			}
			
			this.colorTimer = setTimeout(function() {
				this.colorTimer = null;
				
				if (!this.colorActive) {
					return;
				}
				
				var session = this.colorActive.session;
				
				this.colorpickerChange = true;
				
				this.colorActive.range.end = session.data.doc.replace(this.colorActive.range, color);
				this.colorActive.color = this.parseColorString(color);
				
				//update tooltip
				session.data.removeMarker(this.colorTooltip.marker);
				this.colorTooltip.color = color;
				this.colorTooltip.marker = session.data.addMarker(this.colorActive.range, "csstools-tooltip", "selection");
				
				this.colorpickerChange = false;
				
				this.position();
			}.bind(this), 200);
		}
		
		position(color) {
			if (!this.colorActive) {
				return;
			}

			var session = this.colorActive.session;
			var renderer = session.editor.renderer;
			var start = this.colorActive.range.start;
			var end = this.colorActive.range.end;
			

			// calculate the x and y (top and left) position of the colorpicker
			var coordsStart = renderer.textToScreenCoordinates(start.row, start.column);
			var coordsEnd = renderer.textToScreenCoordinates(end.row, end.column);
			
			var x = coordsEnd.pageX;
			var y = coordsEnd.pageY;
			
			var parentOffset = this.$el.parent()[0].getBoundingClientRect();
			x -= parentOffset.left;
			x += 10;
			y -= parentOffset.top;
			//center vertically
			y -= (this.$el.height() - renderer.lineHeight) / 2;
			
			var arrowY = (this.$el.height() - 14) / 2;
			
			if (y < 0) {
				arrowY += y;
				y = 0;
			} else if (y + this.$el.height() > this.$el.parent().height()) {
				var oldY = y;
				y = this.$el.parent().height() - this.$el.height();
				arrowY += oldY - y;
			}
			
			if (x + this.$el.width() > this.$el.parent().width()) {
				x = coordsStart.pageX - parentOffset.left - this.$el.width() - 10;
				this.$el.addClass('lefted');
			} else {
				this.$el.removeClass('lefted');
			}
			
			this.$el.css({
				top: y,
				left: x
			}).find('.arrow').css({
				top: arrowY
			});
		}
	}

	module.exports = new Extension();
});