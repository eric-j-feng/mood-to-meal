interface CitySelectorProps {
    city: string | null;
    setCity: (city: string) => void;
  }
  
  export default function CitySelector({ city, setCity }: CitySelectorProps) {
    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      setCity(e.target.value); // Update city value
    };
  
    return (
      <input
        type="text"
        value={city || ""}
        onChange={handleInput}
        className="border p-2 rounded w-full"
        placeholder="e.g., New York"
      />
    );
  }
  