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
var globaali;
var treeModel;
var trees;
var testest;

// Water
var verticalMirror;

var cb_xhr = null; // http request
var BACKEND_ADDRESS_CB = "http://orion.lab.fi-ware.org:1026/ngsi10/contextEntities/";

// Calculate and set dialog position
function setDialogPosition(i) {
	if (dialogs[i] === undefined) {
		return;
	}

	var pLocal = new THREE.Vector3(0, 0, -1);
	var pWorld = pLocal.applyMatrix4(camera.matrixWorld);
	var forward = pWorld.sub(camera.position).normalize();
	var toOther = pois[i].position.clone();
	toOther.sub(camera.position);

	if (forward.dot(toOther) < 0) {
		dialogs[i].remove();
		dialogs[i] = undefined;
		return;
	}

	var x, y, p, v, percX, percY;

	// this will give us position relative to the world
	p = new THREE.Vector3(pois[i].position.x, pois[i].position.y + (pois[i].geometry.height / 2), pois[i].position.z);

	// projectVector will translate position to 2d
	projector = new THREE.Projector();
	v = projector.projectVector(p, camera);

	// translate our vector so that percX=0 represents
	// the left edge, percX=1 is the right edge,
	// percY=0 is the top edge, and percY=1 is the bottom edge.
	percX = (v.x + 1) / 2;
	percY = (-v.y + 1) / 2;

	// scale these values to our viewport size
	x = percX * window.innerWidth;
	y = percY * window.innerHeight;

	// calculate distance between the camera and the person. Used for fading the tooltip
	var distance = p.distanceTo(camera.position);
	distance = 2 / distance;

	dialogs[i].dialog("option", "position", [x, y]);
}

function updateDialogs(event) {
	for (var i = 0; i < dialogs.length; i++) {
		setDialogPosition(i);
	}
}

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

		// Tree model
		var jsonLoader = new THREE.JSONLoader();
		// addModelToScene function is called back after model has loaded
		jsonLoader.load("models/tree.js", this.loadTreeModel); 

		// when the mouse moves, call the given function
		proj = new THREE.Projector();
		document.addEventListener('mousemove', this.onDocumentMouseMove, false);
		document.addEventListener('mouseup', this.onDocumentMouseUp, false);
		document.addEventListener('mousewheel', updateDialogs, false);
		// this.createBox(0, 0, "test name", "test description", 398983);
		this.createBox(43.46323, -3.80882, "test name", "test description", 398983);

		// this.getCBInfo(357);
		// this.getCBInfo(3332);		 
		// this.getCBInfo(10015);
		// this.getCBInfo(10013);
		
		// fog
		this.scene.fog.far = 6000;

		// MIRORR plane
		verticalMirror = new THREE.FlatMirror(city.webgl.renderer.renderer, camera, {
			clipBias: 0.003,
			textureWidth: 800,
			textureHeight: 600,
			color: 0x333366,
			baseTexture: THREE.ImageUtils.loadTexture("images/water.jpg"),
			baseSpeed: 1.15,
			// noiseTexture: noiseTexture,
			noiseScale: 0.2,
			alpha: 0.8,
			time: 0.0,
		});

		this.verticalMirrorMesh = new THREE.Mesh(
			new THREE.PlaneGeometry(400, 400, 100, 100),
			verticalMirror.material);
		verticalMirrorMesh.add(verticalMirror);
		// verticalMirror.material.side = THREE.DoubleSide;
		verticalMirrorMesh.position.set(0, 100, -100);
		this.addToScene(verticalMirrorMesh);
	};

	VIZI.Scene.prototype.getCBInfo = function(nodeID) {
		function parseCBData(json) {
		}
		
		console.log("Doing search from " + BACKEND_ADDRESS_CB);
		var restQueryURL = BACKEND_ADDRESS_CB + "urn:smartsantander:testbed:"+nodeID;
		console.log("restQueryURL: " + restQueryURL);
		var cb_xhr = new XMLHttpRequest();

		cb_xhr.onreadystatechange = function() {
			if (cb_xhr.readyState === 4) {
				if (cb_xhr.status === 200) {
					console.log("success: " + cb_xhr.responseText);
					var json = JSON.parse(cb_xhr.responseText);
					parseCBData(json);
					console.log(json);
					var boxLongitude = json.contextElement.attributes[4].value;
					var boxLatitude = json.contextElement.attributes[3].value;
					var boxName = "some thing";
					var boxDescription = "description";
					var boxId = "9999";

					// var tileXY = city.grid.lonlat2tile(boxLatitude, boxLongitude, city.geo.tileZoom, true);
					// city.webgl.scene.createBox(tileXY[0], tileXY[1], boxName, boxDescription, boxId);

					city.webgl.scene.createBox(boxLatitude, boxLongitude, boxName, boxDescription, boxId);
				} else if (cb_xhr.status === 404) {
					console.log("failed: " + cb_xhr.responseText);
				}
			}
		}

		cb_xhr.onerror = function(e) {
			console.log("failed to get CB info.");
		};

		cb_xhr.open("GET", restQueryURL, true);
		cb_xhr.setRequestHeader("Content-Type", "application/json");
		cb_xhr.setRequestHeader("Accept", "application/json");
		cb_xhr.setRequestHeader("X-Auth-Token", "4wUdbVliV55X5zI68DfDZgVI-by2MBR0s3QhJF7WwwOU0u5AO3f85ycMouzxr3UWGfbCjO3ODcaM6ybtHLcJPA");
		cb_xhr.send();
	}

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

		// Cube
		var cubeGeometry = new THREE.CubeGeometry(3, 50, 3);

		var newColor = 0x0FF6464; // red

		if(name == "tree"){
			newColor = 0x669900; // green
		}

		var cubeMaterial = new THREE.MeshBasicMaterial({
			color: newColor
		});
		cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
		
		cube.name = name;
		cube.description = desc;
		cube.uuid = uuid;
		

		// cube.position.set(lat, 25, lon);
		var coord = [lon, lat];
		var newPos = city.geo.projection(coord, city.geo.tileZoom);
		cube.position.x = newPos[0];
		cube.position.y = 25;
		cube.position.z = newPos[1];	

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



		if (name == "tree") {
			if (trees == undefined) {
				trees = cube;
				this.addToScene(trees);
			} else {
				// console.log("create combined tree mesh");

				THREE.GeometryUtils.merge(trees.geometry, cube);

				// Center trees
				trees.position = new THREE.Vector3(0,0,0);
			}
		} else {
			cube.index = pois.length;
			pois.push(cube);
			dialogs.push(undefined);

			this.addToScene(cube);
		}

		// console.log("createBox end");
	};

	VIZI.Scene.prototype.createTree = function(lat, lon, name, desc, uuid) {
		console.log("createTree");

		var treeClone = new THREE.Mesh(treeModel.geometry.clone(), treeModel.material.clone());


		treeClone.name = name;
		treeClone.description = desc;
		treeClone.uuid = uuid;

		var coord = [lon, lat];
		var newPos = city.geo.projection(coord, city.geo.tileZoom);
		treeClone.position.x = newPos[0];
		treeClone.position.y = 0;
		treeClone.position.z = newPos[1];

		if (trees == undefined) {
			trees = treeClone;
			this.addToScene(trees);
		} else {
			// Rotation
			var max = 6;
			var min = 0;
			var randomValue = Math.random() * (max - min) + min;
			treeClone.rotateY(randomValue);

			// Scale
			max = 2;
			min = 0.8;
			randomValue = Math.random() * (max - min) + min;
			treeClone.scale.set(randomValue, randomValue, randomValue);

			// console.log("create combined tree mesh");

			THREE.GeometryUtils.merge(trees.geometry, treeClone);

			// Center trees
			trees.position = new THREE.Vector3(0, 0, 0);
		}

	};

	VIZI.Scene.prototype.loadTreeModel = function( geometry, materials ) {
			console.log("load tree model");
			var material = new THREE.MeshFaceMaterial(materials);
			treeModel = new THREE.Mesh(geometry, material);
			treeModel.scale.set(10, 10, 10);
		};

	VIZI.Scene.prototype.onDocumentMouseMove = function(event) {
		// the following line would stop any other event handler from firing
		// (such as the mouse's TrackballControls)
		// event.preventDefault();

		// update the mouse variable
		mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;


		updateDialogs();

	};

	VIZI.Scene.prototype.onDocumentMouseUp = function(event) {
	


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
					ind: selectedObject.index,
					close: function(ev, ui) {
						console.log("destroy diallog");
						var customAttrValue = $("#"+this.id).dialog("option", "ind");
						dialogs[customAttrValue].remove();
						dialogs[customAttrValue] = undefined;
					}
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
		object.receiveShadow = true;
		object.castShadow = true;
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
