var turf = require("turf");
var cover = require("tile-cover");

mapboxgl.accessToken = "pk.eyJ1IjoicGxhbmVtYWQiLCJhIjoiemdYSVVLRSJ9.g3lbg_eN0kztmsfIPxa9MQ";

var map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/planemad/cinpwopfb008hcam0mqxbxwuq",
  center: [-122.4387, 37.7993],
  zoom: 14,
  hash: true,
  keyboard: false
});

map.addControl(new mapboxgl.NavigationControl({
  position: "top-right"
}));

var mly = new Mapillary.Viewer("mly", "MFo5YmpwMmxHMmxJaUt3VW14c0ZCZzphZDU5ZDBjNTMzN2Y3YTE3", null);
$("#mly").hide();

map.once("load", function() {
  hideDefaultLayers();
  highlightMajorRoads();

  setupMapillary();
  setupTileBoundaries();
  setupOSMRestrictions();
  setupOSMJunctions();
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

function highlightMajorRoads() {
  map.setPaintProperty("road-primary", "line-color", "#aaaaaa");
  map.setPaintProperty("road-secondary-tertiary", "line-color", "#aaaaaa");
  map.setPaintProperty("road-trunk", "line-color", "#aaaaaa");
};

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
      "https://d25uarhxywzl1j.cloudfront.net/v0.1/{z}/{x}/{y}.mvt"
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
      "line-color": "#66cc66",
      "line-width": {
        "stops": [
          [8, 0.5],
          [13, 1],
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
      },
      "icon-rotation-alignment": "map"
    },
    "paint": {
      "icon-opacity": {
        "stops": [
          [15, 0],
          [16, 0.7]
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
      },
      "icon-rotation-alignment": "map"
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
      },
      "icon-rotation-alignment": "map"
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
      },
      "icon-rotation-alignment": "map"
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
          [18, 0],
          [19, 1]
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

      map.setFilter("mapillaryImageHighlight", ["==", "key", imageKey]);
      map.setFilter("mapillarySequenceLine", ["==", "key", sequenceKey]);

      $("#mly").show();
      mly.moveToKey(imageKey);
    }
  });

  mly.on(Mapillary.Viewer.nodechanged, function(node) {
    map.setFilter("mapillaryImageHighlight", ["==", "key", node.key]);
    map.setFilter("mapillarySequenceLine", ["==", "key", node.sequenceKey]);
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
      "line-color": "#cc6666",
    }
  });

  map.addLayer({
    "id": "tileBoundaryText",
    "type": "symbol",
    "source": "tileBoundarySource",
    "layout": {
      "visibility": "visible",
      "text-field": "{id}",
      "text-size":  {
        "base": 1.5,
        "stops": [
          [13, 8],
          [14, 14]
        ]
      },
      "text-offset": [0, 0],
      "text-anchor": "center",
    },
    "paint": {
      "text-color": "#cc6666",
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

function setupOSMRestrictions() {
  map.addSource("osmRestrictionsSource", {
    "type": "geojson",
    "data": osmRestrictions
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
      "circle-color": "hsl(0, 60%, 50%)",
      "circle-opacity": {
        "base": 1,
        "stops": [
          [13.9, 0],
          [14, 0.8]
        ]
      },
      "circle-radius": {
        "base": 1,
        "stops": [
          [10, 4],
          [13.9, 10]
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
      "circle-color": "hsl(200, 70%, 50%)",
      "circle-opacity": {
        "base": 1,
        "stops": [
          [13.9, 0],
          [14, 0.8]
        ]
      },
      "circle-radius": {
        "base": 1,
        "stops": [
          [10, 4],
          [13.9, 10]
        ]
      }
    }
  });
}

function setupOSMJunctions() {
  var DATASETS_PROXY_URL = "https://xck30z94kl.execute-api.us-east-1.amazonaws.com/testing/features";

  var osmJunctions = {
    type: "FeatureCollection",
    features: []
  };

  map.addSource("osmJunctionsSource", {
    "type": "geojson",
    "data": osmJunctions
  });

  function getFeatures(startID) {
    var url = DATASETS_PROXY_URL + (startID ? '?start=' + startID : '');

    $.getJSON(url, function(data) {
      if (data.features.length) {
        data.features.forEach(f => f.properties.uid = f.id);

        osmJunctions.features = osmJunctions.features.concat(data.features);
        map.getSource("osmJunctionsSource")
          .setData(osmJunctions);

        var lastFeatureID = data.features[data.features.length - 1].id;
        getFeatures(lastFeatureID);
      }
    })
  }

  getFeatures();

  map.addLayer({
    "id": "osmJunctionsHighlight",
    "type": "circle",
    "source": "osmJunctionsSource",
    "layout": {
      "visibility": "visible"
    },
    "paint": {
      "circle-radius": 10,
      "circle-opacity": 0.3,
      "circle-color": "white"
    },
    "filter": ["==", "id", ""]
  });

  map.addLayer({
    "id": "osmJunctions",
    "type": "circle",
    "source": "osmJunctionsSource",
    "layout": {
      "visibility": "visible"
    },
    "paint": {
      "circle-color": "#cccc00",
      "circle-opacity": {
        "base": 1,
        "stops": [
          [13.9, 0],
          [14, 0.9]
        ]
      },
      "circle-radius": {
        "base": 1,
        "stops": [
          [10, 2],
          [13.9, 6]
        ]
      }
    },
    "filter": ["!has", "status"]
  });

  map.addLayer({
    "id": "osmJunctionsReviewed",
    "type": "circle",
    "source": "osmJunctionsSource",
    "layout": {
      "visibility": "visible"
    },
    "paint": {
      "circle-color": "#bbbbbb",
      "circle-opacity": {
        "base": 1,
        "stops": [
          [13.9, 0],
          [14, 0.9]
        ]
      },
      "circle-radius": {
        "base": 1,
        "stops": [
          [10, 2],
          [13.9, 6]
        ]
      }
    },
    "filter": ["==", "status", "reviewed"]
  });

  map.addLayer({
    "id": "osmJunctionsAdded",
    "type": "circle",
    "source": "osmJunctionsSource",
    "layout": {
      "visibility": "visible"
    },
    "paint": {
      "circle-color": "#00cccc",
      "circle-opacity": {
        "base": 1,
        "stops": [
          [13.9, 0],
          [14, 0.9]
        ]
      },
      "circle-radius": {
        "base": 1,
        "stops": [
          [10, 2],
          [13.9, 6]
        ]
      }
    },
    "filter": ["==", "status", "added"]
  });

  map.addLayer({
    "id": "osmJunctionsNoSignal",
    "type": "circle",
    "source": "osmJunctionsSource",
    "layout": {
      "visibility": "visible"
    },
    "paint": {
      "circle-color": "#666666",
      "circle-opacity": {
        "base": 1,
        "stops": [
          [13.9, 0],
          [14, 0.8]
        ]
      },
      "circle-radius": {
        "base": 1,
        "stops": [
          [10, 2],
          [13.9, 6]
        ]
      }
    },
    "filter": ["==", "status", "nosignal"]
  });

  map.on('click', function(e) {
    var selectedJunctions = map.queryRenderedFeatures([
      [e.point.x - 5, e.point.y - 5],
      [e.point.x + 5, e.point.y + 5]
    ], { layers: ["osmJunctions", "osmJunctionsReviewed", "osmJunctionsAdded", "osmJunctionsNoSignal"] });

    if (selectedJunctions.length) {
      var selectedJunction = selectedJunctions[0];
      map.setFilter("osmJunctionsHighlight", ["==", "uid", selectedJunction.properties.uid]);
      reviewJunction(selectedJunction);
    }

    function reviewJunction(junction) {
      var reviewForm = ""
        + "<div>"
          + "<div class='radio-pill pill pad2y clearfix'>"
            + "<input id='reviewed' type='radio' name='review' value='reviewed'>"
            + "<label for='reviewed' class='button short icon check'>Reviewed</label>"
            + "<input id='added' type='radio' name='review' value='added'>"
            + "<label for='added' class='button short icon check'>Added</label>"
            + "<input id='nosignal' type='radio' name='review' value='nosignal'>"
            + "<label for='nosignal' class='button icon short check'>No Signal</label>"
          + "</div>"
          + "<div>"
            + "<a id='save-review' class='margin2 button loud col8'>Save</a>"
          + "</div>"
        + "</div>";

      var popup = new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(reviewForm)
        .addTo(map);

      $('#save-review').on('click', function() {
        junction.properties.status = $("input[name=review]:checked").val();

        function uid(feature) {
          return feature.properties.uid;
        }

        var reviewedFeature = {
          type: 'Feature',
          geometry: junction.geometry,
          properties: junction.properties
        };

        popup.remove();

        $.ajax({
          url: DATASETS_PROXY_URL + "/" + uid(reviewedFeature),
          type: "PUT",
          contentType: "application/json",
          data: JSON.stringify(reviewedFeature)
        }).done(function(response) {
          osmJunctions.features = osmJunctions.features
            .filter(f => uid(f) !== uid(reviewedFeature))
            .concat(reviewedFeature);
          map.getSource("osmJunctionsSource").setData(osmJunctions);
          map.setFilter("osmJunctionsHighlight", ["==", "id", ""]);
        });
      });
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

    var josmUrl = "https://127.0.0.1:8112/load_and_zoom?left=" + left + "&right=" + right + "&top=" + top + "&bottom=" + bottom;

    $.ajax(josmUrl, function() {});
  }
}
