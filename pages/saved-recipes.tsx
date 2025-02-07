// pages/saved-recipes.tsx

import SavedRecipes from "@/components/SavedRecipes";

const SavedRecipesPage = () => {
  return (
    <main className="flex flex-col items-center min-h-screen p-8">
      <header className="w-full max-w-5xl text-center mb-12">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">Saved Recipes</h1>
        <p className="text-gray-700 text-lg">
          Here are all the recipes you have saved.
        </p>
      </header>
      <SavedRecipes />
    </main>
  );
};

export default SavedRecipesPage;
