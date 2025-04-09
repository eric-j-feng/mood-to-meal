import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/auth/firebase";
import MarkdownDisplay from "./MarkdownDisplay";

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

type Recipe = {
  ingredients: any;
  id: string;
  title: string;
  content: string;
  rating: number;
  tags?: string[];
  cleanedIngredients?: string;
};

interface RecipesProps {
  geminiSuggestion?: string;
  modifyRecipe?: (modificationRequest: string) => void;
  selectedCity: string | null;
  selectedState: string | null;
  selectedMood: string | null;
  selectedCookTime: string | null;
}

const allowedTags = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snack",
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Low-Carb",
  "High-Protein",
  "Comfort Food",
  "Spicy",
  "Sweet",
  "Keto",
  "Paleo",
  "Healthy",
  "Quick",
  "Italian",
  "Asian",
  "Mexican",
  "American",
];

const generateTags = (text: string): string[] => {
  const tags: string[] = [];
  const lower = text.toLowerCase();

  if (lower.includes("breakfast")) tags.push("Breakfast");
  if (lower.includes("lunch")) tags.push("Lunch");
  if (lower.includes("dinner")) tags.push("Dinner");
  if (lower.includes("snack")) tags.push("Snack");

  if (lower.includes("vegetarian")) tags.push("Vegetarian");
  if (lower.includes("vegan")) tags.push("Vegan");
  if (lower.includes("gluten-free")) tags.push("Gluten-Free");
  if (lower.includes("low carb") || lower.includes("low-carb"))
    tags.push("Low-Carb");
  if (lower.includes("protein")) tags.push("High-Protein");
  if (lower.includes("comfort")) tags.push("Comfort Food");
  if (lower.includes("spicy")) tags.push("Spicy");
  if (lower.includes("sweet")) tags.push("Sweet");

  if (lower.includes("keto")) tags.push("Keto");
  if (lower.includes("paleo")) tags.push("Paleo");
  if (lower.includes("healthy")) tags.push("Healthy");
  if (lower.includes("quick")) tags.push("Quick");

  if (lower.includes("italian")) tags.push("Italian");
  if (lower.includes("asian")) tags.push("Asian");
  if (lower.includes("mexican")) tags.push("Mexican");
  if (lower.includes("american")) tags.push("American");

  return tags.filter((tag) => allowedTags.includes(tag));
};

// Function to clean up the ingredients list
const cleanIngredients = (ingredients: string) => {
  return ingredients
    .split("\n") // Split the string into lines
    .map((line) => line.trim()) // Trim whitespace from each line
    .filter((line) => line && line !== "**" && line !== ":**") // Remove empty lines and unwanted markers
    .map((line) => line.replace(/^\*\s*/, "")) // Remove leading '* ' from each line
    .join("\n"); // Join the cleaned lines back into a string.
};

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
  const [ingredients, setIngredients] = useState<string>("");
  const [isRecipeSaved, setIsRecipeSaved] = useState<boolean>(false);

  useEffect(() => {
    if (geminiSuggestion) {
      const lines = geminiSuggestion.split("\n");
      let title = "";
      let contentLines = [...lines];
      let ingredients = "";
      let tags: string[] = [];

      const tagLineIndex = contentLines.findIndex((line) =>
        line.startsWith("TAGS:")
      );
      if (tagLineIndex !== -1) {
        const tagLine = contentLines[tagLineIndex];
        tags = tagLine
          .replace("TAGS:", "")
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => allowedTags.includes(tag));
        contentLines.splice(tagLineIndex, 1);
      } else {
        const fullText = contentLines.join(" ").toLowerCase();
        tags = generateTags(fullText);
      }

      for (let i = 0; i < Math.min(3, contentLines.length); i++) {
        const line = contentLines[i];
        if (
          !line.toLowerCase().includes("okay") &&
          (line.toLowerCase().includes("recipe") || line.match(/^#+ /))
        ) {
          title = line.replace(/^#+ /, "").replace(" Recipe", "").trim();
          contentLines.splice(i, 1);
          break;
        }
      }

      if (!title) {
        const firstNonEmptyIndex = lines.findIndex(
          (line) => line.trim().length > 0
        );
        if (firstNonEmptyIndex !== -1) {
          title = lines[firstNonEmptyIndex];
          contentLines.splice(firstNonEmptyIndex, 1);
        } else {
          title = "Generated Recipe";
        }
      }

      const content = contentLines.join("\n").trim();
      const ingredientsStart = content.toLowerCase().indexOf("ingredients");
      const instructionsStart = content.toLowerCase().indexOf("instructions");
      if (
        ingredientsStart !== -1 &&
        instructionsStart !== -1 &&
        instructionsStart > ingredientsStart
      ) {
        ingredients = content
          .substring(ingredientsStart + "ingredients".length, instructionsStart)
          .split("\n")
          .filter((line) => !line.toLowerCase().startsWith("equipment"))
          .join("\n")
          .trim();
      }

      const cleanedIngredients = cleanIngredients(ingredients);

      setRecipe({
        id: Date.now().toString(),
        title,
        content: contentLines.join("\n").trim(),
        ingredients,
        cleanedIngredients,
        rating: 0,
        tags,
      });

      setIngredients(ingredients);
    }
  }, [geminiSuggestion]);

  const handleModify = () => {
    if (modifyRecipe && modificationText) {
      modifyRecipe(modificationText);
      setModificationText("");
      setIsEditing(false);
      setIsRecipeSaved(false); // Reset the button to "Save Recipe" state
    }
  };

  const saveRecipe = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user && recipe) {
      const cleanedIngredients =
        recipe.cleanedIngredients || cleanIngredients(recipe.ingredients);

      const userRef = doc(db, "users", user.uid);
      try {
        await updateDoc(userRef, {
          savedRecipes: arrayUnion({
            id: recipe.id,
            title: recipe.title,
            content: recipe.content,
            ingredients: recipe.ingredients, // Include the extracted ingredients here
            rating: rating, // Use the rating variable
            tags: recipe.tags || [],
            cleanedIngredients: cleanedIngredients, // Ensure cleanedIngredients is included
          }),
        });
        setIsRecipeSaved(true); // Mark the recipe as saved
        setIsRating(false);
        if (!isRecipeSaved) {
          await updateDoc(userRef, {
            savedRecipes: arrayUnion({
              id: recipe.id,
              title: recipe.title,
              content: recipe.content,
              ingredients: recipe.ingredients,
              rating: 0,
              tags: recipe.tags || [],
              cleanedIngredients: cleanedIngredients,
            }),
          });
          setIsRecipeSaved(true);
        } else {
          await updateDoc(userRef, {
            savedRecipes: arrayRemove({
              id: recipe.id,
              title: recipe.title,
              content: recipe.content,
              ingredients: recipe.ingredients,
              rating: 0,
              tags: recipe.tags || [],
              cleanedIngredients: cleanedIngredients,
            }),
          });
          setIsRecipeSaved(false);
          alert("Recipe removed!");
        }
      } catch (error) {
        console.error("Error saving/removing recipe: ", error);
        alert("Failed to save/remove recipe.");
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
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {recipe.tags.map((tag: string) => (
              <span
                key={tag}
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  tagColorMap[tag] || "bg-gray-200 text-gray-800"
                }`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="mb-4">
          <MarkdownDisplay content={recipe.content} />
        </div>
        <div className="flex gap-4">
          <button
            onClick={saveRecipe}
            disabled={isRecipeSaved}
            className={`px-4 py-2 rounded transition-colors ${
              isRecipeSaved
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-green-500 text-white hover:bg-green-600"
            }`}
          >
            {isRecipeSaved ? "Recipe Saved" : "Save Recipe"}
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
      </div>
    </div>
  );
};

export default Recipes;
