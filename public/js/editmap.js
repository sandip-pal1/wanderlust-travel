document.addEventListener("DOMContentLoaded", () => {
  const locationInput = document.querySelector("input[name='listing[location]']");
  const mapDiv = document.createElement("div");
  mapDiv.id = "edit-map";
  mapDiv.style = "height: 300px; margin-top: 15px; border-radius: 10px;";
  locationInput.parentNode.appendChild(mapDiv);

  let map = L.map("edit-map").setView([23.2599, 77.4126], 5); // default center (India)
  let marker;

  // Add OSM tile layer
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap",
  }).addTo(map);

  // Function to update marker
  const updateMap = async (location) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${location}`
      );
      const data = await response.json();
      if (data.length > 0) {
        const { lat, lon } = data[0];
        const coords = [parseFloat(lat), parseFloat(lon)];

        map.setView(coords, 13);

        if (marker) {
          marker.setLatLng(coords);
        } else {
          marker = L.marker(coords).addTo(map);
        }

        marker.bindPopup(location).openPopup();
      }
    } catch (err) {
      console.error("Geocoding error:", err);
    }
  };

  // Initial map load with existing location
  if (locationInput.value) {
    updateMap(locationInput.value);
  }

  // Add input event listener to update map live
  locationInput.addEventListener("input", (e) => {
    const loc = e.target.value;
    if (loc.length > 3) {
      updateMap(loc);
    }
  });
});
