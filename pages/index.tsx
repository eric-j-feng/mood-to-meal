// import Image from "next/image";
import Link from "next/link";
import { Inter } from "next/font/google";
import client from "@/lib/mongodb";
import Recipes from "@/components/recipes";
import type { InferGetServerSidePropsType, GetServerSideProps } from "next";
import React, {useState} from 'react'
import MoodSelector from "@/components/MoodSelector";

type ConnectionStatus = {
  isConnected: boolean;
};

const inter = Inter({ subsets: ["latin"] });

export const getServerSideProps: GetServerSideProps<
  ConnectionStatus
> = async () => {
  try {
    await client.connect(); // `await client.connect()` will use the default database passed in the MONGODB_URI
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

  /* NEW STUFF ADDED!  */
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [showRecipes, setShowRecipes] = useState(false);


  const handleMoodSelect = (mood: string) => {
    setSelectedMood(mood); // Update the selected mood
    console.log("Mood selected:", mood); // Log the selected mood 
    // send to the backend here 
  };

  const handleSubmit = () => {
    setShowRecipes(true); // Show recipes when submit button is clicked
  };


  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between p-24 ${inter.className}`}
    >
      {!showRecipes ? (
        // Inputs and Button
        <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left">
          <h2 className="text-lg text-red-500">Welcome to Mood to Meal</h2>
          <h3>Set your preferences:</h3>
          <h4>Choose your primary mood:</h4>

          <MoodSelector onMoodSelect={handleMoodSelect} />
          {selectedMood && <p>You selected: {selectedMood}</p>}

          <h4>Weather:</h4>
          <h4>Dietary Restrictions:</h4>
          <h4>Cook Time:</h4>

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
          <h2 className="text-2xl font-semibold mb-4">Pasta Recipes</h2>
          <Recipes />
        </div>
      )}
    </main>
  );
  //   <main
  //     className={`flex min-h-screen flex-col items-center justify-between p-24 ${inter.className}`}
  //   >
  //     <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left">
  //       <h2 className="text-lg text-red-500">Welcome to Mood to Meal</h2>
  //       <h3>Set your preferences: </h3>
  //       <h4> Choose your primary mood: </h4>
      
  //       <MoodSelector onMoodSelect={handleMoodSelect} />
  //         {selectedMood && <p>You selected: {selectedMood}</p>}



  //       <h4> Weather: </h4>
  //       <h4> Dietary Restrictions: </h4>
  //       <h4> Cook Time: </h4>
  //     </div>


  //     {/* Submit Button */}
  //     <button
  //       onClick={handleSubmit}
  //       className="mt-4 px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition"
  //     >
  //       Submit
  //     </button>

  //     {/* Render Recipes Component Conditionally */}
  //     {showRecipes && (
  //       <div className="w-full max-w-5xl mt-8">
  //         <h2>Pasta Recipes</h2>
  //         <Recipes />
  //       </div>
  //     )}
  //   </main>
  // );

}
