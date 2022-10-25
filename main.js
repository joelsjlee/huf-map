// Setting up map and necessary libraries
var GeoSearchControl = window.GeoSearch.GeoSearchControl;
var OpenStreetMapProvider = window.GeoSearch.OpenStreetMapProvider;
var map = L.map('map');
map.setView([40, -99], 5);

// Adding tile layer to map
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: 'Map data &copy; OpenStreetMap contributors'
}).addTo(map);

function getColor(d) {
    return d > 1000 ? '#800026' :
        d > 500 ? '#BD0026' :
            d > 200 ? '#E31A1C' :
                d > 100 ? '#FC4E2A' :
                    d > 50 ? '#FD8D3C' :
                        d > 20 ? '#FEB24C' :
                            d > 10 ? '#FED976' :
                                '#FFEDA0';
}

function style(feature) {
    return {
        fillColor: getColor(feature.properties.density),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.opera) {
        layer.bringToFront();
    }

    info.update(layer.feature.properties);
}

function resetHighlight(e) {
    geojson.resetStyle(e.target);
    info.update();
}



function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}

geojson = L.geoJson(statesData, {
    style: style,
    onEachFeature: onEachFeature
}).addTo(map);

var info = L.control({ position: "topleft" });

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.update();
    return this._div;
};

// method that we will use to update the control based on feature properties passed
info.update = function (props) {
    this._div.innerHTML = '<h4>US States</h4>' + (props ?
        '<b>' + props.name
        : 'Hover over a state');
};

info.addTo(map);


// Adding Side Bar to map
var sidebar = L.control.sidebar('sidebar').addTo(map);

// Adding GeoSearch to Map
var searchControl = new GeoSearchControl({
    provider: new OpenStreetMapProvider(),
    showMarker: false,
    maxMarkers: 4,
    style: 'bar',
});
map.addControl(searchControl);

// Grab data from GeoJSON
var geojsonFeatures = data["features"];

// Add functionality for each marker
function log(feature, layer) {
    layer.on('click', function (e) {
        var headline = feature.properties["Headline"];
        var newspaper = feature.properties["Newspaper"];
        var url = feature.properties["Page URL"];
        document.getElementById("newspaper").innerHTML = feature.properties["Newspaper"];
        document.getElementById("location").innerHTML = feature.properties["City"] + ", " + feature.properties["State"];
        document.getElementById("publication-date").innerHTML = feature.properties["Publication Date"];
        document.getElementById("page-section").innerHTML = feature.properties["Page"];
        document.getElementById("headline").innerHTML = feature.properties["Headline"];
        document.getElementById("subheadline").innerHTML = feature.properties["Sub Headline"];
        document.getElementById("author").innerHTML = feature.properties["Byline"];
        document.getElementById("article").innerHTML = feature.properties["Article Type"];
        document.getElementById("event").innerHTML = feature.properties["Event"];
        document.getElementById("contributor").innerHTML = feature.properties["Contributor"];
        document.getElementById("user").innerHTML = feature.properties["User Comments"];
        document.getElementById("community-manager").innerHTML = feature.properties["CM Comments"];
        document.getElementById("url").innerHTML = "<a href=\"" + feature.properties["Page URL"] + "\" target='_blank'>" + feature.properties["Page URL"] + "</a>";
        document.getElementById("front-headline").innerHTML = feature.properties["Headline"];
        map.flyTo(e.latlng, 9);
        sidebar.open('home')
    });
    layer.bindPopup('<h2>' + feature.properties["Headline"] + '</h2><p> ' + feature.properties["Sub Headline"] + '<br>' + '<em>' + feature.properties["Publication Date"] + '</em>' + '</p>')
}

// Add all base markers
var allmarkers = L.geoJSON(geojsonFeatures, {
    onEachFeature: log
}).addTo(map);

// Checkbox Functionality
$('#checkboxes input').on('click', function () {
    var selected = [];
    $('#checkboxes input:checked').each(function () {
        selected.push($(this).val());
    });
    if (!selected.length) {
        map.removeLayer(allmarkers);
        allmarkers = L.geoJSON(geojsonFeatures, {
            onEachFeature: log
        }).addTo(map);
    } else {
        map.removeLayer(allmarkers);
        allmarkers = L.geoJSON(geojsonFeatures, {
            onEachFeature: log,
            filter: function (feature, layer) {
                if (selected.includes("cartoon")) {
                    if (feature.properties["Article Type"] == "Cartoon") {
                        return true;
                    }
                }
                if (selected.includes("edop")) {
                    if (feature.properties["Article Type"] == "Editorial or Opinion Piece") {
                        return true;
                    }
                }
                if(selected.includes("letter")) {
                    if (feature.properties["Article Type"] == "Letter to the Editor") {
                        return true;
                    }
                }
                if(selected.includes("news")) {
                    if (feature.properties["Article Type"] == "News Article") {
                        return true;
                    }
                }
                if(selected.includes("other")) {
                    if (feature.properties["Article Type"] == "Other") {
                        return true;
                    }
                } else {
                    return false;
                }
            }
        }).addTo(map);
    }

    console.log(selected);
});