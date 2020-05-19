var renderer, sceneParticles, sceneDraw, camera, stats;
var cameraInit = {
	x: 0, 
	y: 0, 
	z: 0
};
var state = {
	pressedKeys:[]
};
// var isAnimating = false;

var mouseIsPressed, offset;
var realFileBtn, customBtn, customTxt, submitBtn;
var gui, parameters;

init();

async function init() {
	// basic three init
	sceneParticles = new THREE.Scene();
	await PARTICLES.init(sceneParticles);
	LINES.init();
	camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 10000 );
	camera.position.z = 300;
	cameraInit.x = camera.position.x;
	cameraInit.y = camera.position.y;
	cameraInit.z = camera.position.z;

	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	
	var container = document.getElementById( 'container' );
	container.appendChild( renderer.domElement );
	
	window.addEventListener( 'resize', onWindowResize, false );
	document.onkeydown = keydown;
	document.onkeyup = keyup;

	// second scene, allow user to draw
	sceneDraw = new THREE.Scene();
	mouseIsPressed = false;

	renderer.domElement.addEventListener('mousedown', function (){
		mousePressed();
	});
	renderer.domElement.addEventListener('mousemove', function(){
		mouseDragged();
	});
	renderer.domElement.addEventListener ( 'mouseup', function () { 
		mouseReleased(); 
	});

	/* UI Start */
	/* image load buttons */
	realFileBtn = document.getElementById("real-file");
	customBtn = document.getElementById("custom-button");
	customTxt = document.getElementById("custom-text");
	submitBtn = document.getElementById("submit-btn");

	offset = customBtn.getBoundingClientRect().height;

	customBtn.addEventListener("click", function() {
		realFileBtn.click();
	});

	realFileBtn.addEventListener("change", function() {
		if (realFileBtn.value) {
			customTxt.innerHTML = realFileBtn.value.match(
			/[\/\\]([\w\d\s\.\-\(\)]+)$/
			)[1];
			submitBtn.style.display = "inline";
		} else {
			customTxt.innerHTML = "No file chosen, yet.";
			submitBtn.style.display = "none";
		}

	});

	submitBtn.addEventListener("click", function(){
		if (realFileBtn.value) {
			PARTICLES.changeImageSrc(realFileBtn.files[0]);
		}
	});
	
	// UI BOX
	gui = new dat.GUI();
	parameters = {
		threshold: 1.35,
		particleRainbow: false,
		particleColor: "#ffffff",
		color: "#ffffff",
		material: "Point",
		random: true
	};

	LINES.changeLineColor(parameters.color);
	rainbow = true;

	var particleThresholdChange = gui.add(parameters, 'threshold', 0, 2).name('Particle threshold').listen();
	particleThresholdChange.onChange(function(value){
		PARTICLES.changeTreshold(value);
	});

	var particleRainbowChange = gui.add(parameters, 'particleRainbow').name('Particle Rainbow').listen();
	particleRainbowChange.onChange(function(value){
		PARTICLES.toggleRainbow();
	});

	var particleColorChange = gui.addColor(parameters, 'particleColor').name('Particle color').listen();
	particleColorChange.onChange(function(value){
		PARTICLES.changeParticleColor(value);
	});


	var colorChange = gui.addColor(parameters, 'color').name('Line color').listen();
	colorChange.onChange(function(value){
		LINES.changeLineColor(value);
	});

	var materialChange = gui.add(parameters, 'material', ["Basic", "Point"]).name('Line material').listen();
	materialChange.onChange(function(value){
		if(value == "Basic") {
			LINES.changeLineMode("Basic");
		} else{
			LINES.changeLineMode("Point");
		}
	});

	var randomColor = gui.add(parameters, 'random').name('Random Color').listen();
	randomColor.onChange(function(value){
		LINES.toggleRainbowOption();
	});
	gui.open();

	animate();
}

function getMouseCoordinates(){
	var mouse = new THREE.Vector3();
	mouse.set(
		( event.clientX / window.innerWidth ) * 2 - 1,
		- ( (event.clientY - offset) / window.innerHeight ) * 2 + 1,
		0.5 );
	mouse.unproject(camera);
	mouse.sub(camera.position).normalize();
	var distance = (-camera.position.z) / mouse.z;

	mouseCoordinates = new THREE.Vector3();
	mouseCoordinates.copy(camera.position).add(mouse.multiplyScalar(distance));
	return mouseCoordinates;
}

function mousePressed(){
	resetCameraCoords();
	mouseCoordinates = getMouseCoordinates();
	mouseIsPressed = true;
	LINES.mousePressed(mouseCoordinates);
}

function mouseDragged(){
	if(mouseIsPressed){
		mouseCoordinates = getMouseCoordinates();
		resetCameraCoords();
		LINES.mouseDragged(mouseCoordinates);
	}
}

function mouseReleased(){
	resetCameraCoords();
	mouseIsPressed = false; 
}

function keydown(event) {
	state.pressedKeys[event.code] = true;
}

function keyup(event) {
	state.pressedKeys[event.code] = false;
}

function resetCameraCoords() {
	camera.position.x = cameraInit.x;	
	camera.position.y = cameraInit.y;	
	camera.position.z = cameraInit.z;	
	camera.updateProjectionMatrix();
}	

function getKeyboardInput() {
	var speed = 10;
	if (state.pressedKeys["KeyA"]) { // left
		camera.position.x -= speed;
	} else if (state.pressedKeys["KeyD"]) { // right
		camera.position.x += speed;
	} else if (state.pressedKeys["KeyQ"]) { // down
		camera.position.y -= speed;
	} else if (state.pressedKeys["KeyE"]) { // up
		camera.position.y += speed;
	} else if (state.pressedKeys["KeyW"]) { // forward
		camera.position.z -= speed;
	} else if (state.pressedKeys["KeyS"]) { // backward
		camera.position.z += speed;
	}
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
	requestAnimationFrame( animate );
	render();
}

function render() {
	getKeyboardInput();
	// camera.position.x = ( cameraOffset.x );
	// camera.position.y = ( cameraOffset.y );
	// camera.position.z = ( cameraOffset.z );
	camera.lookAt( sceneParticles.position );
	renderer.render( sceneParticles, camera );
	PARTICLES.render();
	LINES.render();
}

