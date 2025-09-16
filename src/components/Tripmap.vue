<script setup>
import { ref, onMounted, watch } from 'vue';
import { loadGoogleMaps } from '../utils/loadGoogleMaps';

const props = defineProps({
  locations: { type: Array, default: () => [] },
  nearby: { type: Array, default: () => [] },
  highlighted: { type: Object, default: null }
});

const map = ref(null);
const mapLoaded = ref(false);
const markers = [];
const nearbyMarkers = [];
let directionsRenderer = null;

const isValidCoord = (v) => typeof v === "number" && !isNaN(v);

function sanitizeLocations(locations) {
  return locations
    .map(loc => {
      const lat = Number(loc.lat);
      const lng = Number(loc.lng);
      if (!isValidCoord(lat) || !isValidCoord(lng)) return null;
      return { ...loc, lat, lng };
    })
    .filter(Boolean);
}

function initMap(center) {
  map.value = new google.maps.Map(document.getElementById("map"), {
    center,
    zoom: 13,
  });
  mapLoaded.value = true;
}

function clearMarkers() {
  markers.forEach(m => m.setMap(null));
  markers.length = 0;
}

function clearNearbyMarkers() {
  nearbyMarkers.forEach(m => m.setMap(null));
  nearbyMarkers.length = 0;
}

const getMarkerColor = (dayNumber) => {
  const colors = ["#9656a2","#5e62a9","#de324c","#f4895f","#f8e16f", "#95cf92", "#369acc"];
  return colors[(dayNumber - 1) % colors.length];
};

function addMarkers() {
  if (!map.value || !props.locations) return;
  clearMarkers();
  const sanitized = sanitizeLocations(props.locations);
  sanitized.forEach((loc, idx) => {
    const pinColor = getMarkerColor(loc.day);
    const svgIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
        <path fill="${pinColor}" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      </svg>`;
    const marker = new google.maps.Marker({
      map: map.value,
      position: { lat: loc.lat, lng: loc.lng },
      title: loc.name,
      icon: { url: `data:image/svg+xml;utf-8,${encodeURIComponent(svgIcon)}`, scaledSize: new google.maps.Size(32, 32) },
      label: { text: String(idx + 1), color: "white", fontWeight: "bold", fontSize: "14px" }
    });
    markers.push(marker);
  });
}

function addNearbyMarkers() {
  if (!map.value || !props.nearby) return;
  clearNearbyMarkers();
  const sanitized = sanitizeLocations(props.nearby);
  sanitized.forEach(loc => {
    const marker = new google.maps.Marker({
      map: map.value,
      position: { lat: loc.lat, lng: loc.lng },
      title: loc.name,
      icon: { url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png" }
    });
    nearbyMarkers.push(marker);
  });
}

function buildRouteRequest(locations) {
  const sanitized = sanitizeLocations(locations);
  if (sanitized.length < 2) return null;

  const origin = sanitized[0];
  const destination = sanitized[sanitized.length - 1];
  const waypoints = sanitized.slice(1, -1).map(l => ({ location: { lat: l.lat, lng: l.lng }, stopover: true }));

  return { origin, destination, waypoints, travelMode: google.maps.TravelMode.DRIVING };
}

async function calculateDistances() {
  const sanitized = sanitizeLocations(props.locations);
  if (sanitized.length < 2) return;

  const service = new google.maps.DistanceMatrixService();
  for (let i = 0; i < sanitized.length - 1; i++) {
    const origin = sanitized[i];
    const destination = sanitized[i + 1];
    try {
      const response = await new Promise((resolve, reject) => {
        service.getDistanceMatrix(
          { origins: [{ lat: origin.lat, lng: origin.lng }], destinations: [{ lat: destination.lat, lng: destination.lng }], travelMode: google.maps.TravelMode.DRIVING },
          (result, status) => (status === 'OK' ? resolve(result) : reject(`Distance Matrix failed: ${status}`))
        );
      });
      destination.distance_to_next = response.rows[0].elements[0].distance?.text || 'N/A';
    } catch (err) {
      console.error(err);
      destination.distance_to_next = 'N/A';
    }
  }
}

async function drawRoute() {
  const routeRequest = buildRouteRequest(props.locations);
  if (!routeRequest || !map.value) return;

  if (!directionsRenderer) {
    directionsRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: { strokeColor: '#1D4ED8', strokeOpacity: 0.8, strokeWeight: 5 }
    });
    directionsRenderer.setMap(map.value);
  }

  const { origin, destination, waypoints } = routeRequest;

  const directionsService = new google.maps.DirectionsService();
  directionsService.route(
    { origin, destination, waypoints, optimizeWaypoints: false, travelMode: google.maps.TravelMode.DRIVING },
    (result, status) => {
      if (status === 'OK') directionsRenderer.setDirections(result);
      else console.error('Directions request failed:', status);
    }
  );
}

function flyTo(loc) {
  if (!map.value || !loc) return;
  const sanitized = sanitizeLocations([loc])[0];
  if (!sanitized) return;
  map.value.panTo({ lat: sanitized.lat, lng: sanitized.lng });
  map.value.setZoom(15);
}

onMounted(async () => {
  const googleMaps = await loadGoogleMaps();
  const firstValid = sanitizeLocations(props.locations)[0];
  if (firstValid) {
    initMap({ lat: firstValid.lat, lng: firstValid.lng });
    addMarkers();
    addNearbyMarkers();
    await calculateDistances();
    await drawRoute();
  }
});

watch(() => props.locations, async () => {
  if (!mapLoaded.value) {
    const firstValid = sanitizeLocations(props.locations)[0];
    if (firstValid) initMap({ lat: firstValid.lat, lng: firstValid.lng });
  }
  addMarkers();
  await calculateDistances();
  await drawRoute();
});

watch(() => props.nearby, () => addNearbyMarkers());
watch(() => props.highlighted, (loc) => { if (loc) flyTo(loc); });
</script>

<template>
  <div class="w-full h-full">
    <div id="map" class="w-full aspect-square md:w-auto md:h-full" style="min-height:300px;"></div>
  </div>
</template>
