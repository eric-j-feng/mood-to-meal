// Add this new function to get user's current position
export function getCurrentPosition(useCurrentLocation: boolean): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!useCurrentLocation || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported or disabled'));
    } else {
      navigator.geolocation.getCurrentPosition(resolve, (error) => {
        console.error("Geolocation error:", error);
        reject(new Error('Unable to get your location. Please try manual input.'));
      }, {
        timeout: 10000,
        enableHighAccuracy: false
      });
    }
  });
}

export async function getCoordinates(selectedCity: string | null, selectedState: string | null) {
  try {
    // Validate inputs
    if (!selectedCity?.trim() || !selectedState?.trim()) {
      throw new Error('City and state are required');
    }

    const apikey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;
    if (!apikey) {
      throw new Error('Weather API key is not configured');
    }

    console.log("Fetching coordinates...");
    
    // URL encode the city and state parameters
    const encodedCity = encodeURIComponent(selectedCity.trim());
    const encodedState = encodeURIComponent(selectedState.trim());

    const geocodeUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodedCity},${encodedState},US&limit=1&appid=${apikey}`;
    const response = await fetch(geocodeUrl);
    
    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(`Location not found: ${response.status} - ${errorDetails}`);
    }

    const data = await response.json();
    
    if (!data || data.length === 0) {
      throw new Error('Location not found');
    }

    const latFetched = data[0]?.lat;
    const lonFetched = data[0]?.lon;

    if (!latFetched || !lonFetched) {
      throw new Error('Invalid coordinates received');
    }

    return { latFetched, lonFetched };
  } catch (error) {
    console.error("Error fetching coordinates:", error);
    throw error;
  }
}

export async function getWeather(
  selectedCity: string | null, 
  selectedState: string | null,
  useCurrentLocation: boolean = true 
) {
  try {
    const apikey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;
    if (!apikey) {
      throw new Error('Weather API key is not configured');
    }

    let latFetched: number;
    let lonFetched: number;

    if (useCurrentLocation) {
      // Get coordinates from browser's geolocation
      try {
        const position = await getCurrentPosition(useCurrentLocation);
        latFetched = position.coords.latitude;
        lonFetched = position.coords.longitude;
      } catch (error) {
        console.error("Geolocation failed:", error);
        throw new Error('Unable to get your location. Please try manual input.');
      }
    } else {
      // Use existing city/state lookup
      const coords = await getCoordinates(selectedCity, selectedState);
      if (!coords) {
        throw new Error('Unable to find coordinates for the specified location');
      }
      latFetched = coords.latFetched;
      lonFetched = coords.lonFetched;
    }

    console.log("Using coordinates:", latFetched, lonFetched);
    
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latFetched}&lon=${lonFetched}&appid=${apikey}&units=imperial`;
    const response = await fetch(weatherUrl);
    
    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(`Weather data not available: ${response.status} - ${errorDetails}`);
    }

    const data = await response.json();
    
    if (!data || !data.main || !data.weather || !data.weather[0]) {
      throw new Error('Invalid weather data received');
    }

    return {
      temperature: Math.round(data.main.temp), // Round to nearest degree
      weatherDescription: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      cityName: data.name,
    };
  } catch (error) {
    console.error("Error fetching weather data:", error);
    throw error;
  }
}