import { useEffect, useState } from "react";
import { auth, db } from "@/auth/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import SavedRecipes from "@/components/SavedRecipes";
import { User } from "firebase/auth";
import { useRouter } from "next/router";

const dietaryOptions = [
  "Vegetarian", "Vegan", "Gluten-Free", "Keto", "Paleo", "Halal", "Kosher"
];

const allergyOptions = [
  "Peanuts", "Tree Nuts", "Dairy", "Eggs", "Soy", "Wheat", "Shellfish", "Fish", "Sesame"
];

interface Preferences {
  dietaryRestrictions: string[];
  allergies: string[];
  cookingSkill: string;
}

export default function Profile() {
  const [preferences, setPreferences] = useState<Preferences>({
    dietaryRestrictions: [],
    allergies: [],
    cookingSkill: "",
  });

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  
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
          allergies: userData.preferences?.allergies || [],
          cookingSkill: userData.preferences?.cookingSkill || "",
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCheckboxChange = (category: "dietaryRestrictions" | "allergies", option: string) => {
    setPreferences((prev) => {
      const updatedCategory = prev[category].includes(option)
        ? prev[category].filter((item) => item !== option)
        : [...prev[category], option];

      return { ...prev, [category]: updatedCategory };
    });
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
      {/* Back to Main Button */}
      <button
        onClick={() => router.push("/main")}
        className="mb-4 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
      >
        ← Back
      </button>

      <h1 className="text-3xl font-bold text-center text-blue-600">Your Profile</h1>

      {/* Preferences Section */}
      <div className="mt-6 bg-white p-6 shadow-lg rounded-lg">
        <h2 className="text-xl font-semibold">Your Preferences</h2>

        {editMode ? (
          <>
            {/* Dietary Restrictions */}
            <fieldset className="mt-4">
              <legend className="font-semibold">Dietary Restrictions</legend>
              {dietaryOptions.map((option) => (
                <label key={option} className="block mt-2">
                  <input
                    type="checkbox"
                    checked={preferences.dietaryRestrictions.includes(option)}
                    onChange={() => handleCheckboxChange("dietaryRestrictions", option)}
                    className="mr-2"
                  />
                  {option}
                </label>
              ))}
            </fieldset>

            {/* Allergy Selections */}
            <fieldset className="mt-4">
              <legend className="font-semibold">Common Allergies</legend>
              {allergyOptions.map((option) => (
                <label key={option} className="block mt-2">
                  <input
                    type="checkbox"
                    checked={preferences.allergies.includes(option)}
                    onChange={() => handleCheckboxChange("allergies", option)}
                    className="mr-2"
                  />
                  {option}
                </label>
              ))}
            </fieldset>

            {/* Cooking Skill Level */}
            <label className="block mt-4">
              <span className="font-semibold">Cooking Skill Level:</span>
              <select
                value={preferences.cookingSkill}
                onChange={(e) => setPreferences({ ...preferences, cookingSkill: e.target.value })}
                className="block w-full mt-2 p-2 border rounded"
              >
                <option value="">Select</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Expert">Expert</option>
              </select>
            </label>
          </>
        ) : (
          <>
            {/* View Mode - Show Saved Preferences */}
            <p className="mt-4"><strong>Dietary Restrictions:</strong> {preferences.dietaryRestrictions.join(", ") || "None"}</p>
            <p className="mt-2"><strong>Allergies:</strong> {preferences.allergies.join(", ") || "None"}</p>
            <p className="mt-2"><strong>Cooking Skill Level:</strong> {preferences.cookingSkill || "Not specified"}</p>
          </>
        )}

        {/* Buttons at the Bottom Left of the Preferences Box */}
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

      {/* Saved Recipes Section */}
      <div className="mt-6 bg-white p-6 shadow-lg rounded-lg">
        <h2 className="text-xl font-semibold">Saved Recipes</h2>
        <SavedRecipes />
      </div>
    </div>
  );
}
