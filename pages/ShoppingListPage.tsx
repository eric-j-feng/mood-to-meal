import React, { useEffect, useState } from "react";

const ShoppingListPage: React.FC = () => {
  const [ingredients, setIngredients] = useState<string[] | null>(null);

  useEffect(() => {
    // Simulate fetching the saved recipe's ingredients
    const fetchSavedRecipe = async () => {
      try {
        // Replace this with your actual API or database call
        const response = await fetch("../components/SavedRecipes");
        // Check if the response is OK and JSON
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const savedRecipe = await response.json();
        setIngredients(savedRecipe.ingredients);
      } catch (error) {
        console.error("Failed to fetch the saved recipe:", error);
        setIngredients([]);
      }
    };

    fetchSavedRecipe();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Shopping List</h1>
      {ingredients && ingredients.length > 0 ? (
        <ul className="list-disc pl-5">
          {ingredients.map((ingredient, index) => (
            <li key={index} className="text-gray-800">
              {ingredient}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No ingredients found.</p>
      )}

    </div>
  );
};
export default ShoppingListPage;