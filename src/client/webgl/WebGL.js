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
		waterNormals = new THREE.ImageUtils.loadTexture('textures/waternormals.jpg');
		waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;

		water = new THREE.Water(this.renderer.renderer, this.camera.camera, this.scene.scene, {
			textureWidth: 512,
			textureHeight: 512,
			waterNormals: waterNormals,
			alpha: 1.0,
			sunDirection: directionalLight2.position.clone().normalize(),
			sunColor: 0xffffff,
			waterColor: "rgb(50,215,245)",
			distortionScale: 50.0,
		});

		// mirrorMesh = new THREE.Mesh(
		// 	// new THREE.PlaneBufferGeometry(waterParameters.width * 500, waterParameters.height * 500),
		// 	new THREE.PlaneGeometry( waterParameters.width * 500, waterParameters.height * 500),
		// 	water.material);

		// mirrorMesh.add(water);
		// mirrorMesh.rotation.x = -Math.PI * 0.5;
		// this.scene.addToScene(mirrorMesh);

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
		directionalLight2.intesity = 1;
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
