// import DietarySelector from "./DietarySelector";

interface SearchFiltersProps {
  query: string;
  setQuery: (query: string) => void;
  dietaryRestrictions: string[];
  setDietaryRestrictions: (restrictions: string[]) => void;
  maxCookTime: number | null;
  setMaxCookTime: (time: number | null) => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  query,
  setQuery,
  dietaryRestrictions,
  setDietaryRestrictions,
  maxCookTime,
  setMaxCookTime,
}) => {
  return (
    <div className="mb-8 p-4 bg-white rounded-lg shadow">
      <div className="mb-4">
        <label htmlFor="search" className="block text-sm font-medium text-gray-700">
          Search Recipes
        </label>
        <input
          type="text"
          id="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Enter keywords (e.g., pasta, chicken)"
        />
      </div>

      {/* <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Dietary Restrictions
        </label>
        <DietarySelector
          selectedRestrictions={dietaryRestrictions}
          onChange={setDietaryRestrictions}
        />
      </div> */}

      <div>
        <label htmlFor="cookTime" className="block text-sm font-medium text-gray-700">
          Maximum Cooking Time (minutes)
        </label>
        <input
          type="number"
          id="cookTime"
          value={maxCookTime || ''}
          onChange={(e) => setMaxCookTime(e.target.value ? Number(e.target.value) : null)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          min="0"
        />
      </div>
    </div>
  );
};

export default SearchFilters; 