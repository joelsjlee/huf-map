// Setting up map and necessary libraries
// Adding tile layers to map
var OpenStreetMap = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: 'Map data &copy; OpenStreetMap contributors'
});

var Esri_NatGeoWorldMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC',
	maxZoom: 16
});

var Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

// Setting up the Geosearch window
var GeoSearchControl = window.GeoSearch.GeoSearchControl;
var OpenStreetMapProvider = window.GeoSearch.OpenStreetMapProvider;

// Setting the initial map in place
/*
From Leaflet tutorial: Also note that when using multiple base layers, only one of them should be added to the map at instantiation, 
but all of them should be present in the base layers object when creating the layers control.
*/
var map = L.map('map', { preferCanvas: false, layers: [Esri_NatGeoWorldMap] });
map.setView([39, -83], 4);

// Setting up the basemaps
var baseMaps = {
    "Esri NatGeo Map": Esri_NatGeoWorldMap,
    "OpenStreetMap": OpenStreetMap,
    "Esri World Image": Esri_WorldImagery,
};

var layerControl = L.control.layers(baseMaps, null, {position:"topleft"}).addTo(map);

// Code used to be able to add control layers to the middle of the map
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

// original function to get colors by class
function getColor_exp(d) {
    return d > 500 ? '#800026' :
        d > 300 ? '#BD0026' :
            d > 150 ? '#E31A1C' :
                d > 75 ? '#FC4E2A' :
                    d > 50 ? '#FD8D3C' :
                        d > 20 ? '#FEB24C' :
                            d > 10 ? '#FED976' :
                                '#FFEDA0';
}

// scaled way to get colors with chroma js
function getColor(d) {
    var mapScale = chroma.scale(['#FED976', '#BD0026'])
      .classes([5,10,25,50,100,200,300,500]);
    return mapScale(d)
}

// Styling and features for the hover tool
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

// Creating the info box that will hold the states demographic data
var info = L.control({ position: "topleft" });

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.update(); 
    return this._div;
};

// Regex function to turn json number to thousands commas
function addThousandsSeparator(n) {
    return n.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

// Update function for the box, along with its HTML
info.update = function (props) {
    this._div.innerHTML = '<h4>US Population Density</h4> <h4>1940 US Census</h4>' +  (props ?
        '<b>' + props.name + '</b><br />' + props.density + ' people / mi<sup>2</sup>' + '<br /> ' + addThousandsSeparator(props.population + '') + ' total'
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

// Creating the Dropdown for the events
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

// This function returns the type of event and json data
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

// Initial check for adding the markers to the map
if (document.getElementById("toggleCluster").checked) {
    allmarkers.addTo(map);
} else {
    map.addLayer(markers);
}

// Dynamically add the checkboxes for the wire stories
for (key of nov_25_key) {
    $('#wire')
    .append(`<input type="checkbox" id="${key['Text_id']}" name="interest" value="${key['Id']}">`)
    .append(`<label for="${key['Text_id']}">${key['Header']}</label></div>`)
    .append(`<br>`);
}


// This function checks the rows of the database and is called to verify if it is one of the minority presses
function checkpress(feature, selected) {
    if (selected.includes("Black") || selected.includes("Jewish") || selected.includes("Spanish") || selected.includes("College") || selected.includes("Catholic")) {
        for (i = 0; i < selected.length; i++) {
            if (feature.properties["Type"] == selected[i]) {
                return checkwire(feature, selected);
            }
        }
        return false;
    } else {
        return checkwire(feature, selected);
    }
}

function checkwire(feature, selected) {
    wires = []
    for (i = 0; i < Object.keys(nov_25_key).length; i++) {
        if (selected.includes(String(i))) {
            wires.push(i);
        }
    }
    if (wires.length) {
        for (i = 0; i <selected.length; i++) {
            if (feature.properties["label"] == selected[i]) {
                return true;
            }
        }
        return false;
    } else {
        return true;
}
}

// This is the main function that updates the markers each time a check mark or etc is checked off.
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
                } 
                wires = []
                for (i = 0; i < Object.keys(nov_25_key).length; i++) {
                    if (selected.includes(String(i))) {
                        wires.push(i);
                    }
                }
                if (wires.length && ((!selected.includes("Black") && !selected.includes("Jewish") && !selected.includes("Spanish") && !selected.includes("College") && !selected.includes("Catholic")) &&
                (!selected.includes("cartoon") && !selected.includes("edop") && !selected.includes("letter") && !selected.includes("news") && !selected.includes("other")))) {
                    return checkpress(feature, selected);
                }
                {
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

// Sets of Jquery functions that call update markers
$('#checkboxes input').on('change', function (e) {
    updateMarkers();
});

function wireUpdate() {
    var selected = [];
    $('#wire input:checked').each(function () {
        selected.push($(this).val());
    });
    $('#story-text').empty();
    if (selected.length) {
        for (key of selected) {
            var obj = nov_25_key.filter(function(nov_25_key) {
                return nov_25_key['Id'] == key
            })[0];
            $('#story-text')
            .append(`<h3>${obj['Header']}</h3>`)
            .append(`<p>${obj['Text']}</p>`)
            .append(`<br>`);
        }
    
    }
}

$('#wire').on('change', function (e) {
    wireUpdate()
})

$('#refresh').on('click', function () {
    map.setView([39, -96], 5);
    sidebar.close();
    map.closePopup();
    $('input[type=checkbox]').prop('checked', false);
    $('#wire input[type=checkbox]').prop('checked', false);
    updateMarkers();
    wireUpdate();
});

$('select').on('change', function (e) {
    updateMarkers();
    map.closePopup();
});

document.getElementById("toggleCluster").addEventListener("click", updateMarkers, false);

sidebar.open("about");