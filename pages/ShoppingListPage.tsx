import React from "react";
import ShoppingList from "../components/ShoppingList";

interface ShoppingListPageProps {
  ingredients: string;
}

const ShoppingListPage: React.FC<ShoppingListPageProps> = ({ ingredients }) => {
  return (
    <div className="max-w-7xl mx-auto px-4">
      <h1 className="text-3xl font-bold mb-6">Your Shopping List</h1>
      <ShoppingList ingredients={ingredients} />
    </div>
  );
};

export default ShoppingListPage;
