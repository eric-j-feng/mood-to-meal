import React, { useState } from "react";
import styles from "./DietarySelector.module.css"; // Import CSS module for styling

type DietarySelectorProps = {
  selectedRestrictions: string[];
  onChange: (restrictions: string[]) => void;
};

const DietarySelector: React.FC<DietarySelectorProps> = ({
  selectedRestrictions,
  onChange,
}) => {
  const [localRestrictions, setLocalRestrictions] =
    useState<string[]>(selectedRestrictions);

  // List of dietary restriction options
  const dietaryOptions = [
    "Vegetarian",
    "Vegan",
    "Gluten-Free",
    "Dairy-Free",
    "Nut-Free",
    "Halal",
    "Kosher",
  ];

  // Handle checkbox changes
  const handleCheckboxChange = (restriction: string) => {
    const updatedRestrictions = localRestrictions.includes(restriction)
      ? localRestrictions.filter((r) => r !== restriction)
      : [...localRestrictions, restriction];

    setLocalRestrictions(updatedRestrictions);
    onChange(updatedRestrictions); // Notify parent about the updated restrictions
  };

  return (
    <div className={styles.dietaryContainer}>
      {dietaryOptions.map((option) => (
        <label key={option} className={styles.checkboxLabel}>
          <input
            type="checkbox"
            value={option}
            checked={localRestrictions.includes(option)}
            onChange={() => handleCheckboxChange(option)}
          />
          {option}
        </label>
      ))}
    </div>
  );
};

export default DietarySelector;
