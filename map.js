// Initialize Map
const map = L.map('map', {
  minZoom: -1,
  maxZoom: 2,
  crs: L.CRS.Simple,
  zoomControl: false
});

// Add Custom Zoom Controls
L.control.zoom({ position: 'topright' }).addTo(map);

// Set Map Bounds and Image Overlay
const bounds = [[0, 0], [1080, 1920]];
L.imageOverlay('placeholder-map.jpg', bounds).addTo(map);
map.fitBounds(bounds);

// Hide Loading Overlay After Map Loads
map.on('load', () => {
  document.getElementById('loading-overlay').classList.add('hidden');
});
setTimeout(() => map.fire('load'), 500);

// === Layers ===
const layerSettlements = L.layerGroup().addTo(map);
const layerNationBorders = L.layerGroup();
const layerConflict = L.layerGroup();
const layerMana = L.layerGroup();
const layerFaith = L.layerGroup();

// === Markers / Settlements ===
// Village: Whispershade Woods
const villageIcon = L.divIcon({
  className: 'settlement-marker',
  html: '<img src="village.svg" style="width: 40px; height: 40px;" />',
  iconSize: [40, 40]
});
const town1 = L.marker([600, 960], { icon: villageIcon }).bindPopup(
  "<b>Whispershade Woods</b><br>A hydromancer’s battlefield, where the air hums with arcane residue."
);

// City: Duskhaven
const cityIcon = L.divIcon({
  className: 'settlement-marker',
  html: '<img src="city.svg" style="width: 50px; height: 50px;" />',
  iconSize: [50, 50]
});
const town2 = L.marker([400, 500], { icon: cityIcon }).bindPopup(
  "<b>Duskhaven</b><br>A shadowy port of sea rituals and rogue guilds, cloaked in mist."
);

// Outpost: Example Settlement
const outpostIcon = L.divIcon({
  className: 'settlement-marker',
  html: '<img src="outpost.svg" style="width: 40px; height: 40px;" />',
  iconSize: [40, 40]
});
const town3 = L.marker([700, 800], { icon: outpostIcon }).bindPopup(
  "<b>Shadowwatch Outpost</b><br>A lonely watchtower guarding the borderlands."
);

[town1, town2, town3].forEach(town => {
  town.addTo(layerSettlements);
  town.on('click', () => {
    map.flyTo(town.getLatLng(), 1, { duration: 1 });
    town.openPopup();
  });
});

// === Conflict Zone ===
L.circle([550, 880], {
  color: '#ff5555',
  fillColor: '#ff5555',
  fillOpacity: 0.3,
  radius: 100
}).bindPopup("⚔️ <b>Battle of Crimson Hollow</b><br>Blood stains the earth where two armies clashed.").addTo(layerConflict);

// === Mana Zone ===
L.polygon([[300, 800], [340, 820], [360, 780], [320, 760]], {
  color: '#00d4ff',
  fillColor: '#00d4ff',
  fillOpacity: 0.3
}).bindPopup("🌊 <b>High Mana Concentration</b><br>Hydrophilic affinity—waters ripple with arcane power.").addTo(layerMana);

// === Faith Zone ===
L.polygon([[700, 300], [750, 320], [770, 280], [720, 260]], {
  color: '#ff5555',
  fillColor: '#ff5555',
  fillOpacity: 0.3
}).bindPopup("🕍 <b>Faith Sphere: Red Faith</b><br>Devotees chant in crimson-lit halls.").addTo(layerFaith);

// === Nation Borders ===
L.polygon([[550, 1000], [610, 1000], [630, 940], [570, 900]], {
  color: '#5555ff',
  dashArray: '4,6',
  weight: 2,
  fillOpacity: 0
}).bindPopup("🧭 <b>Border of Eryndor</b><br>A tense frontier watched by wary guards.").addTo(layerNationBorders);

// === Layer Toggle Control ===
L.control.layers(null, {
  "🏘 Settlements": layerSettlements,
  "🧭 Nation Borders": layerNationBorders,
  "⚔️ Conflict Zones": layerConflict,
  "🌊 Mana Zones": layerMana,
  "🕍 Faith Influence": layerFaith
}, { position: 'topright' }).addTo(map);

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
    <select id="travelSelector" title="Travel Mode">
      <option value="Horseback" selected>🐎 Horseback (8 km/h)</option>
      <option value="Foot">🚶 On Foot (5 km/h)</option>
      <option value="Carriage">🛻 Carriage (6 km/h)</option>
    </select>`;
  return div;
};
travelControl.addTo(map);

// Measure Button
const distanceToggle = L.control({ position: 'topright' });
distanceToggle.onAdd = function () {
  const div = L.DomUtil.create('div', 'leaflet-bar');
  div.innerHTML = '<a href="#" id="toggleMeasure" title="Measure Distance">📏</a>';
  return div;
};
distanceToggle.addTo(map);

// Event Listeners for Travel Selector and Measure Button
setTimeout(() => {
  const travelSelector = document.getElementById('travelSelector');
  const toggleMeasure = document.getElementById('toggleMeasure');

  travelSelector.addEventListener('change', function () {
    travelMode = this.value;
    travelSpeed = travelMode === "Foot" ? 5 : travelMode === "Carriage" ? 6 : 8;
  });

  toggleMeasure.addEventListener('click', function (e) {
    e.preventDefault();
    L.DomEvent.stopPropagation(e);
    measureMode = !measureMode;
    toggleMeasure.classList.toggle('active', measureMode);
    if (measureLine) map.removeLayer(measureLine);
    measureLine = null;
    measurePoints = [];
  });
}, 200);

// Distance Logic
map.on('click', function (e) {
  if (!measureMode) return;
  measurePoints.push(e.latlng);

  if (measurePoints.length > 2) {
    measurePoints = [measurePoints[1]];
    if (measureLine) map.removeLayer(measureLine);
    measureLine = null;
  }

  if (measurePoints.length === 2) {
    const dist = map.distance(measurePoints[0], measurePoints[1]);
    const km = (dist / 100).toFixed(2);
    const baseTime = (km / travelSpeed).toFixed(1);
    const rests = Math.floor(baseTime / 6);
    const totalTime = (parseFloat(baseTime) + rests).toFixed(1);

    measureLine = L.polyline(measurePoints, { color: '#6fc7d7', weight: 3 }).addTo(map);
    measureLine.bindPopup(`
      <div style="font-size: 1em; padding: 4px 8px;">
        📏 <b>Distance:</b> ${km} km<br>
        🚶 <b>Mode:</b> ${travelMode} (${travelSpeed} km/h)<br>
        ⏱ <b>Base Time:</b> ${baseTime} hrs<br>
        ⛺ <b>Rests:</b> ${rests} × 1 hr<br>
        🕒 <b>Total Time:</b> ${totalTime} hrs
      </div>
    `).openPopup();
  }
});
