import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Search, Building2, Users, Target, Calendar, FileText, Clock, TrendingUp, ArrowRight, Loader2 } from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchResult {
  id: string;
  entityType: 'enterprise' | 'person' | 'opportunity' | 'task' | 'documentation';
  matchContext?: string;
  [key: string]: any;
}

interface SearchResponse {
  enterprises: Array<SearchResult>;
  people: Array<SearchResult>;
  opportunities: Array<SearchResult>;
  tasks: Array<SearchResult>;
  documentation?: Array<SearchResult>;
  totalResults: number;
}

const ENTITY_FILTERS = [
  { value: 'all', label: 'All', icon: Search },
  { value: 'enterprises', label: 'Enterprises', icon: Building2 },
  { value: 'people', label: 'People', icon: Users },
  { value: 'opportunities', label: 'Opportunities', icon: Target },
  { value: 'tasks', label: 'Tasks', icon: Calendar },
  { value: 'documentation', label: 'Documentation', icon: FileText },
];

const RECENT_SEARCHES_KEY = 'earth-network-recent-searches';
const MAX_RECENT_SEARCHES = 5;

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const addRecentSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    
    setRecentSearches(prev => {
      const filtered = prev.filter(search => search !== query);
      const updated = [query, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  }, []);

  return { recentSearches, addRecentSearch, clearRecentSearches };
}

export default function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const debouncedQuery = useDebounce(query, 300);
  const { recentSearches, addRecentSearch, clearRecentSearches } = useRecentSearches();

  const shouldSearch = debouncedQuery.length >= 2;

  // Documentation search data (client-side)
  const documentationPages = useMemo(() => [
    { id: 'overview', title: 'API Overview', path: '/docs/api', description: 'Complete reference for the Earth Care Network API' },
    { id: 'getting-started', title: 'Getting Started', path: '/docs/guides/getting-started', description: 'Quick start guide to build your first application' },
    { id: 'authentication', title: 'Authentication', path: '/docs/guides/authentication', description: 'Learn how to authenticate with our API' },
    { id: 'first-api-call', title: 'First API Call', path: '/docs/guides/first-api-call', description: 'Make your first request to our API' },
    { id: 'enterprises-api', title: 'Enterprises API', path: '/docs/api/enterprises', description: 'Manage enterprise directory with full CRUD operations' },
    { id: 'people-api', title: 'People API', path: '/docs/api/people', description: 'Handle contacts and relationships' },
    { id: 'opportunities-api', title: 'Opportunities API', path: '/docs/api/opportunities', description: 'Track leads and sales pipeline' },
    { id: 'tasks-api', title: 'Tasks API', path: '/docs/api/tasks', description: 'Project management and task tracking' },
    { id: 'search-api', title: 'Search API', path: '/docs/api/search', description: 'Global search across all entities' },
    { id: 'ai-copilot-api', title: 'AI Copilot API', path: '/docs/api/ai-copilot', description: 'AI-powered insights and suggestions' },
    { id: 'auth-api', title: 'Authentication API', path: '/docs/api/authentication', description: 'API reference for authentication endpoints' },
  ], []);

  // Perform documentation search
  const documentationResults = useMemo(() => {
    if (!shouldSearch || selectedFilter === 'enterprises' || selectedFilter === 'people' || selectedFilter === 'opportunities' || selectedFilter === 'tasks') {
      return [];
    }

    const searchTerm = debouncedQuery.toLowerCase();
    return documentationPages
      .filter(page => 
        page.title.toLowerCase().includes(searchTerm) || 
        page.description.toLowerCase().includes(searchTerm) ||
        page.path.toLowerCase().includes(searchTerm)
      )
      .map(page => ({
        id: page.id,
        entityType: 'documentation' as const,
        title: page.title,
        description: page.description,
        path: page.path,
        matchContext: page.description,
      }));
  }, [debouncedQuery, selectedFilter, shouldSearch, documentationPages]);

  const { data: apiSearchResults, isLoading, isError } = useQuery<SearchResponse>({
    queryKey: ['/api/search', debouncedQuery, selectedFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        q: debouncedQuery,
      });
      
      // Add type parameter only if not 'all' and not documentation-only
      if (selectedFilter !== 'all' && selectedFilter !== 'documentation') {
        params.append('type', selectedFilter);
      }
      
      const response = await fetch(`/api/search?${params}`);
      if (!response.ok) {
        throw new Error('Search failed');
      }
      return response.json();
    },
    enabled: shouldSearch && selectedFilter !== 'documentation',
    staleTime: 30000, // 30 seconds
    retry: 1,
  });

  // Combine API results with documentation results
  const searchResults = useMemo(() => {
    const apiResults = apiSearchResults || { enterprises: [], people: [], opportunities: [], tasks: [], totalResults: 0 };
    return {
      ...apiResults,
      documentation: documentationResults,
      totalResults: apiResults.totalResults + documentationResults.length,
    };
  }, [apiSearchResults, documentationResults]);

  // Flatten results for keyboard navigation
  const allResults = useMemo(() => {
    if (!searchResults) return [];
    
    const results: Array<SearchResult & { sectionTitle: string }> = [];
    
    if (searchResults.enterprises.length > 0) {
      results.push(...searchResults.enterprises.map(r => ({ ...r, sectionTitle: 'Enterprises' })));
    }
    if (searchResults.people.length > 0) {
      results.push(...searchResults.people.map(r => ({ ...r, sectionTitle: 'People' })));
    }
    if (searchResults.opportunities.length > 0) {
      results.push(...searchResults.opportunities.map(r => ({ ...r, sectionTitle: 'Opportunities' })));
    }
    if (searchResults.tasks.length > 0) {
      results.push(...searchResults.tasks.map(r => ({ ...r, sectionTitle: 'Tasks' })));
    }
    if (searchResults.documentation && searchResults.documentation.length > 0) {
      results.push(...searchResults.documentation.map(r => ({ ...r, sectionTitle: 'Documentation' })));
    }
    
    return results;
  }, [searchResults]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [allResults]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (allResults[selectedIndex]) {
            handleResultSelect(allResults[selectedIndex]);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, allResults, selectedIndex]);

  const handleResultSelect = useCallback((result: SearchResult) => {
    addRecentSearch(query);
    onOpenChange(false);
    setQuery('');

    // Navigate to the appropriate page based on entity type
    switch (result.entityType) {
      case 'enterprise':
        setLocation(`/enterprises?highlight=${result.id}`);
        break;
      case 'person':
        setLocation(`/people?highlight=${result.id}`);
        break;
      case 'opportunity':
        setLocation(`/opportunities?highlight=${result.id}`);
        break;
      case 'task':
        setLocation(`/tasks?highlight=${result.id}`);
        break;
      case 'documentation':
        setLocation(result.path);
        break;
    }
  }, [query, addRecentSearch, onOpenChange, setLocation]);

  const handleRecentSearchSelect = (searchQuery: string) => {
    setQuery(searchQuery);
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'enterprise': return Building2;
      case 'person': return Users;
      case 'opportunity': return Target;
      case 'task': return Calendar;
      case 'documentation': return FileText;
      default: return FileText;
    }
  };

  const getEntityColor = (entityType: string) => {
    switch (entityType) {
      case 'enterprise': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'person': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'opportunity': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'task': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'documentation': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const renderSearchResult = (result: SearchResult, index: number) => {
    const Icon = getEntityIcon(result.entityType);
    const isSelected = index === selectedIndex;
    
    let title = '';
    let subtitle = '';
    
    switch (result.entityType) {
      case 'enterprise':
        title = result.name;
        subtitle = result.location || result.category;
        break;
      case 'person':
        title = `${result.firstName} ${result.lastName}`;
        subtitle = result.title || result.email;
        break;
      case 'opportunity':
        title = result.title;
        subtitle = result.status;
        break;
      case 'task':
        title = result.title;
        subtitle = result.status;
        break;
      case 'documentation':
        title = result.title;
        subtitle = result.description;
        break;
    }

    return (
      <CommandItem
        key={`${result.entityType}-${result.id}`}
        data-testid={`search-result-${result.entityType}-${result.id}`}
        className={`flex items-center gap-3 p-3 cursor-pointer rounded-md transition-all ${
          isSelected ? 'bg-accent text-accent-foreground' : ''
        }`}
        onSelect={() => handleResultSelect(result)}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate" data-testid={`result-title-${result.id}`}>
              {title}
            </p>
            <Badge variant="secondary" className={`text-xs ${getEntityColor(result.entityType)}`}>
              {result.entityType}
            </Badge>
          </div>
          {subtitle && (
            <p className="text-sm text-muted-foreground truncate">
              {subtitle}
            </p>
          )}
          {result.matchContext && (
            <p className="text-xs text-muted-foreground truncate mt-1">
              {result.matchContext}
            </p>
          )}
        </div>
        <ArrowRight className="w-4 h-4 opacity-50" />
      </CommandItem>
    );
  };

  const renderLoadingSkeleton = () => (
    <div className="p-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <CommandDialog 
      open={open} 
      onOpenChange={onOpenChange}
      data-testid="global-search-dialog"
    >
      <div className="flex items-center border-b px-3" data-testid="search-input-container">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <CommandInput
          placeholder="Search enterprises, people, opportunities..."
          value={query}
          onValueChange={setQuery}
          className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          data-testid="search-input"
        />
        <div className="ml-2 flex items-center gap-1">
          <kbd className="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground opacity-100">
            ESC
          </kbd>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/10" data-testid="search-filters">
        {ENTITY_FILTERS.map((filter) => {
          const Icon = filter.icon;
          return (
            <Button
              key={filter.value}
              variant={selectedFilter === filter.value ? "default" : "ghost"}
              size="sm"
              className="h-7 px-3 text-xs"
              disabled={filter.disabled}
              onClick={() => setSelectedFilter(filter.value)}
              data-testid={`filter-${filter.value}`}
            >
              <Icon className="w-3 h-3 mr-1" />
              {filter.label}
            </Button>
          );
        })}
      </div>

      <CommandList data-testid="search-results">
        {isLoading && shouldSearch && renderLoadingSkeleton()}
        
        {isError && shouldSearch && (
          <div className="p-6 text-center text-muted-foreground" data-testid="search-error">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Search failed. Please try again.</p>
          </div>
        )}

        {!shouldSearch && recentSearches.length > 0 && (
          <CommandGroup heading="Recent Searches" data-testid="recent-searches">
            {recentSearches.map((search, index) => (
              <CommandItem
                key={`recent-${index}`}
                onSelect={() => handleRecentSearchSelect(search)}
                className="flex items-center gap-3 p-3"
                data-testid={`recent-search-${index}`}
              >
                <Clock className="w-4 h-4 opacity-50" />
                <span className="flex-1">{search}</span>
              </CommandItem>
            ))}
            <div className="px-3 py-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={clearRecentSearches}
                data-testid="clear-recent-searches"
              >
                Clear recent searches
              </Button>
            </div>
          </CommandGroup>
        )}

        {shouldSearch && searchResults && searchResults.totalResults === 0 && (
          <CommandEmpty data-testid="no-results">
            <div className="p-6 text-center text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="mb-2">No results found for "{query}"</p>
              <p className="text-sm">Try searching for enterprises, people, or opportunities.</p>
            </div>
          </CommandEmpty>
        )}

        {shouldSearch && searchResults && searchResults.totalResults > 0 && (
          <>
            {searchResults.enterprises.length > 0 && (
              <CommandGroup heading="Enterprises" data-testid="enterprises-results">
                {searchResults.enterprises.map((result, index) => 
                  renderSearchResult(result, allResults.findIndex(r => r.id === result.id))
                )}
              </CommandGroup>
            )}

            {searchResults.people.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="People" data-testid="people-results">
                  {searchResults.people.map((result, index) => 
                    renderSearchResult(result, allResults.findIndex(r => r.id === result.id))
                  )}
                </CommandGroup>
              </>
            )}

            {searchResults.opportunities.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Opportunities" data-testid="opportunities-results">
                  {searchResults.opportunities.map((result, index) => 
                    renderSearchResult(result, allResults.findIndex(r => r.id === result.id))
                  )}
                </CommandGroup>
              </>
            )}

            {searchResults.tasks.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Tasks" data-testid="tasks-results">
                  {searchResults.tasks.map((result, index) => 
                    renderSearchResult(result, allResults.findIndex(r => r.id === result.id))
                  )}
                </CommandGroup>
              </>
            )}

            {searchResults.totalResults > allResults.length && (
              <div className="px-3 py-2 border-t bg-muted/10" data-testid="search-summary">
                <p className="text-xs text-muted-foreground text-center">
                  Showing {allResults.length} of {searchResults.totalResults} results
                </p>
              </div>
            )}
          </>
        )}

        {!shouldSearch && recentSearches.length === 0 && (
          <div className="p-6 text-center text-muted-foreground" data-testid="search-prompt">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="mb-2">Search across everything</p>
            <p className="text-sm">Find enterprises, people, opportunities, and tasks instantly.</p>
            <div className="flex items-center justify-center gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>Smart suggestions</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Recent searches</span>
              </div>
            </div>
          </div>
        )}
      </CommandList>
    </CommandDialog>
  );
}