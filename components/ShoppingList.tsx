import React, { useState } from "react";

interface ShoppingListProps {
  ingredients: string;
}

const ShoppingList: React.FC<ShoppingListProps> = ({ ingredients }) => {
  // Split ingredients into an array and clean up unnecessary syntax
  const cleanedIngredients = ingredients
    .split("\n")
    .map((item) => item.trim())
    .filter((item) => item.length > 0); // Remove empty lines

  // State to track checked items
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  const handleCheckboxChange = (ingredient: string) => {
    setCheckedItems((prev) =>
      prev.includes(ingredient)
        ? prev.filter((item) => item !== ingredient) // Uncheck
        : [...prev, ingredient] // Check
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">Shopping List</h2>
      <ul className="list-none">
        {cleanedIngredients.map((ingredient, index) => (
          <li key={index} className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id={`ingredient-${index}`}
              checked={checkedItems.includes(ingredient)}
              onChange={() => handleCheckboxChange(ingredient)}
              className="cursor-pointer"
            />
            <label
              htmlFor={`ingredient-${index}`}
              className={`cursor-pointer ${
                checkedItems.includes(ingredient) ? "line-through text-gray-500" : ""
              }`}
            >
              {ingredient}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ShoppingList;