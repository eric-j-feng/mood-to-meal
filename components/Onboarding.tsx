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
    <div className={styles.pageContainer}>
      {/* Mood to Meal Header (Outside White Box) */}
      <header className={styles.header}>
        <h1 className={styles.title}>Mood to Meal</h1>
        <p className={styles.subtitle}>Let's personalize your experience</p>
      </header>

      {/* Onboarding Form (White Box) */}
      <div className={styles.container}>
        {/* Dietary Restrictions */}
        <fieldset className={styles.section}>
          <legend className={styles.legend}>Dietary Restrictions</legend>
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

        {/* Allergy Selections */}
        <fieldset className={styles.section}>
          <legend className={styles.legend}>Common Allergies</legend>
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

        {/* Cooking Skill Level */}
        <label className={styles.label}>
          Cooking Skill Level:
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

        {/* Save Button */}
        <button
          onClick={handleSubmit}
          className={styles.button}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}
