import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/auth/firebase";
import { getAuth } from "firebase/auth";
import { Poppins} from "next/font/google";
const myFont = Poppins({
  weight:['400'],
  subsets: ['latin']
})



const ShoppingListPage: React.FC = () => {
  const router = useRouter();
  const { recipeId } = router.query;

  const [shoppingList, setShoppingList] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchShoppingList = async () => {
      const auth = getAuth();
      const userId = auth.currentUser?.uid;

      if (!userId) {
        setError("User not logged in.");
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const recipe = userData.savedRecipes.find(
            (r: any) => r.id === recipeId
          );

          console.log(recipe);

          if (!recipe) {
            setError("Recipe not found.");
          } else if (!recipe.cleanedIngredients) {
            setError("No shopping list available for this recipe.");
          } else {
            setShoppingList(recipe.cleanedIngredients.split("\n"));
          }
        } else {
          setError("User data not found.");
        }
      } catch (err: any) {
        setError("Failed to fetch shopping list.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchShoppingList();
  }, [recipeId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className={`bg-[url('/assets/texture.jpg')] min-h-screen mx-auto p-6 ${myFont.className}`}>
      <h1 className="text-4xl font-bold text-center text-green-2000 mb-4">Shopping List</h1>
      {shoppingList.length > 0 ? (
        <ul className="pl-5">
          {shoppingList.map((item, index) => (
            <li key={index} className="mb-2 flex items-center">
              <input
                type="checkbox"
                id={`item-${index}`}
                className="mr-2"
              />
              <label htmlFor={`item-${index}`}>{item}</label>
            </li>
          ))}
        </ul>
      ) : (
        <div>No ingredients found for this recipe.</div>
      )}
      <button
        onClick={() => router.back()}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
      >
        Go Back
      </button>
    </div>
  );
};

export default ShoppingListPage;