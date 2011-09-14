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

form.onsubmit = function(e) {
	e && e.preventDefault();
	
	var color = input.value.trim(),
		previous = body.style.backgroundColor;
		
	body.style.backgroundColor = '';
	body.style.backgroundColor = color;
	
	if(!body.style.backgroundColor) {
		body.style.backgroundColor = previous;
		input.className = 'invalid';
		return;
	}
	
	input.removeAttribute('class');
	
	ctx.fillStyle = color;
	ctx.clearRect(0, 0, 16, 16);
	ctx.fillRect(0, 0, 16, 16);
	
	// Get RGB
	var rgb = [].slice.apply(ctx.getImageData(0, 0, 1, 1).data);
		
	if(rgb[3] === 255) {
		rgb.length = 3;	
	}

	var hex = rgb.map(function(a) {
		return (a < 16? '0' : '') + a.toString(16);
	}).join('');
	
	if(rgb.length === 3) {
		if(/(([\da-z])\2){3}/i.test(hex)) {
			hex = hex.charAt(0) + hex.charAt(2) + hex.charAt(4);
		}
	}
	
	out[1].value = '#' + hex;
	
	if(rgb.length > 3) {
		rgb[3] = ('' + Math.round(rgb[3] / 2.55) / 100).replace('0.', '.');
	}
	
	out[0].value = 'rgb' + (rgb.length > 3? 'a' : '') + '(' + rgb.join(', ') + ')';
	
	
	// Now it's HSL's turn
	if(color.indexOf('hsl') === 0) {
		out[2].value = color.replace('0.', '.');
	}
	else {
		rgb[0] /= 2.55; rgb[1] /= 2.55; rgb[2] /= 2.55;
		
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
			hsl[2] += '%';
		}
		else {
			hsl[0] = 0;
			hsl[1] = '0%';
		}
		
		if(rgb.length > 3) {
			hsl[3] = rgb[3];
		}
		
		out[2].value = 'hsl' + (hsl.length > 3? 'a' : '') + '(' + hsl.join(', ') + ')';
	}
	
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