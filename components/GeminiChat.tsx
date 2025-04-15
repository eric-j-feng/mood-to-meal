import { useState, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/auth/firebase";
import Recipes from "./recipes";
import MarkdownDisplay from "./MarkdownDisplay";

type WeatherData = {
  temperature: number;
  weatherDescription: string;
};

interface GeminiChatProps {
  selectedMood: string | null;
  weather: WeatherData | null;
  selectedCookTime?: string | null;
  selectedMealType?: string | null;
}

interface UserPreferences {
  dietaryRestrictions?: string[];
  cookingSkill?: string;
  utensils?: Record<string, number>;
}

interface UserRecipe {
  id: string;
  title: string;
  content: string;
  rating: number;
}

const GeminiChat: React.FC<GeminiChatProps> = ({
  selectedMood,
  weather,
  selectedCookTime,
  selectedMealType,
}) => {
  const [response, setResponse] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({});
  const [userRecipes, setUserRecipes] = useState<UserRecipe[]>([]);
  const [prompt, setPrompt] = useState<string>("");

  useEffect(() => {
    const fetchUserPreferences = async () => {
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const data = userSnap.data();
            setUserPreferences({
              dietaryRestrictions: data.preferences?.dietaryRestrictions || [],
              cookingSkill: data.preferences?.cookingSkill || "",
              utensils: data.preferences?.utensils || {},
            });
            setUserRecipes(data.savedRecipes || []);
          }
        } catch (error) {
          console.error("Error fetching user preferences:", error);
        }
      }
    };

    fetchUserPreferences();
  }, []);

  useEffect(() => {
    setPrompt(generatePrompt());
  }, [selectedMood, weather, selectedCookTime, selectedMealType, userPreferences, userRecipes]);

  const generatePrompt = () => {
    const dietaryConditions = userPreferences.dietaryRestrictions?.length
      ? [`Must be: ${userPreferences.dietaryRestrictions.join(", ")}`]
      : [];

    // Convert utensils object to array of strings with quantities
    const availableUtensils = userPreferences.utensils
      ? Object.entries(userPreferences.utensils)
          .filter(([_, quantity]) => quantity > 0)
          .map(([utensil, quantity]) => `${utensil} (${quantity})`)
      : [];

    const materialConditions = availableUtensils.length
      ? [`Available Utensils: ${availableUtensils.join(", ")}`]
      : [];

    const otherConditions = [
      selectedMood && `Mood: ${selectedMood}`,
      weather?.temperature && `Weather Temperature: ${weather.temperature}°F`,
      weather?.weatherDescription && `Weather Description: ${weather.weatherDescription}`,
      selectedCookTime && `Cook Time: ${selectedCookTime} minutes`,
      selectedMealType && `Type of Meal: ${selectedMealType}`,
      userPreferences.cookingSkill && `Cooking Skill: ${userPreferences.cookingSkill}`,
    ].filter(Boolean);

    const recipeRatings = userRecipes.length
      ? `User's Recipe Ratings:\n${userRecipes
          .map((recipe) => `- ${recipe.title}: ${recipe.rating} stars`)
          .join("\n")}`
      : "No previous recipe ratings.";

    return `Generate a recipe that matches these requirements:

Dietary Constraints:
------------------
${dietaryConditions.length ? dietaryConditions.join("\n") : "None specified"}

Material Constraints:
------------------
${materialConditions.length ? materialConditions.join("\n") : "None specified"}
Note: Only suggest recipes that can be made with the available utensils listed above.

Other Constraints:
------------------
${otherConditions.length ? otherConditions.join("\n") : "None specified"}

${recipeRatings}

Recipe Guidelines:
------------------
- For happy/energetic moods: Create vibrant, fresh recipes
- For tired/stressed moods: Create simple, comforting recipes
- For sad moods: Create cozy, uplifting recipes
- For cold/rainy weather: Create warm, hearty recipes
- For hot/sunny weather: Create light, refreshing recipes
- Consider both mood and weather for balance
- Use past ratings to inform the suggestion

Format:
Recipe name (do not include the words "Recipe name" in the output)
Description
Ingredients
Instructions

Tags:
Choose from: Breakfast, Lunch, Dinner, Snack, Vegetarian, Vegan, Gluten-Free, Low-Carb, High-Protein, Comfort Food, Spicy, Sweet, Keto, Paleo, Healthy, Quick, Italian, Asian, Mexican, American

End the recipe with:
TAGS: Tag1, Tag2, Tag3

Important: Only suggest recipes that can be made with the available utensils. Do not include any analysis of the weather or mood in the output.`;
  };

  const generateResponse = async () => {
    try {
      setLoading(true);
      setError("");

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
      if (!apiKey) {
        throw new Error("API key not found");
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      setResponse(text);
    } catch (err) {
      setError("Error generating response: " + (err as Error).message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const modifyRecipe = async (modificationRequest: string) => {
    try {
      setLoading(true);
      setError("");

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
      if (!apiKey) {
        throw new Error("API key not found");
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const modResult = await model.generateContent(
        `Modify the following recipe according to this request: ${modificationRequest}

Original recipe:
${response}

Important formatting instructions:
1. Start directly with the recipe name (no introductory text)
2. Follow with Description, Ingredients, and Instructions sections
3. End with TAGS section
4. Do not include any conversational text or acknowledgments
5. Keep the same format as the original recipe
6. Do not include phrases like "here's the modified recipe" or "okay"

Format:
Recipe name (do not include the words "Recipe name" in the output)
Description
Ingredients
Instructions

End with:
TAGS: Tag1, Tag2, Tag3`
      );
      const modifiedText = modResult.response.text();
      setResponse(modifiedText);
    } catch (err) {
      setError("Error modifying recipe: " + (err as Error).message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <button
        onClick={generateResponse}
        className="bg-blue-500 text-white px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? "Generating..." : "Get Meal Suggestion"}
      </button>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      {response && (
        <div className="mt-4">
          <Recipes 
            geminiSuggestion={response}
            modifyRecipe={modifyRecipe}
            selectedCity={null}
            selectedState={null}
            selectedMood={selectedMood}
            selectedCookTime={selectedCookTime ?? null}
          />
        </div>
      )}
    </div>
  );
};

export default GeminiChat;
