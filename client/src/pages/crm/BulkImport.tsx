import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useParams } from "wouter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Download,
  Upload,
  Globe,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  FileText,
  Database,
  Zap,
  Link,
} from "lucide-react";

interface ScrapingResult {
  success: boolean;
  url: string;
  enterprise?: {
    name: string;
    description: string;
    category: string;
    location: string;
    website: string;
    contactEmail: string;
    tags: string[];
    sourceUrl: string;
  };
  error?: string;
}

interface ImportResponse {
  processed: number;
  imported: number;
  failed: number;
  errors: string[];
  details?: ScrapingResult[];
  sourceUrlsFound?: number;
  message?: string;
}

export default function BulkImport() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { enterpriseId } = useParams<{ enterpriseId: string }>();
  const [urlsText, setUrlsText] = useState("");
  const [importResults, setImportResults] = useState<ImportResponse | null>(null);
  const [previewResults, setPreviewResults] = useState<ScrapingResult[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const urlImportMutation = useMutation({
    mutationFn: async (urls: string[]): Promise<ImportResponse> => {
      const response = await apiRequest("POST", `/api/crm/${enterpriseId}/bulk-import/urls`, { urls });
      return response as unknown as ImportResponse;
    },
    onSuccess: (data: ImportResponse) => {
      setImportResults(data);
      queryClient.invalidateQueries({ queryKey: ["/api/enterprises"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm", enterpriseId, "stats"] });
      toast({
        title: "Import Complete",
        description: `Imported ${data.imported} enterprises, ${data.failed} failed`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to import from URLs",
        variant: "destructive",
      });
    },
  });

  const regenerativeSourcesMutation = useMutation({
    mutationFn: async (): Promise<ImportResponse> => {
      const response = await apiRequest("POST", `/api/crm/${enterpriseId}/bulk-import/regenerative-sources`, {});
      return response as unknown as ImportResponse;
    },
    onSuccess: (data: ImportResponse) => {
      setImportResults(data);
      queryClient.invalidateQueries({ queryKey: ["/api/enterprises"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm", enterpriseId, "stats"] });
      toast({
        title: "Source Import Complete",
        description: data.message || `Imported ${data.imported} enterprises from regenerative sources`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to import from regenerative sources",
        variant: "destructive",
      });
    },
  });

  const previewMutation = useMutation({
    mutationFn: async (url: string): Promise<ScrapingResult> => {
      const response = await apiRequest("POST", `/api/crm/${enterpriseId}/scrape-url`, { url });
      return response as unknown as ScrapingResult;
    },
    onSuccess: (data: ScrapingResult) => {
      setPreviewResults([data]);
      setIsPreviewOpen(true);
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to preview URL",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const handleUrlImport = () => {
    const urls = urlsText
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);

    if (urls.length === 0) {
      toast({
        title: "Error",
        description: "Please enter at least one URL",
        variant: "destructive",
      });
      return;
    }

    if (urls.length > 50) {
      toast({
        title: "Error", 
        description: "Please limit to 50 URLs per batch",
        variant: "destructive",
      });
      return;
    }

    urlImportMutation.mutate(urls);
  };

  const handleRegenerativeSourcesImport = () => {
    regenerativeSourcesMutation.mutate();
  };

  const handlePreviewUrl = () => {
    const urls = urlsText
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);

    if (urls.length === 0) {
      toast({
        title: "Error",
        description: "Please enter a URL to preview",
        variant: "destructive",
      });
      return;
    }

    previewMutation.mutate(urls[0]);
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="w-4 h-4 text-green-600" />
    ) : (
      <XCircle className="w-4 h-4 text-red-600" />
    );
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'land_projects':
        return 'bg-green-100 text-green-800';
      case 'capital_sources':
        return 'bg-yellow-100 text-yellow-800';
      case 'open_source_tools':
        return 'bg-blue-100 text-blue-800';
      case 'network_organizers':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };


  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
              <Download className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground font-lato">Bulk Import</h1>
          </div>
          <p className="text-muted-foreground">Import enterprises from URLs and external data sources</p>
        </div>
        <Button
          onClick={() => {
            setImportResults(null);
            setUrlsText("");
          }}
          variant="outline"
          data-testid="button-clear-results"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Clear Results
        </Button>
      </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Import Tools */}
          <div className="space-y-6">
            <Tabs defaultValue="urls" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="urls" data-testid="tab-urls">
                  <Link className="w-4 h-4 mr-2" />
                  URLs
                </TabsTrigger>
                <TabsTrigger value="sources" data-testid="tab-sources">
                  <Database className="w-4 h-4 mr-2" />
                  Sources
                </TabsTrigger>
              </TabsList>

              {/* URL Import Tab */}
              <TabsContent value="urls" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-lato">Import from URLs</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Enterprise URLs (one per line, max 50)
                      </label>
                      <Textarea
                        placeholder={`https://example.com/about
https://regenerativefarm.org
https://impact-fund.com/mission
...`}
                        value={urlsText}
                        onChange={(e) => setUrlsText(e.target.value)}
                        className="min-h-[200px] font-mono text-sm"
                        data-testid="textarea-urls"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {urlsText.split('\n').filter(url => url.trim()).length} URLs entered
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        onClick={handlePreviewUrl}
                        variant="outline"
                        disabled={!urlsText.trim() || previewMutation.isPending}
                        data-testid="button-preview-url"
                      >
                        {previewMutation.isPending ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Previewing...
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4 mr-2" />
                            Preview First
                          </>
                        )}
                      </Button>
                      
                      <Button
                        onClick={handleUrlImport}
                        disabled={!urlsText.trim() || urlImportMutation.isPending}
                        className="flex-1"
                        data-testid="button-import-urls"
                      >
                        {urlImportMutation.isPending ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Import All URLs
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Regenerative Sources Tab */}
              <TabsContent value="sources" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-lato">Regenerative Data Sources</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <p className="font-medium">Permaculture Global</p>
                          <p className="text-sm text-muted-foreground">Regenerative farming projects worldwide</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          <Globe className="w-3 h-3 mr-1" />
                          Global
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <p className="font-medium">OpenSustain Tech</p>
                          <p className="text-sm text-muted-foreground">Open source sustainability tools</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          <Globe className="w-3 h-3 mr-1" />
                          Global
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <p className="font-medium">Regeneration International</p>
                          <p className="text-sm text-muted-foreground">Regenerative agriculture farmers</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          <Globe className="w-3 h-3 mr-1" />
                          Global
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <p className="font-medium">EarthCare Collective</p>
                          <p className="text-sm text-muted-foreground">Network organizations and communities</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          <Globe className="w-3 h-3 mr-1" />
                          Global
                        </Badge>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <Button
                        onClick={handleRegenerativeSourcesImport}
                        disabled={regenerativeSourcesMutation.isPending}
                        className="w-full"
                        data-testid="button-import-sources"
                      >
                        {regenerativeSourcesMutation.isPending ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Discovering & Importing...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            Import from All Sources
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        This will automatically discover and import up to 50 enterprises
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Import Results */}
          <div className="space-y-6">
            {importResults ? (
              <Card>
                <CardHeader>
                  <CardTitle className="font-lato">Import Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-foreground">{importResults.processed}</div>
                        <div className="text-xs text-muted-foreground">Processed</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{importResults.imported}</div>
                        <div className="text-xs text-muted-foreground">Imported</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{importResults.failed}</div>
                        <div className="text-xs text-muted-foreground">Failed</div>
                      </div>
                    </div>

                    {/* Success Rate */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Success Rate</span>
                        <span>{Math.round((importResults.imported / importResults.processed) * 100)}%</span>
                      </div>
                      <Progress 
                        value={Math.round((importResults.imported / importResults.processed) * 100)} 
                        className="h-2" 
                      />
                    </div>

                    {/* Additional Info */}
                    {importResults.sourceUrlsFound && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Discovery:</strong> Found {importResults.sourceUrlsFound} total URLs from regenerative sources
                        </p>
                      </div>
                    )}

                    {importResults.message && (
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <p className="text-sm text-primary">{importResults.message}</p>
                      </div>
                    )}

                    {/* Detailed Results */}
                    {importResults.details && importResults.details.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3">Detailed Results</h4>
                        <ScrollArea className="h-[300px]">
                          <div className="space-y-2">
                            {importResults.details.map((result, index) => (
                              <div 
                                key={index}
                                className={`p-3 rounded-lg border ${
                                  result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                                }`}
                                data-testid={`import-result-${index}`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      {getStatusIcon(result.success)}
                                      <span className="text-sm font-medium truncate">
                                        {result.enterprise?.name || result.url}
                                      </span>
                                    </div>
                                    {result.success && result.enterprise && (
                                      <div className="space-y-1">
                                        <div className="flex items-center space-x-2">
                                          <Badge className={`text-xs ${getCategoryColor(result.enterprise.category)}`}>
                                            {result.enterprise.category.replace('_', ' ')}
                                          </Badge>
                                          {result.enterprise.location && (
                                            <span className="text-xs text-muted-foreground">
                                              {result.enterprise.location}
                                            </span>
                                          )}
                                        </div>
                                        {result.enterprise.description && (
                                          <p className="text-xs text-muted-foreground line-clamp-2">
                                            {result.enterprise.description}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                    {!result.success && result.error && (
                                      <p className="text-xs text-red-600">{result.error}</p>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(result.url, "_blank")}
                                    data-testid={`button-view-source-${index}`}
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}

                    {/* Error List */}
                    {importResults.errors && importResults.errors.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                          Errors ({importResults.errors.length})
                        </h4>
                        <ScrollArea className="h-[200px]">
                          <div className="space-y-2">
                            {importResults.errors.map((error, index) => (
                              <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                                {error}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Upload className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Ready to Import</h3>
                  <p className="text-muted-foreground">
                    Enter URLs or use regenerative sources to import enterprises
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Best Practices */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-lato">Best Practices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Use direct links to organization pages with clear mission statements</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Ensure URLs contain company information, not just landing pages</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Preview URLs first to check data quality before bulk import</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Import in smaller batches (10-20 URLs) for better success rates</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span>Some sites may block automated access - manual entry may be needed</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Preview Dialog */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-lato">URL Preview</DialogTitle>
            </DialogHeader>
            {previewResults.length > 0 && (
              <div className="space-y-4">
                {previewResults.map((result, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(result.success)}
                      <span className="text-sm font-medium">{result.url}</span>
                    </div>
                    
                    {result.success && result.enterprise ? (
                      <div className="p-4 border border-border rounded-lg space-y-3">
                        <div>
                          <h4 className="font-semibold">{result.enterprise.name}</h4>
                          <Badge className={`text-xs mt-1 ${getCategoryColor(result.enterprise.category)}`}>
                            {result.enterprise.category.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        {result.enterprise.description && (
                          <p className="text-sm text-muted-foreground">
                            {result.enterprise.description}
                          </p>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {result.enterprise.location && (
                            <div>
                              <span className="font-medium">Location:</span> {result.enterprise.location}
                            </div>
                          )}
                          {result.enterprise.website && (
                            <div>
                              <span className="font-medium">Website:</span>{" "}
                              <a
                                href={result.enterprise.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                {result.enterprise.website}
                              </a>
                            </div>
                          )}
                          {result.enterprise.contactEmail && (
                            <div>
                              <span className="font-medium">Email:</span> {result.enterprise.contactEmail}
                            </div>
                          )}
                        </div>
                        
                        {result.enterprise.tags && result.enterprise.tags.length > 0 && (
                          <div>
                            <span className="font-medium text-sm">Tags:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {result.enterprise.tags.map((tag, tagIndex) => (
                                <Badge key={tagIndex} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                        <p className="text-sm text-red-700">
                          <strong>Error:</strong> {result.error}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                    Close
                  </Button>
                  {previewResults[0]?.success && (
                    <Button onClick={handleUrlImport} disabled={urlImportMutation.isPending}>
                      Import This URL
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
    </>
  );
}
