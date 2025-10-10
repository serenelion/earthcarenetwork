import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onCategorySelect?: (category: string | null) => void;
  "data-testid"?: string;
}

export default function SearchBar({ value, onChange, onCategorySelect, "data-testid": testId }: SearchBarProps) {
  const handleSearch = () => {
    // Search functionality is handled by the parent component through onChange
    if (onCategorySelect) {
      onCategorySelect(null); // Clear any category filter when searching
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="max-w-2xl mx-auto mb-8">
      <div className="relative">
        <Input
          type="text"
          placeholder="Discover enterprises aligned with your mission..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-full px-4 py-4 pl-12 text-foreground bg-card rounded-lg shadow-lg border border-border focus:ring-2 focus:ring-ring focus:border-ring"
          data-testid={testId ? `${testId}-input` : "search-input"}
        />
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Button 
          onClick={handleSearch}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary text-primary-foreground px-6 py-2 hover:bg-primary/90"
          data-testid={testId ? `${testId}-button` : "search-button"}
        >
          Search
        </Button>
      </div>
    </div>
  );
}
