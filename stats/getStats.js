var DATASETS_PROXY_URL = "https://cjj7opwkt0.execute-api.us-east-1.amazonaws.com/testing/features";

var osmReviews = {
  type: "FeatureCollection",
  features: []
};

var stats = {
  /*
  datestring: { added: ..., nosignal: ..., deleted: ...},
  ...
  */
};

function getFeatures(startID) {
  showLoading();

  var url = DATASETS_PROXY_URL + (startID ? '?start=' + startID : '');

  $.getJSON(url, function(data) {
    if (data.features.length) {
      osmReviews.features = osmReviews.features.concat(data.features);

      var lastFeatureID = data.features[data.features.length - 1].id;
      getFeatures(lastFeatureID);
    } else {
      hideLoading();
      getStats();
    }
  });
}

function getStats() {
  var reviewedJunctions = osmReviews.features.filter(function(f) { return "status" in f.properties });

  reviewedJunctions.forEach(function(f) {
    var timestamp = f.properties.timestamp;
    var status = f.properties.status;

    var ds = getDateString(timestamp);
    stats[ds] = stats[ds] || {};
    stats[ds][status] = stats[ds][status] || 0;
    stats[ds][status] += 1;
  });

  displayStats();
}

function getDateString(timestamp) {
  var dt = new Date(timestamp);
  var y = dt.getFullYear();
  var m = dt.getMonth() + 1;
  var d = dt.getDate();

  return y + "-" + m + "-" + d;
}

function displayStats() {
  var html = ''
  + '<table class="prose">'
  +   '<thead>'
  +     '<tr>'
  +       '<th>Date</th>'
  +       '<th>Reviewed</th>'
  +       '<th>Added</th>'
  +       '<th>No Signal</th>'
  +     '</tr>'
  +   '</thead>'
  +   '<tbody>'
  +      getTableRows()
  +   '</tbody>'
  + '</table>';

  function getTableRows() {
    var tableRows = '';
    var dates = Object.keys(stats).sort(function(a, b) { return a > b; });
    dates.forEach(function(date) {
      tableRows += ''
      + '<tr>'
      +   '<td>' + date + '</td>'
      +   '<td>' + stats[date].reviewed + '</td>'
      +   '<td>' + stats[date].added    + '</td>'
      +   '<td>' + stats[date].nosignal + '</td>'
      + '</tr>';
    });
    return tableRows;
  }

  $('#stats').html(html);
}

function showLoading() {
  $('#stats').addClass('loading loading-text');
  $('#stats').text('Downloading the interwebz ...');
}

function hideLoading() {
  $('#stats').removeClass('loading loading-text');
  $('#stats').text('');
}

getFeatures();
