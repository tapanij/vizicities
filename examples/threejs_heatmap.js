function debugObject(lat, lng) {
    var dmat = new THREE.MeshBasicMaterial({color: 0x0000FF});
    var dcubegeom = new THREE.CubeGeometry(3, 8, 3);
    var dcube = new THREE.Mesh(dcubegeom, dmat);
    var dgeocoord = [lng, lat];
    var dscenecoord = city.geo.projection(dgeocoord, city.geo.tileZoom);
    dcube.position.x = dscenecoord[0];
    dcube.position.y = -0.2;
    dcube.position.z = dscenecoord[1];
    dcube.scale.set(10, 100, 10);
    city.webgl.scene.addToScene(dcube);
    return dcube;
}

function addHeat() {
    debugObject(43.463369, -3.805923);
    debugObject(43.476170, -3.789915);

    var heatgeom = new THREE.CubeGeometry(1, 1, 1);
    var heatmat = new THREE.MeshBasicMaterial({color: 0xFFFFFF});
    var heatlayer = new THREE.Mesh(heatgeom, heatmat);

    var heat_scenecoord = city.geo.projection([-3.800, 43.463369], city.geo.tileZoom);
    heatlayer.position.x = heat_scenecoord[0];
    heatlayer.position.y = 1;
    heatlayer.position.z = heat_scenecoord[1];
    heatlayer.scale.set(1000, 10, 1000);
    city.webgl.scene.addToScene(heatlayer);

    // create a heatmap instance
    var heatmap = h337.create({
        container: document.getElementById('heatmapContainer'),
        maxOpacity: .5,
        radius: 1000,
        blur: .75,
        // update the legend whenever there's an extrema change
        onExtremaChange: function onExtremaChange(data) {
            //updateLegend(data);
        }
    });

        // boundaries for data generation
        var width = (+window.getComputedStyle(document.body).width.replace(/px/,''));
        var height = (+window.getComputedStyle(document.body).height.replace(/px/,''));

        // generate 1000 datapoints
        var generate = function() {
          // randomly generate extremas
          var extremas = [(Math.random() * 1000) >> 0,(Math.random() * 1000) >> 0];
          var max = Math.max.apply(Math, extremas);
          var min = Math.min.apply(Math,extremas);
          var t = [];


          for (var i = 0; i < 1000; i++) {
            var x = (Math.random()* width) >> 0;
            var y = (Math.random()* height) >> 0;
            var c = ((Math.random()* max-min) >> 0) + min;
            // btw, we can set a radius on a point basis
            var r = (Math.random()* 80) >> 0;
            // add to dataset
            t.push({ x: x, y:y, value: c, radius: r });
          }
          var init = +new Date;
          // set the generated dataset
          heatmap.setData({
            min: min,
            max: max,
            data: t
          });
          console.log('took ', (+new Date) - init, 'ms');
        };
        // initial generate
        generate();

    var heatmap_tex = new THREE.Texture(heatmap._renderer.canvas, new THREE.UVMapping(), THREE.RepeatWrapping, THREE.RepeatWrapping);
    heatlayer.material.map = heatmap_tex;
    heatlayer.material.transparent = true;
    heatlayer.material.map.needsUpdate = true;

    updateData(heatmap, heatlayer);

    //console debug access
    VIZI.heat = {}
    VIZI.heat.heatmap = heatmap;
    VIZI.heat.heatlayer = heatlayer;
}

//sensor data reading -- instead of the random generation from example (above)
function updateData(heatmap, heatlayer) {
    // COPY-PASTE from tapanij-vizi-poi Scene.js !!!
    ///Get offline Context Broker info
    $.getJSON("nodeinfo.json", function(data) {
	heatmap_parseOfflineCBData(data, heatmap);
        heatlayer.material.map.needsUpdate = true;
        //heatmap._renderer.canvas.parentNode.removeChild(heatmap._renderer.canvas);
    });
}

function normaliseGeopos(geopos) {
/* the area in Santander
bottom-left: 43.463369, -3.805923
top-right:   43.476170, -3.789915
*/
    var east = -3.805923;
    var west = -3.789915;
    var south = 43.463369;
    var north = 43.476170;

    var width = west - east;
    var height = north - south;
    
    var scale_x = 1 / width;
    var scale_y = 1 / height;
    
    var x = (west - geopos[1]) * scale_x;
    var y = (north - geopos[0]) * scale_y;

    return [x, y];
}

function heatmap_parseOfflineCBData(json, heatmap) {
    console.log("hep");

    //read temperatures from own offline json
    var keys = Object.keys(json);
    var temperatures = []; //longlat, celciusfloat pairs
    for (k in keys) { //n for node, as in sensor (in nid, ndata etc)
        var nid = keys[k];
        var ninfo = json[nid];
        var ndata = ninfo.data; //there's also geopos
        if ("Temperature" in ndata) {
            var temperinfo = ndata["Temperature"]
            var tempernum = parseFloat(temperinfo); //temperinfo.slice(0, -2)
            temperatures.push([ninfo.geopos, tempernum]);
        }
    }
    //console.log(temperatures);

    //populate heatmap data
    var hmapdata = [];
    THREE.hmapdata = hmapdata;
    r = 10;

    var canvas = heatmap._renderer.canvas;
    //var width = (+window.getComputedStyle(document.body).width.replace(/px/,''));
    //var height = (+window.getComputedStyle(document.body).height.replace(/px/,''));
    var width = canvas.width;
    var height = canvas.height;
    console.log("HEATMAP DRAW DIMS: " + width + " : " + height);
    temperatures.forEach(function(t) {
        //console.log(t);
        norm_xypos = normaliseGeopos(t[0]);

        var xypos = [-1, -1];
        xypos[0] = norm_xypos[0] * width;
        xypos[1] = norm_xypos[1] * height;
        hmapdata.push({ x: xypos[0], y: xypos[1], value: t[1], radius: r });
    });

    heatmap.setData({
        min: 10,
        max: 30,
        data: hmapdata
    });
}

// whenever a user clicks on the ContainerWrapper the data will be regenerated -> new max & min
/*
document.getElementById('heatmapContainerWrapper').onclick = function() { 
    //generate();
    updateData();
    cube.material.map.needsUpdate = true;            
};
*/
