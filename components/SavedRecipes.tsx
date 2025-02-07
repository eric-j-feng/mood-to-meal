// components/SavedRecipes.tsx

import { useEffect, useState } from "react";
import Image from "next/image";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";
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

const SavedRecipes: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [expandedRecipe, setExpandedRecipe] = useState<number | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        setError("You need to be logged in to view saved recipes.");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchSavedRecipes = async () => {
      if (userId) {
        const userRef = doc(db, "users", userId);
        try {
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setRecipes(userData.savedRecipes || []);
          } else {
            setRecipes([]);
          }
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchSavedRecipes();
  }, [userId]);

  const removeRecipe = async (recipe: Recipe) => {
    if (userId) {
      const userRef = doc(db, "users", userId);
      try {
        await updateDoc(userRef, {
          savedRecipes: arrayRemove(recipe),
        });
        setRecipes((prevRecipes) =>
          prevRecipes.filter((r) => r.id !== recipe.id)
        );
        alert("Recipe removed!");
      } catch (error) {
        console.error("Error removing recipe: ", error);
        alert("Failed to remove recipe.");
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!recipes || recipes.length === 0)
    return <div>No saved recipes found</div>;

  return (
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

            {/* Toggle Summary Button */}
            <button
              onClick={() =>
                setExpandedRecipe(
                  expandedRecipe === recipe.id ? null : recipe.id
                )
              }
              className="mb-2 text-blue-600 hover:text-blue-800"
            >
              {expandedRecipe === recipe.id ? "Hide Details" : "Show Details"}
            </button>

            {/* Recipe Summary */}
            {expandedRecipe === recipe.id && recipe.summary && (
              <div
                className="mt-2 mb-4 text-sm text-gray-700"
                dangerouslySetInnerHTML={{ __html: recipe.summary }}
              />
            )}

            {/* Full Recipe Link */}
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

            {/* Remove Recipe Button */}
            <button
              onClick={() => removeRecipe(recipe)}
              className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SavedRecipes;
