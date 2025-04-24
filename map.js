const map = L.map('map', {
  minZoom: -1,
  maxZoom: 2,
  crs: L.CRS.Simple,
  zoomControl: false
});
const bounds = [[0, 0], [1080, 1920]];
L.imageOverlay('placeholder-map.jpg', bounds).addTo(map);
map.fitBounds(bounds);

// Custom zoom controls (with styled color)
L.control.zoom({ position: 'bottomright' }).addTo(map);

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

// === Nation Border ===
L.polygon([
  [550, 1000], [610, 1000], [630, 940], [570, 900]
], {
  color: '#5555ff', dashArray: '4,6', weight: 2, fillOpacity: 0
}).bindPopup("🧭 National Border Zone").addTo(layerNationBorders);

// === Sidebar Toggle Layer Controls ===
const sidebar = L.control({ position: 'topleft' });
sidebar.onAdd = function () {
  const div = L.DomUtil.create('div', 'custom-control-panel');
  div.innerHTML = `
    <button id="layerToggle">☰ Layers</button>
    <div id="layerPanel" class="hidden">
      <label><input type="checkbox" id="settlements" checked> 🏘 Settlements</label>
      <label><input type="checkbox" id="nations"> 🧭 Nation Borders</label>
      <label><input type="checkbox" id="conflict"> ⚔️ Conflict Zones</label>
      <label><input type="checkbox" id="trade"> 💰 Trade Routes</label>
      <label><input type="checkbox" id="mana"> 🌊 Mana Zones</label>
      <label><input type="checkbox" id="faith"> 🕍 Faith Influence</label>
    </div>`;
  return div;
};
sidebar.addTo(map);

// Sidebar toggle logic
setTimeout(() => {
  const panel = document.getElementById('layerPanel');
  document.getElementById('layerToggle').onclick = () => {
    panel.classList.toggle('hidden');
  };

  const toggles = {
    settlements: layerSettlements,
    nations: layerNationBorders,
    conflict: layerConflict,
    trade: layerTrade,
    mana: layerMana,
    faith: layerFaith
  };
  Object.keys(toggles).forEach(id => {
    document.getElementById(id).addEventListener('change', e => {
      const checked = e.target.checked;
      if (checked) toggles[id].addTo(map);
      else map.removeLayer(toggles[id]);
    });
  });
}, 200);

// === Travel Mode Selector + Distance Tool ===
let measureMode = false;
let measurePoints = [];
let measureLine = null;
let travelSpeed = 8;
let travelMode = "Horseback";

const travelControl = L.control({ position: 'topright' });
travelControl.onAdd = function () {
  const div = L.DomUtil.create('div', 'leaflet-bar');
  div.innerHTML = `
    <select id="travelSelector" title="Travel Mode" style="font-size: 0.9em; padding: 3px;">
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
    if (travelMode === "Foot") travelSpeed = 5;
    if (travelMode === "Horseback") travelSpeed = 8;
    if (travelMode === "Carriage") travelSpeed = 6;
  });
}, 200);

// Distance toggle
const distanceToggle = L.control({ position: 'topright' });
distanceToggle.onAdd = function () {
  const div = L.DomUtil.create('div', 'leaflet-bar');
  div.innerHTML = '<a href="#" id="toggleMeasure" title="Measure" style="background:#222;color:#6fc7d7;">📏 Measure</a>';
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
    const distMeters = map.distance(measurePoints[0], measurePoints[1]);
    const km = (distMeters / 100).toFixed(2);
    const baseTime = (km / travelSpeed);
    const rests = Math.floor(baseTime / 6);
    const totalTime = (baseTime + rests).toFixed(1);

    measureLine = L.polyline(measurePoints, { color: 'cyan' }).addTo(map);
    measureLine.bindPopup(`
      📏 ${km} km<br>
      🚶 Mode: ${travelMode}<br>
      ⏱ Base Travel: ${baseTime.toFixed(1)} hrs<br>
      ⛺ Rests: ${rests} × 1 hr<br>
      🕒 Total: ${totalTime} hrs
    `).openPopup();
  }
});
