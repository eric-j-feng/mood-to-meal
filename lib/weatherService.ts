// Add this new function to get user's current position
export function getCurrentPosition(useCurrentLocation: boolean): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      useCurrentLocation = false;
    } else {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    }
  });
}

export async function getCoordinates(selectedCity: string | null, selectedState: string | null) {
  try {
    // Validate inputs
    if (!selectedCity?.trim() || !selectedState?.trim()) {
      return null;  // Return null instead of throwing error to handle partial input
    }

    console.log("Fetching coordinates...");
    
    // URL encode the city and state parameters
    const encodedCity = encodeURIComponent(selectedCity.trim());
    const encodedState = encodeURIComponent(selectedState.trim());
    const apikey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;

    const geocodeUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodedCity},${encodedState},US&limit=1&appid=${apikey}`;
    const response = await fetch(geocodeUrl);
    
    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(`Geocoding response was not ok: ${response.status} - ${errorDetails}`);
    }

    const data = await response.json();
    
    if (!data || data.length === 0) {
      return null;
    }

    const latFetched = data[0]?.lat;
    const lonFetched = data[0]?.lon;

    if (!latFetched || !lonFetched) {
      return null;
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
    let latFetched: number;
    let lonFetched: number;

    if (useCurrentLocation) {
      // Get coordinates from browser's geolocation
      const position = await getCurrentPosition(useCurrentLocation);
      latFetched = position.coords.latitude;
      lonFetched = position.coords.longitude;
    } else {
      // Use existing city/state lookup
      const coords = await getCoordinates(selectedCity, selectedState);
      if (!coords) {
        return null;
      }
      latFetched = coords.latFetched;
      lonFetched = coords.lonFetched;
    }

    const apikey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;
    console.log("Using coordinates:", latFetched, lonFetched);
    
    const weatherUrl = `http://api.openweathermap.org/data/2.5/weather?lat=${latFetched}&lon=${lonFetched}&appid=${apikey}&units=imperial`;
    const response = await fetch(weatherUrl);
    
    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(`Weather response was not ok: ${response.status} - ${errorDetails}`);
    }

    const data = await response.json();
    
    return {
      temperature: data.main.temp,
      weatherDescription: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      cityName: data.name,
    };
  } catch (error) {
    console.error("Error fetching forecast data:", error);
    throw error;
  }
}