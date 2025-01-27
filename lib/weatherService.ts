// lib/weatherService.ts
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

export async function getWeather() {
    try {
    console.log("Starting the weather service...");
    const apikey = process.env.OPENWEATHERMAP_API_KEY;
    console.log("API Key:", apikey); // Log the API key to check if it's set correctly
    const lat = 36.1627;
    const lon = 86.7816;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=bee76c71adbb1cc04d3bf0445c032ab3`;
    // const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=bee76c71adbb1cc04d3bf0445c032ab3`;
    // const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apikey}`;
    // const url = `http://api.openweathermap.org/geo/1.0/direct?q=Nashville&limit=2&appid=bee76c71adbb1cc04d3bf0445c032ab3`;

    const response = await fetch(url);
    if (!response.ok) {
        const errorDetails = await response.text(); // Get the error message from the server
        throw new Error(`Network response was not ok: ${response.status} - ${errorDetails}`);
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

// CHANGE TO THIS WHEN WE HAVE THE LOCATION

// function getUserLocation(): Promise<{ lat: number, lon: number }> {
//     return new Promise((resolve, reject) => {
//         if (navigator.geolocation) {
//             navigator.geolocation.getCurrentPosition(
//                 (position) => {
//                     resolve({
//                         lat: position.coords.latitude,
//                         lon: position.coords.longitude
//                     });
//                 },
//                 (error) => {
//                     reject(error);
//                 }
//             );
//         } else {
//             reject(new Error("Geolocation is not supported by this browser."));
//         }
//     });
// }

// export async function getWeather() {
//     try {
//         console.log("Starting the weather service...");
//         const apikey = process.env.OPENWEATHERMAP_API_KEY;
//         console.log("API Key:", apikey); // Log the API key to check if it's set correctly

//         const { lat, lon } = await getUserLocation();
//         console.log(`User's location: lat=${lat}, lon=${lon}`);

//         const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${apikey}`;
//         const response = await fetch(url);
//         if (!response.ok) {
//             const errorDetails = await response.text(); // Get the error message from the server
//             throw new Error(`Network response was not ok: ${response.status} - ${errorDetails}`);
//         }
//         const data = await response.json();
//         return data;
//     } catch (error) {
//         console.error("Error fetching forecast data:", error);
//         throw error;
//     }
// }