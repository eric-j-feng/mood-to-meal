import React from "react";
import { useRouter } from "next/router";
import ShoppingList from "../components/ShoppingList";

const ShoppingListPage: React.FC = () => {
  const router = useRouter();
  const { ingredients } = router.query;

  if (!ingredients || typeof ingredients !== "string") {
    return <p>No ingredients found.</p>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      <h1 className="text-3xl font-bold mb-6">Your Shopping List</h1>
      <ShoppingList ingredients={ingredients} />
    </div>
  );
};

export default ShoppingListPage;
