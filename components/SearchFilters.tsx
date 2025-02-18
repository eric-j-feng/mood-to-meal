// import DietarySelector from "./DietarySelector";

interface SearchFiltersProps {
  query: string;
  setQuery: (query: string) => void;
  // dietaryRestrictions: string[];
  // setDietaryRestrictions: (restrictions: string[]) => void;
  maxCookTime: number | null;
  setMaxCookTime: (time: number | null) => void;
  onSearch: () => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  query,
  setQuery,
  // dietaryRestrictions,
  // setDietaryRestrictions,
  maxCookTime,
  setMaxCookTime,
  onSearch
}) => {
  return (
    <div className="mb-6 space-y-4">
      <div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search recipes..."
          className="p-2 border rounded"
        />
      </div> */}

      <div>
        <input
          type="number"
          value={maxCookTime || ''}
          onChange={(e) => setMaxCookTime(e.target.value ? Number(e.target.value) : null)}
          placeholder="Maximum cooking time (minutes)"
          className="p-2 border rounded"
        />
      </div>
      <button
        onClick={onSearch}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Update Search
      </button>
    </div>
  );
};

export default SearchFilters; 