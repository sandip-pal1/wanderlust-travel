const coords = JSON.parse(document.getElementById("map").dataset.coords);
const [lng, lat] = coords;

const map = L.map("map").setView([lat, lng], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap",
}).addTo(map);

L.marker([lat, lng])
  .addTo(map)
  .bindPopup(
    `<b>${document.getElementById("map").dataset.title}</b><br>${
      document.getElementById("map").dataset.location
    }`
  );
