import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/auth/firebase";
import MarkdownDisplay from "./MarkdownDisplay";

type Recipe = {
  id: string;
  title: string;
  content: string;
  rating: number;
};

interface RecipesProps {
  geminiSuggestion?: string;
  modifyRecipe?: (modificationRequest: string) => void;
  selectedCity: string | null;
  selectedState: string | null;
  selectedMood: string | null;
  selectedCookTime: string | null;
}

const Recipes: React.FC<RecipesProps> = ({
  geminiSuggestion,
  modifyRecipe,
  selectedCity,
  selectedState,
  selectedMood,
  selectedCookTime,
}) => {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [modificationText, setModificationText] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isRating, setIsRating] = useState<boolean>(false);
  const [rating, setRating] = useState<number>(0);

  useEffect(() => {
    if (geminiSuggestion) {
      // Split the response into title and content
      const lines = geminiSuggestion.split("\n");
      let title = "";
      let contentLines = [...lines];

      // Look for a title in the first few lines
      for (let i = 0; i < Math.min(3, contentLines.length); i++) {
        const line = contentLines[i];
        if (
          !line.toLowerCase().includes("okay") &&
          (line.toLowerCase().includes("recipe") || line.match(/^#+ /))
        ) {
          title = line.replace(/^#+ /, "").replace(" Recipe", "").trim();
          contentLines.splice(i, 1); // Remove the title line from content
          break;
        }
      }

      // If no title found, use the first non-empty line
      if (!title) {
        const firstNonEmptyIndex = lines.findIndex(
          (line) => line.trim().length > 0
        );
        if (firstNonEmptyIndex !== -1) {
          title = lines[firstNonEmptyIndex];
          contentLines.splice(firstNonEmptyIndex, 1); // Remove the title line from content
        } else {
          title = "Generated Recipe";
        }
      }

      setRecipe({
        id: Date.now().toString(),
        title,
        content: contentLines.join("\n").trim(), // Join remaining lines for content
        rating: 0,
      });
    }
  }, [geminiSuggestion]);

  const handleModify = () => {
    if (modifyRecipe && modificationText) {
      modifyRecipe(modificationText);
      setModificationText("");
      setIsEditing(false);
    }
  };

  const saveRecipe = () => {
    setIsRating(true);
  };

  const handleRating = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user && recipe) {
      const userRef = doc(db, "users", user.uid);
      try {
        await updateDoc(userRef, {
          savedRecipes: arrayUnion({
            id: recipe.id,
            title: recipe.title,
            content: recipe.content,
            rating: rating,
          }),
        });
        alert("Recipe saved!");
        setIsRating(false);
      } catch (error) {
        console.error("Error saving recipe: ", error);
        alert("Failed to save recipe.");
      }
    } else {
      alert("You need to be logged in to save recipes.");
    }
  };

  if (!recipe) return null;

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="border rounded-lg overflow-hidden shadow-lg bg-white p-6">
        <h2 className="text-2xl font-bold mb-4">{recipe.title}</h2>
        <div className="mb-4">
          <MarkdownDisplay content={recipe.content} />
        </div>
        <div className="flex gap-4">
          <button
            onClick={saveRecipe}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Save Recipe
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            {isEditing ? "Cancel" : "Edit Recipe"}
          </button>
        </div>
        {isEditing && (
          <div className="mt-4">
            <input
              type="text"
              value={modificationText}
              onChange={(e) => setModificationText(e.target.value)}
              placeholder="Enter modification request..."
              className="w-full p-2 border rounded"
            />
            <button
              onClick={handleModify}
              className="mt-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
            >
              Submit Modifications
            </button>
          </div>
        )}
        {isRating && (
          <div className="mt-4">
            <label className="block">
              <span className="font-semibold">Rate this Recipe:</span>
              <select
                value={rating}
                onChange={(e) => setRating(parseInt(e.target.value))}
                className="block w-full mt-2 p-2 border rounded"
              >
                <option value={0}>Select Rating</option>
                <option value={1}>1 - Poor</option>
                <option value={2}>2 - Fair</option>
                <option value={3}>3 - Good</option>
                <option value={4}>4 - Very Good</option>
                <option value={5}>5 - Excellent</option>
              </select>
            </label>
            <button
              onClick={handleRating}
              className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              Submit Rating
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recipes;
