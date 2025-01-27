import {useState} from 'react';
import styles from "./MoodSelector.module.css"; // Import CSS module for styling

type MoodSelectorProps = {
  onMoodSelect: (mood: string) => void; // Function to handle mood selection
}; 

const MoodSelector: React.FC<MoodSelectorProps> = ({ onMoodSelect }) => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  // Define available moods
  const moods = [
    { id: "happy", label: "Happy 😊" },
    { id: "tired", label: "Tired 😴" },
    { id: "stressed", label: "Stressed 😰" },
    { id: "neutral", label: "Neutral 😐" },
  ];

  // Handle mood selection
  const handleMoodClick = (mood: string) => {
    setSelectedMood(mood); // Update local state
    onMoodSelect(mood); // Notify parent about selected mood
  };

  return (
    <div className={styles.moodContainer}>
      {moods.map((mood) => (
        <button
          key={mood.id}
          className={`${styles.moodButton} ${
            selectedMood === mood.id ? styles.active : ""
          }`}
          onClick={() => handleMoodClick(mood.id)}
        >
          {mood.label}
        </button>
      ))}
    </div>
  );
};

export default MoodSelector;
