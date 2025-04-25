console.log('measurementTool.js: Script loaded');

// Guard against redeclaration
let measureMode = false;
let measureLines = [];
let previewLine = null;
let freeDrawPoints = [];
let isDrawing = false;
let isFreeDrawing = false;
let startPoint = null;
let hasFirstClick = false;
let travelSpeed = 8;
let travelMode = "Horseback";

if (window.measureToolInitialized) {
  console.log('measurementTool.js: Already initialized, skipping redeclaration');
  measureMode = window.measureMode;
  measureLines = window.measureLines;
  previewLine = window.previewLine;
  freeDrawPoints = window.freeDrawPoints;
  isDrawing = window.isDrawing;
  isFreeDrawing = window.isFreeDrawing;
  startPoint = window.startPoint;
  hasFirstClick = window.hasFirstClick;
  travelSpeed = window.travelSpeed;
  travelMode = window.travelMode;
} else {
  window.measureToolInitialized = true;
  window.measureMode = measureMode;
  window.measureLines = measureLines;
  window.previewLine = previewLine;
  window.freeDrawPoints = freeDrawPoints;
  window.isDrawing = isDrawing;
  window.isFreeDrawing = isFreeDrawing;
  window.startPoint = startPoint;
  window.hasFirstClick = hasFirstClick;
  window.travelSpeed = travelSpeed;
  window.travelMode = travelMode;
  console.log('measurementTool.js: Variables initialized');
}

// Function to clear all measurement lines
function clearMeasureLines() {
  measureLines.forEach(line => {
    if (map.hasLayer(line)) {
      map.removeLayer(line);
      console.log('measurementTool.js: Removed a measurement line');
    }
  });
  measureLines = [];
  window.measureLines = measureLines;
  if (previewLine && map.hasLayer(previewLine)) {
    map.removeLayer(previewLine);
    console.log('measurementTool.js: Removed preview line');
  }
  previewLine = null;
  window.previewLine = previewLine;
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
  div.innerHTML = '<a href="#" id="toggleMeasure" title="Measure Distance (Left Click: Two Points, Right Click: Free Draw)">📏</a>';
  return div;
};
distanceToggle.addTo(map);

// Feedback Message for Out-of-Bounds
const outOfBoundsMessage = L.control({ position: 'topleft' });
outOfBoundsMessage.onAdd = function () {
  const div = L.DomUtil.create('div', 'out-of-bounds-message');
  div.innerHTML = 'Please interact within the map bounds';
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

// Event Listeners for Travel Selector and Measure Button
setTimeout(() => {
  const travelSelector = document.getElementById('travelSelector');
  const toggleMeasure = document.getElementById('toggleMeasure');

  travelSelector.addEventListener('change', function () {
    travelMode = this.value;
    travelSpeed = travelMode === "Foot" ? 5 : travelMode === "Carriage" ? 6 : 8;
    window.travelMode = travelMode;
    window.travelSpeed = travelSpeed;
  });

  toggleMeasure.addEventListener('click', function (e) {
    e.preventDefault();
    L.DomEvent.stopPropagation(e);
    measureMode = !measureMode;
    toggleMeasure.classList.toggle('active', measureMode);
    window.measureMode = measureMode;
    if (measureMode) {
      map.dragging.disable();
    } else {
      map.dragging.enable();
      clearMeasureLines();
      startPoint = null;
      freeDrawPoints = [];
      isDrawing = false;
      isFreeDrawing = false;
      hasFirstClick = false;
      window.startPoint = startPoint;
      window.freeDrawPoints = freeDrawPoints;
      window.isDrawing = isDrawing;
      window.isFreeDrawing = isFreeDrawing;
      window.hasFirstClick = hasFirstClick;
    }
  });
}, 200);

// Prevent default right-click menu
map.on('contextmenu', function (e) {
  L.DomEvent.preventDefault(e);
});

// Distance Logic with Two-Click Straight Line and Free-Draw
map.on('click', function (e) {
  if (!measureMode) return;

  if (!mapBounds.contains(e.latlng)) {
    showOutOfBoundsMessage();
    return;
  }

  const clampedLatLng = clampLatLng(e.latlng);

  if (!hasFirstClick) {
    startPoint = clampedLatLng;
    hasFirstClick = true;
    previewLine = L.polyline([startPoint, startPoint], {
      color: '#6fc7d7',
      weight: 3,
      dashArray: '5,10'
    }).addTo(map);
    window.startPoint = startPoint;
    window.hasFirstClick = hasFirstClick;
    window.previewLine = previewLine;
  } else {
    hasFirstClick = false;
    if (previewLine) map.removeLayer(previewLine);

    const pointsToMeasure = [startPoint, clampedLatLng];
    let totalPixelDist = 0;

    const pointA = map.latLngToContainerPoint(pointsToMeasure[0]);
    const pointB = map.latLngToContainerPoint(pointsToMeasure[1]);
    totalPixelDist = Math.sqrt(
      Math.pow(pointB.x - pointA.x, 2) + Math.pow(pointB.y - pointA.y, 2)
    );

    if (totalPixelDist < 5) {
      clearMeasureLines();
      startPoint = null;
      window.startPoint = startPoint;
      return;
    }

    const km = (totalPixelDist * pixelToKmScale).toFixed(2);
    const baseTime = (km / travelSpeed).toFixed(1);
    const rests = Math.floor(baseTime / 6);
    const totalTime = (parseFloat(baseTime) + rests).toFixed(1);

    clearMeasureLines();
    const newLine = L.polyline(pointsToMeasure, { color: '#6fc7d7', weight: 3 }).addTo(map);
    newLine.bindPopup(`
      <div style="font-size: 1em; padding: 4px 8px;">
        📏 <b>Distance:</b> ${km} km<br>
        🚶 <b>Mode:</b> ${travelMode} (${travelSpeed} km/h)<br>
        ⏱ <b>Base Time:</b> ${baseTime} hrs<br>
        ⛺ <b>Rests:</b> ${rests} × 1 hr<br>
        🕒 <b>Total Time:</b> ${totalTime} hrs
      </div>
    `).openPopup();
    measureLines.push(newLine);
    window.measureLines = measureLines;
    console.log('measurementTool.js: Added new straight line, total lines:', measureLines.length);

    previewLine = null;
    startPoint = null;
    window.previewLine = previewLine;
    window.startPoint = startPoint;
  }
});

map.on('mousemove', function (e) {
  if (!measureMode || !hasFirstClick || isDrawing) return;

  const clampedLatLng = clampLatLng(e.latlng);
  if (previewLine) {
    previewLine.setLatLngs([startPoint, clampedLatLng]);
    window.previewLine = previewLine;
  }
});

// Free-Draw with Right Click
map.on('mousedown', function (e) {
  if (!measureMode || e.originalEvent.button !== 2) return;

  if (!mapBounds.contains(e.latlng)) {
    showOutOfBoundsMessage();
    return;
  }

  isDrawing = true;
  isFreeDrawing = true;
  freeDrawPoints = [clampLatLng(e.latlng)];
  previewLine = L.polyline(freeDrawPoints, {
    color: '#6fc7d7',
    weight: 3,
    dashArray: '5,10'
  }).addTo(map);
  window.isDrawing = isDrawing;
  window.isFreeDrawing = isFreeDrawing;
  window.freeDrawPoints = freeDrawPoints;
  window.previewLine = previewLine;
});

map.on('mousemove', function (e) {
  if (!isDrawing || !measureMode || !isFreeDrawing) return;

  const clampedLatLng = clampLatLng(e.latlng);
  freeDrawPoints.push(clampedLatLng);
  previewLine.setLatLngs(freeDrawPoints);
  window.freeDrawPoints = freeDrawPoints;
  window.previewLine = previewLine;
});

map.on('mouseup', function (e) {
  if (!isDrawing || !measureMode || e.originalEvent.button !== 2) return;

  isDrawing = false;
  isFreeDrawing = false;
  if (previewLine) map.removeLayer(previewLine);

  let pointsToMeasure = freeDrawPoints;
  let totalPixelDist = 0;

  for (let i = 0; i < pointsToMeasure.length - 1; i++) {
    const pointA = map.latLngToContainerPoint(pointsToMeasure[i]);
    const pointB = map.latLngToContainerPoint(pointsToMeasure[i + 1]);
    const pixelDist = Math.sqrt(
      Math.pow(pointB.x - pointA.x, 2) + Math.pow(pointB.y - pointA.y, 2)
    );
    totalPixelDist += pixelDist;
  }

  if (totalPixelDist < 5) {
    clearMeasureLines();
    freeDrawPoints = [];
    window.freeDrawPoints = freeDrawPoints;
    return;
  }

  const km = (totalPixelDist * pixelToKmScale).toFixed(2);
  const baseTime = (km / travelSpeed).toFixed(1);
  const rests = Math.floor(baseTime / 6);
  const totalTime = (parseFloat(baseTime) + rests).toFixed(1);

  clearMeasureLines();
  const newLine = L.polyline(pointsToMeasure, { color: '#6fc7d7', weight: 3 }).addTo(map);
  newLine.bindPopup(`
    <div style="font-size: 1em; padding: 4px 8px;">
      📏 <b>Distance:</b> ${km} km<br>
      🚶 <b>Mode:</b> ${travelMode} (${travelSpeed} km/h)<br>
      ⏱ <b>Base Time:</b> ${baseTime} hrs<br>
      ⛺ <b>Rests:</b> ${rests} × 1 hr<br>
      🕒 <b>Total Time:</b> ${totalTime} hrs
    </div>
  `).openPopup();
  measureLines.push(newLine);
  window.measureLines = measureLines;
  console.log('measurementTool.js: Added new free-draw line, total lines:', measureLines.length);

  previewLine = null;
  freeDrawPoints = [];
  window.previewLine = previewLine;
  window.freeDrawPoints = freeDrawPoints;
});
