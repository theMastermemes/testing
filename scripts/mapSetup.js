const map = L.map('map', {
  minZoom: -1,
  maxZoom: 2,
  crs: L.CRS.Simple,
  zoomControl: false
});

L.control.zoom({ position: 'topright' }).addTo(map);

const bounds = [[0, 0], [1080, 1920]];
const mapBounds = L.latLngBounds([0, 0], [1080, 1920]);

function clampLatLng(latlng) {
  let lat = Math.max(0, Math.min(1080, latlng.lat));
  let lng = Math.max(0, Math.min(1920, latlng.lng));
  return L.latLng(lat, lng);
}

const imageOverlay = L.imageOverlay('assets/placeholder-map.jpg', bounds).addTo(map);
map.fitBounds(bounds);

imageOverlay.on('load', () => {
  console.log('Image overlay loaded successfully');
  document.getElementById('loading-overlay').classList.add('hidden');
});

imageOverlay.on('error', () => {
  console.error('Failed to load placeholder-map.jpg');
  document.getElementById('loading-overlay').classList.add('hidden');
  const errorMessage = L.control({ position: 'topleft' });
  errorMessage.onAdd = function () {
    const div = L.DomUtil.create('div', 'error-message');
    div.innerHTML = 'Failed to load map image. Please check the file path.';
    return div;
  };
  errorMessage.addTo(map);
});

setTimeout(() => {
  if (!document.getElementById('loading-overlay').classList.contains('hidden')) {
    console.warn('Loading overlay timeout reached, hiding overlay');
    document.getElementById('loading-overlay').classList.add('hidden');
  }
}, 5000);
