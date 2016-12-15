(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var bboxPolygon = require("turf-bbox-polygon");
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

var mly = new Mapillary.Viewer("mly-viewer", "MFo5YmpwMmxHMmxJaUt3VW14c0ZCZzphZDU5ZDBjNTMzN2Y3YTE3", null);
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

  map.on("click", function(e) {
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

  $("#mly-close").on("click", function(e) {
    $("#mly").hide();
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

    var poly = bboxPolygon(bbox);
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
    var url = DATASETS_PROXY_URL + (startID ? "?start=" + startID : "");

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

  map.on("click", function(e) {
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

      $("#save-review").on("click", function() {
        junction.properties.status = $("input[name=review]:checked").val();
        junction.properties.timestamp = Date.now();

        function uid(feature) {
          return feature.properties.uid;
        }

        var reviewedFeature = {
          type: "Feature",
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
  $("#josm").on("click", openInJOSM);

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

},{"tile-cover":2,"turf-bbox-polygon":4}],2:[function(require,module,exports){
var tilebelt = require('tilebelt');

/**
 * Given a geometry, create cells and return them in a format easily readable
 * by any software that reads GeoJSON.
 *
 * @alias geojson
 * @param {Object} geom GeoJSON geometry
 * @param {Object} limits an object with min_zoom and max_zoom properties
 * specifying the minimum and maximum level to be tiled.
 * @returns {Object} FeatureCollection of cells formatted as GeoJSON Features
 */
exports.geojson = function (geom, limits) {
    return {
        type: 'FeatureCollection',
        features: getTiles(geom, limits).map(tileToFeature)
    };
};

function tileToFeature(t) {
    return {
        type: 'Feature',
        geometry: tilebelt.tileToGeoJSON(t),
        properties: {}
    };
}

/**
 * Given a geometry, create cells and return them in their raw form,
 * as an array of cell identifiers.
 *
 * @alias tiles
 * @param {Object} geom GeoJSON geometry
 * @param {Object} limits an object with min_zoom and max_zoom properties
 * specifying the minimum and maximum level to be tiled.
 * @returns {Array<Array<number>>} An array of tiles given as [x, y, z] arrays
 */
exports.tiles = getTiles;

/**
 * Given a geometry, create cells and return them as
 * [quadkey](http://msdn.microsoft.com/en-us/library/bb259689.aspx) indexes.
 *
 * @alias indexes
 * @param {Object} geom GeoJSON geometry
 * @param {Object} limits an object with min_zoom and max_zoom properties
 * specifying the minimum and maximum level to be tiled.
 * @returns {Array<String>} An array of tiles given as quadkeys.
 */
exports.indexes = function (geom, limits) {
    return getTiles(geom, limits).map(tilebelt.tileToQuadkey);
};

function getTiles(geom, limits) {
    var i, tile,
        coords = geom.coordinates,
        maxZoom = limits.max_zoom,
        tileHash = {},
        tiles = [];

    if (geom.type === 'Point') {
        return [tilebelt.pointToTile(coords[0], coords[1], maxZoom)];

    } else if (geom.type === 'MultiPoint') {
        for (i = 0; i < coords.length; i++) {
            tile = tilebelt.pointToTile(coords[i][0], coords[i][1], maxZoom);
            tileHash[toID(tile[0], tile[1], tile[2])] = true;
        }
    } else if (geom.type === 'LineString') {
        lineCover(tileHash, coords, maxZoom);

    } else if (geom.type === 'MultiLineString') {
        for (i = 0; i < coords.length; i++) {
            lineCover(tileHash, coords[i], maxZoom);
        }
    } else if (geom.type === 'Polygon') {
        polygonCover(tileHash, tiles, coords, maxZoom);

    } else if (geom.type === 'MultiPolygon') {
        for (i = 0; i < coords.length; i++) {
            polygonCover(tileHash, tiles, coords[i], maxZoom);
        }
    } else {
        throw new Error('Geometry type not implemented');
    }

    if (limits.min_zoom !== maxZoom) {
        // sync tile hash and tile array so that both contain the same tiles
        var len = tiles.length;
        appendHashTiles(tileHash, tiles);
        for (i = 0; i < len; i++) {
            var t = tiles[i];
            tileHash[toID(t[0], t[1], t[2])] = true;
        }
        return mergeTiles(tileHash, tiles, limits);
    }

    appendHashTiles(tileHash, tiles);
    return tiles;
}

function mergeTiles(tileHash, tiles, limits) {
    var mergedTiles = [];

    for (var z = limits.max_zoom; z > limits.min_zoom; z--) {

        var parentTileHash = {};
        var parentTiles = [];

        for (var i = 0; i < tiles.length; i++) {
            var t = tiles[i];

            if (t[0] % 2 === 0 && t[1] % 2 === 0) {
                var id2 = toID(t[0] + 1, t[1], z),
                    id3 = toID(t[0], t[1] + 1, z),
                    id4 = toID(t[0] + 1, t[1] + 1, z);

                if (tileHash[id2] && tileHash[id3] && tileHash[id4]) {
                    tileHash[toID(t[0], t[1], t[2])] = false;
                    tileHash[id2] = false;
                    tileHash[id3] = false;
                    tileHash[id4] = false;

                    var parentTile = [t[0] / 2, t[1] / 2, z - 1];

                    if (z - 1 === limits.min_zoom) mergedTiles.push(parentTile);
                    else {
                        parentTileHash[toID(t[0] / 2, t[1] / 2, z - 1)] = true;
                        parentTiles.push(parentTile);
                    }
                }
            }
        }

        for (i = 0; i < tiles.length; i++) {
            t = tiles[i];
            if (tileHash[toID(t[0], t[1], t[2])]) mergedTiles.push(t);
        }

        tileHash = parentTileHash;
        tiles = parentTiles;
    }

    return mergedTiles;
}

function polygonCover(tileHash, tileArray, geom, zoom) {
    var intersections = [];

    for (var i = 0; i < geom.length; i++) {
        var ring = [];
        lineCover(tileHash, geom[i], zoom, ring);

        for (var j = 0, len = ring.length, k = len - 1; j < len; k = j++) {
            var m = (j + 1) % len;
            var y = ring[j][1];

            // add interesction if it's not local extremum or duplicate
            if ((y > ring[k][1] || y > ring[m][1]) && // not local minimum
                (y < ring[k][1] || y < ring[m][1]) && // not local maximum
                y !== ring[m][1]) intersections.push(ring[j]);
        }
    }

    intersections.sort(compareTiles); // sort by y, then x

    for (i = 0; i < intersections.length; i += 2) {
        // fill tiles between pairs of intersections
        y = intersections[i][1];
        for (var x = intersections[i][0] + 1; x < intersections[i + 1][0]; x++) {
            var id = toID(x, y, zoom);
            if (!tileHash[id]) {
                tileArray.push([x, y, zoom]);
            }
        }
    }
}

function compareTiles(a, b) {
    return (a[1] - b[1]) || (a[0] - b[0]);
}

function lineCover(tileHash, coords, maxZoom, ring) {
    var prevX, prevY;

    for (var i = 0; i < coords.length - 1; i++) {
        var start = tilebelt.pointToTileFraction(coords[i][0], coords[i][1], maxZoom),
            stop = tilebelt.pointToTileFraction(coords[i + 1][0], coords[i + 1][1], maxZoom),
            x0 = start[0],
            y0 = start[1],
            x1 = stop[0],
            y1 = stop[1],
            dx = x1 - x0,
            dy = y1 - y0;

        if (dy === 0 && dx === 0) continue;

        var sx = dx > 0 ? 1 : -1,
            sy = dy > 0 ? 1 : -1,
            x = Math.floor(x0),
            y = Math.floor(y0),
            tMaxX = dx === 0 ? Infinity : Math.abs(((dx > 0 ? 1 : 0) + x - x0) / dx),
            tMaxY = dy === 0 ? Infinity : Math.abs(((dy > 0 ? 1 : 0) + y - y0) / dy),
            tdx = Math.abs(sx / dx),
            tdy = Math.abs(sy / dy);

        if (x !== prevX || y !== prevY) {
            tileHash[toID(x, y, maxZoom)] = true;
            if (ring && y !== prevY) ring.push([x, y]);
            prevX = x;
            prevY = y;
        }

        while (tMaxX < 1 || tMaxY < 1) {
            if (tMaxX < tMaxY) {
                tMaxX += tdx;
                x += sx;
            } else {
                tMaxY += tdy;
                y += sy;
            }
            tileHash[toID(x, y, maxZoom)] = true;
            if (ring && y !== prevY) ring.push([x, y]);
            prevX = x;
            prevY = y;
        }
    }

    if (ring && y === ring[0][1]) ring.pop();
}

function appendHashTiles(hash, tiles) {
    var keys = Object.keys(hash);
    for (var i = 0; i < keys.length; i++) {
        tiles.push(fromID(+keys[i]));
    }
}

function toID(x, y, z) {
    var dim = 2 * (1 << z);
    return ((dim * y + x) * 32) + z;
}

function fromID(id) {
    var z = id % 32,
        dim = 2 * (1 << z),
        xy = ((id - z) / 32),
        x = xy % dim,
        y = ((xy - x) / dim) % dim;
    return [x, y, z];
}

},{"tilebelt":3}],3:[function(require,module,exports){
// a tile is an array [x,y,z]
var d2r = Math.PI / 180,
    r2d = 180 / Math.PI;

function tileToBBOX (tile) {
    var e = tile2lon(tile[0]+1,tile[2]);
    var w = tile2lon(tile[0],tile[2]);
    var s = tile2lat(tile[1]+1,tile[2]);
    var n = tile2lat(tile[1],tile[2]);
    return [w,s,e,n];
}

function tileToGeoJSON (tile) {
    var bbox = tileToBBOX(tile);
    var poly = {
        type: 'Polygon',
        coordinates:
            [
                [
                    [bbox[0],bbox[1]],
                    [bbox[0], bbox[3]],
                    [bbox[2], bbox[3]],
                    [bbox[2], bbox[1]],
                    [bbox[0], bbox[1]]
                ]
            ]
    };
    return poly;
}

function tile2lon(x, z) {
    return (x/Math.pow(2,z)*360-180);
}

function tile2lat(y, z) {
    var n=Math.PI-2*Math.PI*y/Math.pow(2,z);
    return (r2d*Math.atan(0.5*(Math.exp(n)-Math.exp(-n))));
}

function pointToTile(lon, lat, z) {
    var tile = pointToTileFraction(lon, lat, z);
    tile[0] = Math.floor(tile[0]);
    tile[1] = Math.floor(tile[1]);
    return tile;
}

function getChildren (tile) {
    return [
        [tile[0]*2, tile[1]*2, tile[2]+1],
        [tile[0]*2+1, tile[1]*2, tile[2 ]+1],
        [tile[0]*2+1, tile[1]*2+1, tile[2]+1],
        [tile[0]*2, tile[1]*2+1, tile[2]+1],
    ];
}

function getParent (tile) {
    // top left
    if(tile[0]%2===0 && tile[1]%2===0) {
        return [tile[0]/2, tile[1]/2, tile[2]-1];
    }
    // bottom left
    else if((tile[0]%2===0) && (!tile[1]%2===0)) {
        return [tile[0]/2, (tile[1]-1)/2, tile[2]-1];
    }
    // top right
    else if((!tile[0]%2===0) && (tile[1]%2===0)) {
        return [(tile[0]-1)/2, (tile[1])/2, tile[2]-1];
    }
    // bottom right
    else {
        return [(tile[0]-1)/2, (tile[1]-1)/2, tile[2]-1];
    }
}

function getSiblings (tile) {
    return getChildren(getParent(tile));
}

function hasSiblings(tile, tiles) {
    var siblings = getSiblings(tile);
    for (var i = 0; i < siblings.length; i++) {
        if (!hasTile(tiles, siblings[i])) return false;
    }
    return true;
}

function hasTile(tiles, tile) {
    for (var i = 0; i < tiles.length; i++) {
        if (tilesEqual(tiles[i], tile)) return true;
    }
    return false;
}

function tilesEqual(tile1, tile2) {
    return (
        tile1[0] === tile2[0] &&
        tile1[1] === tile2[1] &&
        tile1[2] === tile2[2]
    );
}

function tileToQuadkey(tile) {
  var index = '';
  for (var z = tile[2]; z > 0; z--) {
      var b = 0;
      var mask = 1 << (z - 1);
      if ((tile[0] & mask) !== 0) b++;
      if ((tile[1] & mask) !== 0) b += 2;
      index += b.toString();
  }
  return index;
}

function quadkeyToTile(quadkey) {
    var x = 0;
    var y = 0;
    var z = quadkey.length;

    for (var i = z; i > 0; i--) {
        var mask = 1 << (i - 1);
        switch (quadkey[z - i]) {
            case '0':
                break;

            case '1':
                x |= mask;
                break;

            case '2':
                y |= mask;
                break;

            case '3':
                x |= mask;
                y |= mask;
                break;
        }
    }
    return [x,y,z];
}

function bboxToTile(bboxCoords) {
    var min = pointToTile(bboxCoords[0], bboxCoords[1], 32);
    var max = pointToTile(bboxCoords[2], bboxCoords[3], 32);
    var bbox = [min[0], min[1], max[0], max[1]];

    var z = getBboxZoom(bbox);
    if (z === 0) return [0,0,0];
    var x = bbox[0] >>> (32 - z);
    var y = bbox[1] >>> (32 - z);
    return [x,y,z];
}

function getBboxZoom(bbox) {
    var MAX_ZOOM = 28;
    for (var z = 0; z < MAX_ZOOM; z++) {
        var mask = 1 << (32 - (z + 1));
        if (((bbox[0] & mask) != (bbox[2] & mask)) ||
            ((bbox[1] & mask) != (bbox[3] & mask))) {
            return z;
        }
    }

    return MAX_ZOOM;
}

function pointToTileFraction(lon, lat, z) {
    var sin = Math.sin(lat * d2r),
        z2 = Math.pow(2, z),
        x = z2 * (lon / 360 + 0.5),
        y = z2 * (0.5 - 0.25 * Math.log((1 + sin) / (1 - sin)) / Math.PI);
    return [x, y, z];
}

module.exports = {
    tileToGeoJSON: tileToGeoJSON,
    tileToBBOX: tileToBBOX,
    getChildren: getChildren,
    getParent: getParent,
    getSiblings: getSiblings,
    hasTile: hasTile,
    hasSiblings: hasSiblings,
    tilesEqual: tilesEqual,
    tileToQuadkey: tileToQuadkey,
    quadkeyToTile: quadkeyToTile,
    pointToTile: pointToTile,
    bboxToTile: bboxToTile,
    pointToTileFraction: pointToTileFraction
};

},{}],4:[function(require,module,exports){
var polygon = require('turf-helpers').polygon;

/**
 * Takes a bbox and returns an equivalent {@link Polygon|polygon}.
 *
 * @name bboxPolygon
 * @param {Array<number>} bbox an Array of bounding box coordinates in the form: ```[xLow, yLow, xHigh, yHigh]```
 * @return {Feature<Polygon>} a Polygon representation of the bounding box
 * @example
 * var bbox = [0, 0, 10, 10];
 *
 * var poly = turf.bboxPolygon(bbox);
 *
 * //=poly
 */

module.exports = function (bbox) {
    var lowLeft = [bbox[0], bbox[1]];
    var topLeft = [bbox[0], bbox[3]];
    var topRight = [bbox[2], bbox[3]];
    var lowRight = [bbox[2], bbox[1]];

    return polygon([[
        lowLeft,
        lowRight,
        topRight,
        topLeft,
        lowLeft
    ]]);
};

},{"turf-helpers":5}],5:[function(require,module,exports){
/**
 * Wraps a GeoJSON {@link Geometry} in a GeoJSON {@link Feature}.
 *
 * @name feature
 * @param {Geometry} geometry input geometry
 * @param {Object} properties properties
 * @returns {FeatureCollection} a FeatureCollection of input features
 * @example
 * var geometry = {
 *      "type": "Point",
 *      "coordinates": [
 *        67.5,
 *        32.84267363195431
 *      ]
 *    }
 *
 * var feature = turf.feature(geometry);
 *
 * //=feature
 */
function feature(geometry, properties) {
    return {
        type: 'Feature',
        properties: properties || {},
        geometry: geometry
    };
}

module.exports.feature = feature;

/**
 * Takes coordinates and properties (optional) and returns a new {@link Point} feature.
 *
 * @name point
 * @param {number[]} coordinates longitude, latitude position (each in decimal degrees)
 * @param {Object=} properties an Object that is used as the {@link Feature}'s
 * properties
 * @returns {Feature<Point>} a Point feature
 * @example
 * var pt1 = turf.point([-75.343, 39.984]);
 *
 * //=pt1
 */
module.exports.point = function (coordinates, properties) {
    if (!Array.isArray(coordinates)) throw new Error('Coordinates must be an array');
    if (coordinates.length < 2) throw new Error('Coordinates must be at least 2 numbers long');
    return feature({
        type: 'Point',
        coordinates: coordinates.slice()
    }, properties);
};

/**
 * Takes an array of LinearRings and optionally an {@link Object} with properties and returns a {@link Polygon} feature.
 *
 * @name polygon
 * @param {Array<Array<Array<number>>>} coordinates an array of LinearRings
 * @param {Object=} properties a properties object
 * @returns {Feature<Polygon>} a Polygon feature
 * @throws {Error} throw an error if a LinearRing of the polygon has too few positions
 * or if a LinearRing of the Polygon does not have matching Positions at the
 * beginning & end.
 * @example
 * var polygon = turf.polygon([[
 *  [-2.275543, 53.464547],
 *  [-2.275543, 53.489271],
 *  [-2.215118, 53.489271],
 *  [-2.215118, 53.464547],
 *  [-2.275543, 53.464547]
 * ]], { name: 'poly1', population: 400});
 *
 * //=polygon
 */
module.exports.polygon = function (coordinates, properties) {

    if (!coordinates) throw new Error('No coordinates passed');

    for (var i = 0; i < coordinates.length; i++) {
        var ring = coordinates[i];
        if (ring.length < 4) {
            throw new Error('Each LinearRing of a Polygon must have 4 or more Positions.');
        }
        for (var j = 0; j < ring[ring.length - 1].length; j++) {
            if (ring[ring.length - 1][j] !== ring[0][j]) {
                throw new Error('First and last Position are not equivalent.');
            }
        }
    }

    return feature({
        type: 'Polygon',
        coordinates: coordinates
    }, properties);
};

/**
 * Creates a {@link LineString} based on a
 * coordinate array. Properties can be added optionally.
 *
 * @name lineString
 * @param {Array<Array<number>>} coordinates an array of Positions
 * @param {Object=} properties an Object of key-value pairs to add as properties
 * @returns {Feature<LineString>} a LineString feature
 * @throws {Error} if no coordinates are passed
 * @example
 * var linestring1 = turf.lineString([
 *	[-21.964416, 64.148203],
 *	[-21.956176, 64.141316],
 *	[-21.93901, 64.135924],
 *	[-21.927337, 64.136673]
 * ]);
 * var linestring2 = turf.lineString([
 *	[-21.929054, 64.127985],
 *	[-21.912918, 64.134726],
 *	[-21.916007, 64.141016],
 * 	[-21.930084, 64.14446]
 * ], {name: 'line 1', distance: 145});
 *
 * //=linestring1
 *
 * //=linestring2
 */
module.exports.lineString = function (coordinates, properties) {
    if (!coordinates) {
        throw new Error('No coordinates passed');
    }
    return feature({
        type: 'LineString',
        coordinates: coordinates
    }, properties);
};

/**
 * Takes one or more {@link Feature|Features} and creates a {@link FeatureCollection}.
 *
 * @name featureCollection
 * @param {Feature[]} features input features
 * @returns {FeatureCollection} a FeatureCollection of input features
 * @example
 * var features = [
 *  turf.point([-75.343, 39.984], {name: 'Location A'}),
 *  turf.point([-75.833, 39.284], {name: 'Location B'}),
 *  turf.point([-75.534, 39.123], {name: 'Location C'})
 * ];
 *
 * var fc = turf.featureCollection(features);
 *
 * //=fc
 */
module.exports.featureCollection = function (features) {
    return {
        type: 'FeatureCollection',
        features: features
    };
};

/**
 * Creates a {@link Feature<MultiLineString>} based on a
 * coordinate array. Properties can be added optionally.
 *
 * @name multiLineString
 * @param {Array<Array<Array<number>>>} coordinates an array of LineStrings
 * @param {Object=} properties an Object of key-value pairs to add as properties
 * @returns {Feature<MultiLineString>} a MultiLineString feature
 * @throws {Error} if no coordinates are passed
 * @example
 * var multiLine = turf.multiLineString([[[0,0],[10,10]]]);
 *
 * //=multiLine
 *
 */
module.exports.multiLineString = function (coordinates, properties) {
    if (!coordinates) {
        throw new Error('No coordinates passed');
    }
    return feature({
        type: 'MultiLineString',
        coordinates: coordinates
    }, properties);
};

/**
 * Creates a {@link Feature<MultiPoint>} based on a
 * coordinate array. Properties can be added optionally.
 *
 * @name multiPoint
 * @param {Array<Array<number>>} coordinates an array of Positions
 * @param {Object=} properties an Object of key-value pairs to add as properties
 * @returns {Feature<MultiPoint>} a MultiPoint feature
 * @throws {Error} if no coordinates are passed
 * @example
 * var multiPt = turf.multiPoint([[0,0],[10,10]]);
 *
 * //=multiPt
 *
 */
module.exports.multiPoint = function (coordinates, properties) {
    if (!coordinates) {
        throw new Error('No coordinates passed');
    }
    return feature({
        type: 'MultiPoint',
        coordinates: coordinates
    }, properties);
};


/**
 * Creates a {@link Feature<MultiPolygon>} based on a
 * coordinate array. Properties can be added optionally.
 *
 * @name multiPolygon
 * @param {Array<Array<Array<Array<number>>>>} coordinates an array of Polygons
 * @param {Object=} properties an Object of key-value pairs to add as properties
 * @returns {Feature<MultiPolygon>} a multipolygon feature
 * @throws {Error} if no coordinates are passed
 * @example
 * var multiPoly = turf.multiPolygon([[[[0,0],[0,10],[10,10],[10,0],[0,0]]]);
 *
 * //=multiPoly
 *
 */
module.exports.multiPolygon = function (coordinates, properties) {
    if (!coordinates) {
        throw new Error('No coordinates passed');
    }
    return feature({
        type: 'MultiPolygon',
        coordinates: coordinates
    }, properties);
};

/**
 * Creates a {@link Feature<GeometryCollection>} based on a
 * coordinate array. Properties can be added optionally.
 *
 * @name geometryCollection
 * @param {Array<{Geometry}>} geometries an array of GeoJSON Geometries
 * @param {Object=} properties an Object of key-value pairs to add as properties
 * @returns {Feature<GeometryCollection>} a geometrycollection feature
 * @example
 * var pt = {
 *     "type": "Point",
 *       "coordinates": [100, 0]
 *     };
 * var line = {
 *     "type": "LineString",
 *     "coordinates": [ [101, 0], [102, 1] ]
 *   };
 * var collection = turf.geometrycollection([[0,0],[10,10]]);
 *
 * //=collection
 */
module.exports.geometryCollection = function (geometries, properties) {
    return feature({
        type: 'GeometryCollection',
        geometries: geometries
    }, properties);
};

var factors = {
    miles: 3960,
    nauticalmiles: 3441.145,
    degrees: 57.2957795,
    radians: 1,
    inches: 250905600,
    yards: 6969600,
    meters: 6373000,
    metres: 6373000,
    kilometers: 6373,
    kilometres: 6373
};

/*
 * Convert a distance measurement from radians to a more friendly unit.
 *
 * @name radiansToDistance
 * @param {number} distance in radians across the sphere
 * @param {string=kilometers} units: one of miles, nauticalmiles, degrees, radians,
 * inches, yards, metres, meters, kilometres, kilometers.
 * @returns {number} distance
 */
module.exports.radiansToDistance = function (radians, units) {
    var factor = factors[units || 'kilometers'];
    if (factor === undefined) {
        throw new Error('Invalid unit');
    }
    return radians * factor;
};

/*
 * Convert a distance measurement from a real-world unit into radians
 *
 * @name distanceToRadians
 * @param {number} distance in real units
 * @param {string=kilometers} units: one of miles, nauticalmiles, degrees, radians,
 * inches, yards, metres, meters, kilometres, kilometers.
 * @returns {number} radians
 */
module.exports.distanceToRadians = function (distance, units) {
    var factor = factors[units || 'kilometers'];
    if (factor === undefined) {
        throw new Error('Invalid unit');
    }
    return distance / factor;
};

/*
 * Convert a distance measurement from a real-world unit into degrees
 *
 * @name distanceToRadians
 * @param {number} distance in real units
 * @param {string=kilometers} units: one of miles, nauticalmiles, degrees, radians,
 * inches, yards, metres, meters, kilometres, kilometers.
 * @returns {number} degrees
 */
module.exports.distanceToDegrees = function (distance, units) {
    var factor = factors[units || 'kilometers'];
    if (factor === undefined) {
        throw new Error('Invalid unit');
    }
    return (distance / factor) * 57.2958;
};

},{}]},{},[1]);
