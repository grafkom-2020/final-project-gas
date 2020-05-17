var renderer, scene, camera, ww, wh, particles, geometry, material;
var flag = false, play = false;

var mouseIsPressed, mouseCoordinates, drawingSolid;

ww = window.innerWidth,
wh = window.innerHeight;

var centerVector = new THREE.Vector3(0, 0, 0);
var previousTime = 0;

var getImageData = function(image) {

	var canvas = document.createElement("canvas");
	canvas.width = image.width;
    canvas.height = image.height;
    console.log("image " + image);

	var ctx = canvas.getContext("2d");
	ctx.drawImage(image, 0, 0);

	imgdata = ctx.getImageData(0, 0, image.width, image.height);
    var pixels = imgdata.data;

    for (var i = 0, n = pixels.length; i < n; i += 4) {
        var grayscale = 0.21 * pixels[i] + 0.71 * pixels[i+1] + 0.07 * pixels[i+2]; //Math.floor((pixels[i] + pixels[i+1] + pixels[i+2]) / 3);
        pixels[i  ] = grayscale;        // red
        pixels[i+1] = grayscale;        // green
        pixels[i+2] = grayscale;        // blue
    }

    return imgdata;
}

var drawParticles = function() {

    var texture = new THREE.TextureLoader().load("./assets/spark1.png");
	geometry = new THREE.Geometry();
	material = new THREE.PointsMaterial({
		size: 3,
		color: 0x313742,
        sizeAttenuation: false,
        map: texture
	});
	for (var y = 0, y2 = imagedata.height; y < y2; y += 2) {
		for (var x = 0, x2 = imagedata.width; x < x2; x += 2) {
			if (imagedata.data[(x * 4 + y * 4 * imagedata.width)] > 128) {

				var vertex = new THREE.Vector3();
				vertex.x = Math.random() * 1000 - 500;
				vertex.y = Math.random() * 1000 - 500;
				vertex.z = -Math.random() * 500;

				vertex.destination = {
					x: x - imagedata.width / 2,
					y: -y + imagedata.height / 2,
					z: 0
				};

				vertex.speed = Math.random() / 200 + 0.015;

                geometry.vertices.push(vertex);
                geometry.colors.push(0x00ffff);
			}
		}
	}
	particles = new THREE.Points(geometry, material);

	sceneParticles.add(particles);

	requestAnimationFrame(render);
};

var getMouseCoordinates = function(){
    var mouse = new THREE.Vector3();
    mouse.set(
        ( event.clientX / window.innerWidth ) * 2 - 1,
        - ( event.clientY / window.innerHeight ) * 2 + 1,
        0.5 );
    mouse.unproject(camera);
    mouse.sub(camera.position).normalize();
    var distance = (-200 - camera.position.z) / mouse.z;

    mouseCoordinates = new THREE.Vector3();
    mouseCoordinates.copy(camera.position).add(mouse.multiplyScalar(distance));
}

var createSolidLine = function(){
    var lineGeometry = new THREE.Geometry();
    lineGeometry.vertices.push(mouseCoordinates);
    var lineMaterial = new THREE.LineBasicMaterial();
    var solidLine = new THREE.Line( lineGeometry, lineMaterial );
    sceneDraw.add(solidLine);
    drawingSolid = solidLine;
}

var continueSolidLine = function(){
    var solidLine = drawingSolid;
    var newLineGeometry = new THREE.Geometry();
    newLineGeometry.vertices = solidLine.geometry.vertices;
    newLineGeometry.vertices.push(mouseCoordinates);
    solidLine.geometry = newLineGeometry;
}

var mousePressed = function(){
    createSolidLine();
}

var mouseDragged = function(){
    continueSolidLine();
}

var mouseReleased = function(){

}

var init = function() {
	var WIDTH = window.innerWidth,
    HEIGHT = window.innerHeight;

    // set some camera attributes
    var VIEW_ANGLE = 75,
    ASPECT = WIDTH / HEIGHT,
    NEAR = 0.1,
    FAR = 1000;

    renderer = new THREE.WebGLRenderer();
    camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
    sceneParticles = new THREE.Scene();
    camera.position.z = 300;

    renderer.setSize(WIDTH, HEIGHT);
    document.body.appendChild(renderer.domElement);

	texture = THREE.ImageUtils.loadTexture("./assets/img1.jpg", undefined, function() {
        console.log("t " + texture.image);
		imagedata = getImageData(texture.image);
		drawParticles();
    });
    
    //   window.addEventListener('resize', onResize, false);

    // second scene, allow user to draw
    sceneDraw = new THREE.Scene();
    mouseIsPressed = false;

    renderer.domElement.addEventListener('mousedown', function (){
        getMouseCoordinates();
        mouseIsPressed = true;
        mousePressed();
    });
    renderer.domElement.addEventListener('mousemove', function(){
        getMouseCoordinates();
        if(mouseIsPressed){
            mouseDragged();
        }
    });
    renderer.domElement.addEventListener ( 'mouseup', function () { 
		mouseIsPressed = false; 
		mouseReleased(); 
	});
    
};

var onResize = function(){
    ww = window.innerWidth;
	wh = window.innerHeight;
	renderer.setSize(ww, wh);
    camera.aspect = ww / wh;
    camera.updateProjectionMatrix();
};

var render = function(a) {
    
    requestAnimationFrame(render);
    for (var i = 0, j = particles.geometry.vertices.length; i < j; i++) {
        var particle = particles.geometry.vertices[i];
        particle.x += (particle.destination.x - particle.x) * particle.speed;
        particle.y += (particle.destination.y - particle.y) * particle.speed;
        particle.z += (particle.destination.z - particle.z) * particle.speed;
    }

    particles.geometry.verticesNeedUpdate = true;
    // particles.rotation.y -= 0.01;
    renderer.render(sceneParticles, camera);
    
    if(drawingSolid){
        renderer.autoClear = false;
        renderer.render(sceneDraw, camera);
    }
};

init();