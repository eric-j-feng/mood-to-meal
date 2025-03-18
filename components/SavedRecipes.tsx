// components/SavedRecipes.tsx

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";
import { db } from "@/auth/firebase";
import MarkdownDisplay from "./MarkdownDisplay";

type Recipe = {
  id: string;
  title: string;
  content: string;
  rating: number;
};

const SavedRecipes: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
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


  // const updateRating = async (recipeId: string, rating: number) => {
  //   if (userId) {
  //     const userRef = doc(db, "users", userId);
  //     try {
  //       const updatedRecipes = recipes.map((recipe) =>
  //         recipe.id === recipeId ? { ...recipe, rating } : recipe
  //       );
  //       await updateDoc(userRef, {
  //         savedRecipes: updatedRecipes,
  //       });
  //       setRecipes(updatedRecipes);
  //       setEditingRecipeId(null);
  //     } catch (error) {
  //       console.error("Error updating rating: ", error);
  //       alert("Failed to update rating.");
  //     }
  //   }
  // };


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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!recipes || recipes.length === 0)
    return <div>No saved recipes found</div>;

  return (
    <div className="grid grid-cols-1 gap-6">
      {recipes.map((recipe) => (
        <div
          key={recipe.id}
          className="border rounded-lg overflow-hidden shadow-lg bg-white"
        >
          <div className="p-4">
            <h3 className="font-bold text-xl mb-2">{recipe.title}</h3>

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
              <br/>
              {editingRecipeId === recipe.id ? (
                <>
                  <select
                    value={newRating ?? recipe.rating}
                    onChange={(e) => setNewRating(Number(e.target.value))}
                    className="mt-2 px-2 py-1 border rounded"
                  >
                    {[0, 1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num}>{num}</option>
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
            {/* <div>
              {recipe.rating === 0 ? "Current Rating: Not Set" : `Current Rating: ${recipe.rating}/5`}
              <br/>
              {editingRecipeId === recipe.id ? (
                <select
                  value={newRating ?? recipe.rating}
                  onChange={(e) => setNewRating(Number(e.target.value))}
                  onBlur={() => {
                    if (newRating !== null) updateRating(recipe.id, newRating);
                  }}
                  className="mt-2 px-2 py-1 border rounded"
                >
                  {[0, 1, 2, 3, 4, 5].map((num) => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              ) : (
                <button
                  onClick={() => setEditingRecipeId(recipe.id)}
                  className="mt-2 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Edit Rating
                </button>
              )}
            </div> */}

            {/* <div>
              {recipe.rating === 0 ? "Current Rating: Not Set" : recipe.rating}
              <br/>
              <button
                onClick={() => setEditingRecipeId(recipe.id)}
                className="mt-2 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Edit Rating
              </button>
            </div> */}

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
