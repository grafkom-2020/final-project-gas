var renderer, scene, camera, stats;

var particleSystem, uniforms, geometry;

var particles;

var image, imgdata, imgw, imgh;

var destination = [];
var speed = [];

init();

async function init() {
    
    camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.z = 300;

    scene = new THREE.Scene();
    
    uniforms = {
        
        pointTexture: { value: new THREE.TextureLoader().load( "./assets/spark1.png" ) },
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
    
    const promise = new Promise(resolve => {
        image = new Image();
        image.onload = function() {
            
            var canvas = document.createElement("canvas");
            var ctx = canvas.getContext("2d");
            imgw = image.width / 4;
            imgh = image.height / 4;
            ctx.drawImage(image, 0, 0, imgw, imgh);
            imgdata = ctx.getImageData(0, 0, imgw, imgh);
            console.log(imgdata.width + " " + imgdata.height);
            resolve();
            var pixels = imgdata.data;
        
            for (var i = 0, n = pixels.length; i < n; i += 4) {
                var grayscale = 0.21 * pixels[i] + 0.71 * pixels[i+1] + 0.07 * pixels[1+2]; //Math.floor((pixels[i] + pixels[i+1] + pixels[i+2]) / 3);
                pixels[i  ] = grayscale;        // red
                pixels[i+1] = grayscale;        // green
                pixels[i+2] = grayscale;        // blue
            }
        }
        image.src = "./assets/doggo.jpg";

    })
    await promise;
    var radius = 200;
    
    geometry = new THREE.BufferGeometry();
    
    var positions = [];
    var colors = [];
    var sizes = [];

    particles = imgdata.height * imgdata.width;
    var color = new THREE.Color();
    for (var y = 0, y2 = imgdata.height; y < y2; y += 1) {
		for (var x = 0, x2 = imgdata.width; x < x2; x += 1) {
			if (imgdata.data[(x * 4 + y * 4 * imgdata.width)] > 128) {
                positions.push(Math.random() * 1000 - 500);
                positions.push(Math.random() * 1000 - 500);
                positions.push(-Math.random() * 500);

                destination.push(x - imgdata.width / 2);
                destination.push(-y + imgdata.height / 3);
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
    
    scene.add( particleSystem );
    
    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    
    var container = document.getElementById( 'container' );
    container.appendChild( renderer.domElement );
    
    window.addEventListener( 'resize', onWindowResize, false );
    animate();
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
    for ( var i = 0; i < particles; i ++ ) {
        
        sizes[ i ] = 5 * ( 1 + Math.sin( 0.1 * i + time ) ) + 5;
    }

    // console.log(destination);
    var particle = geometry.attributes.position.array;
    var speedidx = 0;
    for ( var i = 0; i < particles; i += 3 ) {
        particle[ i ] += (destination[i] - particle[i]) * speed[speedidx];
        particle[ i+1 ] += (destination[i+1] - particle[i+1]) * speed[speedidx];
        particle[ i+2 ] += (destination[i+2] - particle[i+2]) * speed[speedidx];
        speedidx++;
    }
    
    geometry.attributes.size.needsUpdate = true;
    geometry.attributes.position.needsUpdate = true; 
    renderer.render( scene, camera );
}