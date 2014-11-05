/* globals window, _, VIZI, THREE */
// POI


var mouse = {
	x: 0,
	y: 0
}, INTERSECTED;

var projector, proj, mouse = {
		x: 0,
		y: 0
	}, INTERSECTED;

var cube;
var proj;
var pois = [];
var dialogs = [];

(function() {
	"use strict";

	VIZI.Scene = function() {
		VIZI.Log("Inititialising WebGL scene");

		_.extend(this, VIZI.Mediator);

		this.scene = this.createScene();
		this.objects = [];

		// Listeners
		this.subscribe("addToScene", function(object) {
			VIZI.Log("Scene add object handler");
			VIZI.Log(object);
			this.addToScene(object);
		});

		this.subscribe("removeFromScene", function(object) {
			VIZI.Log("Scene remove object handler");
			VIZI.Log(object);
			this.removeFromScene(object);
		});


		// POI

		// when the mouse moves, call the given function
		proj = new THREE.Projector();
		document.addEventListener('mousedown', this.onDocumentMouseDown, false);
		this.createBox(0, 0, "test name", "test description", 398983);
		

	};


	VIZI.Scene.prototype.makeTextSprite = function(message, parameters) {
		function roundRect(ctx, x, y, w, h, r) {
			ctx.beginPath();
			ctx.moveTo(x + r, y);
			ctx.lineTo(x + w - r, y);
			ctx.quadraticCurveTo(x + w, y, x + w, y + r);
			ctx.lineTo(x + w, y + h - r);
			ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
			ctx.lineTo(x + r, y + h);
			ctx.quadraticCurveTo(x, y + h, x, y + h - r);
			ctx.lineTo(x, y + r);
			ctx.quadraticCurveTo(x, y, x + r, y);
			ctx.closePath();
			ctx.fill();
			ctx.stroke();
		}

		if (parameters === undefined) parameters = {};

		var fontface = parameters.hasOwnProperty("fontface") ?
			parameters["fontface"] : "Arial";

		var fontsize = parameters.hasOwnProperty("fontsize") ?
			parameters["fontsize"] : 18;

		var borderThickness = parameters.hasOwnProperty("borderThickness") ?
			parameters["borderThickness"] : 4;

		var borderColor = parameters.hasOwnProperty("borderColor") ?
			parameters["borderColor"] : {
			r: 0,
			g: 0,
			b: 0,
			a: 1.0
		};

		var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
			parameters["backgroundColor"] : {
			r: 255,
			g: 255,
			b: 255,
			a: 1.0
		};
		// debugger;
		var spriteAlignment = THREE.SpriteAlignment.topLeft;

		var canvas = document.createElement('canvas');
		var context = canvas.getContext('2d');
		context.font = "Bold " + fontsize + "px " + fontface;

		// get size data (height depends only on font size)
		var metrics = context.measureText(message);
		var textWidth = metrics.width;

		// background color
		context.fillStyle = "rgba(" + backgroundColor.r + "," + backgroundColor.g + "," + backgroundColor.b + "," + backgroundColor.a + ")";
		// border color
		context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + "," + borderColor.b + "," + borderColor.a + ")";

		context.lineWidth = borderThickness;
		roundRect(context, borderThickness / 2, borderThickness / 2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);
		// 1.4 is extra height factor for text below baseline: g,j,p,q.

		// text color
		context.fillStyle = "rgba(0, 0, 0, 1.0)";

		context.fillText(message, borderThickness, fontsize + borderThickness);

		// canvas contents will be used for a texture
		var texture = new THREE.Texture(canvas);
		texture.needsUpdate = true;

		var spriteMaterial = new THREE.SpriteMaterial({
			map: texture,
			useScreenCoordinates: false,
			alignment: spriteAlignment
		});
		var sprite = new THREE.Sprite(spriteMaterial);
		sprite.scale.set(100, 50, 1.0);
		return sprite;
	};

	VIZI.Scene.prototype.createBox = function(lat, lon, name, desc, uuid) {
		console.log("createBox");

		var cubeGeometry = new THREE.CubeGeometry(3, 50, 3);
		var cubeMaterial = new THREE.MeshBasicMaterial({
			color: 0x0FF6464
		});
		cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
		cube.position.set(lon, 25, lat);
		cube.name = name;
		cube.description = desc;
		cube.uuid = uuid;
		this.addToScene(cube);

		// Name sprite
		// var nameSprite = this.makeTextSprite(name, {
		// 	fontsize: 12,
		// 	borderColor: {
		// 		r: 255,
		// 		g: 0,
		// 		b: 0,
		// 		a: 1.0
		// 	},
		// 	backgroundColor: {
		// 		r: 255,
		// 		g: 100,
		// 		b: 100,
		// 		a: 0.8
		// 	}
		// });
		// nameSprite.position.set(0, 35, 0);
		// cube.add(nameSprite);

		// cube.index = pois.length;
		pois.push(cube);
		dialogs.push(undefined);

		console.log("createBox end");
	};

	VIZI.Scene.prototype.onDocumentMouseDown = function(event) {
		// the following line would stop any other event handler from firing
		// (such as the mouse's TrackballControls)
		// event.preventDefault();


		// update the mouse variable
		mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

		// find intersections

		// create a Ray with origin at the mouse position
		// and direction into the scene (camera direction)
		var vector = new THREE.Vector3(mouse.x, mouse.y, 1);
		proj.unprojectVector(vector, camera);
		var pLocal = new THREE.Vector3(0, 0, -1);
		var pWorld = pLocal.applyMatrix4(camera.matrixWorld);
		var ray = new THREE.Raycaster(pWorld, vector.sub(pWorld).normalize());

		// create an array containing all objects in the scene with which the ray intersects
		var intersects = ray.intersectObjects(pois);

		// if there is one (or more) intersections
		if (intersects.length > 0) {
			console.log(intersects[0]);
			var selectedObject = intersects[0].object;

			if (dialogs[selectedObject.index] === undefined) {

				// jQuery dialog
				var newDialog = selectedObject.uuid;
				$("body").append("<div id=" + newDialog + " title='" + selectedObject.name + "'>" + selectedObject.description + "</div>");
				dialogs[selectedObject.index] = $("#" + newDialog).dialog({
					width: 300,
					height: "auto",
				});

				setDialogPosition(selectedObject.index);
			} else {
				dialogs[selectedObject.index].remove();
				dialogs[selectedObject.index] = undefined;
			}

		}

	};

	VIZI.Scene.prototype.createScene = function() {
		VIZI.Log("Creating WebGL scene");

		var scene = new THREE.Scene();
		scene.fog = new THREE.Fog(0xffffff, 1, 40000);

		return scene;
	};

	VIZI.Scene.prototype.addToScene = function(object) {
		this.scene.add(object);
		this.objects.push(object);
	};

	VIZI.Scene.prototype.removeFromScene = function(object) {
		this.scene.remove(object);

		// Clean up
		// http://mrdoob.github.io/three.js/examples/webgl_test_memory.html
		if (object.geometry) {
			object.geometry.dispose();
		}

		if (object.material) {
			object.material.dispose();
		}

		if (object.texture) {
			object.texture.dispose();
		}

		// Remove object from objects array
		var index = _.indexOf(this.objects, object);
		if (index > -1) {
			this.objects.splice(index, 1);
		}
	};
}());
