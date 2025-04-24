const map = L.map('map', {
  minZoom: -1,
  maxZoom: 2,
  crs: L.CRS.Simple
});
const bounds = [[0, 0], [1080, 1920]];
L.imageOverlay('placeholder-map.jpg', bounds).addTo(map);
map.fitBounds(bounds);

// === Layers ===
const layerSettlements = L.layerGroup().addTo(map);
const layerNationBorders = L.layerGroup();
const layerConflict = L.layerGroup();
const layerTrade = L.layerGroup();
const layerMana = L.layerGroup();
const layerFaith = L.layerGroup();

// === Markers / Settlements ===
const town1 = L.marker([600, 960]).bindPopup("<b>Whispershade Woods</b><br>Hydromancer battlefield.");
const town2 = L.marker([400, 500]).bindPopup("<b>Duskhaven</b><br>Sea rituals & rogue guilds.");
[town1, town2].forEach(town => {
  town.addTo(layerSettlements);
  town.on('click', () => {
    map.setView(town.getLatLng(), 1);
    town.openPopup();
  });
});

// === Conflict Zone ===
L.circle([550, 880], {
  color: 'red', fillColor: '#f03', fillOpacity: 0.5, radius: 100
}).bindPopup("⚔️ Battle Site").addTo(layerConflict);

// === Trade Route with Info ===
L.polyline([
  [400, 500], [600, 960]
], {
  color: 'gold', weight: 3, dashArray: '5,10'
}).bindPopup(`
  <b>Trade Route: Duskhaven ⇄ Whispershade</b><br>
  📦 Goods: Spices, Ritual Cloth<br>
  🔁 Type: Mutual<br>
  📊 Stability: High
`).addTo(layerTrade);

// === Mana Zone ===
L.polygon([
  [300, 800], [340, 820], [360, 780], [320, 760]
], {
  color: '#00ffff', fillColor: '#00ffff88', fillOpacity: 0.4
}).bindPopup("🌊 High Mana Concentration — Hydrophilic Affinity").addTo(layerMana);

// === Faith Zone ===
L.polygon([
  [700, 300], [750, 320], [770, 280], [720, 260]
], {
  color: '#ff0000', fillColor: '#ff000088', fillOpacity: 0.4
}).bindPopup("🕍 Faith Sphere of Influence: Red Faith").addTo(layerFaith);

// === Nation Borders ===
L.polygon([
  [550, 1000], [610, 1000], [630, 940], [570, 900]
], {
  color: '#5555ff', dashArray: '4,6', weight: 2, fillOpacity: 0
}).bindPopup("🧭 National Border Zone").addTo(layerNationBorders);

// === Classic Leaflet Layer Toggle ===
L.control.layers(null, {
  "🏘 Settlements": layerSettlements,
  "🧭 Nation Borders": layerNationBorders,
  "⚔️ Conflict Zones": layerConflict,
  "💰 Trade Routes": layerTrade,
  "🌊 Mana Zones": layerMana,
  "🕍 Faith Influence": layerFaith
}).addTo(map);

// === Distance Tool + Travel Selector ===
let measureMode = false;
let measurePoints = [];
let measureLine = null;
let travelSpeed = 8;
let travelMode = "Horseback";

// Travel Selector
const travelControl = L.control({ position: 'topright' });
travelControl.onAdd = function () {
  const div = L.DomUtil.create('div', 'leaflet-bar');
  div.innerHTML = `
    <select id="travelSelector" title="Travel Mode" style="font-size: 1em; padding: 5px;">
      <option value="Horseback" selected>🐎 Horseback</option>
      <option value="Foot">🚶 On Foot</option>
      <option value="Carriage">🛻 Carriage</option>
    </select>`;
  return div;
};
travelControl.addTo(map);

setTimeout(() => {
  document.getElementById('travelSelector').addEventListener('change', function () {
    travelMode = this.value;
    travelSpeed = travelMode === "Foot" ? 5 : travelMode === "Carriage" ? 6 : 8;
  });
}, 200);

// Measure Button
const distanceToggle = L.control({ position: 'topright' });
distanceToggle.onAdd = function () {
  const div = L.DomUtil.create('div', 'leaflet-bar');
  div.innerHTML = '<a href="#" id="toggleMeasure" title="Measure">📏<br>Measure</a>';
  return div;
};
distanceToggle.addTo(map);

setTimeout(() => {
  document.getElementById('toggleMeasure').onclick = function (e) {
    e.preventDefault();
    measureMode = !measureMode;
    this.style.background = measureMode ? '#6fc7d7' : '#222';
    this.style.color = measureMode ? '#000' : '#6fc7d7';
    if (measureLine) map.removeLayer(measureLine);
    measureLine = null;
    measurePoints = [];
  };
}, 200);

// Distance Logic
map.on('click', function (e) {
  if (!measureMode) return;
  measurePoints.push(e.latlng);
  if (measurePoints.length > 2) {
    measurePoints = [];
    if (measureLine) map.removeLayer(measureLine);
    measureLine = null;
    return;
  }

  if (measurePoints.length === 2) {
    const dist = map.distance(measurePoints[0], measurePoints[1]);
    const km = (dist / 100).toFixed(2);
    const base = (km / travelSpeed);
    const rests = Math.floor(base / 6);
    const total = (base + rests).toFixed(1);

    measureLine = L.polyline(measurePoints, { color: 'cyan' }).addTo(map);
    measureLine.bindPopup(`
      <div style="font-size: 1.1em; padding: 4px 8px;">
      📏 <b>${km} km</b><br>
      🚶 Mode: <b>${travelMode}</b><br>
      ⏱ Base: ${base.toFixed(1)} hrs<br>
      ⛺ Rests: ${rests} × 1 hr<br>
      🕒 Total: <b>${total} hrs</b>
      </div>
    `).openPopup();
  }
});
