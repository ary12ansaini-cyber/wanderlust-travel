const mapContainer = document.getElementById("map");

if (mapContainer) {
  // 1. Initial coordinates resolution
  let coords = [77.209, 28.6139]; // Default: [lng, lat] (Delhi, India)
  let hasDbCoords = false;

  if (
    typeof listing !== "undefined" &&
    listing &&
    listing.geometry &&
    Array.isArray(listing.geometry.coordinates) &&
    listing.geometry.coordinates.length === 2 &&
    typeof listing.geometry.coordinates[0] === "number" &&
    typeof listing.geometry.coordinates[1] === "number" &&
    !isNaN(listing.geometry.coordinates[0]) &&
    !isNaN(listing.geometry.coordinates[1])
  ) {
    coords = listing.geometry.coordinates;
    hasDbCoords = true;
  }

  const title =
    typeof listing !== "undefined" && listing && listing.title
      ? listing.title
      : "Listing Location";
  const locationName =
    typeof listing !== "undefined" && listing && listing.location
      ? listing.location
      : "";
  const countryName =
    typeof listing !== "undefined" && listing && listing.country
      ? listing.country
      : "";
  const fullAddress = [locationName, countryName].filter(Boolean).join(", ");

  const popupHtml = `
    <div style="font-family: 'Plus Jakarta Sans', sans-serif; padding: 4px;">
      <h6 style="margin: 0 0 5px 0; font-weight: 700;">${title}</h6>
      <p style="margin: 0 0 5px 0; font-size: 0.85rem; color: #555;">${fullAddress || "Location"}</p>
      <span style="font-size: 0.75rem; color: #fe424d; font-weight: 600;">Exact location provided after booking</span>
    </div>
  `;

  let activeMap = null;
  let activeMarker = null;

  // 2. Mapbox GL JS Renderer
  function initMapbox(token, currentCoords) {
    mapContainer.innerHTML = "";
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/streets-v12",
      center: currentCoords,
      zoom: 11,
    });

    map.addControl(new mapboxgl.NavigationControl());

    const marker = new mapboxgl.Marker({ color: "#fe424d" })
      .setLngLat(currentCoords)
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(popupHtml))
      .addTo(map);

    activeMap = map;
    activeMarker = marker;

    window.addEventListener("resize", () => {
      if (map) map.resize();
    });

    map.on("error", (e) => {
      console.warn("Mapbox encountered an error, falling back to Leaflet:", e);
      initLeaflet(currentCoords);
    });

    return { map, marker };
  }

  // 3. Leaflet / OpenStreetMap Fallback Renderer (Works tokenless)
  function initLeaflet(currentCoords) {
    mapContainer.innerHTML = "";
    // Leaflet uses [latitude, longitude]
    const latLng = [currentCoords[1], currentCoords[0]];

    if (window.L) {
      const lMap = L.map("map").setView(latLng, 11);

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
      }).addTo(lMap);

      const marker = L.marker(latLng).addTo(lMap);
      marker.bindPopup(popupHtml).openPopup();

      activeMap = lMap;
      activeMarker = marker;

      window.addEventListener("resize", () => {
        if (lMap) lMap.invalidateSize();
      });

      return { map: lMap, marker };
    }
  }

  // 4. Mount map based on token availability
  const hasMapboxToken =
    typeof mapToken !== "undefined" &&
    mapToken &&
    typeof mapToken === "string" &&
    mapToken.trim() !== "" &&
    mapToken.startsWith("pk.");

  if (hasMapboxToken) {
    try {
      initMapbox(mapToken.trim(), coords);
    } catch (e) {
      console.warn("Mapbox initialization error, falling back to Leaflet:", e);
      initLeaflet(coords);
    }
  } else {
    initLeaflet(coords);
  }

  // 5. Client-side geocoding fallback for legacy listings with default or missing coordinates
  if (!hasDbCoords && fullAddress) {
    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        fullAddress
      )}&format=json&limit=1`,
      {
        headers: { Accept: "application/json" },
      }
    )
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const newLng = parseFloat(data[0].lon);
          const newLat = parseFloat(data[0].lat);
          if (!isNaN(newLng) && !isNaN(newLat)) {
            const updatedCoords = [newLng, newLat];
            if (hasMapboxToken && activeMap && activeMap.flyTo) {
              activeMap.flyTo({ center: updatedCoords, zoom: 11 });
              if (activeMarker && activeMarker.setLngLat) {
                activeMarker.setLngLat(updatedCoords);
              }
            } else if (activeMap && activeMap.setView) {
              activeMap.setView([newLat, newLng], 11);
              if (activeMarker && activeMarker.setLatLng) {
                activeMarker.setLatLng([newLat, newLng]);
              }
            }
          }
        }
      })
      .catch((err) => {
        console.warn("Client-side geocoding fallback error:", err.message);
      });
  }
}
