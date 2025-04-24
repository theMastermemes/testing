// Set map image dimensions
const mapWidth = 1920;
const mapHeight = 1080;

// Create custom CRS for flat image
const map = L.map('map', {
  minZoom: -1,
  maxZoom: 2,
  crs: L.CRS.Simple
});

const bounds = [[0,0], [mapHeight, mapWidth]];
const image = L.imageOverlay('placeholder-map.jpg', bounds).addTo(map);
map.fitBounds(bounds);

// Add a sample marker
const marker = L.marker([600, 960]).addTo(map)
  .bindPopup("<b>Whispershade Woods</b><br>Site of a great battle between hydromancers and raiders.").openPopup();

// You can add more markers here
