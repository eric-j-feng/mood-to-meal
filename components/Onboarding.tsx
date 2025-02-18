import { useState } from "react";
import { auth, db } from "@/auth/firebase";
import { doc, setDoc } from "firebase/firestore";
import styles from "./Onboarding.module.css";

interface OnboardingProps {
  onComplete: () => void;
}

const dietaryOptions = [
  "Vegetarian", "Vegan", "Gluten-Free", "Keto", "Paleo", "Halal", "Kosher"
];

const allergyOptions = [
  "Peanuts", "Tree Nuts", "Dairy", "Eggs", "Soy", "Wheat", "Shellfish", "Fish", "Sesame"
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [cookingSkill, setCookingSkill] = useState<string>("");
  const [loading, setLoading] = useState(false);



  // new 
  const [step, setStep] = useState(1); 
  
  // end new 
  const handleCheckboxChange = (category: "dietaryRestrictions" | "allergies", option: string) => {
    if (category === "dietaryRestrictions") {
      setDietaryRestrictions((prev) =>
        prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option]
      );
    } else {
      setAllergies((prev) =>
        prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option]
      );
    }
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
      await setDoc(userRef, {
        preferences: {
          dietaryRestrictions,
          allergies,
          cookingSkill,
        }
      }, { merge: true });

      console.log("Preferences saved to Firestore!");
      onComplete();
    } catch (error) {
      console.error("Error saving preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-20 bg-gray-100">
     {/* Mood to Meal Header (Outside White Box) */}
      <header className={styles.header}>
            <h1 className="text-4xl font-bold text-blue-600 mb-4">
              Mood to Meal
            </h1>
            <p className="text-gray-700 text-lg">
              Let's Get You Onboarded! 
            </p>
      </header>


      {/* The Onboarding Box with Diff Sequences */}
      <div className="bg-white shadow-lg rounded-lg p-8 w-96 text-center">

      
        {step == 1 && (
          <>
          <h2 className="text-xl font-semibold mb-4"> Dietary Restrictions</h2>
          <fieldset className={styles.section}>
          {/* <legend className={styles.legend}>Dietary Restrictions</legend> */}
          {dietaryOptions.map((option) => (
            <label key={option} className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={dietaryRestrictions.includes(option)}
                onChange={() => handleCheckboxChange("dietaryRestrictions", option)}
                className={styles.checkbox}
              />
              {option}
            </label>
          ))}
        </fieldset>
        <button onClick={() => setStep(2)}
                className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg w-full">
          Next
        </button>
          </>
        )}


        {step == 2 && (
        <>
            <h2 className="text-xl font-semibold mb-4">Allergies</h2>
            <fieldset className={styles.section}>
            {allergyOptions.map((option) => (
              <label key={option} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={allergies.includes(option)}
                  onChange={() => handleCheckboxChange("allergies", option)}
                  className={styles.checkbox}
                />
                {option}
              </label>
            ))}
          </fieldset>

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


        {step == 3 && (
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
