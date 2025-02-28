import { useEffect, useState } from "react";
import { auth, db } from "@/auth/firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteField,
} from "firebase/firestore";
import SavedRecipes from "@/components/SavedRecipes";
import { User } from "firebase/auth";
import { useRouter } from "next/router";

const dietaryOptions = [
  "Vegan",
  "Vegetarian",
  "Pescetarian",
  "Gluten-Free",
  "Grain-Free",
  "Dairy-Free",
  "High-Protein",
  "Whole30",
  "Low-Sodium",
  "Low-Carb",
  "Paleo",
  "Ketogenic",
  "FODMAP",
  "Primal",
];

const utensilOptions = [
  "Stove",
  "Oven",
  "Microwave",
  "Toaster",
  "Blender",
  "Immersion Blender",
  "Food Processor",
  "Air Fryer",
  "Pressure Cooker",
  "Slow Cooker",
  "Wok",
  "Frying Pan",
  "Saucepan",
  "Stockpot",
  "Baking Sheet",
  "Mixing Bowl",
  "Measuring Cups",
  "Measuring Spoons",
  "Cutting Board",
  "Knife Set",
  "Spatula",
  "Tongs",
  "Whisk",
  "Rolling Pin",
  "Grater",
  "Colander",
  "Peeler",
  "Can Opener",
];

interface Preferences {
  dietaryRestrictions: string[];
  cookingSkill: string;
  utensils: Record<string, number>;
}

export default function Profile() {
  const [preferences, setPreferences] = useState<Preferences>({
    dietaryRestrictions: [],
    cookingSkill: "",
    utensils: {},
  });

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newUtensilName, setNewUtensilName] = useState("");
  const [newUtensilQuantity, setNewUtensilQuantity] = useState(0);
  const [customUtensils, setCustomUtensils] = useState<string[]>([]);

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(currentUser);
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        setPreferences({
          dietaryRestrictions: userData.preferences?.dietaryRestrictions || [],
          cookingSkill: userData.preferences?.cookingSkill || "",
          utensils: userData.preferences?.utensils || {},
        });
        setCustomUtensils(
          Object.keys(userData.preferences?.utensils || {}).filter(
            (utensil) => !utensilOptions.includes(utensil)
          )
        );
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCheckboxChange = (
    category: "dietaryRestrictions",
    option: string
  ) => {
    setPreferences((prev) => {
      const updatedCategory = prev[category].includes(option)
        ? prev[category].filter((item) => item !== option)
        : [...prev[category], option];
      return { ...prev, [category]: updatedCategory };
    });
  };

  const handleUtensilChange = async (utensil: string, quantity: number) => {
    setPreferences((prev) => ({
      ...prev,
      utensils: { ...prev.utensils, [utensil]: quantity },
    }));

    if (user) {
      const userRef = doc(db, "users", user.uid);
      if (quantity === 0) {
        await updateDoc(userRef, {
          [`preferences.utensils.${utensil}`]: deleteField(),
        });
      } else {
        await updateDoc(userRef, {
          [`preferences.utensils.${utensil}`]: quantity,
        });
      }
    }
  };

  const handleAddNewUtensil = async () => {
    if (newUtensilName && newUtensilQuantity > 0) {
      handleUtensilChange(newUtensilName, newUtensilQuantity);
      if (user) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          [`preferences.utensils.${newUtensilName}`]: newUtensilQuantity,
        });
        setCustomUtensils((prev) => [...prev, newUtensilName]);
      }
      setNewUtensilName("");
      setNewUtensilQuantity(0);
    }
  };

  const handleRemoveUtensil = async (utensil: string) => {
    const updatedUtensils = { ...preferences.utensils };
    delete updatedUtensils[utensil];
    setPreferences((prev) => ({
      ...prev,
      utensils: updatedUtensils,
    }));
    if (user) {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        [`preferences.utensils.${utensil}`]: deleteField(),
      });
      setCustomUtensils((prev) => prev.filter((item) => item !== utensil));
    }
  };

  const handleSavePreferences = async () => {
    if (!user) return;
    setSaving(true);
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, { preferences }, { merge: true });
    setSaving(false);
    setEditMode(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button
        onClick={() => router.push("/main")}
        className="mb-4 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
      >
        ← Back
      </button>

      <h1 className="text-3xl font-bold text-center text-blue-600">
        Your Profile
      </h1>

      <div className="mt-6 bg-white p-6 shadow-lg rounded-lg">
        <h2 className="text-xl font-semibold">Your Preferences</h2>

        {editMode ? (
          <>
            <fieldset className="mt-4">
              <legend className="font-semibold">Dietary Restrictions</legend>
              {dietaryOptions.map((option) => (
                <label key={option} className="block mt-2">
                  <input
                    type="checkbox"
                    checked={preferences.dietaryRestrictions.includes(option)}
                    onChange={() =>
                      handleCheckboxChange("dietaryRestrictions", option)
                    }
                    className="mr-2"
                  />
                  {option}
                </label>
              ))}
            </fieldset>

            <label className="block mt-4">
              <span className="font-semibold">Cooking Skill Level:</span>
              <select
                value={preferences.cookingSkill}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    cookingSkill: e.target.value,
                  })
                }
                className="block w-full mt-2 p-2 border rounded"
              >
                <option value="">Select</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Expert">Expert</option>
              </select>
            </label>

            <fieldset className="mt-4">
              <legend className="font-semibold">
                Available Cooking Utensils
              </legend>
              {utensilOptions.map((utensil) => (
                <label key={utensil} className="block mt-2">
                  {utensil}:
                  <input
                    type="number"
                    min="0"
                    value={preferences.utensils[utensil] || 0}
                    onChange={(e) =>
                      handleUtensilChange(
                        utensil,
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="ml-2 w-16 p-1 border rounded"
                  />
                </label>
              ))}
              <h3 className="mt-4 font-semibold">User Custom Utensils</h3>
              {Object.keys(preferences.utensils).map(
                (utensil) =>
                  !utensilOptions.includes(utensil) && (
                    <div key={utensil} className="flex items-center mt-2">
                      <span className="mr-2">{utensil}:</span>
                      <input
                        type="number"
                        min="0"
                        value={preferences.utensils[utensil]}
                        onChange={(e) =>
                          handleUtensilChange(
                            utensil,
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="ml-2 w-16 p-1 border rounded"
                      />
                      {customUtensils.includes(utensil) && (
                        <button
                          onClick={() => handleRemoveUtensil(utensil)}
                          className="ml-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  )
              )}
            </fieldset>

            <div className="mt-4">
              <label className="block">
                <span className="font-semibold">New Utensil Name:</span>
                <input
                  type="text"
                  value={newUtensilName}
                  onChange={(e) => setNewUtensilName(e.target.value)}
                  className="block w-full mt-2 p-2 border rounded"
                />
              </label>
              <label className="block mt-2">
                <span className="font-semibold">New Utensil Quantity:</span>
                <input
                  type="number"
                  min="0"
                  value={newUtensilQuantity}
                  onChange={(e) =>
                    setNewUtensilQuantity(parseInt(e.target.value) || 0)
                  }
                  className="block w-full mt-2 p-2 border rounded"
                />
              </label>
              <button
                onClick={handleAddNewUtensil}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              >
                Add Utensil
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-4">
              <strong>Dietary Restrictions:</strong>{" "}
              {preferences.dietaryRestrictions.join(", ") || "None"}
            </p>
            <p className="mt-2">
              <strong>Cooking Skill Level:</strong>{" "}
              {preferences.cookingSkill || "Not specified"}
            </p>
            <p className="mt-2">
              <strong>Cooking Utensils:</strong>{" "}
              {Object.entries(preferences.utensils)
                .filter(([_, value]) => value > 0)
                .map(([key, value]) => `${key} (${value})`)
                .join(", ") || "None"}
            </p>
          </>
        )}

        <div className="mt-6 flex justify-start">
          {editMode ? (
            <button
              onClick={handleSavePreferences}
              className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Preferences"}
            </button>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition"
            >
              Edit Preferences
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 bg-white p-6 shadow-lg rounded-lg">
        <h2 className="text-xl font-semibold">Saved Recipes</h2>
        <SavedRecipes />
      </div>
    </div>
  );
}
