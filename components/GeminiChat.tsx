import { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/auth/firebase";
import Recipes from './recipes';
import MarkdownDisplay from './MarkdownDisplay';

type WeatherData = {
  temperature: number;
  weatherDescription: string;
};

interface GeminiChatProps {
  selectedMood: string | null;
  weather: WeatherData | null;
  selectedCookTime?: string | null;
}

interface UserPreferences {
  dietaryRestrictions?: string[];
  cookingSkill?: string;
  cookingUtensils?: string[];
}

const GeminiChat: React.FC<GeminiChatProps> = ({ 
  selectedMood, 
  weather,
  selectedCookTime,
}) => {
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showPrompt, setShowPrompt] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({});
  const [prompt, setPrompt] = useState<string>('');

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
            setUserPreferences(data.preferences || {});
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
  }, [selectedMood, weather, selectedCookTime, userPreferences]);

  const generatePrompt = () => {
    const dietaryConditions = userPreferences.dietaryRestrictions?.length ? 
      [`Must be: ${userPreferences.dietaryRestrictions.join(', ')}`] : [];

    const materialConditions = userPreferences.cookingUtensils?.length ? 
      [`Cooking Utensils: ${userPreferences.cookingUtensils.join(', ')}`] : [];

    const otherConditions = [
      selectedMood && `Mood: ${selectedMood}`,
      weather?.temperature && `Weather Temperature: ${weather.temperature}°F`,
      weather?.weatherDescription && `Weather Description: ${weather.weatherDescription}`,
      selectedCookTime && `Cook Time: ${selectedCookTime} minutes`,
      userPreferences.cookingSkill && `Cooking Skill: ${userPreferences.cookingSkill}`
    ].filter(Boolean);

    return `A user wants a recipe based on their mood and current weather conditions. Your task is to generate a recipe that aligns with the following criteria:

Dietary Constraints:
------------------
${dietaryConditions.length ? dietaryConditions.join('\n') : 'None specified'}

Material Constraints:
------------------
${materialConditions.length ? materialConditions.join('\n') : 'None specified'}

Other Constraints:
------------------
${otherConditions.length ? otherConditions.join('\n') : 'None specified'}

If the user is feeling happy/energetic, generate vibrant, fresh, or exciting recipes.
If the user is tired or stressed, generate comforting, simple, or nourishing meals.
If the user is sad or down, generate cozy, uplifting, or nostalgic dishes.
If the weather is cold/rainy, generate warm, hearty, or soothing meals.
If the weather is hot/sunny, generate light, refreshing, or hydrating dishes.
If some criteria are not specified, ignore them.
Combine mood and weather for a well-balanced suggestion.

Generate a recipe. Do not speak in a conversational tone.`;
  };

  const generateResponse = async () => {
    try {
      setLoading(true);
      setError('');
      
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
      if (!apiKey) {
        throw new Error('API key not found');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      setResponse(text);
    } catch (err) {
      setError('Error generating response: ' + (err as Error).message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const modifyRecipe = async (modificationRequest: string) => {
    try {
      setLoading(true);
      setError('');

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
      if (!apiKey) {
        throw new Error('API key not found');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const modResult = await model.generateContent(`Modify the following recipe:\n\n${response}\n\nModification request: ${modificationRequest}`);
      const modifiedText = modResult.response.text();
      setResponse(modifiedText);
    } catch (err) {
      setError('Error modifying recipe: ' + (err as Error).message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <button
          onClick={() => setShowPrompt(!showPrompt)}
          className="text-blue-500 hover:text-blue-700 underline mb-2"
        >
          {showPrompt ? 'Hide Prompt' : 'Show Prompt'}
        </button>
        
        {showPrompt && (
          <div className="bg-gray-100 p-4 rounded-lg whitespace-pre-wrap font-mono text-sm">
            {prompt}
          </div>
        )}
      </div>

      <button
        onClick={generateResponse}
        className="bg-blue-500 text-white px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Get Meal Suggestion'}
      </button>

      {error && <p className="text-red-500 mt-2">{error}</p>}
      
      {response && (
        <div className="mt-4">
          <Recipes 
            geminiSuggestion={response}
            modifyRecipe={modifyRecipe}
          />
        </div>
      )}
    </div>
  );
};

export default GeminiChat; 