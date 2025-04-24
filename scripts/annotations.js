const layerAnnotations = L.layerGroup().addTo(map);
let annotateMode = false;

// Load annotations from localStorage
let annotations = JSON.parse(localStorage.getItem('ankyraAnnotations')) || [];

// Function to save annotations to localStorage
function saveAnnotations() {
  localStorage.setItem('ankyraAnnotations', JSON.stringify(annotations));
}

// Function to delete an annotation
window.deleteAnnotation = function(id) {
  annotations = annotations.filter(annotation => annotation.id !== id);
  saveAnnotations();
  layerAnnotations.clearLayers();
  annotations.forEach(annotation => {
    const marker = L.marker([annotation.lat, annotation.lng], {
      icon: L.divIcon({
        className: 'annotation-marker',
        html: '<span style="color: #ff5555; font-size: 1.2em;">📜</span>',
        iconSize: [30, 30]
      })
    }).bindPopup(`
      <b>Annotation</b><br>
      ${annotation.note}<br>
      <button onclick="deleteAnnotation(${annotation.id})">Delete</button>
    `).addTo(layerAnnotations);
  });
};

// Populate annotations on map load
annotations.forEach(annotation => {
  const marker = L.marker([annotation.lat, annotation.lng], {
    icon: L.divIcon({
      className: 'annotation-marker',
      html: '<span style="color: #ff5555; font-size: 1.2em;">📜</span>',
      iconSize: [30, 30]
    })
  }).bindPopup(`
    <b>Annotation</b><br>
    ${annotation.note}<br>
    <button onclick="deleteAnnotation(${annotation.id})">Delete</button>
  `).addTo(layerAnnotations);
});

// Annotate Button
const annotateToggle = L.control({ position: 'topright' });
annotateToggle.onAdd = function () {
  const div = L.DomUtil.create('div', 'leaflet-bar');
  div.innerHTML = '<a href="#" id="toggleAnnotate" title="Add Annotation (Click to Place Marker)">📜</a>';
  return div;
};
annotateToggle.addTo(map);

// Update Layer Toggle Control to Include Annotations
L.control.layers(null, {
  "🏘 Settlements": layerSettlements,
  "🧭 Nation Borders": layerNationBorders,
  "⚔️ Conflict Zones": layerConflict,
  "🌊 Mana Zones": layerMana,
  "🕍 Faith Influence": layerFaith,
  "📜 Annotations": layerAnnotations
}, { position: 'topright' }).addTo(map);

// Update Legend to Include Annotations
const updatedLegend = L.control({ position: 'bottomright' });
updatedLegend.onAdd = function () {
  const div = L.DomUtil.create('div', 'map-legend');
  div.innerHTML = `
    <h4>Legend</h4>
    <div><img src="assets/village.svg" style="width: 20px; height: 20px;"> Village</div>
    <div><img src="assets/city.svg" style="width: 25px; height: 25px;"> City</div>
    <div><img src="assets/outpost.svg" style="width: 20px; height: 20px;"> Outpost</div>
    <div><span style="color: #ff5555;">⚔️</span> Conflict Zone</div>
    <div><span style="color: #00d4ff;">🌊</span> Mana Zone</div>
    <div><span style="color: #ff5555;">🕍</span> Faith Influence</div>
    <div><span style="color: #5555ff;">🧭</span> Nation Border</div>
    <div><span style="color: #ff5555;">📜</span> Annotation</div>
    <div style="margin-top: 10px;">
      <strong>Scale:</strong> 100 pixels = 10 km
    </div>
  `;
  return div;
};
updatedLegend.addTo(map);

// Event Listener for Annotate Button
setTimeout(() => {
  const toggleAnnotate = document.getElementById('toggleAnnotate');
  toggleAnnotate.addEventListener('click', function (e) {
    e.preventDefault();
    L.DomEvent.stopPropagation(e);
    annotateMode = !annotateMode;
    toggleAnnotate.classList.toggle('active', annotateMode);
    if (annotateMode) {
      map.dragging.disable();
    } else {
      map.dragging.enable();
    }
  });
}, 200);

// Handle Annotation Placement
map.on('click', function (e) {
  if (!annotateMode) return;

  if (!mapBounds.contains(e.latlng)) {
    showOutOfBoundsMessage();
    return;
  }

  const clampedLatLng = clampLatLng(e.latlng);
  const id = Date.now(); // Unique ID based on timestamp
  const note = prompt("Enter your annotation note:");
  if (note) {
    const annotation = {
      id: id,
      lat: clampedLatLng.lat,
      lng: clampedLatLng.lng,
      note: note
    };
    annotations.push(annotation);
    saveAnnotations();
    const marker = L.marker([clampedLatLng.lat, clampedLatLng.lng], {
      icon: L.divIcon({
        className: 'annotation-marker',
        html: '<span style="color: #ff5555; font-size: 1.2em;">📜</span>',
        iconSize: [30, 30]
      })
    }).bindPopup(`
      <b>Annotation</b><br>
      ${note}<br>
      <button onclick="deleteAnnotation(${id})">Delete</button>
    `).addTo(layerAnnotations);
  }
  annotateMode = false;
  document.getElementById('toggleAnnotate').classList.remove('active');
  map.dragging.enable();
});
