import { useState } from "react";
import { auth, db } from "@/auth/firebase";
import { useRouter } from "next/router";
import { doc, setDoc } from "firebase/firestore";

import styles from "./Onboarding.module.css";

interface OnboardingProps {
  onComplete: () => void;
}

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

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [cookingSkill, setCookingSkill] = useState<string>("");
  const [utensils, setUtensils] = useState<Record<string, number>>({});
  const [customUtensils, setCustomUtensils] = useState<string[]>([]);
  const [newUtensilName, setNewUtensilName] = useState("");
  const [newUtensilQuantity, setNewUtensilQuantity] = useState(0);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const router = useRouter();

  const handleCheckboxChange = (
    category: "dietaryRestrictions",
    option: string
  ) => {
    if (category === "dietaryRestrictions") {
      setDietaryRestrictions((prev) =>
        prev.includes(option)
          ? prev.filter((item) => item !== option)
          : [...prev, option]
      );
    }
  };

  const handleUtensilChange = (utensil: string, quantity: number) => {
    setUtensils((prev) => ({
      ...prev,
      [utensil]: quantity,
    }));
  };

  const handleAddNewUtensil = () => {
    if (newUtensilName && newUtensilQuantity > 0) {
      handleUtensilChange(newUtensilName, newUtensilQuantity);
      setCustomUtensils((prev) => [...prev, newUtensilName]);
      setNewUtensilName("");
      setNewUtensilQuantity(0);
    }
  };

  const handleRemoveUtensil = (utensil: string) => {
    const updatedUtensils = { ...utensils };
    delete updatedUtensils[utensil];
    setUtensils(updatedUtensils);
    setCustomUtensils((prev) => prev.filter((item) => item !== utensil));
  };

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) {
      console.error("User not authenticated");
      return;
    }

    const userRef = doc(db, "users", user.uid);
    setLoading(true);

    try {
      await setDoc(
        userRef,
        {
          preferences: {
            dietaryRestrictions,
            cookingSkill,
            utensils,
          },
        },
        { merge: true }
      );

      console.log("Preferences saved to Firestore!");
      onComplete();
      router.push("/main");
    } catch (error) {
      console.error("Error saving preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-20 bg-gray-100">
      <header className={styles.header}>
        <h1 className="text-4xl font-bold text-blue-600 mb-4">Mood to Meal</h1>
        <p className="text-gray-700 text-lg">Let's Get You Onboarded!</p>
      </header>

      <div className="bg-white shadow-lg rounded-lg p-8 w-96 text-center">
        {step === 1 && (
          <>
            <h2 className="text-xl font-semibold mb-4">Dietary Restrictions</h2>
            <fieldset className={styles.section}>
              {dietaryOptions.map((option) => (
                <label key={option} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={dietaryRestrictions.includes(option)}
                    onChange={() =>
                      handleCheckboxChange("dietaryRestrictions", option)
                    }
                    className={styles.checkbox}
                  />
                  {option}
                </label>
              ))}
            </fieldset>
            <button
              onClick={() => setStep(2)}
              className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg w-full"
            >
              Next
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-xl font-semibold mb-4">Cooking Skill Level</h2>
            <label className={styles.label}>
              <select
                value={cookingSkill}
                onChange={(e) => setCookingSkill(e.target.value)}
                className={styles.select}
              >
                <option value="">Select</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Expert">Expert</option>
              </select>
            </label>
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="bg-gray-400 text-white py-2 px-4 rounded-lg"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="bg-blue-600 text-white py-2 px-4 rounded-lg"
              >
                Next
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-xl font-semibold mb-4">
              Available Cooking Utensils
            </h2>
            <fieldset className={styles.section}>
              {utensilOptions.map((utensil) => (
                <label key={utensil} className={styles.checkboxLabel}>
                  {utensil}:
                  <input
                    type="number"
                    min="0"
                    value={utensils[utensil] || 0}
                    onChange={(e) =>
                      handleUtensilChange(
                        utensil,
                        parseInt(e.target.value) || 0
                      )
                    }
                    className={styles.input}
                  />
                </label>
              ))}
              <h3 className="mt-4 font-semibold">User Custom Utensils</h3>
              {Object.keys(utensils).map(
                (utensil) =>
                  !utensilOptions.includes(utensil) && (
                    <div key={utensil} className="flex items-center mt-2">
                      <span className="mr-2">{utensil}:</span>
                      <input
                        type="number"
                        min="0"
                        value={utensils[utensil]}
                        onChange={(e) =>
                          handleUtensilChange(
                            utensil,
                            parseInt(e.target.value) || 0
                          )
                        }
                        className={styles.input}
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
                  className={styles.input}
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
                  className={styles.input}
                />
              </label>
              <button
                onClick={handleAddNewUtensil}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              >
                Add Utensil
              </button>
            </div>
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="bg-gray-400 text-white py-2 px-4 rounded-lg"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                className="bg-green-600 text-white py-2 px-4 rounded-lg"
                disabled={loading}
              >
                Submit
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
