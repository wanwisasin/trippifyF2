// src/utils/loadGoogleMaps.js
let googleMapsPromise = null;

export function loadGoogleMaps() {
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    if (window.google && window.google.maps) return resolve(window.google.maps);

    const script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyAPXZbbrz75ECNK3VD77E9CZULbebHbe9I';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}
