var renderer, sceneParticles, sceneDraw, camera, stats;

var particleSystem, uniforms, geometry;

var particles;

var image, imgdata, imgw, imgh;

var destination = [];
var speed = [];

var mouseIsPressed, mouseCoordinates, lineMaterial, drawing;

function getParticleTexture() {
    var partCanvas = document.createElement('canvas');
    var context = partCanvas.getContext('2d');
    // Gradient untuk gradiasi warna per partikel
    var gradient = context.createRadialGradient(
        partCanvas.width / 2, 
        partCanvas.height / 2, 
        0, 
        partCanvas.width / 2, 
        partCanvas.height / 2, 
        partCanvas.width / 2
    );
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.1, 'rgba(0,0,255,1)');
    gradient.addColorStop(0.15, 'rgba(0,200,128,1)');
    gradient.addColorStop(0.2, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    context.fillStyle = gradient;
    context.fillRect(0, 0, partCanvas.width, partCanvas.height);

    return new THREE.CanvasTexture(partCanvas);
}

init();

async function init() {
    
    camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.z = 300;

    sceneParticles = new THREE.Scene();
    
    uniforms = {
        
        // pointTexture: { value: new THREE.TextureLoader().load( "./assets/spark1.png" ) },
        pointTexture: { value: getParticleTexture() },
        uDepth: {value: 2.0}
        
    };
    
    var shaderMaterial = new THREE.ShaderMaterial( {
        
        uniforms: uniforms,
        vertexShader: document.getElementById( 'vertexshader' ).textContent,
        fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
        
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true,
        vertexColors: true
        
    } );
    
    var threshold = 0;
    // f is ration/constant of real image to particle/pixelized version
    var f = 1; 
    const promise = new Promise(resolve => {
        image = new Image();
        image.onload = function() {
            
            f = Math.floor(image.height / 180.0);
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
        // image.src = "./assets/uno.jpg";
        // image.src = "./assets/uno small.jpg";
        // image.src = "./assets/doggo.jpg";
        image.src = "./assets/doggo1.jpg";
        // image.src = "./assets/doggo2.jpg";

    })
    await promise;

    geometry = new THREE.BufferGeometry();
    
    var positions = [];
    var colors = [];
    var sizes = [];
    
    particles = imgdata.height * imgdata.width;
    console.log(imgdata.height, imgdata.width, imgdata.height*imgdata.width);
    threshold /= particles;
    threshold *= 1.35;
    // console.log(threshold);
    var color = new THREE.Color();
    for (var y = 0, y2 = imgdata.height; y < y2; y += 1) {
        for (var x = 0, x2 = imgdata.width; x < x2; x += 1) {
        // for (var y = imgdata.height; y >= 0; y -= 1) {
            if (imgdata.data[(x * 4 + y * 4 * imgdata.width)] > threshold) {
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
    // console.log(imgdata.width + " " + imgdata.height + " " + positions.length + " " + destination.length);
    geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
    geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
    geometry.setAttribute( 'size', new THREE.Float32BufferAttribute( sizes, 1 ).setUsage( THREE.DynamicDrawUsage ) );
    
    particleSystem = new THREE.Points( geometry, shaderMaterial );
    console.log(geometry);
    
    sceneParticles.add( particleSystem );
    
    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    
    var container = document.getElementById( 'container' );
    container.appendChild( renderer.domElement );
    
    window.addEventListener( 'resize', onWindowResize, false );
    animate();

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

    drawSetup();
}

function drawSetup(){
    lineMaterial = new THREE.LineBasicMaterial({
        color:0xffffff,
        linewidth : 4
    });
}

function getMouseCoordinates(){
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

function mousePressed(){
    var lineGeometry = new THREE.Geometry();
    lineGeometry.vertices.push(mouseCoordinates);
    var line = new THREE.Line(lineGeometry, lineMaterial);
    sceneDraw.add(line);
    drawing = line; 
}

function mouseDragged(){
    var line = drawing;
    var prevLineGeometry = line.geometry;
    var newLineGeometry = new THREE.Geometry();
    newLineGeometry.vertices = prevLineGeometry.vertices;
    newLineGeometry.vertices.push(mouseCoordinates);
    line.geometry = newLineGeometry;
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
    
    var time = Date.now() * 0.001;
    
    var sizes = geometry.attributes.size.array;
    for ( var i = 0; i < particles*3; i ++ ) {
        
        sizes[ i ] = 5 * ( 1 + Math.sin( 0.1 * i + time ) ) + 5;
    }

    // console.log(destination);
    var particle = geometry.attributes.position.array;
    var speedidx = 0;
    for ( var i = 0; i < particles*3; i += 3 ) {
        particle[ i ] += (destination[i] - particle[i]) * speed[speedidx];
        particle[ i+1 ] += (destination[i+1] - particle[i+1]) * speed[speedidx];
        particle[ i+2 ] += (destination[i+2] - particle[i+2]) * speed[speedidx];
        speedidx++;
    }
    
    geometry.attributes.size.needsUpdate = true;
    geometry.attributes.position.needsUpdate = true; 

    renderer.render( sceneParticles, camera );


    if(drawing){
        renderer.autoClear = false;
        renderer.render(sceneDraw, camera);
    }
    
}