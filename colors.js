function $(expr) { return document.querySelector(expr); }
function $$(expr) { return document.querySelectorAll(expr); }

var body = document.body,
	canvas = document.createElement('canvas'),
	ctx = canvas.getContext('2d'),
	input = $('#color'),
	form = $('form'),
	out = $$('output > input');
	
canvas.width = canvas.height = 16;
body.appendChild(canvas);

// Simple class for handling sRGB colors
function Color(rgba) {
	if (rgba === 'transparent') {
		rgba = [0,0,0,0];
	}
	else if (typeof rgba === 'string') {
		var rgbaString = rgba;
		rgba = rgbaString.match(/rgba?\(([\d.]+), ([\d.]+), ([\d.]+)(?:, ([\d.]+))?\)/);
		
		if (rgba) {
			rgba.shift();
		}
		else {
			throw new Error('Invalid string: ' + rgbaString);
		}
	}
	
	if (rgba[3] === undefined) {
		rgba[3] = 1;	
	}
	
	rgba = rgba.map(function (a) { return Math.round(a * 100)/100 });
	
	this.rgba = rgba;
}

Color.prototype = {
	get rgb () {
		return this.rgba.slice(0,3);
	},
	
	get alpha () {
		return this.rgba[3];
	},
	
	set alpha (alpha) {
		this.rgba[3] = alpha;
	},
	
	get hex () {
		var hex = this.rgb.map(function(a) {
			return (a < 16? '0' : '') + a.toString(16);
		}).join('')
		
		if(this.alpha >= 1) {
			if(/(([\da-z])\2){3}/i.test(hex)) {
				hex = hex.charAt(0) + hex.charAt(2) + hex.charAt(4);
			}
		}
		else {
			var alpha255 = Math.round(this.alpha * 255);
			
			hex += (alpha255 < 16? '0' : '') + alpha255.toString(16);
		}
		
		return '#' + hex;
	},
	
	get hsl () {
		var rgb = this.rgb.map(function(a) { return a / 2.55 });
		
		var hsl = [],
			max = Math.max.apply(Math, rgb),
			min = Math.min.apply(Math, rgb);
			
		hsl[2] = Math.round((min + max)/2);
		
		var d = max - min;
		
		if(d !== 0) {
			hsl[1] = Math.round(d*100 / (100 - Math.abs(2*hsl[2] - 100))) + '%';
			
			switch(max){
				case rgb[0]: hsl[0] = (rgb[1] - rgb[2]) / d + (rgb[1] < rgb[2] ? 6 : 0); break;
				case rgb[1]: hsl[0] = (rgb[2] - rgb[0]) / d + 2; break;
				case rgb[2]: hsl[0] = (rgb[0] - rgb[1]) / d + 4;
			}
			
			hsl[0] = Math.round(hsl[0]*60);
		}
		else {
			hsl[0] = 0;
			hsl[1] = '0%';
		}
		
		hsl[2] += '%';
		
		return hsl;
	},
	
	toString: function() {
		return 'rgb' + (this.alpha < 1? 'a' : '') + '(' + (this.rgba.slice(0, this.alpha >= 1? 3 : 4).join(', ') + ')').replace(/\b0\./, '.');
	},
	
	toHSLString: function() {
		var hsl = this.hsl;
		
		return 'hsl' + (this.alpha < 1? 'a' : '') + '(' + hsl.join(', ') + ((this.alpha < 1? ', ' + this.alpha : '') + ')').replace(/\b0\./, '.');
	},
	
	clone: function() {
		return new Color(this.rgba);
	}
}

form.onsubmit = function(e) {
	e && e.preventDefault();
	
	var oldColor = getComputedStyle(document.body).backgroundColor;
	
	document.body.style.background = '';
	document.body.style.background = input.value;

	var newColor = document.body.style.background;
	
	if (!newColor) {
		// Invalid color
		document.body.style.background = oldColor;
		input.className = 'invalid';
		
		return;
	}
	
	newColor = getComputedStyle(document.body).backgroundColor;
	
	input.removeAttribute('class');
	
	var color = new Color(newColor);
	
	out[1].value = color.hex;
	
	out[0].value = color + '';
	
	out[2].value = color.toHSLString();
	
	ctx.fillStyle = color + '';
	ctx.clearRect(0, 0, 16, 16);
	ctx.fillRect(0, 0, 16, 16);
	
	$('link[rel="shortcut icon"]').setAttribute('href', canvas.toDataURL());
	document.title = color + ' ✿ CSS.coloratum';
	
	if(history.pushState) {
		history.pushState(null, null, '#' + encodeURIComponent(input.value));
	}
	
	return false;
};

input.onblur = function() {
	if(input.className) {
		return;
	}
	
	var hashchange = onhashchange;
	window.onhashchange = null;
	location.hash = '#' + encodeURIComponent(input.value);
	window.onhashchange = hashchange;
}

input.oninput = function() { form.onsubmit() };

(onhashchange = function() { 
	var color = location.hash.slice(1) || 'slategray';
	
	try {
		input.value = decodeURIComponent(color);
	}
	catch(e) { input.value = color };
	
	form.onsubmit();
})();

for(var i=0; i<out.length; i++) {
	out[i].onclick = function () { this.select(); }
}