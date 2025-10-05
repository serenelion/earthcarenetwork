import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, Sprout, Coins, Wrench, Network, Search, User, ExternalLink } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import EnterpriseCard from "@/components/directory/EnterpriseCard";
import CategorySection from "@/components/directory/CategorySection";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { visitorFlow, freeMemberFlow } from "@/lib/onboardingFlows";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import type { Enterprise } from "@shared/schema";

export default function Landing() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showFreeMemberOnboarding, setShowFreeMemberOnboarding] = useState(false);
  
  const { user, isAuthenticated } = useAuth();
  const { isFlowComplete } = useOnboarding();

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('visitor_onboarding_shown');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user && user.role === 'member' && !isFlowComplete('free_member')) {
      setShowFreeMemberOnboarding(true);
    }
  }, [isAuthenticated, user, isFlowComplete]);

  const handleOnboardingComplete = () => {
    localStorage.setItem('visitor_onboarding_shown', 'true');
    setShowOnboarding(false);
  };

  const handleOnboardingDismiss = () => {
    localStorage.setItem('visitor_onboarding_shown', 'true');
    setShowOnboarding(false);
  };

  const { data: enterprises = [], isLoading } = useQuery<Enterprise[]>({
    queryKey: ["/api/enterprises", selectedCategory, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append("category", selectedCategory);
      if (searchQuery) params.append("search", searchQuery);
      params.append("limit", "12");
      
      const response = await fetch(`/api/enterprises?${params}`);
      if (!response.ok) throw new Error("Failed to fetch enterprises");
      const data: Enterprise[] = await response.json();
      return data;
    },
  });

  const categories = [
    {
      id: "land_projects",
      title: "Land Projects",
      description: "Explore regenerative farms, food forests, permaculture sites, and other land-based projects.",
      icon: Sprout,
      count: enterprises.filter(e => e.category === "land_projects").length,
    },
    {
      id: "capital_sources",
      title: "Capital Sources", 
      description: "Find impact investment funds, grantmaking organizations, and regenerative financial institutions.",
      icon: Coins,
      count: enterprises.filter(e => e.category === "capital_sources").length,
    },
    {
      id: "open_source_tools",
      title: "Open Source Tools",
      description: "Discover digital tools for mapping, monitoring, and managing regenerative projects.",
      icon: Wrench,
      count: enterprises.filter(e => e.category === "open_source_tools").length,
    },
    {
      id: "network_organizers", 
      title: "Network Organizers",
      description: "Connect with organizations building communities, networks, and movements for regeneration.",
      icon: Network,
      count: enterprises.filter(e => e.category === "network_organizers").length,
    },
  ];

  return (
    <div className="min-h-screen bg-background">

      {/* Hero Section */}
      <section className="hero-gradient earth-pattern text-white py-24">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-[#000000]">
            Earth Care Network
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-800 font-medium">
            An open source directory + CRM for new earth enterprise sales optimization
          </p>
          
          {/* Search Bar */}
          <SearchBar 
            value={searchQuery}
            onChange={setSearchQuery}
            onCategorySelect={setSelectedCategory}
            data-testid="hero-search"
          />
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button 
              className="bg-secondary hover:bg-secondary/90 text-white px-8 py-3"
              data-testid="button-add-enterprise"
              onClick={() => window.location.href = "/api/login"}
            >
              Add Your Enterprise
            </Button>
            <Button 
              variant="outline" 
              className="bg-white/90 backdrop-blur text-gray-900 border-white hover:bg-white px-8 py-3 font-semibold"
              data-testid="button-explore-directory"
              onClick={() => {
                document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Explore Directory
            </Button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Explore by Category
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map((category) => (
              <CategorySection
                key={category.id}
                category={category}
                data-testid={`category-${category.id}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Enterprises */}
      <section id="featured" className="py-16 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-bold text-foreground">
              {selectedCategory 
                ? `${categories.find(c => c.id === selectedCategory)?.title} Enterprises`
                : "Featured Enterprises"
              }
            </h2>
            {selectedCategory && (
              <Button 
                variant="outline" 
                onClick={() => setSelectedCategory(null)}
                data-testid="button-clear-filter"
              >
                Show All Categories
              </Button>
            )}
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-muted-foreground/20"></div>
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted-foreground/20 rounded mb-2"></div>
                    <div className="h-6 bg-muted-foreground/20 rounded mb-4"></div>
                    <div className="h-16 bg-muted-foreground/20 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : enterprises.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                <Globe className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No enterprises found</p>
                <p className="text-sm">
                  {searchQuery || selectedCategory 
                    ? "Try adjusting your search or browse all categories"
                    : "Be the first to add your regenerative enterprise"
                  }
                </p>
              </div>
              <Button 
                onClick={() => window.location.href = "/api/login"}
                data-testid="button-add-first-enterprise"
              >
                Add Your Enterprise
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {enterprises.map((enterprise) => (
                <EnterpriseCard 
                  key={enterprise.id} 
                  enterprise={enterprise}
                  data-testid={`enterprise-card-${enterprise.id}`}
                />
              ))}
            </div>
          )}

          {enterprises.length > 0 && (
            <div className="text-center mt-12">
              <Button 
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3"
                data-testid="button-explore-all"
                onClick={() => window.location.href = "/api/login"}
              >
                Explore All Enterprises
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Sponsor Section */}
      <section className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-4 text-foreground font-lato">Founding Sponsor</h2>
            <div className="flex justify-center items-center space-x-4 mb-4">
              <div className="text-4xl text-primary">
                <Globe />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground font-lato">TerraLux</h3>
                <p className="text-muted-foreground">Illuminating sustainable futures</p>
              </div>
            </div>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              Proudly sponsored by TerraLux - pioneering innovative solutions for regenerative enterprises worldwide.
            </p>
            <div className="mt-6 space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
              <Button 
                className="bg-secondary hover:bg-secondary/90 text-white px-6 py-3"
                data-testid="button-become-sponsor"
                onClick={() => window.open("https://terra-lux.org/terraluxtech/", "_blank")}
              >
                Become a Sponsor
              </Button>
              <Button 
                variant="outline"
                className="px-6 py-3"
                data-testid="button-learn-more-terralux"
                onClick={() => window.open("https://terra-lux.org/", "_blank")}
              >
                Learn More <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4 font-lato">Join the Regenerative Ecosystem</h2>
          <p className="text-xl mb-8 text-primary-foreground">
            Are you working on a regenerative project? Add your enterprise to our directory and connect with a global community of changemakers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="bg-white text-primary hover:bg-gray-100 px-8 py-3"
              data-testid="button-add-enterprise-cta"
              onClick={() => window.location.href = "/api/login"}
            >
              Add Your Enterprise
            </Button>
            <Button 
              variant="outline"
              className="bg-white/90 border-white text-gray-900 hover:bg-white px-8 py-3 font-semibold"
              data-testid="button-claim-profile"
              onClick={() => window.open("https://thespatialnetwork.net", "_blank")}
            >
              Claim Your Profile
            </Button>
          </div>
          <p className="mt-6 text-sm text-primary-foreground opacity-90">
            Powered by <a 
              href="https://terra-lux.org/terraluxtech/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:text-primary-foreground hover:opacity-100"
              data-testid="link-terralux-powered"
            >
              TerraLux Technology
            </a> • Partner with <a
              href="https://thespatialnetwork.net"
              target="_blank"
              rel="noopener noreferrer" 
              className="underline hover:text-primary-foreground hover:opacity-100"
              data-testid="link-spatial-network"
            >
              The Spatial Network
            </a>
          </p>
        </div>
      </section>

      {/* Visitor Onboarding Modal */}
      <OnboardingModal
        flowKey="visitor"
        steps={visitorFlow.steps}
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
        onDismiss={handleOnboardingDismiss}
      />

      {/* Free Member Onboarding Modal */}
      <OnboardingModal
        flowKey="free_member"
        steps={freeMemberFlow.steps}
        isOpen={showFreeMemberOnboarding}
        onComplete={() => setShowFreeMemberOnboarding(false)}
        onDismiss={() => setShowFreeMemberOnboarding(false)}
      />
    </div>
  );
}
