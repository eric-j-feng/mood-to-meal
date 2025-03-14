// components/Recipes.tsx

import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/auth/firebase";
import MarkdownDisplay from "./MarkdownDisplay";

type Recipe = {
  id: string;
  title: string;
  content: string;
};

interface RecipesProps {
  geminiSuggestion?: string;
}

const Recipes: React.FC<RecipesProps> = ({ geminiSuggestion }) => {
  const [recipe, setRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    if (geminiSuggestion) {
      // Split the response into title and content
      const lines = geminiSuggestion.split('\n');
      let title = '';
      let contentLines = [...lines];

      // Look for a title in the first few lines
      for (let i = 0; i < Math.min(3, lines.length); i++) {
        const line = lines[i];
        if (line.toLowerCase().includes('recipe') || line.match(/^#+ /)) {
          title = line.replace(/^#+ /, '').replace(' Recipe', '').trim();
          contentLines.splice(i, 1); // Remove the title line from content
          break;
        }
      }

      // If no title found, use the first non-empty line
      if (!title) {
        const firstNonEmptyIndex = lines.findIndex(line => line.trim().length > 0);
        if (firstNonEmptyIndex !== -1) {
          title = lines[firstNonEmptyIndex];
          contentLines.splice(firstNonEmptyIndex, 1); // Remove the title line from content
        } else {
          title = 'Generated Recipe';
        }
      }

      setRecipe({
        id: Date.now().toString(),
        title,
        content: contentLines.join('\n').trim() // Join remaining lines for content
      });
    }
  }, [geminiSuggestion]);

  const saveRecipe = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user && recipe) {
      const userRef = doc(db, "users", user.uid);
      try {
        await updateDoc(userRef, {
          savedRecipes: arrayUnion({
            id: recipe.id,
            title: recipe.title,
            content: recipe.content
          }),
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

  if (!recipe) return null;

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="border rounded-lg overflow-hidden shadow-lg bg-white p-6">
        <h2 className="text-2xl font-bold mb-4">{recipe.title}</h2>
        <div className="mb-4">
          <MarkdownDisplay content={recipe.content} />
        </div>
        <button
          onClick={saveRecipe}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          Save Recipe
        </button>
      </div>
    </div>
  );
};

export default Recipes;