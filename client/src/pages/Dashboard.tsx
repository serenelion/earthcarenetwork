import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building, Users, Handshake, CheckSquare, TrendingUp, Plus, Download, ExternalLink, Lightbulb, BarChart3, Settings } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/crm/stats"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: recentEnterprises = [], isLoading: enterprisesLoading } = useQuery({
    queryKey: ["/api/enterprises", "", "", 5, 0],
    queryFn: async () => {
      const response = await fetch("/api/enterprises?limit=5");
      if (!response.ok) throw new Error("Failed to fetch recent enterprises");
      return response.json();
    },
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: suggestions = [], isLoading: suggestionsLoading, error: suggestionsError } = useQuery({
    queryKey: ["/api/crm/ai/suggestions"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Handle suggestions error using useEffect
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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-4 w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-xl"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const statsCards = [
    {
      title: "Total Enterprises",
      value: stats?.enterprises?.total || 0,
      change: "+12%",
      icon: Building,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Active People", 
      value: stats?.people?.total || 0,
      change: "+8%",
      icon: Users,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Open Opportunities",
      value: stats?.opportunities?.total || 0,
      change: "+23%",
      icon: Handshake,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Pending Tasks",
      value: stats?.tasks?.byStatus?.pending || 0,
      change: "-5%",
      icon: CheckSquare,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      {/* Header */}
      <div className="flex-1">
        <header className="bg-card border-b border-border">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Building className="text-primary text-xl" />
                  <span className="text-lg font-bold text-foreground font-lato">Earth Network CRM</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon" data-testid="button-notifications">
                  <span className="sr-only">Notifications</span>
                  🔔
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => window.open("/", "_blank")}
                  data-testid="button-public-view"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                    {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <span className="text-sm text-foreground">{user?.firstName || 'Admin User'}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          {/* Dashboard Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2 font-lato">Dashboard</h1>
            <p className="text-muted-foreground">Manage your regenerative enterprise network</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title} data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm">{stat.title}</p>
                        <p className="text-2xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
                      </div>
                      <div className={`${stat.bgColor} p-3 rounded-lg`}>
                        <Icon className={`${stat.color} w-5 h-5`} />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                      <span className="text-primary">{stat.change}</span>
                      <span className="text-muted-foreground ml-2">from last month</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recent Activity & Copilot Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Recent Enterprises */}
            <Card>
              <CardHeader>
                <CardTitle className="font-lato">Recent Enterprises</CardTitle>
              </CardHeader>
              <CardContent>
                {enterprisesLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse flex items-center space-x-3 p-3 bg-muted rounded-lg">
                        <div className="w-10 h-10 bg-muted-foreground/20 rounded-lg"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-muted-foreground/20 rounded mb-1"></div>
                          <div className="h-3 bg-muted-foreground/20 rounded w-2/3"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentEnterprises.length === 0 ? (
                  <div className="text-center py-8">
                    <Building className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground">No enterprises yet</p>
                    <Button 
                      size="sm" 
                      className="mt-2"
                      onClick={() => window.location.href = "/enterprises"}
                      data-testid="button-add-first-enterprise"
                    >
                      Add Your First Enterprise
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentEnterprises.slice(0, 3).map((enterprise: any) => (
                      <div 
                        key={enterprise.id} 
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        data-testid={`recent-enterprise-${enterprise.id}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                            <span className="text-primary-foreground text-sm">
                              {enterprise.category === 'land_projects' && '🌱'}
                              {enterprise.category === 'capital_sources' && '💰'}
                              {enterprise.category === 'open_source_tools' && '🔧'}
                              {enterprise.category === 'network_organizers' && '🌐'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{enterprise.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {enterprise.category.replace('_', ' ')} • {enterprise.location || 'Global'}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(enterprise.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* EarthCare Copilot */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Lightbulb className="w-3 h-3 text-primary-foreground" />
                  </div>
                  <CardTitle className="font-lato">EarthCare Copilot</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {suggestionsLoading ? (
                  <div className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="animate-pulse p-4 border rounded-lg">
                        <div className="h-4 bg-muted-foreground/20 rounded mb-2"></div>
                        <div className="h-3 bg-muted-foreground/20 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="text-center py-8">
                    <Lightbulb className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground mb-3">No AI suggestions available</p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.location.href = "/copilot"}
                      data-testid="button-configure-copilot"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Configure Copilot
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {suggestions.slice(0, 2).map((suggestion: any, index: number) => (
                      <div 
                        key={index} 
                        className={`border rounded-lg p-4 ${
                          suggestion.priority === 'high' ? 'border-primary/20 bg-primary/5' :
                          suggestion.priority === 'medium' ? 'border-secondary/20 bg-secondary/5' :
                          'border-border'
                        }`}
                        data-testid={`suggestion-${index}`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            suggestion.priority === 'high' ? 'bg-primary' :
                            suggestion.priority === 'medium' ? 'bg-secondary' :
                            'bg-muted'
                          }`}>
                            <Lightbulb className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-foreground mb-2">
                              <strong>{suggestion.title}</strong>
                            </p>
                            <p className="text-xs text-muted-foreground mb-2">
                              {suggestion.description}
                            </p>
                            {suggestion.actionable && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="text-primary text-xs hover:underline p-0 h-auto"
                                data-testid={`suggestion-action-${index}`}
                              >
                                Take Action
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="border border-border rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <Settings className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">Configure Copilot Context</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        Set context for AI suggestions, lead scoring criteria, and automation rules.
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.location.href = "/copilot"}
                        data-testid="button-open-copilot-settings"
                      >
                        Open Settings
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4 font-lato">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                className="bg-primary text-primary-foreground p-6 h-auto hover:bg-primary/90 justify-start"
                onClick={() => window.location.href = "/enterprises"}
                data-testid="button-add-enterprise"
              >
                <div className="text-left">
                  <Plus className="w-6 h-6 mb-2" />
                  <p className="font-medium">Add Enterprise</p>
                  <p className="text-sm text-primary-foreground/80">Create new enterprise profile</p>
                </div>
              </Button>
              
              <Button
                className="bg-secondary text-white p-6 h-auto hover:bg-secondary/90 justify-start"
                onClick={() => window.location.href = "/bulk-import"}
                data-testid="button-bulk-import"
              >
                <div className="text-left">
                  <Download className="w-6 h-6 mb-2" />
                  <p className="font-medium">Bulk Import</p>
                  <p className="text-sm text-white/80">Import from URLs or CSV</p>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="p-6 h-auto hover:bg-muted justify-start"
                onClick={() => window.open("https://thespatialnetwork.net", "_blank")}
                data-testid="button-spatial-network"
              >
                <div className="text-left">
                  <ExternalLink className="w-6 h-6 mb-2 text-muted-foreground" />
                  <p className="font-medium text-foreground">Spatial Network</p>
                  <p className="text-sm text-muted-foreground">Upgrade to Build Pro</p>
                </div>
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
