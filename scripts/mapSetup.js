console.log('mapSetup.js: Script loaded');

const map = L.map('map', {
  minZoom: -1,
  maxZoom: 2,
  crs: L.CRS.Simple,
  zoomControl: false
});

console.log('mapSetup.js: Map initialized');

L.control.zoom({ position: 'topright' }).addTo(map);
console.log('mapSetup.js: Zoom control added');

// Updated bounds for the new map image (2274 x 1700 pixels)
const bounds = [[0, 0], [1700, 2274]];
const mapBounds = L.latLngBounds([0, 0], [1700, 2274]]);

// Scale factor: 1 pixel = 0.2871 km (calculated from 318,812.5 km² over 2274 x 1700 pixels)
const pixelToKmScale = 0.2871; // 100 pixels = 28.71 km

function clampLatLng(latlng) {
  let lat = Math.max(0, Math.min(1700, latlng.lat));
  let lng = Math.max(0, Math.min(2274, latlng.lng));
  return L.latLng(lat, lng);
}

console.log('mapSetup.js: Attempting to load map image: assets/central-ankyra-map.jpg');
const imageOverlay = L.imageOverlay('assets/central-ankyra-map.jpg', bounds).addTo(map);
map.fitBounds(bounds);

imageOverlay.on('load', () => {
  console.log('mapSetup.js: Image overlay loaded successfully');
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.classList.add('hidden');
  } else {
    console.error('mapSetup.js: Loading overlay element not found');
  }
});

imageOverlay.on('error', () => {
  console.error('mapSetup.js: Failed to load central-ankyra-map.jpg');
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.classList.add('hidden');
    const errorMessage = L.control({ position: 'topleft' });
    errorMessage.onAdd = function () {
      const div = L.DomUtil.create('div', 'error-message');
      div.innerHTML = 'Failed to load map image. Please check the file path.';
      return div;
    };
    errorMessage.addTo(map);
  } else {
    console.error('mapSetup.js: Loading overlay element not found');
  }
});

// Fallback: Hide loading overlay after 15 seconds if the load event doesn't fire
setTimeout(() => {
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay && !loadingOverlay.classList.contains('hidden')) {
    console.warn('mapSetup.js: Loading overlay timeout reached (15 seconds), hiding overlay');
    loadingOverlay.classList.add('hidden');
  } else if (!loadingOverlay) {
    console.error('mapSetup.js: Loading overlay element not found during timeout');
  }
}, 15000);

// Additional fallback: Force hide loading overlay after 30 seconds
setTimeout(() => {
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay && !loadingOverlay.classList.contains('hidden')) {
    console.error('mapSetup.js: Forcing loading overlay to hide after 30 seconds due to script failure');
    loadingOverlay.classList.add('hidden');
  }
}, 30000);
