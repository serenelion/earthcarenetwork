import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon, Building2, Users, Target, Calendar, FileText, Clock, TrendingUp, ArrowRight, Loader2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

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
  { value: 'all', label: 'All', icon: SearchIcon },
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

export default function Search() {
  const [location, setLocation] = useLocation();
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const initialQuery = urlParams.get('q') || '';
  const initialFilter = urlParams.get('filter') || 'all';
  
  const [query, setQuery] = useState(initialQuery);
  const [selectedFilter, setSelectedFilter] = useState(initialFilter);
  const debouncedQuery = useDebounce(query, 300);
  const { recentSearches, addRecentSearch, clearRecentSearches } = useRecentSearches();

  const shouldSearch = debouncedQuery.length >= 2;

  // Read URL params and update state when location changes
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    const urlQuery = params.get('q') || '';
    const urlFilter = params.get('filter') || 'all';
    
    if (urlQuery !== query) {
      setQuery(urlQuery);
    }
    if (urlFilter !== selectedFilter) {
      setSelectedFilter(urlFilter);
    }
  }, [location]);

  // Update URL when query or filter changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) {
      params.set('q', debouncedQuery);
    }
    if (selectedFilter !== 'all') {
      params.set('filter', selectedFilter);
    }
    const newUrl = params.toString() ? `/search?${params.toString()}` : '/search';
    if (location !== newUrl) {
      window.history.replaceState({}, '', newUrl);
    }
  }, [debouncedQuery, selectedFilter]);

  // Auto-focus search input on page load
  useEffect(() => {
    const input = document.getElementById('search-input');
    if (input) {
      input.focus();
    }
  }, []);

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
    staleTime: 30000,
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

  const handleResultClick = useCallback((result: SearchResult) => {
    addRecentSearch(query);

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
  }, [query, addRecentSearch, setLocation]);

  const handleRecentSearchSelect = (searchQuery: string) => {
    setQuery(searchQuery);
  };

  const handleClearQuery = () => {
    setQuery('');
    const input = document.getElementById('search-input');
    if (input) {
      input.focus();
    }
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

  const renderSearchResult = (result: SearchResult) => {
    const Icon = getEntityIcon(result.entityType);
    
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
      <Card
        key={`${result.entityType}-${result.id}`}
        data-testid={`search-result-${result.entityType}-${result.id}`}
        className="hover:shadow-md transition-shadow cursor-pointer group"
        onClick={() => handleResultClick(result)}
      >
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted flex-shrink-0">
              <Icon className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors" data-testid={`result-title-${result.id}`}>
                  {title}
                </h3>
                <Badge variant="secondary" className={`text-xs ${getEntityColor(result.entityType)}`}>
                  {result.entityType}
                </Badge>
              </div>
              {subtitle && (
                <p className="text-sm text-muted-foreground mb-2">
                  {subtitle}
                </p>
              )}
              {result.matchContext && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {result.matchContext}
                </p>
              )}
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderResultsSection = (results: SearchResult[], sectionTitle: string, testId: string) => {
    if (results.length === 0) return null;

    return (
      <div className="mb-8" data-testid={testId}>
        <h2 className="text-xl font-semibold mb-4 text-foreground">{sectionTitle}</h2>
        <div className="space-y-3">
          {results.map(result => renderSearchResult(result))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-foreground" data-testid="page-title">Search</h1>
          <p className="text-muted-foreground" data-testid="page-description">
            Search across enterprises, people, opportunities, tasks, and documentation
          </p>
        </div>

        {/* Search Input */}
        <div className="mb-6">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-muted-foreground" />
            <Input
              id="search-input"
              type="text"
              placeholder="Search enterprises, people, opportunities..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-14 pl-14 pr-12 text-lg border-2 focus:ring-2 focus:ring-primary"
              data-testid="search-input"
            />
            {query && (
              <button
                onClick={handleClearQuery}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                data-testid="clear-search-button"
                aria-label="Clear search"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filters */}
        <div className="mb-8 flex flex-wrap gap-2" data-testid="search-filters">
          {ENTITY_FILTERS.map((filter) => {
            const Icon = filter.icon;
            return (
              <Button
                key={filter.value}
                variant={selectedFilter === filter.value ? "default" : "outline"}
                size="default"
                className="h-10 px-4"
                onClick={() => setSelectedFilter(filter.value)}
                data-testid={`filter-${filter.value}`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {filter.label}
              </Button>
            );
          })}
        </div>

        {/* Search Results */}
        <div data-testid="search-results">
          {isLoading && shouldSearch && (
            <div className="space-y-3" data-testid="loading-skeleton">
              {[1, 2, 3, 4].map(i => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-6 w-48 mb-2" />
                        <Skeleton className="h-4 w-64 mb-2" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {isError && shouldSearch && (
            <Card data-testid="search-error">
              <CardContent className="p-12 text-center">
                <SearchIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Search Failed</h3>
                <p className="text-muted-foreground">
                  We couldn't complete your search. Please try again.
                </p>
              </CardContent>
            </Card>
          )}

          {!shouldSearch && recentSearches.length > 0 && (
            <Card data-testid="recent-searches">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Recent Searches
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearRecentSearches}
                    data-testid="clear-recent-searches"
                  >
                    Clear
                  </Button>
                </div>
                <div className="space-y-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={`recent-${index}`}
                      onClick={() => handleRecentSearchSelect(search)}
                      className="w-full text-left px-4 py-3 rounded-md hover:bg-muted transition-colors flex items-center gap-3"
                      data-testid={`recent-search-${index}`}
                    >
                      <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="flex-1">{search}</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {shouldSearch && searchResults && searchResults.totalResults === 0 && (
            <Card data-testid="no-results">
              <CardContent className="p-12 text-center">
                <SearchIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground mb-4">
                  We couldn't find anything matching "{query}"
                </p>
                <p className="text-sm text-muted-foreground">
                  Try searching for enterprises, people, or opportunities with different keywords.
                </p>
              </CardContent>
            </Card>
          )}

          {shouldSearch && searchResults && searchResults.totalResults > 0 && (
            <div>
              {renderResultsSection(searchResults.enterprises, 'Enterprises', 'enterprises-results')}
              {renderResultsSection(searchResults.people, 'People', 'people-results')}
              {renderResultsSection(searchResults.opportunities, 'Opportunities', 'opportunities-results')}
              {renderResultsSection(searchResults.tasks, 'Tasks', 'tasks-results')}
              {renderResultsSection(searchResults.documentation || [], 'Documentation', 'documentation-results')}
              
              <Card className="mt-8 bg-muted/30" data-testid="search-summary">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Found {searchResults.totalResults} result{searchResults.totalResults !== 1 ? 's' : ''} for "{query}"
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {!shouldSearch && recentSearches.length === 0 && (
            <Card data-testid="search-prompt">
              <CardContent className="p-12 text-center">
                <SearchIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h2 className="text-2xl font-semibold mb-2">Search across everything</h2>
                <p className="text-muted-foreground mb-6">
                  Find enterprises, people, opportunities, and tasks instantly.
                </p>
                <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>Smart suggestions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Recent searches</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>Documentation</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
