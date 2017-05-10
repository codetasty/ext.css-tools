define(function(require, exports, module) {
	
	var names = {"aliceblue":15792383,"antiquewhite":16444375,"aqua":65535,"aquamarine":8388564,"azure":15794175,"beige":16119260,"bisque":16770244,"black":0,"blanchedalmond":16772045,"blue":255,"blueviolet":9055202,"brown":10824234,"burlywood":14596231,"cadetblue":6266528,"chartreuse":8388352,"chocolate":13789470,"coral":16744272,"cornflowerblue":6591981,"cornsilk":16775388,"crimson":14423100,"cyan":65535,"darkblue":139,"darkcyan":35723,"darkgoldenrod":12092939,"darkgray":11119017,"darkgrey":11119017,"darkgreen":25600,"darkkhaki":12433259,"darkmagenta":9109643,"darkolivegreen":5597999,"darkorange":16747520,"darkorchid":10040012,"darkred":9109504,"darksalmon":15308410,"darkseagreen":9419919,"darkslateblue":4734347,"darkslategray":3100495,"darkslategrey":3100495,"darkturquoise":52945,"darkviolet":9699539,"deeppink":16716947,"deepskyblue":49151,"dimgray":6908265,"dimgrey":6908265,"dodgerblue":2003199,"firebrick":11674146,"floralwhite":16775920,"forestgreen":2263842,"fuchsia":16711935,"gainsboro":14474460,"ghostwhite":16316671,"gold":16766720,"goldenrod":14329120,"gray":8421504,"grey":8421504,"green":32768,"greenyellow":11403055,"honeydew":15794160,"hotpink":16738740,"indianred":13458524,"indigo":4915330,"ivory":16777200,"khaki":15787660,"lavender":15132410,"lavenderblush":16773365,"lawngreen":8190976,"lemonchiffon":16775885,"lightblue":11393254,"lightcoral":15761536,"lightcyan":14745599,"lightgoldenrodyellow":16448210,"lightgray":13882323,"lightgrey":13882323,"lightgreen":9498256,"lightpink":16758465,"lightsalmon":16752762,"lightseagreen":2142890,"lightskyblue":8900346,"lightslategray":7833753,"lightslategrey":7833753,"lightsteelblue":11584734,"lightyellow":16777184,"lime":65280,"limegreen":3329330,"linen":16445670,"magenta":16711935,"maroon":8388608,"mediumaquamarine":6737322,"mediumblue":205,"mediumorchid":12211667,"mediumpurple":9662680,"mediumseagreen":3978097,"mediumslateblue":8087790,"mediumspringgreen":64154,"mediumturquoise":4772300,"mediumvioletred":13047173,"midnightblue":1644912,"mintcream":16121850,"mistyrose":16770273,"moccasin":16770229,"navajowhite":16768685,"navy":128,"oldlace":16643558,"olive":8421376,"olivedrab":7048739,"orange":16753920,"orangered":16729344,"orchid":14315734,"palegoldenrod":15657130,"palegreen":10025880,"paleturquoise":11529966,"palevioletred":14184595,"papayawhip":16773077,"peachpuff":16767673,"peru":13468991,"pink":16761035,"plum":14524637,"powderblue":11591910,"purple":8388736,"red":16711680,"rosybrown":12357519,"royalblue":4286945,"saddlebrown":9127187,"salmon":16416882,"sandybrown":16032864,"seagreen":3050327,"seashell":16774638,"sienna":10506797,"silver":12632256,"skyblue":8900331,"slateblue":6970061,"slategray":7372944,"slategrey":7372944,"snow":16775930,"springgreen":65407,"steelblue":4620980,"tan":13808780,"teal":32896,"thistle":14204888,"tomato":16737095,"turquoise":4251856,"violet":15631086,"wheat":16113331,"white":16777215,"whitesmoke":16119285,"yellow":16776960,"yellowgreen":10145074};
	
	var patterns = {
		rgb: "rgba?\\(\\s*\\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\\b\\s*,\\s*\\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\\b\\s*,\\s*\\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\\b\\s*(:?\\s*,\\s*(?:1|0|0?\\.[0-9]{1,2})\\s*)?\\)",
		rgb_alt: "rgba?\\(\\s*\\b(\\d{1,2}|100)%\\s*,\\s*\\b(\\d{1,2}|100)%\\s*,\\s*\\b(\\d{1,2}|100)%\\s*(:?\\s*,\\s*(?:1|0|0?\\.[0-9]{1,2})\\s*)?\\)",    
		hsl: "hsla?\\(\\s*\\b([1-2][0-9][0-9]|360|3[0-5][0-9]|[1-9][0-9]|[0-9])\\b\\s*,\\s*\\b(\\d{1,2}|100)%\\s*,\\s*\\b(\\d{1,2}|100)%\\s*(:?\\s*,\\s*(?:1|0|0?\\.[0-9]{1,2})\\s*)?\\)"
	};
	
	module.exports = {
		names: names,
		isColor: new RegExp("(#([0-9A-Fa-f]{3,6})\\b)"
			+ "|\\b(" + Object.keys(names).join("|") + ")\\b"
			+ "|(" + patterns.rgb + ")"
			+ "|(" + patterns.rgb_alt + ")"
			+ "|(" + patterns.hsl + ")", "gi"),
		isRgb: new RegExp("(?:" + patterns.rgb + ")"
			+ "|(?:" + patterns.rgb_alt + ")"),
		isHsl: new RegExp(patterns.hsl),
		HSBToHex: function(hsb) {
			return this.RGBToHex(this.HSBToRGB(hsb));
		},
		hexToHSB: function(hex) {
			return this.RGBToHSB(this.hexToRGB(hex));
		},
		RGBToHSB: function(rgb) {
			var hsb = {
				h: 0,
				s: 0,
				b: 0
			}, min = Math.min(rgb.r, rgb.g, rgb.b),
				max = Math.max(rgb.r, rgb.g, rgb.b),
				delta = max - min
			return hsb.b = max, hsb.s = 0 != max ? 255 * delta / max : 0, hsb.h = 0 != hsb.s ? rgb.r == max ? (rgb.g - rgb.b) / delta : rgb.g == max ? 2 + (rgb.b - rgb.r) / delta : 4 + (rgb.r - rgb.g) / delta : -1, hsb.h *= 60, hsb.h < 0 && (hsb.h += 360), hsb.s *= 100 / 255, hsb.b *= 100 / 255, hsb;
		},
		hexToRGB: function(hex) {
			return hex = parseInt(hex.indexOf("#") > -1 ? hex.substring(1) : hex, 16), {
				r: hex >> 16,
				g: (65280 & hex) >> 8,
				b: 255 & hex
			};
		},
		RGBToHex: function(rgb) {
			return ("00000" + (rgb.r << 16 | rgb.g << 8 | rgb.b).toString(16)).slice(-6);
		},
		fixHex: function(hex, asBrowser) {
			hex = hex.toLowerCase().replace(/[^a-f0-9]/g, "");
			var len = 6 - hex.length;
			if (len > 0) {
				var ch = "0",
					o = [],
					i = 0;
				for (asBrowser && (ch = hex.charAt(hex.length - 1), o.push(hex)); len > i; i++) {
					o.push(ch);
					asBrowser || o.push(hex), hex = o.join("");
				}
			}

			return hex;
		},
		fixHSB: function(hsb) {
			return {
				h: Math.min(360, Math.max(0, hsb.h)),
				s: Math.min(100, Math.max(0, hsb.s)),
				b: Math.min(100, Math.max(0, hsb.b))
			};

		},
		fixRGB: function(rgb) {
			return {
				r: Math.min(255, Math.max(0, rgb.r)),
				g: Math.min(255, Math.max(0, rgb.g)),
				b: Math.min(255, Math.max(0, rgb.b))
			};
		}
	};
});