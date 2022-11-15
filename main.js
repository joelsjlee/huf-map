// Setting up map and necessary libraries
var GeoSearchControl = window.GeoSearch.GeoSearchControl;
var OpenStreetMapProvider = window.GeoSearch.OpenStreetMapProvider;
var map = L.map('map', { preferCanvas: false });
map.setView([39, -83], 4);

function addControlPlaceholders(map) {
    var corners = map._controlCorners,
        l = 'leaflet-',
        container = map._controlContainer;

    function createCorner(vSide, hSide) {
        var className = l + vSide + ' ' + l + hSide;

        corners[vSide + hSide] = L.DomUtil.create('div', className, container);
    }

    createCorner('top', 'center');
}
addControlPlaceholders(map);

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

// Add states chloropleth
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

// Add toggle cluster checkbox to the map
var toggleCluster = L.control({ position: "topleft" });

toggleCluster.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'toggleClusterDiv');

    div.innerHTML = '<form><input id="toggleCluster" type="checkbox"/>Display Unclustered Markers</form>';
    return div;
};

toggleCluster.addTo(map);

var events = L.control({ position: "topcenter" });

events.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'events');

    div.innerHTML = '<h4>Select Event</h4>' + '<select id=eventSelector><option selected value="nov241942">November 24th,  1942: Nazi Plan to Kill All Jews Confirmed</option><option value="dec171942">December 17th, 1942: Allies Denounce Nazi Plan to \"Exterminate\" the Jews</option></select>';
    return div;
};

events.addTo(map);

// Adding Side Bar to map
var sidebar = L.control.sidebar('sidebar').addTo(map);

// Adding GeoSearch to Map
var searchControl = new GeoSearchControl({
    provider: new OpenStreetMapProvider(),
    showMarker: false,
    maxMarkers: 4,
    style: 'button',
});

map.addControl(searchControl);

// Grab data from GeoJSON
var nov241942 = nov241942_data["features"];
var dec171942 = dec171942_data["features"];

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
        // map.flyTo(e.latlng, 9);
        sidebar.open('home')
    });
    layer.bindPopup('<h2>' + feature.properties["Headline"] + '</h2><p> ' + feature.properties["Sub Headline"] + '<br>' + '<em>' + feature.properties["Publication Date"] + '</em>' + '</p>')
}

function eventReturner() {
    var currEvent = $('#eventSelector option:selected').val();
    if (currEvent == "nov241942") {
        return nov241942;
    } else if (currEvent == "dec171942") {
        return dec171942;
    }
}

// Add all base markers
var allmarkers = L.geoJSON(eventReturner(), {
    onEachFeature: log
});

var markers = L.markerClusterGroup();
markers.addLayer(allmarkers);

if (document.getElementById("toggleCluster").checked) {
    allmarkers.addTo(map);
} else {
    map.addLayer(markers);
}


function checkpress(feature, selected) {
    if (selected.includes("Black") || selected.includes("Jewish") || selected.includes("Spanish") || selected.includes("College") || selected.includes("Catholic")) {
        for (i = 0; i < selected.length; i++) {
            if (feature.properties["Type"] == selected[i]) {
                return true;
            }
        }
        return false;
    } else {
        return true;
    }


}

function updateMarkers() {
    var selected = [];
    $('#checkboxes input:checked').each(function () {
        selected.push($(this).val());
    });
    if (!selected.length) {
        markers.clearLayers();
        map.removeLayer(allmarkers);
        allmarkers = L.geoJSON(eventReturner(), {
            onEachFeature: log
        });
        markers = L.markerClusterGroup();
        markers.addLayer(allmarkers);

        if (document.getElementById("toggleCluster").checked) {
            allmarkers.addTo(map);
        } else {
            map.addLayer(markers);
        }
    } else {
        markers.clearLayers();
        map.removeLayer(allmarkers);
        allmarkers = L.geoJSON(eventReturner(), {
            onEachFeature: log,
            filter: function (feature, layer) {
                if (selected.includes("cartoon")) {
                    if (feature.properties["Article Type"] == "Cartoon") {
                        return checkpress(feature, selected);
                    }
                }
                if (selected.includes("edop")) {
                    if (feature.properties["Article Type"] == "Editorial or Opinion Piece") {
                        return checkpress(feature, selected);
                    }
                }
                if (selected.includes("letter")) {
                    if (feature.properties["Article Type"] == "Letter to the Editor") {
                        return checkpress(feature, selected);
                    }
                }
                if (selected.includes("news")) {
                    if (feature.properties["Article Type"] == "News Article") {
                        return checkpress(feature, selected);
                    }
                }
                if (selected.includes("other")) {
                    if (feature.properties["Article Type"] == "Other") {
                        return checkpress(feature, selected);
                    }
                }
                if ((selected.includes("Black") || selected.includes("Jewish") || selected.includes("Spanish") || selected.includes("College") || selected.includes("Catholic")) &&
                    (!selected.includes("cartoon") && !selected.includes("edop") && !selected.includes("letter") && !selected.includes("news") && !selected.includes("other"))) {
                    return checkpress(feature, selected);
                } else {
                    return false;
                }
            }
        });
        markers = L.markerClusterGroup();
        markers.addLayer(allmarkers);

        if (document.getElementById("toggleCluster").checked) {
            allmarkers.addTo(map);
        } else {
            map.addLayer(markers);
        }
    }

}

$('#checkboxes input').on('change', function (e) {
    updateMarkers();
});

$('#refresh').on('click', function () {
    map.setView([39, -96], 5);
    sidebar.close();
    map.closePopup();
    $('input[type=checkbox]').prop('checked', false);
    updateMarkers();
});

$('select').on('change', function (e) {
    updateMarkers();
    sidebar.close();
    map.closePopup();
});

document.getElementById("toggleCluster").addEventListener("click", updateMarkers, false);

sidebar.open("about");