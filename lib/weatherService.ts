import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Function to fetch the latitude and longitude
export async function getCoordinates(selectedCity: string | null, selectedState: string | null) {
  try {
    console.log("Fetching coordinates...");
    const apikey = process.env.OPENWEATHERMAP_API_KEY;
    console.log("API Key:", apikey);
    
    const geocodeUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${selectedCity},${selectedState}&limit=1&appid=bee76c71adbb1cc04d3bf0445c032ab3`;
    const response = await fetch(geocodeUrl);
    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(`Geocoding response was not ok: ${response.status} - ${errorDetails}`);
    }

    const data = await response.json();
    const latFetched = data[0]?.lat;
    const lonFetched = data[0]?.lon;

    return { latFetched, lonFetched };
  } catch (error) {
    console.error("Error fetching coordinates:", error);
    throw error;
  }
}

// Function to fetch weather data using the lat/lon
export async function getWeather(selectedCity: string | null, selectedState: string | null){
  try {
    const { latFetched, lonFetched } = await getCoordinates(selectedCity, selectedState);
    console.log("Using coordinates:", latFetched, lonFetched);
    
    const apikey = process.env.OPENWEATHERMAP_API_KEY;
    console.log("API Key:", apikey);
    
    const weatherUrl = `http://api.openweathermap.org/data/2.5/weather?lat=${latFetched}&lon=${lonFetched}&appid=bee76c71adbb1cc04d3bf0445c032ab3&units=imperial`;
    const response = await fetch(weatherUrl);
    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(`Weather response was not ok: ${response.status} - ${errorDetails}`);
    }

    const data = await response.json();
    // Categorize weather data
    const temperature = data.main.temp;
    const weatherDescription = data.weather[0].description;
    const humidity = data.main.humidity;
    const windSpeed = data.wind.speed;
    const cityName = data.name;
    
    return {
      temperature,
      weatherDescription,
      humidity,
      windSpeed,
      cityName,
    };
  } catch (error) {
    console.error("Error fetching forecast data:", error);
    throw error;
  }
}
