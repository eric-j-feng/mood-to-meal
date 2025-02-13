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
import GeminiChat from "@/components/GeminiChat";
import Onboarding from "@/components/Onboarding";
import { auth } from "@/auth/firebase"; // Import Firebase auth
import { getAuth, signOut, onAuthStateChanged } from "@firebase/auth";
import { useRouter } from "next/router";
import { app } from "@/auth/firebase";

dotenv.config({ path: ".env.local" });

// type ConnectionStatus = {
//   isConnected: boolean;
// };

const inter = Inter({ subsets: ["latin"] });

// export const getServerSideProps: GetServerSideProps<
//   ConnectionStatus
// > = async () => {
//   try {
//     await client.connect();
//     return {
//       props: { isConnected: true },
//     };
//   } catch (e) {
//     console.error(e);
//     return {
//       props: { isConnected: false },
//     };
//   }
// };

// export default function Main({
//   isConnected,
// }: InferGetServerSidePropsType<typeof getServerSideProps>) {

const Main = () => {

  type WeatherData = {
    temperature: number;
    weatherDescription: string;
    humidity: number;
    windSpeed: number;
    cityName: string;
  };

   const auth = getAuth(app);
      const router = useRouter();
      const [user, setUser] = useState(null);
  
      useEffect(()=>{
          const unsubscribe = onAuthStateChanged(auth, (user)=>{
              if(user){
                  setUser(user)
              } else{
                  router.push("/")
              }
          });
  
          return () => unsubscribe();
  
      }, [auth, router])
  
      const handleLogOut = async () => {
          try{
              await signOut(auth);
              router.push("/")
          } catch (error: any){
              console.log("error: ", error.message)
          }
      };


  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(true);

  // Recipe search states
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedCookTime, setSelectedCookTime] = useState<string | null>(null);
  const [showRecipes, setShowRecipes] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]); // State for dietary restrictions
  const [userId, setUserId] = useState<string | null>(null); // State for user ID

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

  const handleOnboardingComplete = (preferences: {
    dietaryRestrictions: string[];
    cookingSkill: string;
  }) => {
    setShowOnboarding(false);
  };

  const handleSubmit = () => {
    setShowRecipes(true);
  };

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        let weatherData;
        
        // First trying to get weather using geolocation
        try {
          weatherData = await getWeather(null, null, true);
        } catch (geoError) {
          console.log("Geolocation failed, falling back to city/state:", geoError);
          // Fall back to city/state if geolocation fails
          if (selectedCity && selectedState) {
            weatherData = await getWeather(selectedCity, selectedState, false);
          } else {
            console.log("City and state not selected");
            return;
          }
        }

        if (weatherData) {
          setWeather(weatherData);
        }
      } catch (error) {
        console.error("Error fetching weather:", error);
      }
    };
    
    fetchWeather();
  }, [selectedCity, selectedState]);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        {
          /* Useful print statement for debugging*/
        }
        console.log("User ID:", user.uid);
      } else {
        setUserId(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <main
      className={`flex flex-col items-center min-h-screen p-8 ${inter.className}`}
    >
      {showOnboarding ? (
        <Onboarding onComplete={handleOnboardingComplete} />
      ) : (
        <>
          {/* Header */}
          <button onClick={handleLogOut}>
                    LOG OUT 
          </button>

          <header className="w-full max-w-5xl text-center mb-12">
            <h1 className="text-4xl font-bold text-blue-600 mb-4">
              Mood to Meal
            </h1>
            <p className="text-gray-700 text-lg">
              Select your mood and preferences to discover tailored recipes.
            </p>
            {userId && (
              <p className="text-gray-700 text-lg">User ID: {userId}</p>
            )}
          </header>

          {/* All input selection */}
          {!showRecipes ? (
            <div className="w-full max-w-5xl bg-white shadow-lg rounded-2xl p-6 mb-8">
              {/* Mood Selection */}
              <div className="bg-white shadow-lg rounded-2xl p-6 mb-8">
                <h4 className="text-xl font-semibold text-gray-800 mb-2">
                  Choose your primary mood:
                </h4>
                <MoodSelector onMoodSelect={handleMoodSelect} />
              </div>

              {/* City & State Selector */}
              <div className="bg-white shadow-lg rounded-2xl p-6 mb-8">
                <h4 className="text-xl font-semibold text-gray-800 mb-4">
                  Enter your city and state:
                </h4>
                <CitySelector city={selectedCity} setCity={handleCitySelect} />
                {selectedCity && (
                  <p className="mt-4 text-gray-800">
                    Your City: {selectedCity}
                  </p>
                )}

                <StateSelector
                  state={selectedState}
                  setState={handleStateSelect}
                />
                {selectedState && (
                  <p className="mt-4 text-gray-800">
                    Your State: {selectedState}
                  </p>
                )}
              </div>

              {/* Weather Selection */}
              {weather ? (
                <div className="bg-white shadow-lg rounded-2xl p-6 mb-8">
                  {/* <h4 className="text-xl font-semibold text-gray-800 mb-2">Weather in Nashville{weather.cityName}:</h4> */}
                  <h4 className="text-xl font-semibold text-gray-800 mb-2">
                    {" "}
                    Weather in {weather.cityName}
                  </h4>
                  <p className="text-gray-600">
                    Temperature: {weather.temperature}°F
                  </p>
                  <p className="text-gray-600">
                    Description: {weather.weatherDescription}
                  </p>
                  <p className="text-gray-600">Humidity: {weather.humidity}%</p>
                  <p className="text-gray-600">
                    Wind Speed: {weather.windSpeed} m/s
                  </p>
                </div>
              ) : (
                <h4 className="bg-white shadow-lg rounded-2xl p-6 mb-8">
                  Enter City and State to get Weather data
                </h4>
              )}

              {/* Dietary Selection */}
              <div className="bg-white shadow-lg rounded-2xl p-6 mb-8">
                <h4 className="text-xl font-semibold text-gray-800 mb-4">
                  Dietary Restrictions:
                </h4>
                <DietarySelector
                  selectedRestrictions={dietaryRestrictions}
                  onChange={handleDietaryChange}
                />
                {dietaryRestrictions.length > 0 && (
                  <p className="mt-4 text-green-600">
                    You selected: {dietaryRestrictions.join(", ")}
                  </p>
                )}
              </div>

              {/* Cook Time Selector */}
              <div className="bg-white shadow-lg rounded-2xl p-6 mb-8">
                <h4 className="text-xl font-semibold text-gray-800 mb-4">
                  Cook Time:
                </h4>
                <h4>Enter your cook time (in minutes):</h4>
                <CookTimeSelector
                  cookTime={selectedCookTime}
                  setCookTime={handleCookTimeSelect}
                />
                {selectedCookTime && (
                  <p>Your Cook Time: {selectedCookTime} minutes</p>
                )}
              </div>

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
        </>
      )}

      <div className="w-full max-w-5xl">
        <h2 className="text-2xl font-semibold mb-4">Pasta Recipes</h2>
        <Recipes />
      </div>

      {/* Add GeminiChat at the bottom */}
      <div className="w-full max-w-5xl mt-8">
        <h2 className="text-2xl font-semibold mb-4">AI Meal Suggestions</h2>
        <GeminiChat selectedMood={selectedMood} weather={weather} />
      </div>
    </main>
  );
};



export default Main;