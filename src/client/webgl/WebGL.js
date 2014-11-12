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

		// MIRORR plane
		verticalMirror = new THREE.FlatMirror(this.renderer.renderer, this.camera.camera, {
			clipBias: 0.003,
			textureWidth: 800,
			textureHeight: 600,
			color: 0x333366,
			// baseTexture: THREE.ImageUtils.loadTexture("images/water.jpg"),
			baseSpeed: 1.15,
			// noiseTexture: noiseTexture,
			noiseScale: 0.2,
			alpha: 0.8,
			time: 0.0,
		});

		this.verticalMirrorMesh = new THREE.Mesh(
			new THREE.PlaneGeometry(400, 400, 100, 100),
			verticalMirror.material);
		this.verticalMirrorMesh.add(verticalMirror);
		// verticalMirror.material.side = THREE.DoubleSide;
		this.verticalMirrorMesh.position.set(0, 100, -100);
		this.scene.addToScene(this.verticalMirrorMesh);

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

		// var ambientLight = new THREE.AmbientLight( 0xeeeeee );
		// THREE.ColorConverter.setHSV( ambientLight.color, 0.1, 0.1, 0.4 );

		// this.lights.push(ambientLight);
		// this.publish("addToScene", ambientLight);

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

		var directionalLight2 = new THREE.DirectionalLight( 0x999999 );
		directionalLight2.intesity = 0.1;
		// THREE.ColorConverter.setHSV( directionalLight2.color, 0.1, 0.1, 0.5 );
		directionalLight2.position.x = -1;
		directionalLight2.position.y = 1000;
		directionalLight2.position.z = -500;
		directionalLight2.castShadow = true;
		directionalLight2.shadowDarkness = 0.5;
		directionalLight2.shadowCameraVisible = true;
		directionalLight2.target.position.x = -30;
		directionalLight2.target.position.y = -30;
		directionalLight2.target.position.z = -1000;
		// directionalLight2.position.normalize();

		directionalLight2.shadowCameraRight = 2500;
		directionalLight2.shadowCameraLeft = -2500;
		directionalLight2.shadowCameraTop = 2500;
		directionalLight2.shadowCameraBottom = -2500;

		this.lights.push(directionalLight2);
		this.publish("addToScene", directionalLight2);

		// var helper2 = new THREE.DirectionalLightHelper(directionalLight2, 50);
		// this.publish("addToScene", helper2);

		// var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.65 );
		// THREE.ColorConverter.setHSV( hemiLight.color, 0.6, 0.35, 0.7 );
		// THREE.ColorConverter.setHSV( hemiLight.groundColor, 0.095, 0.5, 0.6 );
		// hemiLight.position.set( 0, 600, 0 );

		// this.lights.push(hemiLight);
		// this.publish("addToScene", hemiLight);
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
