import { useState } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import Recipes from './recipes';

type WeatherData = {
  temperature: number;
  weatherDescription: string;
};

interface GeminiChatProps {
  selectedMood: string | null;
  weather: WeatherData | null;
}

const GeminiChat: React.FC<GeminiChatProps> = ({ selectedMood, weather }) => {
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const generateResponse = async () => {
    try {
      setLoading(true);
      setError('');
      
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
      if (!apiKey) {
        throw new Error('API key not found');
      }

      const prompt = `A user wants cooking ideas based on their mood and current weather conditions. Your task is to generate a short, natural-language cooking suggestion that aligns with these factors. The output should be concise, appetizing, and relevant to the mood and weather.

Current conditions:
- Mood: ${selectedMood || 'Not specified'}
- Temperature: ${weather?.temperature || 'Not available'}°F
- Weather: ${weather?.weatherDescription || 'Not available'}

If the user is feeling happy/energetic, suggest vibrant, fresh, or exciting recipes.
If the user is tired or stressed, suggest comforting, simple, or nourishing meals.
If the user is sad or down, suggest cozy, uplifting, or nostalgic dishes.
If the weather is cold/rainy, suggest warm, hearty, or soothing meals.
If the weather is hot/sunny, suggest light, refreshing, or hydrating dishes.
Combine mood and weather for a well-balanced suggestion.

Please suggest a suitable meal. Only output the recipe name, keep it to one or two words about food only.
`;
      
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

  return (
    <div className="p-4">
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
          <div className="p-4 bg-gray-100 rounded">
            <p>Suggested meal: {response}</p>
          </div>
          <div className="mt-4">
            <Recipes geminiSuggestion={response} />
          </div>
        </div>
      )}
    </div>
  );
};

export default GeminiChat; 