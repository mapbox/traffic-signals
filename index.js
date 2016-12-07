var turf = require("turf");
var cover = require("tile-cover");

mapboxgl.accessToken = "pk.eyJ1IjoicGxhbmVtYWQiLCJhIjoiemdYSVVLRSJ9.g3lbg_eN0kztmsfIPxa9MQ";

var map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/planemad/cinpwopfb008hcam0mqxbxwuq",
  center: [-122.4387, 37.7993],
  zoom: 14,
  hash: true,
  attributionControl: false,
  keyboard: false
});

map.addControl(new mapboxgl.NavigationControl({
  position: "top-right"
}));

var mly = new Mapillary.Viewer("mly", "MFo5YmpwMmxHMmxJaUt3VW14c0ZCZzphZDU5ZDBjNTMzN2Y3YTE3", null, {
  attribution: false,
  direction: false,
  mouse: false
});
$("#mly").hide();

var mapillaryImageKey;

map.once("load", function() {
  hideDefaultLayers();
  setupMapillary();
  setupTileBoundaries();
  setupOverpass();
  setupJOSMButton();
});

function hideDefaultLayers() {
  // Maxspeed
  map.setLayoutProperty("maxspeed", "visibility", "none");
  map.setLayoutProperty("maxspeed labels", "visibility", "none");
  // Oneways
  map.setLayoutProperty("oneways", "visibility", "none");
  map.setLayoutProperty("oneways arrows", "visibility", "none");
}

function setupMapillary() {
  map.addSource("mapillary", {
    "type": "vector",
    "tiles": [
      "https://a.mapillary.com/v3/tiles/{z}/{x}/{y}.mapbox?objects=accuracy,alt,first_seen_at,last_seen_at,rect_count,rects,updated_at,value,user_keys&client_id=MFo5YmpwMmxHMmxJaUt3VW14c0ZCZzphZDU5ZDBjNTMzN2Y3YTE3",
    ],
    "minzoom": 14,
    "maxzoom": 14
  });

  map.addSource("mapillaryCoverage", {
    "type": "vector",
    "tiles": [
      "http://d25uarhxywzl1j.cloudfront.net/v0.1/{z}/{x}/{y}.mvt"
    ],
    "maxzoom": 14
  });

  var mapillaryRestrictionsFilter = [
    "in",
    "value",
    "regulatory--stop--us",
    "warning--stop-ahead--us",
    "warning--traffic-signals-ahead--us"
  ];

  function iconRotations() {
    var stops = [];
    for (var i = -360; i <= 360; i++) {
      stops.push([i, i]);
    }
    return stops;
  }

  map.addLayer({
    "id": "mapillarySequenceLine",
    "type": "line",
    "source": "mapillaryCoverage",
    "source-layer": "mapillary-sequences",
    "paint": {
      "line-color": "white",
      "line-width": {
        "stops": [
          [8, 1],
          [13, 3],
          [16, 2]
        ]
      },
      "line-opacity": {
        "stops": [
          [8, 0.2],
          [13, 0.7]
        ]
      }
    },
    "filter": ["==", "key", ""]
  });

  map.addLayer({
    "id": "mapillaryImages",
    "type": "symbol",
    "source": "mapillaryCoverage",
    "source-layer": "mapillary-images",
    "layout": {
      "icon-image": "Pointer-2",
      "icon-rotate": {
        "property": "ca",
        "stops": iconRotations()
      }
    },
    "paint": {
      "icon-opacity": {
        "stops": [
          [15, 0],
          [16, 1]
        ]
      }
    }
  });

  map.addLayer({
    "id": "mapillaryImageHighlight",
    "type": "symbol",
    "source": "mapillaryCoverage",
    "source-layer": "mapillary-images",
    "layout": {
      "icon-image": "Pointer-2-focus",
      "icon-rotate": {
        "property": "ca",
        "stops": iconRotations()
      }
    },
    "filter": ["==", "key", ""]
  });

  map.addLayer({
    "id": "mapillarySequenceImages",
    "type": "symbol",
    "source": "mapillaryCoverage",
    "source-layer": "mapillary-images",
    "layout": {
      "icon-image": "Pointer-1",
      "icon-rotate": {
        "property": "ca",
        "stops": iconRotations()
      }
    },
    "filter": ["==", "key", ""]
  });

  map.addLayer({
    "id": "mapillarySequenceImagesHighlight",
    "type": "symbol",
    "source": "mapillaryCoverage",
    "source-layer": "mapillary-images",
    "layout": {
      "icon-image": "Pointer-1-focus",
      "icon-rotate": {
        "property": "ca",
        "stops": iconRotations()
      }
    },
    "filter": ["==", "key", ""]
  });

  map.addLayer({
    "id": "mapillaryRestrictionsIconHighlight",
    "type": "circle",
    "source": "mapillary",
    "source-layer": "objects",
    "paint": {
      "circle-radius": 15,
      "circle-opacity": 0.3,
      "circle-color": "white"
    },
    "filter": ["==", "rects", ""]
  });

  map.addLayer({
    "id": "mapillaryRestrictionsIcon",
    "type": "symbol",
    "source": "mapillary",
    "source-layer": "objects",
    "layout": {
      "icon-image": "{value}",
      "icon-image": "{value}",
      "icon-allow-overlap": true,
      "icon-size": 0.8
    },
    "filter": mapillaryRestrictionsFilter
  });

  map.addLayer({
    "id": "mapillaryRestrictionsLabel",
    "type": "symbol",
    "source": "mapillary",
    "source-layer": "objects",
    "layout": {
      "text-field": "{value}",
      "text-size": 14,
      "text-offset": [0, 2],
      "text-font": ["Clan Offc Pro Bold"],
      "text-allow-overlap": false
    },
    "paint": {
      "text-color": "hsl(112, 100%, 50%)",
      "text-halo-color": "black",
      "text-halo-width": 1,
      "text-opacity": {
        "stops": [
          [15, 0],
          [16, 1]
        ]
      }
    },
    "filter": mapillaryRestrictionsFilter
  });

  map.on('click', function(e) {
    var mapillaryRestrictions = map.queryRenderedFeatures([
      [e.point.x - 5, e.point.y - 5],
      [e.point.x + 5, e.point.y + 5]
    ], { layers: ["mapillaryRestrictionsIcon"] });

    if (mapillaryRestrictions.length) {
      var restriction = mapillaryRestrictions[0];
      var rects = restriction.properties.rects;
      var imageKeys = JSON.parse(rects).map(function(rect) {
        return rect.image_key;
      });

      map.setFilter("mapillaryImageHighlight", ["==", "key", ""]);
      map.setFilter("mapillarySequenceLine", ["==", "key", ""]);

      map.setFilter("mapillaryRestrictionsIconHighlight", ["==", "rects", rects]);
      map.setFilter("mapillarySequenceImagesHighlight", ["in", "key"].concat(imageKeys));
    }

    var mapillaryImages = map.queryRenderedFeatures([
      [e.point.x - 5, e.point.y - 5],
      [e.point.x + 5, e.point.y + 5]
    ], { layers: ["mapillaryImages", "mapillarySequenceImagesHighlight"] });

    if (mapillaryImages.length) {
      var image = mapillaryImages[0];
      var imageKey = image.properties.key;
      var sequenceKey = image.properties.skey;

      mapillaryImageKey = imageKey;

      map.setFilter("mapillaryImageHighlight", ["==", "key", imageKey]);
      map.setFilter("mapillarySequenceLine", ["==", "key", sequenceKey]);

      $("#mly").show();
      mly.moveToKey(imageKey);
    }
  });

  mly.on('nodechanged', function(node) {
    map.setFilter("mapillaryImageHighlight", ["==", "key", node.key]);
    map.setFilter("mapillarySequenceLine", ["==", "key", node.sequence.key]);

    mapillaryImageKey = node.key;
  });

  $("#mly").click(function(e) {
    if (e.target.className == "domRenderer") {
      var url = "https://d1cuyjsrcm0gby.cloudfront.net/" + mapillaryImageKey + "/thumb-2048.jpg";
      window.open(url, "_blank")
    }
  });
}

function setupTileBoundaries() {
  map.addSource("tileBoundarySource", {
    "type": "geojson",
    "data": {
      "type": "FeatureCollection",
      "features": []
    }
  });

  map.addLayer({
    "id": "tileBoundaryGrid",
    "type": "line",
    "source": "tileBoundarySource",
    "layout": {
      "visibility": "visible",
    },
    "paint": {
      "line-color": "red",
    }
  });

  map.addLayer({
    "id": "tileBoundaryText",
    "type": "symbol",
    "source": "tileBoundarySource",
    "layout": {
      "visibility": "visible",
      "text-field": "{id}",
      "text-size": 14,
      "text-offset": [4, 4],
    },
    "paint": {
      "text-color": "red",
    }
  });

  map.on("moveend", function() {
    if (map.getZoom() > 13) {
      showTileBoundary();
    } else {
      hideTileBoundary();
    }
  });

  function showTileBoundary() {
    map.setLayoutProperty("tileBoundaryGrid", "visibility", "visible");
    map.setLayoutProperty("tileBoundaryText", "visibility", "visible");

    var bbox = [
      map.getBounds()["_sw"]["lng"],
      map.getBounds()["_sw"]["lat"],
      map.getBounds()["_ne"]["lng"],
      map.getBounds()["_ne"]["lat"]
    ];

    var poly = turf.bboxPolygon(bbox);
    var limits = {
      min_zoom: 16,
      max_zoom: 16
    };

    var geojson = cover.geojson(poly.geometry, limits);
    var indexes = [];
    indexes = cover.tiles(poly.geometry, limits);
    var arr = geojson.features;
    var i;

    for(i = 0; i < geojson.features.length; i++) {
      geojson.features[i]["properties"] = {"id" : indexes[i][0] + ", " + indexes[i][1]};
    }

    map.getSource("tileBoundarySource").setData(geojson);
  }

  function hideTileBoundary() {
    map.setLayoutProperty("tileBoundaryGrid", "visibility", "none");
    map.setLayoutProperty("tileBoundaryText", "visibility", "none");
  }
}

function setupOverpass() {
  map.addSource("osmRestrictionsSource", {
    "type": "geojson",
    "data": overpassResults 
  });

  map.addLayer({
    "id": "osmHighwayStop",
    "type": "circle",
    "source": "osmRestrictionsSource",
    "filter": ["in", "highway", "stop"],
    "layout": {
      "visibility": "visible"
    },
    "paint": {
      "circle-color": "hsl(0, 66%, 53%)",
      "circle-opacity": {
        "base": 1,
        "stops": [
          [13.9, 0],
          [14, 0.6]
        ]
      },
      "circle-radius": {
        "base": 1,
        "stops": [
          [10, 4],
          [13.9, 8]
        ]
      }
    }
  });

  map.addLayer({
    "id": "osmHighwayTrafficSignals",
    "type": "circle",
    "source": "osmRestrictionsSource",
    "filter": ["in", "highway", "traffic_signals"],
    "layout": {
      "visibility": "visible"
    },
    "paint": {
      "circle-color": "hsl(206, 100%, 50%)",
      "circle-opacity": {
        "base": 1,
        "stops": [
          [13.9, 0],
          [14, 0.6]
        ]
      },
      "circle-radius": {
        "base": 1,
        "stops": [
          [10, 4],
          [13.9, 8]
        ]
      }
    }
  });
}


function setupJOSMButton() {
  $("#josm").on('click', openInJOSM);

  function openInJOSM() {
    var bounds = map.getBounds();

    var top    = bounds.getNorth(),
    bottom = bounds.getSouth(),
    left   = bounds.getWest(),
    right  = bounds.getEast();

    var josmUrl = "http://127.0.0.1:8111/load_and_zoom?left=" + left + "&right=" + right + "&top=" + top + "&bottom=" + bottom;

    $.ajax(josmUrl, function() {});
  }
}
