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
    // const apikey = process.env.OPENWEATHERMAP_API_KEY;

    
    const geocodeUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodedCity},${encodedState},US&limit=1&appid=bee76c71adbb1cc04d3bf0445c032ab3`;
    // const geocodeUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodedCity},${encodedState}&limit=1&appid=${apikey}`;
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

export async function getWeather(selectedCity: string | null, selectedState: string | null) {
  try {
    const coords = await getCoordinates(selectedCity, selectedState);
    if (!coords) {
      return null;  // Return null if coordinates aren't available
    }
    
    const { latFetched, lonFetched } = coords;
    console.log("Using coordinates:", latFetched, lonFetched);
    
    const weatherUrl = `http://api.openweathermap.org/data/2.5/weather?lat=${latFetched}&lon=${lonFetched}&appid=bee76c71adbb1cc04d3bf0445c032ab3&units=imperial`;
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