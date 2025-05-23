try {
  console.log('layers.js: Script loaded');

  // Verify dependencies
  if (typeof L === 'undefined') {
    throw new Error('Leaflet (L) is not defined. Ensure leaflet.js is loaded.');
  }
  if (typeof map === 'undefined') {
    throw new Error('Map variable is not defined. Ensure mapSetup.js executed correctly.');
  }

  // Layer declarations
  let layerSettlements = L.layerGroup().addTo(map);
  let layerNationBorders = L.layerGroup();
  let layerConflict = L.layerGroup();
  let layerMana = L.layerGroup();
  let layerFaith = L.layerGroup();

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
        const iconUrl = `assets/${iconType}.svg`;

        // Test the SVG URL directly
        const testImage = new Image();
        testImage.src = iconUrl;
        testImage.onload = () => {
          console.log(`layers.js: SVG loaded successfully: ${iconUrl}`);
        };
        testImage.onerror = () => {
          console.error(`layers.js: Failed to load SVG: ${iconUrl}`);
        };

        const marker = L.marker([settlement.lat, settlement.lng], {
          icon: L.divIcon({
            className: 'settlement-marker',
            html: `<img src="${iconUrl}" style="width: ${iconSize[0]}px; height: ${iconSize[1]}px;" onerror="this.src='https://via.placeholder.com/40?text=${iconType}';" />`,
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
      <div><img src="assets/village.svg" style="width: 20px; height: 20px;" onerror="this.src='https://via.placeholder.com/20?text=Village';"> Village</div>
      <div><img src="assets/city.svg" style="width: 25px; height: 25px;" onerror="this.src='https://via.placeholder.com/25?text=City';"> City</div>
      <div><img src="assets/outpost.svg" style="width: 20px; height: 20px;" onerror="this.src='https://via.placeholder.com/20?text=Outpost';"> Outpost</div>
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

} catch (error) {
  console.error('layers.js: Error during execution:', error);
}
