(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = global || self, factory(global.PARTICLES = {}));
}(this, (function (exports) {
	var sceneParticles;

	var newParticleColors = false, tresholdMultiplierDefault = 1.35, newTresholdMultiplier;
	var particleSystem, uniforms, geometry, shaderMaterial;
	var userImageInput, image, imgdata, imgw, imgh;

	var destination = [];
	var speed = [];
	
	
	// Function to call on initialization
	async function init(inSceneParticles) {
		sceneParticles = inSceneParticles;

		uniforms = {
			pointTexture: { value: new THREE.TextureLoader().load( "./assets/spark1.png" ) },
			uDepth: {value: 2.0}
		};

		shaderMaterial = new THREE.ShaderMaterial({
			uniforms: uniforms,
			vertexShader: document.getElementById( 'vertexshader' ).textContent,
			fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
			
			blending: THREE.AdditiveBlending,
			depthTest: false,
			transparent: true,
			vertexColors: true
		});

		const prom = new Promise(resolve => {drawImageParticles(); resolve()});
		await prom;
	}

	// Function to call on each render call
	function render() {
    var time = Date.now() * 0.001;
    
    var sizes = geometry.attributes.size.array;
    for ( var i = 0; i < sizes.length; i ++ ) {
        sizes[ i ] = 5 * ( 1 + Math.sin( 0.1 * i + time ) ) + 5;
    }

    var particle = geometry.attributes.position.array;
    var speedidx = 0;
    for ( var i = 0; i < particle.length; i += 3 ) {
        particle[ i ] += (destination[i] - particle[i]) * speed[speedidx];
        particle[ i+1 ] += (destination[i+1] - particle[i+1]) * speed[speedidx];
        particle[ i+2 ] += (destination[i+2] - particle[i+2]) * speed[speedidx];
        speedidx++;
    }
    
    geometry.attributes.size.needsUpdate = true;
    geometry.attributes.position.needsUpdate = true; 

    if (newParticleColors) {
			var color = geometry.attributes.color.array;
			
			let newColor = new THREE.Color();
			newColor.setHex(newParticleColors.replace("#", "0x"));
			for ( var i = 0; i < color.length; i += 3 ) {
				color[i] = newColor.r
				color[i+1] = newColor.g
				color[i+2] = newColor.b;
			}
			newParticleColors = undefined;
			geometry.attributes.color.needsUpdate = true;
    }
	}

	// Convert image to points
	async function drawImageParticles(){
		// Diganti jadi while karena terkadang particle system terpanggil 2 kali
		while(sceneParticles.getObjectByName("particleSystem")) {
			sceneParticles.remove(sceneParticles.getObjectByName("particleSystem"));
		}

		var threshold = 0;

		// f is ration/constant of real image to particle/pixelized version
		var f = 1; 
		var promises = [];
		var p1 = new Promise(resolve => {
			image = new Image();

			// If user inputted a custom image to draw particles
			if (userImageInput) {
				image.src = userImageInput;
			} else {
				image.src = "./assets/doggo1.jpg";
			}

			image.onload = function() {
				f = Math.floor(image.height / 180.0);
				if(document.getElementById("canvas")) {
					document.getElementById("canvas").remove();
				}
				var canvas = document.createElement("canvas");
				canvas.width = window.innerWidth;
				canvas.height = window.innerHeight;
				var ctx = canvas.getContext("2d");
	
				imgw = image.width / f;
				imgh = image.height / f;
				ctx.drawImage(image, 0, 0, imgw, imgh);
				imgdata = ctx.getImageData(0, 0, imgw, imgh);
				var pixels = imgdata.data;
				
				for (var i = 0, n = pixels.length; i < n; i += 4) {
					// Skip pixels, only process pixels that needs to be processed
					var grayscale = 0.21 * pixels[i] + 0.71 * pixels[i+1] + 0.07 * pixels[1+2];
					pixels[i  ] = grayscale;        // red
					pixels[i+1] = grayscale;        // green
					pixels[i+2] = grayscale;        // blue
					threshold += pixels[i];
				}
				resolve();
			}
	
		})
		await p1;
	
		var p2 = new Promise(resolve => {
			geometry = new THREE.BufferGeometry();
			
			var positions = [];
			var colors = [];
			var sizes = [];
			destination = [];
			speed = [];
			
			totPixel = imgdata.height * imgdata.width;
			threshold /= totPixel;
			if (newTresholdMultiplier) {
				threshold *= newTresholdMultiplier;
				newTresholdMultiplier = undefined;
			} else {
				threshold *= tresholdMultiplierDefault;
			}
				
			var color = new THREE.Color();
			for (var y = 0, y2 = imgdata.height; y < y2; y += 1) {
				for (var x = 0, x2 = imgdata.width; x < x2; x += 1) {
					if (imgdata.data[(x * 4 + y * 4 * imgdata.width)] >= threshold) {
						positions.push(Math.random() * 1000 - 500);
						positions.push(Math.random() * 1000 - 500);
						positions.push(-Math.random() * 500);
		
						destination.push(x - imgdata.width / 2);
						destination.push(-y + imgdata.height / 2);
						destination.push((Math.random() * 2 - 1)* 10);
		
						speed.push(Math.random() / 10 + 0.05);
		
						color.setHex(0xFFFFFF);
				
						colors.push(color.r, color.g, color.b);
						
						sizes.push( Math.random() * 5 + 5 );
						
					}
				}
			}
			geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
			geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
			geometry.setAttribute( 'size', new THREE.Float32BufferAttribute( sizes, 1 ).setUsage( THREE.DynamicDrawUsage ) );
			
			particleSystem = new THREE.Points( geometry, shaderMaterial );
			particleSystem.name = "particleSystem";
			
			sceneParticles.add( particleSystem );
			resolve();
		})
	
		await p2;
	}
	
	function changeImageSrc(imageSrc) {
		userImageInput = URL.createObjectURL(imageSrc);
		drawImageParticles();
	}

	function changeParticleColor(inNewColor) {
		newParticleColors = inNewColor;
	}

	function changeTreshold(inTresholdMultiplier) {
		newTresholdMultiplier = inTresholdMultiplier;
		drawImageParticles();
	}
	
	exports.init = init;
	exports.render = render;
	exports.drawImageParticles = drawImageParticles;
	exports.changeImageSrc = changeImageSrc;
	exports.changeParticleColor = changeParticleColor;
	exports.changeTreshold = changeTreshold;
})));
