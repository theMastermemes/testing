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

// Define LatLngBounds for interaction restriction
const mapBounds = L.latLngBounds([0, 0], [1080, 1920]);

// Function to clamp coordinates within bounds
function clampLatLng(latlng) {
  let lat = Math.max(0, Math.min(1080, latlng.lat));
  let lng = Math.max(0, Math.min(1920, latlng.lng));
  return L.latLng(lat, lng);
}

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

// Outpost: Shadowwatch Outpost
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
const conflictZone = L.circle([550, 880], {
  color: '#ff5555',
  fillColor: '#ff5555',
  fillOpacity: 0.3,
  radius: 100
}).bindPopup("⚔️ <b>Battle of Crimson Hollow</b><br>Blood stains the earth where two armies clashed.").addTo(layerConflict);

// === Mana Zone ===
const manaZone = L.polygon([[300, 800], [340, 820], [360, 780], [320, 760]], {
  color: '#00d4ff',
  fillColor: '#00d4ff',
  fillOpacity: 0.3
}).bindPopup("🌊 <b>High Mana Concentration</b><br>Hydrophilic affinity—waters ripple with arcane power.").addTo(layerMana);

// === Faith Zone ===
const faithZone = L.polygon([[700, 300], [750, 320], [770, 280], [720, 260]], {
  color: '#ff5555',
  fillColor: '#ff5555',
  fillOpacity: 0.3
}).bindPopup("🕍 <b>Faith Sphere: Red Faith</b><br>Devotees chant in crimson-lit halls.").addTo(layerFaith);

// === Nation Borders ===
const nationBorder = L.polygon([[550, 1000], [610, 1000], [630, 940], [570, 900]], {
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

// === Map Legend ===
const legend = L.control({ position: 'bottomright' });
legend.onAdd = function () {
  const div = L.DomUtil.create('div', 'map-legend');
  div.innerHTML = `
    <h4>Legend</h4>
    <div><img src="village.svg" style="width: 20px; height: 20px;"> Village</div>
    <div><img src="city.svg" style="width: 25px; height: 25px;"> City</div>
    <div><img src="outpost.svg" style="width: 20px; height: 20px;"> Outpost</div>
    <div><span style="color: #ff5555;">⚔️</span> Conflict Zone</div>
    <div><span style="color: #00d4ff;">🌊</span> Mana Zone</div>
    <div><span style="color: #ff5555;">🕍</span> Faith Influence</div>
    <div><span style="color: #5555ff;">🧭</span> Nation Border</div>
    <div style="margin-top: 10px;">
      <strong>Scale:</strong> 100 pixels = 10 km
    </div>
  `;
  return div;
};
legend.addTo(map);

// === Distance Tool + Travel Selector ===
let measureMode = false;
let measureLine = null;
let previewLine = null;
let freeDrawPoints = [];
let isDrawing = false;
let isFreeDrawing = false;
let startPoint = null;
let travelSpeed = 8;
let travelMode = "Horseback";

// Feedback Message for Out-of-Bounds
const outOfBoundsMessage = L.control({ position: 'topleft' });
outOfBoundsMessage.onAdd = function () {
  const div = L.DomUtil.create('div', 'out-of-bounds-message');
  div.innerHTML = 'Please draw within the map bounds';
  div.style.display = 'none';
  return div;
};
outOfBoundsMessage.addTo(map);

function showOutOfBoundsMessage() {
  const messageDiv = document.querySelector('.out-of-bounds-message');
  messageDiv.style.display = 'block';
  setTimeout(() => {
    messageDiv.style.display = 'none';
  }, 2000);
}

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
  div.innerHTML = '<a href="#" id="toggleMeasure" title="Measure Distance (Left Click: Drag Line, Right Click: Free Draw)">📏</a>';
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
    if (previewLine) map.removeLayer(previewLine);
    measureLine = null;
    previewLine = null;
    startPoint = null;
    freeDrawPoints = [];
    isDrawing = false;
    isFreeDrawing = false;
  });
}, 200);

// Prevent default right-click menu
map.on('contextmenu', function (e) {
  L.DomEvent.preventDefault(e);
});

// Distance Logic with Click-and-Drag and Free-Draw
map.on('mousedown', function (e) {
  if (!measureMode) return;

  // Check if the starting point is within bounds
  if (!mapBounds.contains(e.latlng)) {
    showOutOfBoundsMessage();
    return;
  }

  if (e.originalEvent.button === 0) { // Left click
    isDrawing = true;
    startPoint = clampLatLng(e.latlng);
    previewLine = L.polyline([startPoint, startPoint], {
      color: '#6fc7d7',
      weight: 3,
      dashArray: '5,10'
    }).addTo(map);
  } else if (e.originalEvent.button === 2) { // Right click
    isDrawing = true;
    isFreeDrawing = true;
    freeDrawPoints = [clampLatLng(e.latlng)];
    previewLine = L.polyline(freeDrawPoints, {
      color: '#6fc7d7',
      weight: 3,
      dashArray: '5,10'
    }).addTo(map);
  }
});

map.on('mousemove', function (e) {
  if (!isDrawing || !measureMode) return;

  const clampedLatLng = clampLatLng(e.latlng);

  if (isFreeDrawing) {
    freeDrawPoints.push(clampedLatLng);
    previewLine.setLatLngs(freeDrawPoints);
  } else {
    previewLine.setLatLngs([startPoint, clampedLatLng]);
  }
});

map.on('mouseup', function (e) {
  if (!isDrawing || !measureMode) return;

  if (e.originalEvent.button === 0 || e.originalEvent.button === 2) { // Left or Right click
    isDrawing = false;
    if (previewLine) map.removeLayer(previewLine);

    const clampedEndPoint = clampLatLng(e.latlng);
    let pointsToMeasure = isFreeDrawing ? freeDrawPoints : [startPoint, clampedEndPoint];
    let totalPixelDist = 0;

    // Calculate total pixel distance for the line
    for (let i = 0; i < pointsToMeasure.length - 1; i++) {
      const pointA = map.latLngToContainerPoint(pointsToMeasure[i]);
      const pointB = map.latLngToContainerPoint(pointsToMeasure[i + 1]);
      const pixelDist = Math.sqrt(
        Math.pow(pointB.x - pointA.x, 2) + Math.pow(pointB.y - pointA.y, 2)
      );
      totalPixelDist += pixelDist;
    }

    // Minimum distance threshold (5 pixels)
    if (totalPixelDist < 5) {
      if (measureLine) map.removeLayer(measureLine);
      measureLine = null;
      previewLine = null;
      startPoint = null;
      freeDrawPoints = [];
      isFreeDrawing = false;
      return;
    }

    // Convert pixels to km (scale: 100 pixels = 10 km, so 1 pixel = 0.1 km)
    const km = (totalPixelDist * 0.1).toFixed(2);
    const baseTime = (km / travelSpeed).toFixed(1);
    const rests = Math.floor(baseTime / 6);
    const totalTime = (parseFloat(baseTime) + rests).toFixed(1);

    if (measureLine) map.removeLayer(measureLine);
    measureLine = L.polyline(pointsToMeasure, { color: '#6fc7d7', weight: 3 }).addTo(map);
    measureLine.bindPopup(`
      <div style="font-size: 1em; padding: 4px 8px;">
        📏 <b>Distance:</b> ${km} km<br>
        🚶 <b>Mode:</b> ${travelMode} (${travelSpeed} km/h)<br>
        ⏱ <b>Base Time:</b> ${baseTime} hrs<br>
        ⛺ <b>Rests:</b> ${rests} × 1 hr<br>
        🕒 <b>Total Time:</b> ${totalTime} hrs
      </div>
    `).openPopup();

    // Reset for next measurement
    previewLine = null;
    startPoint = null;
    freeDrawPoints = [];
    isFreeDrawing = false;
  }
});
