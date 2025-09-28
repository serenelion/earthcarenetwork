import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bot,
  Lightbulb,
  Settings,
  TrendingUp,
  Target,
  BarChart3,
  Zap,
  Brain,
  Users,
  Building,
  Handshake,
  CheckSquare,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import ChatInterface from "@/components/ChatInterface";
import { insertCopilotContextSchema, type CopilotContext, type InsertCopilotContext } from "@shared/schema";
import { z } from "zod";

interface CopilotSuggestion {
  type: 'lead_scoring' | 'outreach' | 'partnership' | 'task_automation';
  title: string;
  description: string;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high';
  relatedEntityId?: string;
  relatedEntityType?: 'enterprise' | 'person' | 'opportunity';
}

interface LeadScoringResult {
  score: number;
  confidence: number;
  factors: string[];
  insights: string;
}

const contextFormSchema = insertCopilotContextSchema.extend({
  focusAreasText: z.string().optional(),
  leadScoringText: z.string().optional(),
  automationText: z.string().optional(),
});

type ContextFormData = z.infer<typeof contextFormSchema>;

export default function Copilot() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [isContextDialogOpen, setIsContextDialogOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<CopilotSuggestion | null>(null);
  const [leadScoreTarget, setLeadScoreTarget] = useState<{ enterpriseId: string; personId?: string } | null>(null);

  const contextForm = useForm<ContextFormData>({
    resolver: zodResolver(contextFormSchema),
    defaultValues: {
      focusAreas: [],
      leadScoringCriteria: {},
      automationRules: {},
      focusAreasText: "",
      leadScoringText: "",
      automationText: "",
    },
  });

  const { data: suggestions = [], isLoading: suggestionsLoading, refetch: refetchSuggestions, error: suggestionsError } = useQuery({
    queryKey: ["/api/crm/ai/suggestions"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Handle suggestions error
  useEffect(() => {
    if (suggestionsError && isUnauthorizedError(suggestionsError as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [suggestionsError, toast]);

  const { data: context, isLoading: contextLoading } = useQuery({
    queryKey: ["/api/crm/ai/context"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Handle context data update
  useEffect(() => {
    if (context) {
      contextForm.reset({
        focusAreas: context.focusAreas || [],
        leadScoringCriteria: context.leadScoringCriteria || {},
        automationRules: context.automationRules || {},
        focusAreasText: context.focusAreas?.join(', ') || "",
        leadScoringText: JSON.stringify(context.leadScoringCriteria || {}, null, 2),
        automationText: JSON.stringify(context.automationRules || {}, null, 2),
      });
    }
  }, [context, contextForm]);

  const { data: enterprises = [] } = useQuery({
    queryKey: ["/api/enterprises"],
    queryFn: async () => {
      const response = await fetch("/api/enterprises?limit=100");
      if (!response.ok) throw new Error("Failed to fetch enterprises");
      return response.json();
    },
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: people = [] } = useQuery({
    queryKey: ["/api/crm/people"],
    queryFn: async () => {
      const response = await fetch("/api/crm/people?limit=100");
      if (!response.ok) throw new Error("Failed to fetch people");
      return response.json();
    },
    enabled: isAuthenticated,
    retry: false,
  });

  const updateContextMutation = useMutation({
    mutationFn: async (data: InsertCopilotContext) => {
      return apiRequest("POST", "/api/crm/ai/context", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/ai/context"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/ai/suggestions"] });
      toast({
        title: "Success",
        description: "Copilot context updated successfully",
      });
      setIsContextDialogOpen(false);
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
        description: "Failed to update copilot context",
        variant: "destructive",
      });
    },
  });

  const generateLeadScoreMutation = useMutation({
    mutationFn: async (data: { enterpriseId: string; personId?: string }) => {
      return apiRequest("POST", "/api/crm/ai/lead-score", data);
    },
    onSuccess: (result: LeadScoringResult) => {
      toast({
        title: "Lead Score Generated",
        description: `Score: ${result.score}/100 (Confidence: ${Math.round(result.confidence * 100)}%)`,
      });
      setLeadScoreTarget(null);
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
        description: "Failed to generate lead score",
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

  const handleContextSubmit = (data: ContextFormData) => {
    const processedData: InsertCopilotContext = {
      userId: user?.id || "",
      focusAreas: data.focusAreasText 
        ? data.focusAreasText.split(',').map(area => area.trim()).filter(Boolean)
        : [],
      leadScoringCriteria: data.leadScoringText 
        ? (() => {
            try {
              return JSON.parse(data.leadScoringText);
            } catch {
              return {};
            }
          })()
        : {},
      automationRules: data.automationText
        ? (() => {
            try {
              return JSON.parse(data.automationText);
            } catch {
              return {};
            }
          })()
        : {},
    };

    updateContextMutation.mutate(processedData);
  };

  const handleGenerateLeadScore = () => {
    if (leadScoreTarget) {
      generateLeadScoreMutation.mutate(leadScoreTarget);
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'lead_scoring':
        return TrendingUp;
      case 'outreach':
        return Users;
      case 'partnership':
        return Handshake;
      case 'task_automation':
        return Zap;
      default:
        return Lightbulb;
    }
  };

  const getSuggestionColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-4 w-64"></div>
            <div className="h-32 bg-muted rounded mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded-xl"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold text-foreground font-lato">EarthCare Copilot</h1>
            </div>
            <p className="text-muted-foreground">AI-powered insights for regenerative enterprise management</p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => refetchSuggestions()}
              disabled={suggestionsLoading}
              data-testid="button-refresh-suggestions"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${suggestionsLoading ? 'animate-spin' : ''}`} />
              Refresh Insights
            </Button>
            <Dialog open={isContextDialogOpen} onOpenChange={setIsContextDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-configure-context">
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Context
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-lato">Configure Copilot Context</DialogTitle>
                </DialogHeader>
                <Form {...contextForm}>
                  <form onSubmit={contextForm.handleSubmit(handleContextSubmit)} className="space-y-6">
                    <FormField
                      control={contextForm.control}
                      name="focusAreasText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Focus Areas</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="land projects, carbon credits, regenerative farming (comma-separated)"
                              {...field}
                              data-testid="input-focus-areas"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={contextForm.control}
                      name="leadScoringText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lead Scoring Criteria (JSON)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder='{"location": "high_value", "category": "land_projects", "verification": "required"}'
                              className="min-h-[120px] font-mono text-sm"
                              {...field}
                              data-testid="textarea-lead-scoring"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={contextForm.control}
                      name="automationText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Automation Rules (JSON)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder='{"auto_score": true, "follow_up_days": 7, "priority_threshold": 80}'
                              className="min-h-[120px] font-mono text-sm"
                              {...field}
                              data-testid="textarea-automation-rules"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsContextDialogOpen(false)}
                        data-testid="button-cancel-context"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={updateContextMutation.isPending}
                        data-testid="button-save-context"
                      >
                        {updateContextMutation.isPending ? "Saving..." : "Save Context"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Main Content - Chat Interface */}
        <ChatInterface className="mb-8" />

        {/* Additional AI Tools */}
        <Tabs defaultValue="insights" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="insights" data-testid="tab-insights">
              <Lightbulb className="w-4 h-4 mr-2" />
              AI Insights
            </TabsTrigger>
            <TabsTrigger value="lead-scoring" data-testid="tab-lead-scoring">
              <TrendingUp className="w-4 h-4 mr-2" />
              Lead Scoring
            </TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="automation" data-testid="tab-automation">
              <Zap className="w-4 h-4 mr-2" />
              Automation
            </TabsTrigger>
          </TabsList>

          {/* AI Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 font-lato">
                  <Brain className="w-5 h-5 text-primary" />
                  <span>Current Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {suggestionsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse p-4 border rounded-lg">
                        <div className="h-4 bg-muted rounded mb-2"></div>
                        <div className="h-3 bg-muted rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="text-center py-12">
                    <Bot className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No AI insights available</h3>
                    <p className="text-muted-foreground mb-4">
                      Configure your copilot context to receive personalized insights
                    </p>
                    <Button 
                      onClick={() => setIsContextDialogOpen(true)}
                      data-testid="button-configure-for-insights"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Configure Context
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {suggestions.map((suggestion: CopilotSuggestion, index: number) => {
                      const Icon = getSuggestionIcon(suggestion.type);
                      const colorClass = getSuggestionColor(suggestion.priority);
                      
                      return (
                        <Card 
                          key={index} 
                          className={`border ${colorClass} hover:shadow-md transition-shadow cursor-pointer`}
                          onClick={() => setSelectedSuggestion(suggestion)}
                          data-testid={`suggestion-${index}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                suggestion.priority === 'high' ? 'bg-red-100' :
                                suggestion.priority === 'medium' ? 'bg-yellow-100' :
                                'bg-blue-100'
                              }`}>
                                <Icon className={`w-4 h-4 ${
                                  suggestion.priority === 'high' ? 'text-red-600' :
                                  suggestion.priority === 'medium' ? 'text-yellow-600' :
                                  'text-blue-600'
                                }`} />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold text-foreground">{suggestion.title}</h4>
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${
                                      suggestion.priority === 'high' ? 'border-red-200 text-red-700' :
                                      suggestion.priority === 'medium' ? 'border-yellow-200 text-yellow-700' :
                                      'border-blue-200 text-blue-700'
                                    }`}
                                  >
                                    {suggestion.priority} priority
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {suggestion.description}
                                </p>
                                <div className="flex items-center justify-between">
                                  <Badge variant="secondary" className="text-xs">
                                    {suggestion.type.replace('_', ' ')}
                                  </Badge>
                                  {suggestion.actionable && (
                                    <Button size="sm" variant="ghost" className="text-primary hover:text-primary/80">
                                      Take Action
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lead Scoring Tab */}
          <TabsContent value="lead-scoring" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-lato">Generate Lead Score</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Select Enterprise</label>
                    <Select 
                      value={leadScoreTarget?.enterpriseId || ""} 
                      onValueChange={(value) => setLeadScoreTarget({ enterpriseId: value })}
                    >
                      <SelectTrigger data-testid="select-lead-enterprise">
                        <SelectValue placeholder="Choose enterprise for scoring" />
                      </SelectTrigger>
                      <SelectContent>
                        {enterprises.map((enterprise: any) => (
                          <SelectItem key={enterprise.id} value={enterprise.id}>
                            {enterprise.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Select Contact (Optional)</label>
                    <Select 
                      value={leadScoreTarget?.personId || "none"} 
                      onValueChange={(value) => setLeadScoreTarget(prev => ({ ...prev!, personId: value === "none" ? undefined : value }))}
                    >
                      <SelectTrigger data-testid="select-lead-person">
                        <SelectValue placeholder="Choose primary contact" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No specific contact</SelectItem>
                        {people.map((person: any) => (
                          <SelectItem key={person.id} value={person.id}>
                            {person.firstName} {person.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={handleGenerateLeadScore}
                    disabled={!leadScoreTarget?.enterpriseId || generateLeadScoreMutation.isPending}
                    className="w-full"
                    data-testid="button-generate-lead-score"
                  >
                    {generateLeadScoreMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Generating Score...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Generate Lead Score
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-lato">Scoring Methodology</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Enterprise category alignment (25%)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Geographic location potential (20%)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Verification status & credibility (20%)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span>Engagement metrics (15%)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>Contact information quality (10%)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span>Online presence & website (10%)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-lato">AI Usage Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Suggestions Generated</span>
                      <span className="font-semibold">{suggestions.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Lead Scores Created</span>
                      <span className="font-semibold">-</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Automation Rules</span>
                      <span className="font-semibold">
                        {context?.automationRules ? Object.keys(context.automationRules).length : 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-lato">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>AI Accuracy</span>
                        <span>85%</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Response Time</span>
                        <span>92%</span>
                      </div>
                      <Progress value={92} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>User Satisfaction</span>
                        <span>78%</span>
                      </div>
                      <Progress value={78} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-lato">Focus Areas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {context?.focusAreas && context.focusAreas.length > 0 ? (
                      context.focusAreas.map((area, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {area}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No focus areas configured</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Automation Tab */}
          <TabsContent value="automation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-lato">Automation Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-foreground">Active Rules</h4>
                      {context?.automationRules && Object.keys(context.automationRules).length > 0 ? (
                        <div className="space-y-2">
                          {Object.entries(context.automationRules).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                              <span className="text-sm font-medium">{key.replace('_', ' ')}</span>
                              <Badge variant="secondary" className="text-xs">
                                {String(value)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No automation rules configured</p>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-foreground">Available Automations</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                          <div>
                            <p className="text-sm font-medium">Auto Lead Scoring</p>
                            <p className="text-xs text-muted-foreground">Score new enterprises automatically</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {context?.automationRules?.auto_score ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                          <div>
                            <p className="text-sm font-medium">Follow-up Reminders</p>
                            <p className="text-xs text-muted-foreground">Create tasks for follow-ups</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {context?.automationRules?.follow_up_days ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                          <div>
                            <p className="text-sm font-medium">Priority Alerts</p>
                            <p className="text-xs text-muted-foreground">Notify for high-value opportunities</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {context?.automationRules?.priority_threshold ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <Button 
                      onClick={() => setIsContextDialogOpen(true)}
                      data-testid="button-configure-automation"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Configure Automation Rules
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Suggestion Detail Dialog */}
        {selectedSuggestion && (
          <Dialog open={!!selectedSuggestion} onOpenChange={() => setSelectedSuggestion(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-lato">{selectedSuggestion.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-muted-foreground">{selectedSuggestion.description}</p>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    {selectedSuggestion.type.replace('_', ' ')}
                  </Badge>
                  <Badge 
                    className={
                      selectedSuggestion.priority === 'high' ? 'bg-red-100 text-red-800' :
                      selectedSuggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }
                  >
                    {selectedSuggestion.priority} priority
                  </Badge>
                </div>
                {selectedSuggestion.actionable && (
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setSelectedSuggestion(null)}>
                      Close
                    </Button>
                    <Button>
                      Take Action
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
}
