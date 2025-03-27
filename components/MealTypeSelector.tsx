interface MealSelectorProps {
    meal: string | null;
    setMeal: (meal: string) => void;
  }
  
  const mealOptions = ["Breakfast", "Lunch", "Dinner", "Snack", "Dessert"];
  
  export default function MealSelector({ meal, setMeal }: MealSelectorProps) {
    const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setMeal(e.target.value);
    };
  
    return (
      <select
        value={meal || ""}
        onChange={handleSelect}
        className="border p-2 rounded w-full"
      >
        <option value="" disabled>
          Select a meal
        </option>
        {mealOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }