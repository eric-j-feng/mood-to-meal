// components/SavedRecipes.tsx

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";
import { db } from "@/auth/firebase";
import MarkdownDisplay from "./MarkdownDisplay";
import React from "react";
import { useRouter } from "next/router";

const tagColorMap: { [key: string]: string } = {
  Breakfast: "bg-yellow-100 text-yellow-800",
  Lunch: "bg-blue-100 text-blue-800",
  Dinner: "bg-purple-100 text-purple-800",
  Snack: "bg-pink-100 text-pink-800",
  Vegetarian: "bg-green-100 text-green-800",
  Vegan: "bg-emerald-100 text-emerald-800",
  "Gluten-Free": "bg-orange-100 text-orange-800",
  "Low-Carb": "bg-lime-100 text-lime-800",
  "High-Protein": "bg-indigo-100 text-indigo-800",
  "Comfort Food": "bg-rose-100 text-rose-800",
  Spicy: "bg-red-100 text-red-800",
  Sweet: "bg-pink-200 text-pink-900",
  Keto: "bg-yellow-200 text-yellow-900",
  Paleo: "bg-amber-100 text-amber-800",
  Healthy: "bg-teal-100 text-teal-800",
  Quick: "bg-sky-100 text-sky-800",
  Italian: "bg-green-200 text-green-900",
  Asian: "bg-orange-200 text-orange-900",
  Mexican: "bg-red-200 text-red-900",
  American: "bg-blue-200 text-blue-900",
};

// Define allTagOptions as a static array of strings
const allTagOptions = ["Breakfast", "Lunch", "Dinner", "Snack",
  "Vegetarian", "Vegan", "Gluten-Free", "Low-Carb",
  "High-Protein", "Comfort Food", "Spicy", "Sweet",
  "Keto", "Paleo", "Healthy", "Quick",
  "Italian", "Asian", "Mexican", "American"];

type Recipe = {
  id: string;
  title: string;
  content: string;
  rating: number;
  tags?: string[];
  cleanedIngredients?: string;
};

export interface SavedRecipe {
  id: string;
  title: string;
  description: string;
  content: string; // Added content property
  tags: string[]; // Assuming tags is an array of strings
  rating: number; // Added rating property
  cleanedIngredients?: string;
}

interface SavedRecipesProps {
  recipes: SavedRecipe[];
  setRecipes: React.Dispatch<React.SetStateAction<SavedRecipe[]>>;
}

const SavedRecipes: React.FC<SavedRecipesProps> = ({ recipes, setRecipes }) => {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [newRating, setNewRating] = useState<number | null>(null);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filterVisible, setFilterVisible] = useState(false);

  const cleanIngredients = (content: string) => {
    const ingredientsStart = content.toLowerCase().indexOf("ingredients");
    const instructionsStart = content.toLowerCase().indexOf("instructions");
    if (ingredientsStart !== -1 && instructionsStart !== -1 && instructionsStart > ingredientsStart) {
      return content
        .substring(ingredientsStart + "ingredients".length, instructionsStart) // Extract text after "Ingredients"
        .split("\n")
        .map((line) => line.trim())
        .filter(
          (line) =>
            line && // Exclude empty lines
            line.toLowerCase() !== "ingredients" && // Exclude "Ingredients" header
            line !== "**" && // Exclude unwanted markers
            line !== ":**" &&
            !line.toLowerCase().startsWith("equipment") // Exclude "Equipment" lines
        )
        .map((line) => line.replace(/^\*\s*/, "")) // Remove leading "* " from each line
        .join("\n");
    }
    return "";
  };

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
            const processedRecipes = (userData.savedRecipes || []).map((recipe: Recipe) => {
              if (!recipe.content) {
                return { ...recipe, tags: [], cleanedIngredients: "" };
              }

              const cleanedIngredients = cleanIngredients(recipe.content);

              if (!recipe.tags || recipe.tags.length === 0) {
                const lower = recipe.content.toLowerCase();
                const inferredTags: string[] = [];
                if (lower.includes("breakfast")) inferredTags.push("Breakfast");
                if (lower.includes("lunch")) inferredTags.push("Lunch");
                if (lower.includes("dinner")) inferredTags.push("Dinner");
                if (lower.includes("snack")) inferredTags.push("Snack");
                if (lower.includes("vegetarian")) inferredTags.push("Vegetarian");
                if (lower.includes("vegan")) inferredTags.push("Vegan");
                if (lower.includes("gluten-free")) inferredTags.push("Gluten-Free");
                return { ...recipe, tags: inferredTags, cleanedIngredients };
              }
              return { ...recipe, cleanedIngredients };
            });
            const sortedRecipes = processedRecipes.sort((a: Recipe, b: Recipe) => b.rating - a.rating);
            setRecipes(sortedRecipes);
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
  const filteredRecipes = recipes.filter((recipe) => {
    if (selectedTags.length === 0) return true;
    return selectedTags.every((tag) => recipe.tags?.includes(tag));
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <button
        onClick={() => setFilterVisible(!filterVisible)}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
      >
        {filterVisible ? "Hide Filters" : "Filter Recipes"}
      </button>

      {filterVisible && (
        <div className="mb-6 bg-gray-100 p-4 rounded shadow">
          <div className="flex flex-wrap gap-4">
            {allTagOptions.map((tag: string) => (
              <label key={tag} className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag)}
                  onChange={() => {
                    setSelectedTags((prev) =>
                      prev.includes(tag)
                        ? prev.filter((t) => t !== tag)
                        : [...prev, tag]
                    );
                  }}
                  className="mr-2"
                />
                {tag}
              </label>
            ))}
          </div>
        </div>
      )}

      {filteredRecipes.length === 0 ? (
        <div className="text-center text-gray-500 mt-6">No saved recipes found</div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredRecipes.map((recipe) => (
            <div
              key={recipe.id}
              className="border rounded-lg overflow-hidden shadow-lg bg-white"
            >
              <div className="p-4">
                <h3 className="font-bold text-xl mb-2">{recipe.title}</h3>

                {recipe.tags && recipe.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {recipe.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`text-xs font-medium px-2 py-1 rounded-full ${tagColorMap[tag] || "bg-gray-200 text-gray-700"}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Toggle Content Button */}
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

                {/* Recipe Content */}
                {expandedRecipe === recipe.id && (
                  <div className="mt-4 mb-4">
                    <MarkdownDisplay content={recipe.content} />
                  </div>
                )}

                {/* Recipe Rating */}
                <div>
                  {recipe.rating === 0 ? "Current Rating: Not Set" : `Current Rating: ${recipe.rating}/5`}
                  <br />
                  {editingRecipeId === recipe.id ? (
                    <>
                      <select
                        value={newRating ?? recipe.rating}
                        onChange={(e) => setNewRating(Number(e.target.value))}
                        className="mt-2 px-2 py-1 border rounded"
                      >
                        {[0, 1, 2, 3, 4, 5].map((num) => (
                          <option key={num} value={num}>
                            {num}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => updateRating(recipe.id)}
                        className="ml-2 px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                      >
                        Save
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditingRecipeId(recipe.id)}
                      className="mt-2 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      Edit Rating
                    </button>
                  )}
                </div>

                {/* View Shopping List Button */}
                <button
                  onClick={() => router.push(`/ShoppingListPage?recipeId=${recipe.id}`)}
                  className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                >
                  View Shopping List
                </button>

                {/* Remove Recipe Button */}
                <> </>
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
      )}
    </div>
  );
};

const ParentComponent: React.FC = () => {
  const [recipes, setRecipes] = useState<any[]>([]);

  return <SavedRecipes recipes={recipes} setRecipes={setRecipes} />;
};

export default SavedRecipes;
