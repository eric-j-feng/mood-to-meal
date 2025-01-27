// components/Recipes.tsx

import { useEffect, useState } from "react";
import Image from "next/image";

type Recipe = {
  id: number;
  title: string;
  image: string;
  readyInMinutes?: number;
  servings?: number;
  sourceUrl?: string;
  summary?: string;
};

const Recipes: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedRecipe, setExpandedRecipe] = useState<number | null>(null);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const response = await fetch("/api/recipes?query=pasta");
        if (!response.ok) {
          throw new Error('Failed to fetch recipes');
        }
        const data = await response.json();
        // The API returns data with a 'results' property containing the recipes array
        setRecipes(data.results || []); // Add fallback empty array
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!recipes || recipes.length === 0) return <div>No recipes found</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recipes.map((recipe) => (
        <div 
          key={recipe.id} 
          className="border rounded-lg overflow-hidden shadow-lg bg-white"
        >
          <div className="relative h-48 w-full">
            <Image
              src={recipe.image}
              alt={recipe.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="p-4">
            <h3 className="font-bold text-xl mb-2">{recipe.title}</h3>
            <div className="flex justify-between text-sm text-gray-600 mb-4">
              {recipe.readyInMinutes && (
                <span>⏱️ {recipe.readyInMinutes} mins</span>
              )}
              {recipe.servings && (
                <span>👥 Serves {recipe.servings}</span>
              )}
            </div>

            {/* Toggle Summary Button */}
            <button
              onClick={() => setExpandedRecipe(expandedRecipe === recipe.id ? null : recipe.id)}
              className="mb-2 text-blue-600 hover:text-blue-800"
            >
              {expandedRecipe === recipe.id ? 'Hide Details' : 'Show Details'}
            </button>

            {/* Recipe Summary */}
            {expandedRecipe === recipe.id && recipe.summary && (
              <div 
                className="mt-2 mb-4 text-sm text-gray-700"
                dangerouslySetInnerHTML={{ __html: recipe.summary }}
              />
            )}

            {/* Full Recipe Link */}
            {recipe.sourceUrl && (
              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                View Full Recipe
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Recipes;
