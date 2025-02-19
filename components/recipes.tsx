// components/Recipes.tsx

import { useEffect, useState } from "react";
import Image from "next/image";
import { getAuth } from "firebase/auth";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/auth/firebase";

type Recipe = {
  id: number;
  title: string;
  image: string;
  readyInMinutes?: number;
  servings?: number;
  sourceUrl?: string;
  summary?: string;
};

interface RecipesProps {
  geminiSuggestion?: string;
  selectedCity?: string | null;
  selectedState?: string | null;
  selectedMood?: string | null;
  selectedCookTime?: string | null;
}

const Recipes: React.FC<RecipesProps> = ({ geminiSuggestion }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedRecipe, setExpandedRecipe] = useState<number | null>(null);

  // New state for filters
  const [query, setQuery] = useState<string>('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [maxCookTime, setMaxCookTime] = useState<number | null>(null);
  const [shouldSearch, setShouldSearch] = useState(false);

  useEffect(() => {
    if (geminiSuggestion) {
      setQuery(geminiSuggestion);
      setShouldSearch(true);
    }
  }, [geminiSuggestion]);

  useEffect(() => {
    if (!shouldSearch) return;
    if (!query) return;

    const fetchRecipes = async () => {
      try {
        setLoading(true);
        // Build query parameters
        const params = new URLSearchParams({
          query: query,
          ...(dietaryRestrictions.length && { diet: dietaryRestrictions.join(',') }),
          ...(maxCookTime && { maxReadyTime: maxCookTime.toString() })
        });

        const response = await fetch(`/api/recipes?${params}`);
        if (!response.ok) {
          throw new Error("Failed to fetch recipes");
        }
        const data = await response.json();
        setRecipes(data.results || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
        setShouldSearch(false);
      }
    };

    fetchRecipes();
  }, [shouldSearch, query, dietaryRestrictions, maxCookTime]);

  const saveRecipe = async (recipe: Recipe) => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      const userRef = doc(db, "users", user.uid);
      try {
        await updateDoc(userRef, {
          savedRecipes: arrayUnion(recipe),
        });
        alert("Recipe saved!");
      } catch (error) {
        console.error("Error saving recipe: ", error);
        alert("Failed to save recipe.");
      }
    } else {
      alert("You need to be logged in to save recipes.");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShouldSearch(true);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!recipes || recipes.length === 0) return <div>No recipes found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Add search form */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search recipes..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Update Search'}
          </button>
        </div>
      </form>

      {/* Only show recipes section if we have results */}
      {recipes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="border rounded-lg overflow-hidden shadow-lg bg-white"
            >
              <div className="relative h-48 w-full">
                <Image
                  src={recipe.image}
                  alt={recipe.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-xl mb-2">{recipe.title}</h3>
                <div className="flex justify-between text-sm text-gray-600 mb-4">
                  {recipe.readyInMinutes && (
                    <span>⏱️ {recipe.readyInMinutes} mins</span>
                  )}
                  {recipe.servings && <span>👥 Serves {recipe.servings}</span>}
                </div>

                <button
                  onClick={() => setExpandedRecipe(expandedRecipe === recipe.id ? null : recipe.id)}
                  className="mb-2 text-blue-600 hover:text-blue-800"
                >
                  {expandedRecipe === recipe.id ? "Hide Details" : "Show Details"}
                </button>

                {expandedRecipe === recipe.id && recipe.summary && (
                  <div
                    className="mt-2 mb-4 text-sm text-gray-700"
                    dangerouslySetInnerHTML={{ __html: recipe.summary }}
                  />
                )}

                {recipe.sourceUrl && (
                  <a
                    href={recipe.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    View Full Recipe
                  </a>
                )}

                <button
                  onClick={() => saveRecipe(recipe)}
                  className="mt-2 ml-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                >
                  Save Recipe
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Recipes;