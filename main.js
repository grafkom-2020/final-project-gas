var renderer, sceneParticles, sceneDraw, camera, stats;
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

	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	
	var container = document.getElementById( 'container' );
	container.appendChild( renderer.domElement );
	
	window.addEventListener( 'resize', onWindowResize, false );

	// second scene, allow user to draw
	sceneDraw = new THREE.Scene();
	mouseIsPressed = false;

	renderer.domElement.addEventListener('mousedown', function (){
		mouseCoordinates = getMouseCoordinates();
		mouseIsPressed = true;
		LINES.mousePressed(mouseCoordinates);
		mousePressed();
	});
	renderer.domElement.addEventListener('mousemove', function(){
		mouseCoordinates = getMouseCoordinates();
		if(mouseIsPressed){
			LINES.mouseDragged(mouseCoordinates);
			mouseDragged();
		}
	});
	renderer.domElement.addEventListener ( 'mouseup', function () { 
		mouseIsPressed = false; 
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
	var distance = (-200 - camera.position.z) / mouse.z;

	mouseCoordinates = new THREE.Vector3();
	mouseCoordinates.copy(camera.position).add(mouse.multiplyScalar(distance));
	return mouseCoordinates;
}

function mousePressed(){
}

function mouseDragged(){
}

function mouseReleased(){
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
	renderer.render( sceneParticles, camera );
	PARTICLES.render();
	LINES.render();
}

