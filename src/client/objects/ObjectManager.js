/* globals window, _, VIZI, THREE, Q, d3, cw */
(function() {
	"use strict";

	VIZI.ObjectManager = function() {
		_.extend(this, VIZI.Mediator);

		this.combinedMaterial = new THREE.MeshLambertMaterial({vertexColors: THREE.VertexColors});
		this.combinedObjects = undefined;
	};

	// TODO: Convert to a promise
	VIZI.ObjectManager.prototype.processFeatures = function(features) {
		var startTime = Date.now();

		var objects = _.map(features, this.processFeature);

		VIZI.Log(Date.now() - startTime);

		this.combinedObjects = this.combineObjects(objects);

		this.publish("addToScene", this.combinedObjects);
	};

	VIZI.ObjectManager.prototype.workerPromise = function(worker, features, pixelsPerMeter) {
		var deferred = Q.defer();

		var startTime = Date.now();
		worker.process([features, pixelsPerMeter]).then(function(data) {
			var timeToSend = data.startTime - startTime;
			var timeToArrive = Date.now() - data.timeSent;
			if (data.water) {
				var newWaterGeometry = new THREE.Geometry();

				newWaterGeometry.vertices = data.water.vertices;
				newWaterGeometry.faces = data.water.faces;
				newWaterGeometry.computeBoundingSphere();

				var waterMeshInstance = new THREE.Mesh(newWaterGeometry);
				waterMeshInstance.position.set(data.water.position.x, data.water.position.y, data.water.position.z);
				waterMeshInstance.rotation = new THREE.Euler(data.water.rotation._x, data.water.rotation._y, data.water.rotation._z, data.water.rotation._order);
				// debugger;

				waterMeshInstance.type = "water";
				// this.publish("addToScene", waterMeshInstance);
				city.webgl.scene.addToScene(waterMeshInstance);
			}
			deferred.resolve({data: data, timeToArrive: timeToArrive, timeToSend: timeToSend});
		});
		return deferred.promise;
	};

	VIZI.ObjectManager.prototype.processFeaturesWorker = function(features) {};
	VIZI.ObjectManager.prototype.processFeature = function(feature) {};

	VIZI.ObjectManager.prototype.combineObjects = function(objects) {
		var combinedGeom = new THREE.Geometry();

		_.each(objects, function(object) {
			if (!object.object) {
				return;
			}

			THREE.GeometryUtils.merge(combinedGeom, object.object);
		});

		combinedGeom.computeFaceNormals();

		return new THREE.Mesh( combinedGeom, this.combinedMaterial );
	};
}());
