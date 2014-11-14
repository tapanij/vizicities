/* globals window, _, VIZI, THREE */
(function() {
	"use strict";

	var postprocessing = {};

	VIZI.Renderer = function(scene, camera, domContainer) {
		VIZI.Log("Inititialising WebGL renderer");

		_.extend(this, VIZI.Mediator);

		this.scene = scene.scene;
		this.camera = camera.camera;
		this.domContainer = domContainer;

		this.renderer = this.createRenderer();

		// Listeners
		this.subscribe("render", this.render);
		this.subscribe("resize", this.resize);
	};

	VIZI.Renderer.prototype.createRenderer = function() {
		var renderer = new THREE.WebGLRenderer({
			antialias: false,
		});

		renderer.setSize( window.innerWidth, window.innerHeight );
		renderer.setClearColor( this.scene.fog.color, 1 );

		// Gamma settings make things look 'nicer' for some reason
		renderer.gammaInput = true;
		renderer.gammaOutput = true;

		renderer.physicallyBasedShading = true;

		renderer.shadowMapEnabled = true;
		renderer.shadowMapSoft = true;

		this.domContainer.appendChild(renderer.domElement);

		// DOF
		// debugger;
		this.initPostprocessing();



		return renderer;
	};

	VIZI.Renderer.prototype.render = function() {
		this.publish("fpsTickStart", "render");
		this.renderer.render( this.scene, this.camera );
		this.publish("updateRendererInfo", this.renderer.info);
		this.publish("fpsTickEnd", "render");
	};

	VIZI.Renderer.prototype.resize = function() {
		this.renderer.setSize( window.innerWidth, window.innerHeight );
	};

	VIZI.Renderer.prototype.initPostprocessing = function() {
				var renderPass = new THREE.RenderPass( this.scene, this.camera );

				var bokehPass = new THREE.BokehPass( this.scene, this.camera, {
					focus: 		1.0,
					aperture:	0.025,
					maxblur:	1.0,

					width: window.innerWidth,
					height: window.innerHeight
				} );

				bokehPass.renderToScreen = true;

				var composer = new THREE.EffectComposer( this.renderer );

				composer.addPass( renderPass );
				composer.addPass( bokehPass );

				postprocessing.composer = composer;
				postprocessing.bokeh = bokehPass;

			};
}());
