interface CookTimeSelectorProps {
    cookTime: string | null;
    setCookTime: (cookTime: string) => void;
  }
  
  export default function CookTimeSelector({ cookTime, setCookTime }: CookTimeSelectorProps) {
    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      setCookTime(e.target.value); // Update cook time value
    };
  
    return (
      <input
        type="number"
        value={cookTime || ""}
        onChange={handleInput}
        className="border p-2 rounded w-full"
        placeholder="e.g, 30"
      />
    );
  }
  