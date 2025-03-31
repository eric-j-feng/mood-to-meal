// components/SavedRecipes.tsx

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";
import { db } from "@/auth/firebase";
import MarkdownDisplay from "./MarkdownDisplay";
import React from "react";
import { useRouter } from "next/router";

type Recipe = {
  id: string;
  title: string;
  content: string;
  rating: number;
};

interface SavedRecipe {
  id: string;
  title: string;
  content: string;
  ingredients: string; // Added ingredients property
}

interface SavedRecipesProps {
  recipes: SavedRecipe[];
  setRecipes: React.Dispatch<React.SetStateAction<SavedRecipe[]>>;
}

const SavedRecipes: React.FC<SavedRecipesProps> = ({ recipes, setRecipes }) => {
  const router = useRouter();

  const handleViewShoppingList = (ingredients: string) => {
    router.push({
      pathname: "/ShoppingListPage",
      query: { ingredients },
    });
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [newRating, setNewRating] = useState<number | null>(null);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);

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
            const sortedRecipes = (userData.savedRecipes || []).sort((a: Recipe, b: Recipe) => b.rating - a.rating);
            setRecipes(sortedRecipes || []);
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

  const removeRecipe = async (recipe: SavedRecipe) => {
      if (userId) {
        const userRef = doc(db, "users", userId);
        try {
          await updateDoc(userRef, {
            savedRecipes: arrayRemove({ ...recipe, rating: 0 }),
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

  const updateRating = async (recipeId: string) => {
    if (userId && newRating !== null) {
      const userRef = doc(db, "users", userId);
      try {
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const updatedRecipes = userData.savedRecipes.map((recipe: Recipe) =>
            recipe.id === recipeId ? { ...recipe, rating: newRating } : recipe
          );

          await updateDoc(userRef, {
            savedRecipes: updatedRecipes,
          });

          const sortedRecipes = (updatedRecipes || []).sort((a: Recipe, b: Recipe) => b.rating - a.rating);

          setRecipes(sortedRecipes);
          setEditingRecipeId(null);
          setNewRating(null);
        }
      } catch (error) {
        console.error("Error updating rating: ", error);
        alert("Failed to update rating.");
      }
    }
  };

  const addRecipe = (newRecipe: any) => {
    setRecipes((prevRecipes) => [...prevRecipes, newRecipe]);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!recipes || recipes.length === 0)
    return <div>No saved recipes found</div>;

  return (
    <div>
      {recipes.map((recipe) => (
        <div key={recipe.id} className="border rounded-lg p-4 mb-4 shadow">
          <h3 className="text-lg font-bold">{recipe.title}</h3>
          <p className="text-gray-700 mt-2">{recipe.content.substring(0, 100)}...</p>

          {/* Buttons for each recipe */}
          <div className="flex gap-4 mt-4">
            {/* View Shopping List Button */}
            <button
              onClick={() => handleViewShoppingList(recipe.ingredients)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              View Shopping List
            </button>

            {/* Remove Recipe Button */}
            <button
              onClick={() => removeRecipe(recipe)}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              Remove Recipe
            </button>

            {/* Update Rating Button */}
            {editingRecipeId === recipe.id ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={newRating || ""}
                  onChange={(e) => setNewRating(Number(e.target.value))}
                  className="w-16 p-1 border rounded"
                />
                <button
                  onClick={() => updateRating(recipe.id)}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                >
                  Save Rating
                </button>
                <button
                  onClick={() => setEditingRecipeId(null)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingRecipeId(recipe.id)}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
              >
                Update Rating
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const ParentComponent: React.FC = () => {
  const [recipes, setRecipes] = useState<any[]>([]);

  return <SavedRecipes recipes={recipes} setRecipes={setRecipes} />;
};

export default SavedRecipes;
