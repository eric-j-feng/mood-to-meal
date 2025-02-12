// components/Recipes.tsx

import { useEffect, useState } from "react";
import Image from "next/image";
import { getAuth } from "firebase/auth";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/auth/firebase";
import SearchFilters from "./SearchFilters";

type Recipe = {
  id: number;
  title: string;
  image: string;
  readyInMinutes?: number;
  servings?: number;
  sourceUrl?: string;
  summary?: string;
};

const Recipes: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedRecipe, setExpandedRecipe] = useState<number | null>(null);
  
  // New state for filters
  const [query, setQuery] = useState<string>('pasta');
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [maxCookTime, setMaxCookTime] = useState<number | null>(null);

  useEffect(() => {
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
      }
    };

    // Add debounce to prevent too many API calls
    const timeoutId = setTimeout(() => {
      fetchRecipes();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query, dietaryRestrictions, maxCookTime]);

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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!recipes || recipes.length === 0) return <div>No recipes found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4">
      <SearchFilters
        query={query}
        setQuery={setQuery}
        dietaryRestrictions={dietaryRestrictions}
        setDietaryRestrictions={setDietaryRestrictions}
        maxCookTime={maxCookTime}
        setMaxCookTime={setMaxCookTime}
      />
      {/* Render recipes */}
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
              {/* Add more recipe details here */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recipes;