(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = global || self, factory(global.LINES = {}));
}(this, (function (exports) {

	var lineColor, lineMode, drawingSolid, drawingPoint, rainbow = true;

	function init() {
		uniforms = {
			pointTexture: { value: new THREE.TextureLoader().load("./assets/spark1.png") },
			uDepth: { value: 2.0 }
		};

		shaderMaterial = new THREE.ShaderMaterial({
			uniforms: uniforms,
			vertexShader: document.getElementById('vertexshader').textContent,
			fragmentShader: document.getElementById('fragmentshader').textContent,
			blending: THREE.AdditiveBlending,
			depthTest: false,
			transparent: true,
			vertexColors: true
		});
	}

	function render() {
		var time = Date.now() * 0.001;
		if(drawingSolid || drawingPoint){
			renderer.autoClear = false;
			renderer.render(sceneDraw, camera);
			
			if(drawingPoint){
				var lsizes = drawingPoint.geometry.attributes.size.array;
				for ( var i = 0; i < lsizes.length; i ++ ) {
					lsizes[ i ] = 10 * ( 1 + Math.sin( 0.1 * i + time ) ) + 10;
				}
				drawingPoint.geometry.attributes.position.needsUpdate = true;
				drawingPoint.geometry.attributes.color.needsUpdate = true;
				drawingPoint.geometry.attributes.size.needsUpdate = true;
			}
		}
	}
	
	function mouseDragged() {
		if (lineMode == "Basic") {
			continueLineBasic();
		} else {
			createLinePoint();
		}
	}

	function mousePressed() {
		if (lineMode == "Basic") {
			createLineBasic();
		} else {
			createLinePoint();
		}
	}

	function createLineBasic() {
		var lineGeometry = new THREE.Geometry();
		lineGeometry.vertices.push(mouseCoordinates);
		if (rainbow) {
			var lineMaterial = new THREE.LineBasicMaterial({
				vertexColors: THREE.VertexColors
			});
		} else {
			var lineMaterial = new THREE.LineBasicMaterial({
				color: lineColor
			});
		}
		var lineSolid = new THREE.Line(lineGeometry, lineMaterial);
		sceneDraw.add(lineSolid);
		drawingSolid = lineSolid;
	}

	function continueLineBasic() {
		var lineSolid = drawingSolid;
		var newLineGeometry = new THREE.Geometry();
		newLineGeometry.vertices = lineSolid.geometry.vertices;
		newLineGeometry.vertices.push(mouseCoordinates);
		if (rainbow) {
			for (var i = 0; i < newLineGeometry.vertices.length; i++) {
				newLineGeometry.colors[i] = new THREE.Color(Math.random(), Math.random(), Math.random());
			}
		}
		lineSolid.geometry = newLineGeometry;
	}

	function createLinePoint() {
		var lineGeometry = new THREE.BufferGeometry();

		var positions = [];
		var colors = [];
		var sizes = [];

		if (drawingPoint) {
			positions = Array.prototype.slice.call(drawingPoint.geometry.attributes.position.array);
			colors = Array.prototype.slice.call(drawingPoint.geometry.attributes.color.array);
			sizes = Array.prototype.slice.call(drawingPoint.geometry.attributes.size.array);

			if (sceneDraw.getObjectByName("line")) sceneDraw.remove(sceneDraw.getObjectByName("line"));
		}
		var particlePerPoint = 20;
		var color = new THREE.Color();
		for (var i = 0; i < particlePerPoint; i += 1) {
			positions.push(mouseCoordinates.x + (Math.random() * 10.0 - 5.0));
			positions.push(mouseCoordinates.y + (Math.random() * 10.0 - 5.0));
			positions.push(mouseCoordinates.z + (Math.random() * 10.0));

			if (rainbow) {
				color.setHSL(Math.random() * 360, 1.0, 0.5);
				colors.push(color.r, color.g, color.b);
			}
			else {
				color.setHex(lineColor.replace("#", "0x"));
				colors.push(color.r, color.g, color.b);
			}
			sizes.push(Math.random() * 10 + 10);
		}
		lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
		lineGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
		lineGeometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1).setUsage(THREE.DynamicDrawUsage));

		var lineParticle = new THREE.Points(lineGeometry, shaderMaterial);
		lineParticle.name = "line";
		sceneDraw.add(lineParticle);
		drawingPoint = lineParticle;
	}

	function toggleRainbowOption() {
		rainbow = !rainbow;
	}

	function changeLineColor(inLineColor) {
		lineColor = inLineColor;
	}

	function changeLineMode(inLineMode) {
		lineMode = inLineMode;
	}


	exports.init = init;
	exports.render = render;
	exports.mouseDragged = mouseDragged;
	exports.mousePressed = mousePressed;
	exports.changeLineMode = changeLineMode;
	exports.changeLineColor = changeLineColor;
	exports.toggleRainbowOption = toggleRainbowOption;
	// exports.drawImageParticles = drawImageParticles;
	// exports.onchangeImageSrc = onchangeImageSrc;
})));
