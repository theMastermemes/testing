// Set dimensions of the custom image map
const mapWidth = 1920;
const mapHeight = 1080;

// Initialize Leaflet map
const map = L.map('map', {
  minZoom: -1,
  maxZoom: 2,
  crs: L.CRS.Simple
});

// Define map bounds and background image
const bounds = [[0,0], [mapHeight, mapWidth]];
const image = L.imageOverlay('placeholder-map.jpg', bounds).addTo(map);
map.fitBounds(bounds);

// Layers for toggling
const layerNations = L.layerGroup();
const layerConflict = L.layerGroup();
const layerTrade = L.layerGroup();

// Add nation markers
L.marker([600, 960]).bindPopup("<b>Whispershade Woods</b><br>Site of the great hydromancer battle.").addTo(layerNations);
L.marker([400, 500]).bindPopup("<b>Duskhaven</b><br>Port city known for sea rituals and rogue guilds.").addTo(layerNations);

// Add conflict zone marker
L.circle([550, 880], {
  color: 'red',
  fillColor: '#f03',
  fillOpacity: 0.5,
  radius: 100
}).bindPopup("⚔️ Battle Site: Still smoldering").addTo(layerConflict);

// Add trade route line
L.polyline([
  [400, 500],
  [600, 960]
], {
  color: 'gold',
  weight: 3,
  dashArray: '5, 10'
}).bindPopup("Trade Route: Duskhaven to Whispershade").addTo(layerTrade);

// Add layers to the map
layerNations.addTo(map);

// Layer control toggle
L.control.layers(null, {
  "🌍 Nations": layerNations,
  "🔥 Conflict Zones": layerConflict,
  "💰 Trade Routes": layerTrade
}).addTo(map);

// Distance Measurement Tool
let measurePoints = [];
map.on('click', function(e) {
  if (measurePoints.length === 2) {
    measurePoints = [];
    map.eachLayer(layer => {
      if (layer instanceof L.Polyline && !layer._popup) map.removeLayer(layer);
    });
  }
  measurePoints.push(e.latlng);
  if (measurePoints.length === 2) {
    const distance = map.distance(measurePoints[0], measurePoints[1]);
    const travelKm = (distance / 100).toFixed(2); // Adjust scale to your map
    const hours = (travelKm / 8).toFixed(1);
    const line = L.polyline(measurePoints, {color: 'cyan'}).addTo(map);
    line.bindPopup(`📏 ${travelKm} km — 🐎 ${hours} hrs on horseback`).openPopup();
  }
});
