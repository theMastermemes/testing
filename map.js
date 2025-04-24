// Initialize map
const map = L.map('map', {
  minZoom: -1,
  maxZoom: 2,
  crs: L.CRS.Simple
});
const bounds = [[0, 0], [1080, 1920]];
const image = L.imageOverlay('placeholder-map.jpg', bounds).addTo(map);
map.fitBounds(bounds);

// Create LayerGroups
const layerNations = L.layerGroup().addTo(map);
const layerConflict = L.layerGroup();
const layerTrade = L.layerGroup();
const layerMana = L.layerGroup();
const layerFaith = L.layerGroup();

// === Lore Markers ===
L.marker([600, 960]).bindPopup("<b>Whispershade Woods</b><br>Hydromancer battlefield.").addTo(layerNations);
L.marker([400, 500]).bindPopup("<b>Duskhaven</b><br>Sea rituals & rogue guilds.").addTo(layerNations);

// === Conflict Zone Circle ===
L.circle([550, 880], {
  color: 'red',
  fillColor: '#f03',
  fillOpacity: 0.5,
  radius: 100
}).bindPopup("⚔️ Battle Site").addTo(layerConflict);

// === Trade Route ===
L.polyline([
  [400, 500],
  [600, 960]
], {
  color: 'gold',
  weight: 3,
  dashArray: '5,10'
}).bindPopup("Trade Route: Duskhaven → Whispershade").addTo(layerTrade);

// === Mana Zone: Hydrophilic (Water Affinity) ===
L.polygon([
  [300, 800],
  [340, 820],
  [360, 780],
  [320, 760]
], {
  color: '#00ffff',
  fillColor: '#00ffff88',
  fillOpacity: 0.4
}).bindPopup("🌊 Hydrophilic Mana Zone — High Water Magic Affinity").addTo(layerMana);

// === Faith Zone: Constantism ===
L.polygon([
  [700, 300],
  [750, 320],
  [770, 280],
  [720, 260]
], {
  color: '#ff0000',
  fillColor: '#ff000088',
  fillOpacity: 0.4
}).bindPopup("🟥 Constantism Faith Territory").addTo(layerFaith);

// === Layer Toggle Controls ===
L.control.layers(null, {
  "🌍 Nations": layerNations,
  "🔥 Conflict Zones": layerConflict,
  "💰 Trade Routes": layerTrade,
  "🌊 Mana Zones (Water)": layerMana,
  "🕍 Faith Influence (Constantism)": layerFaith
}).addTo(map);

// === Distance Measurement Tool ===
let measureMode = false;
let measurePoints = [];
let measureLine = null;

// Create toggle button for distance mode
const distanceButton = L.control({position: 'topright'});
distanceButton.onAdd = function () {
  const div = L.DomUtil.create('div', 'leaflet-bar');
  div.innerHTML = '<a href="#" title="Toggle Distance Tool" id="toggleMeasure" style="padding: 8px; display: block; background: #222; color: cyan; font-weight: bold;">📏 Measure</a>';
  return div;
};
distanceButton.addTo(map);

// Toggle functionality
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('toggleMeasure').onclick = function(e) {
    e.preventDefault();
    measureMode = !measureMode;
    this.style.background = measureMode ? 'cyan' : '#222';
    this.style.color = measureMode ? '#000' : 'cyan';

    // Clear any existing measurements
    if (measureLine) {
      map.removeLayer(measureLine);
      measureLine = null;
      measurePoints = [];
    }
  };
});

map.on('click', function(e) {
  if (!measureMode) return;

  measurePoints.push(e.latlng);

  // Reset if 3rd click happens
  if (measurePoints.length > 2) {
    measurePoints = [];
    if (measureLine) {
      map.removeLayer(measureLine);
      measureLine = null;
    }
    return;
  }

  if (measurePoints.length === 2) {
    const distance = map.distance(measurePoints[0], measurePoints[1]);
    const travelKm = (distance / 100).toFixed(2);
    const hours = (travelKm / 8).toFixed(1);
    measureLine = L.polyline(measurePoints, {color: 'cyan'}).addTo(map);
    measureLine.bindPopup(`📏 ${travelKm} km — 🐎 ${hours} hrs on horseback`).openPopup();
  }
});
