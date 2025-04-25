console.log('layers.js: Script loaded');

// Guard against redeclaration
let layerSettlements, layerNationBorders, layerConflict, layerMana, layerFaith;
if (!window.layerSettlements) {
  layerSettlements = L.layerGroup().addTo(map);
  layerNationBorders = L.layerGroup();
  layerConflict = L.layerGroup();
  layerMana = L.layerGroup();
  layerFaith = L.layerGroup();
  window.layerSettlements = layerSettlements; // Store in window to prevent redeclaration
  window.layerNationBorders = layerNationBorders;
  window.layerConflict = layerConflict;
  window.layerMana = layerMana;
  window.layerFaith = layerFaith;
} else {
  layerSettlements = window.layerSettlements;
  layerNationBorders = window.layerNationBorders;
  layerConflict = window.layerConflict;
  layerMana = window.layerMana;
  layerFaith = window.layerFaith;
}

console.log('layers.js: Layer groups initialized');

// Load Settlements
fetch('data/settlements.json')
  .then(response => {
    if (!response.ok) throw new Error('Failed to load settlements.json');
    return response.json();
  })
  .then(settlements => {
    settlements.forEach(settlement => {
      const iconType = settlement.type === 'city' ? 'city' : settlement.type === 'village' ? 'village' : 'outpost';
      const iconSize = settlement.type === 'city' ? [50, 50] : [40, 40];
      const marker = L.marker([settlement.lat, settlement.lng], {
        icon: L.divIcon({
          className: 'settlement-marker',
          html: `<img src="assets/${iconType}.svg" style="width: ${iconSize[0]}px; height: ${iconSize[1]}px;" />`,
          iconSize: iconSize
        })
      }).bindPopup(`<b>${settlement.name}</b><br>${settlement.description}`);
      marker.on('click', () => map.flyTo(marker.getLatLng(), 1, { duration: 1 }));
      marker.addTo(layerSettlements);
    });
    console.log('layers.js: Settlements loaded');
  })
  .catch(error => console.error('layers.js: Error loading settlements:', error));

// Load Nation Borders
fetch('data/nations.json')
  .then(response => {
    if (!response.ok) throw new Error('Failed to load nations.json');
    return response.json();
  })
  .then(nations => {
    nations.forEach(nation => {
      L.polygon(nation.points, {
        color: nation.color,
        dashArray: '4,6',
        weight: 2,
        fillOpacity: 0
      }).bindPopup(`🧭 <b>Border of ${nation.name}</b><br>${nation.description}`).addTo(layerNationBorders);
    });
    console.log('layers.js: Nation borders loaded');
  })
  .catch(error => console.error('layers.js: Error loading nations:', error));

// Load Conflict Zones
fetch('data/conflictZones.json')
  .then(response => {
    if (!response.ok) throw new Error('Failed to load conflictZones.json');
    return response.json();
  })
  .then(conflictZones => {
    conflictZones.forEach(zone => {
      L.circle([zone.lat, zone.lng], {
        color: '#ff5555',
        fillColor: '#ff5555',
        fillOpacity: 0.3,
        radius: zone.radius
      }).bindPopup(`⚔️ <b>${zone.description}</b>`).addTo(layerConflict);
    });
    console.log('layers.js: Conflict zones loaded');
  })
  .catch(error => console.error('layers.js: Error loading conflict zones:', error));

// Load Mana Zones
fetch('data/manaZones.json')
  .then(response => {
    if (!response.ok) throw new Error('Failed to load manaZones.json');
    return response.json();
  })
  .then(manaZones => {
    manaZones.forEach(zone => {
      L.polygon(zone.points, {
        color: '#00d4ff',
        fillColor: '#00d4ff',
        fillOpacity: 0.3
      }).bindPopup(`🌊 <b>${zone.description}</b>`).addTo(layerMana);
    });
    console.log('layers.js: Mana zones loaded');
  })
  .catch(error => console.error('layers.js: Error loading mana zones:', error));

// Load Faith Zones
fetch('data/faithZones.json')
  .then(response => {
    if (!response.ok) throw new Error('Failed to load faithZones.json');
    return response.json();
  })
  .then(faithZones => {
    faithZones.forEach(zone => {
      L.polygon(zone.points, {
        color: '#ff5555',
        fillColor: '#ff5555',
        fillOpacity: 0.3
      }).bindPopup(`🕍 <b>${zone.description}</b>`).addTo(layerFaith);
    });
    console.log('layers.js: Faith zones loaded');
  })
  .catch(error => console.error('layers.js: Error loading faith zones:', error));

// Layer Toggle Control
L.control.layers(null, {
  "🏘 Settlements": layerSettlements,
  "🧭 Nation Borders": layerNationBorders,
  "⚔️ Conflict Zones": layerConflict,
  "🌊 Mana Zones": layerMana,
  "🕍 Faith Influence": layerFaith
}, { position: 'topright' }).addTo(map);

// Map Legend
const legend = L.control({ position: 'bottomright' });
legend.onAdd = function () {
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
    <div style="margin-top: 10px;">
      <strong>Scale:</strong> 100 pixels = 28.71 km
    </div>
  `;
  return div;
};
legend.addTo(map);

console.log('layers.js: Layer control and legend added');
