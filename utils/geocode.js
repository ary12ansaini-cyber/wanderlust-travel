/**
 * Dynamic Geocoding Service
 * Converts locations (addresses, cities, countries) to GeoJSON Point coordinates: [longitude, latitude]
 * Supports Mapbox Geocoding API (when MAP_TOKEN is set) with automatic fallback to OpenStreetMap Nominatim.
 */

const popularLocations = {
  mumbai: [72.8777, 19.076],
  delhi: [77.209, 28.6139],
  "new delhi": [77.209, 28.6139],
  jaipur: [75.7873, 26.9124],
  bangalore: [77.5946, 12.9716],
  bengaluru: [77.5946, 12.9716],
  goa: [74.124, 15.2993],
  udaipur: [73.7125, 24.5854],
  kolkata: [88.3639, 22.5726],
  chennai: [80.2707, 13.0827],
  hyderabad: [78.4867, 17.385],
  manali: [77.1892, 32.2432],
  shimla: [77.1734, 31.1048],
  rishikesh: [78.2676, 30.0869],
  agra: [78.0081, 27.1767],
  kerala: [76.2711, 10.8505],
  paris: [2.3522, 48.8566],
  london: [-0.1278, 51.5074],
  "new york": [-74.006, 40.7128],
  dubai: [55.2708, 25.2048],
  tokyo: [139.6917, 35.6895],
  sydney: [151.2093, -33.8688],
  rome: [12.4964, 41.9028],
};

function lookupFallback(query) {
  if (!query) return [77.209, 28.6139];
  const lower = query.toLowerCase();
  for (const [key, coords] of Object.entries(popularLocations)) {
    if (lower.includes(key)) {
      return coords;
    }
  }
  return [77.209, 28.6139]; // Default: Delhi, India
}

async function geocodeLocation(locationQuery) {
  const query = (locationQuery || "").trim();
  if (!query) {
    return {
      type: "Point",
      coordinates: [77.209, 28.6139],
    };
  }

  // 1. Try Mapbox Geocoding if MAP_TOKEN is configured
  const mapToken = process.env.MAP_TOKEN;
  if (mapToken && typeof mapToken === "string" && mapToken.startsWith("pk.")) {
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        query
      )}.json?access_token=${mapToken.trim()}&limit=1`;
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (response.ok) {
        const data = await response.json();
        if (
          data &&
          Array.isArray(data.features) &&
          data.features.length > 0 &&
          data.features[0].geometry &&
          Array.isArray(data.features[0].geometry.coordinates)
        ) {
          const coords = data.features[0].geometry.coordinates;
          if (
            coords.length === 2 &&
            !isNaN(coords[0]) &&
            !isNaN(coords[1])
          ) {
            return {
              type: "Point",
              coordinates: [Number(coords[0]), Number(coords[1])], // [lng, lat]
            };
          }
        }
      }
    } catch (err) {
      console.warn("Mapbox geocoding error, trying OpenStreetMap fallback:", err.message);
    }
  }

  // 2. Try OpenStreetMap Nominatim (Free, tokenless geocoding)
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query
    )}&format=json&limit=1`;
    const response = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "Wanderlust-App/1.0",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const lon = parseFloat(data[0].lon);
        const lat = parseFloat(data[0].lat);
        if (!isNaN(lon) && !isNaN(lat)) {
          return {
            type: "Point",
            coordinates: [lon, lat], // GeoJSON standard: [longitude, latitude]
          };
        }
      }
    }
  } catch (err) {
    console.warn("Nominatim geocoding error:", err.message);
  }

  // 3. Fallback to dictionary or Delhi default coordinates
  const fallbackCoords = lookupFallback(query);
  return {
    type: "Point",
    coordinates: fallbackCoords,
  };
}

module.exports = {
  geocodeLocation,
};
