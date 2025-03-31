import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/auth/firebase";
import MarkdownDisplay from "./MarkdownDisplay";
import ShoppingList from "./ShoppingList";

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
  "Breakfast", "Lunch", "Dinner", "Snack",
  "Vegetarian", "Vegan", "Gluten-Free", "Low-Carb",
  "High-Protein", "Comfort Food", "Spicy", "Sweet",
  "Keto", "Paleo", "Healthy", "Quick",
  "Italian", "Asian", "Mexican", "American"
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
  if (lower.includes("low carb") || lower.includes("low-carb")) tags.push("Low-Carb");
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
  const [ingredients, setIngredients] = useState<string>('');
  const [isRecipeSaved, setIsRecipeSaved] = useState<boolean>(false); // New state to track if the recipe is saved
  const [isRating, setIsRating] = useState<boolean>(false);
  const [rating, setRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    if (geminiSuggestion) {
      // Split the response into title and content
      const lines = geminiSuggestion.split("\n");
      let title = "";
      let contentLines = [...lines];
      let ingredients = '';
      let tags: string[] = [];

      const tagLineIndex = contentLines.findIndex(line => line.startsWith("TAGS:"));
      if (tagLineIndex !== -1) {
        const tagLine = contentLines[tagLineIndex];
        tags = tagLine.replace("TAGS:", "")
          .split(",")
          .map(tag => tag.trim())
          .filter(tag => allowedTags.includes(tag)); // Validate
        contentLines.splice(tagLineIndex, 1);
      } else {
        const fullText = contentLines.join(" ").toLowerCase();
        tags = generateTags(fullText);
      }

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

      // Extract ingredients between "Ingredients" and "Instructions"
      const content = contentLines.join('\n').trim();
      const ingredientsStart = content.toLowerCase().indexOf('ingredients');
      const instructionsStart = content.toLowerCase().indexOf('instructions');
      if (ingredientsStart !== -1 && instructionsStart !== -1 && instructionsStart > ingredientsStart) {
        ingredients = content.substring(ingredientsStart + 'ingredients'.length, instructionsStart).trim();
      }

      setRecipe({
        id: Date.now().toString(),
        title,
        content, // Full content
        ingredients, // Include the extracted ingredients here
        rating: 0,
        content: contentLines.join("\n").trim(), // Join remaining lines for content
        tags,
      });

      // Store the extracted ingredients in a separate state
      setIngredients(ingredients);
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
            ingredients: recipe.ingredients, // Include the extracted ingredients here
            rating: 0,
            rating: rating,
            tags: recipe.tags || [],
          }),
        });
        setIsRecipeSaved(true); // Mark the recipe as saved
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
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {recipe.tags.map((tag) => (
              <span
                key={tag}
                className={`text-xs font-medium px-2 py-1 rounded-full ${tagColorMap[tag] || "bg-gray-200 text-gray-800"}`}
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
      {isRecipeSaved && ingredients && (
        <div className="mt-6">
          <ShoppingList ingredients={ingredients} />
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
