/* globals window, _, VIZI, Q, THREE */
(function() {
	"use strict";

	VIZI.WebGL = function() {
		VIZI.Log("Initialising WebGL");

		_.extend(this, VIZI.Mediator);

		this.domContainer = undefined;
		this.scene = undefined;
		this.camera = undefined;
		this.renderer = undefined;

		this.lights = [];
	};

	VIZI.WebGL.prototype.init = function(domElement, cameraTargetPos, capZoom, capOrbit) {
		this.domContainer = this.createDOMContainer(domElement);
		this.scene = new VIZI.Scene();
		this.camera = new VIZI.Camera(cameraTargetPos, capZoom, capOrbit);
		this.renderer = new VIZI.Renderer(this.scene, this.camera, this.domContainer);

		this.lights = [];
		this.addLights();


		// WATER
		waterNormals = new THREE.ImageUtils.loadTexture('textures/waternormals.png');
		waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;

		water = new THREE.Water(this.renderer.renderer, this.camera.camera, this.scene.scene, {
			textureWidth: 1024,
			textureHeight: 1024,
			waterNormals: waterNormals,
			alpha: 0.65,
			sunDirection: directionalLight2.position.clone().normalize(),
			sunColor: 0xffffff,
			waterColor: "rgb(60,225,255)",
			distortionScale: 50.0,
		});

		// mirrorMesh = new THREE.Mesh(
		// 	// new THREE.PlaneBufferGeometry(waterParameters.width * 500, waterParameters.height * 500),
		// 	new THREE.PlaneGeometry( waterParameters.width * 500, waterParameters.height * 500),
		// 	water.material);

		// mirrorMesh.add(water);
		// mirrorMesh.rotation.x = -Math.PI * 0.5;
		// this.scene.addToScene(mirrorMesh);


		// BIRDS



		// Custom Geometry - using 3 triangles each. No UVs, no normals currently.
		THREE.BirdGeometry = function() {

			var triangles = BIRDS * 3;
			var points = triangles * 3;

			THREE.BufferGeometry.call(this);

			var vertices = new THREE.BufferAttribute(new Float32Array(points * 3), 3);
			var birdColors = new THREE.BufferAttribute(new Float32Array(points * 3), 3);
			var references = new THREE.BufferAttribute(new Float32Array(points * 2), 2);
			var birdVertex = new THREE.BufferAttribute(new Float32Array(points), 1);

			this.addAttribute('position', vertices);
			this.addAttribute('birdColor', birdColors);
			this.addAttribute('reference', references);
			this.addAttribute('birdVertex', birdVertex);

			// this.addAttribute( 'normal', new Float32Array( points * 3 ), 3 );


			var v = 0;

			function verts_push() {
				for (var i = 0; i < arguments.length; i++) {
					vertices.array[v++] = arguments[i];
				}
			}

			var wingsSpan = 20;

			for (var f = 0; f < BIRDS; f++) {

				// Body
				verts_push(
					0, -0, -20,
					0, 4, -20,
					0, 0, 30);

				// Left Wing
				verts_push(
					0, 0, -15, -wingsSpan, 0, 0,
					0, 0, 15);

				// Right Wing
				verts_push(
					0, 0, 15,
					wingsSpan, 0, 0,
					0, 0, -15);

			}

			for (var v = 0; v < triangles * 3; v++) {

				var i = ~~ (v / 3);
				var x = (i % WIDTH) / WIDTH;
				var y = ~~ (i / WIDTH) / WIDTH;

				var c = new THREE.Color(
					0x444444 + ~~(v / 9) / BIRDS * 0x666666);

				birdColors.array[v * 3 + 0] = c.r;
				birdColors.array[v * 3 + 1] = c.g;
				birdColors.array[v * 3 + 2] = c.b;

				references.array[v * 2] = x;
				references.array[v * 2 + 1] = y;

				birdVertex.array[v] = v % 9;

			}

			this.applyMatrix(new THREE.Matrix4().makeScale(0.2, 0.2, 0.2));

		}

		THREE.BirdGeometry.prototype = Object.create(THREE.BufferGeometry.prototype);


		// var mouseX = 0,
		// 	mouseY = 0;



		function change(n) {
			location.hash = n;
			location.reload();
			return false;
		}


		// var options = '';
		// for (i = 1; i < 7; i++) {
		// 	var j = Math.pow(2, i);
		// 	options += '<a href="#" onclick="return change(' + j + ')">' + (j * j) + '</a> ';
		// }
		// document.getElementById('options').innerHTML = options;


		simulator = new SimulationRenderer(WIDTH, this.renderer.renderer);
		simulator.init();

		// document.addEventListener('mousemove', onDocumentMouseMove, false);
		// document.addEventListener('touchstart', onDocumentTouchStart, false);
		// document.addEventListener('touchmove', onDocumentTouchMove, false);
		function initBirds() {

			var geometry = new THREE.BirdGeometry();

			// For Vertex Shaders
			birdAttributes = {
				// index: { type: 'i', value: [] },
				birdColor: {
					type: 'c',
					value: null
				},
				reference: {
					type: 'v2',
					value: null
				},
				birdVertex: {
					type: 'f',
					value: null
				}
			};

			// For Vertex and Fragment
			birdUniforms = {

				color: {
					type: "c",
					value: new THREE.Color(0xff2200)
				},
				texturePosition: {
					type: "t",
					value: null
				},
				textureVelocity: {
					type: "t",
					value: null
				},
				time: {
					type: "f",
					value: 1.0
				},
				delta: {
					type: "f",
					value: 0.0
				},

			};

			// ShaderMaterial
			var shaderMaterial = new THREE.ShaderMaterial({

				uniforms: birdUniforms,
				attributes: birdAttributes,
				vertexShader: document.getElementById('birdVS').textContent,
				fragmentShader: document.getElementById('birdFS').textContent,
				side: THREE.DoubleSide

			});


			// var
			birdMesh = new THREE.Mesh(geometry, shaderMaterial);
			birdMesh.rotation.y = Math.PI / 2;
			birdMesh.matrixAutoUpdate = false;
			birdMesh.updateMatrix();

			this.publish("addToScene", birdMesh);

		}

		initBirds();

		return Q.fcall(function() {});
	};

	VIZI.WebGL.prototype.createDOMContainer = function(domElement) {
		VIZI.Log("Creating WebGL DOM container");

		var container = document.createElement("div");
		container.classList.add("vizicities-webgl-container");

		domElement.appendChild(container);

		return container;
	};

	// TODO: Split lights out into classes
	VIZI.WebGL.prototype.addLights = function() {
		VIZI.Log("Adding lights to scene");

		// AMBIENT LIGHT 1

		var light = new THREE.AmbientLight( 0x404040 ); // soft white light
		this.publish("addLightToScene", light);
		this.lights.push(light);

		// AMBIENT LIGHT 2

		// var ambientLight = new THREE.AmbientLight( 0xeeeeee );
		// THREE.ColorConverter.setHSV( ambientLight.color, 0.1, 0.1, 0.4 );
		// this.lights.push(ambientLight);
		// this.publish("addLightToScene", ambientLight);

		// DIRECTIONAL LIGHT 1

		// var directionalLight = new THREE.DirectionalLight( 0x999999 );
		// directionalLight.intesity = 0.1;
		// // THREE.ColorConverter.setHSV( directionalLight.color, 0.1, 0.1, 0.55 );
		// directionalLight.position.x = 1;
		// directionalLight.position.y = 1;
		// directionalLight.position.z = 1;
		// directionalLight.castShadow = false;	

		// this.lights.push(directionalLight);
		// this.publish("addToScene", directionalLight);

		// var helper1 = new THREE.DirectionalLightHelper(directionalLight, 50);
		// this.publish("addToScene", helper1);

		// DIRECTIONAL LIGHT 2

		// var highNoonSun = 0xFFFFFB;
		var highNoonSun = 0xFFFFFF;
		directionalLight2 = new THREE.DirectionalLight( highNoonSun );
		directionalLight2.intesity = 1.3;
		// THREE.ColorConverter.setHSV( directionalLight2.color, 0.1, 0.1, 0.5 );
		directionalLight2.position.x = -1000;
		directionalLight2.position.y = 1300;
		directionalLight2.position.z = -1500;
		directionalLight2.castShadow = true;
		directionalLight2.shadowMapWidth = 4096;
		directionalLight2.shadowMapHeight = 4096;
		directionalLight2.shadowDarkness = 0.3;
		directionalLight2.shadowCameraVisible = false;
		directionalLight2.target.position.x = -600;
		directionalLight2.target.position.y = 0;
		directionalLight2.target.position.z = -1900;
		// directionalLight2.position.normalize();

		directionalLight2.shadowCameraRight = 1500;
		directionalLight2.shadowCameraLeft = -1000;
		directionalLight2.shadowCameraTop = 1000;
		directionalLight2.shadowCameraBottom = -1500;

		this.lights.push(directionalLight2);
		this.publish("addLightToScene", directionalLight2);

		// var helper2 = new THREE.DirectionalLightHelper(directionalLight2, 50);
		// this.publish("addToScene", helper2);

		// HEMISPHERE LIGHT 1

		// var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.65 );
		// 		THREE.ColorConverter.setHSV( hemiLight.color, 0.6, 0.35, 0.7 );
		// 		THREE.ColorConverter.setHSV( hemiLight.groundColor, 0.095, 0.5, 0.6 );
		// 		hemiLight.position.set( 0, 600, 0 );

		// HEMISPHERE LIGHT 2

		// var hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
		var hemiLight = new THREE.HemisphereLight(0xC7F1FF, 0x52C0FF, 0.6);
		hemiLight.color.setHSL(0.6, 1, 0.6); // 153, 255, 153
		hemiLight.groundColor.setHSL(0.095, 1, 0.75); // 24, 255, 191
		hemiLight.position.set(0, 500, 0);

		hemiLight.castShadow = false;

		this.lights.push(hemiLight);
		this.publish("addLightToScene", hemiLight);
	};

	// Global helpers (move elsewhere?)
	VIZI.applyVertexColors = function( g, c ) {
		g.faces.forEach( function( f ) {
			var n = ( f instanceof THREE.Face3 ) ? 3 : 4;
			for( var j = 0; j < n; j ++ ) {
				f.vertexColors[ j ] = c;
			}
		} );
	};
}());
