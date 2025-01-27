interface StateSelectorProps {
    state: string | null;
    setState: (state: string) => void;
  }
  
  export default function StateSelector({ state, setState }: StateSelectorProps) {
    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      setState(e.target.value); // Update state value
    };
  
    return (
      <input
        type="text"
        value={state || ""}
        onChange={handleInput}
        className="border p-2 rounded w-full"
        placeholder="e.g., NY"
      />
    );
  }
  