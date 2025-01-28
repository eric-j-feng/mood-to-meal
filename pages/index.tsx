import Link from "next/link";
import { Inter } from "next/font/google";
import client from "@/lib/mongodb";
import Recipes from "@/components/recipes";
import type { InferGetServerSidePropsType, GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import { getWeather } from "../lib/weatherService";
import dotenv from "dotenv";
import CitySelector from "@/components/CitySelector";
import StateSelector from "@/components/StateSelector";
import CookTimeSelector from "@/components/CookTimeSelector";
import MoodSelector from "@/components/MoodSelector";
import DietarySelector from "@/components/DietarySelector"; // Import DietarySelector

dotenv.config({ path: ".env.local" });

type ConnectionStatus = {
  isConnected: boolean;
};

const inter = Inter({ subsets: ["latin"] });

export const getServerSideProps: GetServerSideProps<
  ConnectionStatus
> = async () => {
  try {
    await client.connect();
    return {
      props: { isConnected: true },
    };
  } catch (e) {
    console.error(e);
    return {
      props: { isConnected: false },
    };
  }
};

export default function Home({
  isConnected,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  type WeatherData = {
    temperature: number;
    weatherDescription: string;
    humidity: number;
    windSpeed: number;
    cityName: string;
  };

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedCookTime, setSelectedCookTime] = useState<string | null>(null);
  const [showRecipes, setShowRecipes] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]); // State for dietary restrictions

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    console.log("City selected:", city);
  };

  const handleStateSelect = (state: string) => {
    setSelectedState(state);
    console.log("State selected:", state);
  };

  const handleCookTimeSelect = (cookTime: string) => {
    setSelectedCookTime(cookTime);
    console.log("Cook Time selected:", cookTime);
  };

  const handleMoodSelect = (mood: string) => {
    setSelectedMood(mood); // Update the selected mood
    console.log("Mood selected:", mood); // Log the selected mood
    // send to the backend here
  };

  const handleDietaryChange = (restrictions: string[]) => {
    setDietaryRestrictions(restrictions);
    console.log("Dietary restrictions selected:", restrictions);
  };

  const handleSubmit = () => {
    setShowRecipes(true);
  };

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const data = await getWeather();
        setWeather(data);
      } catch (error) {
        console.error("Error fetching weather:", error);
      }
    };

    fetchWeather();
  });

  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between p-24 ${inter.className}`}
    >
      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left">
        <h2>Welcome to Mood to Meal</h2>
        <h3>Set your preferences: </h3>
        <h4> Mood: </h4>
        {weather ? (
          <div>
            <h4>Weather in {weather.cityName}:</h4>
            <p>Temperature: {weather.temperature}°F</p>
            <p>Description: {weather.weatherDescription}</p>
            <p>Humidity: {weather.humidity}%</p>
            <p>Wind Speed: {weather.windSpeed} m/s</p>
          </div>
        ) : (
          <h4>Loading weather data...</h4>
        )}
      </div>

      {!showRecipes ? (
        // Inputs and Button
        <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left">
          <h2 className="text-lg text-red-500">Welcome to Mood to Meal</h2>
          <h3>Set your preferences:</h3>

          <h4>Choose your primary mood:</h4>

          <MoodSelector onMoodSelect={handleMoodSelect} />
          {selectedMood && <p>You selected: {selectedMood}</p>}

          {weather ? (
            <div>
              <h4>Weather in {weather.cityName}:</h4>
              <p>Temperature: {weather.temperature}°F</p>
              <p>Description: {weather.weatherDescription}</p>
              <p>Humidity: {weather.humidity}%</p>
              <p>Wind Speed: {weather.windSpeed} m/s</p>
            </div>
          ) : (
            <h4>Loading weather data...</h4>
          )}
          <h4>Dietary Restrictions:</h4>
          <DietarySelector
            selectedRestrictions={dietaryRestrictions}
            onChange={handleDietaryChange}
          />
          {dietaryRestrictions.length > 0 && (
            <p>You selected: {dietaryRestrictions.join(", ")}</p>
          )}

          <h4>Cook Time:</h4>
          {/* City Selector */}
          <h4>Enter your city:</h4>
          <CitySelector city={selectedCity} setCity={handleCitySelect} />
          {selectedCity && <p>You selected: {selectedCity}</p>}

          {/* State Selector */}
          <h4>Enter your state:</h4>
          <StateSelector state={selectedState} setState={handleStateSelect} />
          {selectedState && <p>You selected: {selectedState}</p>}

          {/* Cook Time Selector */}
          <h4>Enter your cook time (in minutes):</h4>
          <CookTimeSelector
            cookTime={selectedCookTime}
            setCookTime={handleCookTimeSelect}
          />
          {selectedCookTime && <p>You selected: {selectedCookTime} minutes</p>}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            className="mt-4 px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition"
          >
            Submit
          </button>
        </div>
      ) : (
        // Recipes Section
        <div className="w-full max-w-5xl mt-8">
          <h2 className="text-2xl font-semibold mb-4">
            Recipes Based on Your Preferences
          </h2>
          <p>
            <strong>City:</strong> {selectedCity || "Not selected"}
          </p>
          <p>
            <strong>State:</strong> {selectedState || "Not selected"}
          </p>
          <p>
            <strong>Cook Time:</strong> {selectedCookTime || "Not selected"}{" "}
            minutes
          </p>
          <p>
            <strong>Dietary Restrictions:</strong>{" "}
            {dietaryRestrictions.length > 0
              ? dietaryRestrictions.join(", ")
              : "None"}
          </p>

          <h2 className="text-2xl font-semibold mb-4">Pasta Recipes</h2>
          <Recipes />
        </div>
      )}
    </main>
  );
}
