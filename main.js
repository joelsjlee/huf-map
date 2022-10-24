// Setting up map and necessary libraries
var GeoSearchControl = window.GeoSearch.GeoSearchControl;
var OpenStreetMapProvider = window.GeoSearch.OpenStreetMapProvider;
var map = L.map('map');
map.setView([35, -98], 4);

// Adding tile layer to map
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: 'Map data &copy; OpenStreetMap contributors'
}).addTo(map);

// Adding Side Bar to map
var sidebar = L.control.sidebar('sidebar').addTo(map);
sidebar.open('home');

// Adding GeoSearch to Map
var searchControl = new GeoSearchControl({
    provider: new OpenStreetMapProvider(),
    showMarker: false,
    maxMarkers: 4,
    style: 'bar',
});
map.addControl(searchControl);

// Adding markers to map
var geojsonFeatures = data["features"];

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
        document.getElementById("event").innerHTML = feature.properties["Event"];
        document.getElementById("contributor").innerHTML = feature.properties["Contributor"];
        document.getElementById("user").innerHTML = feature.properties["User Comments"];
        document.getElementById("community-manager").innerHTML = feature.properties["CM Comments"];
        document.getElementById("url").innerHTML = "<a href="+feature.properties["Page URL"]+" target=_'blank'>" +feature.properties["Page URL"]+ "</a>"; 
        document.getElementById("front-headline").innerHTML = feature.properties["Headline"];
        map.flyTo(e.latlng, 9);
        sidebar.open('home')
    });
}

L.geoJSON(geojsonFeatures, {
    onEachFeature: log
}).addTo(map);