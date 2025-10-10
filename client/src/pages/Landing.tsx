import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, Sprout, Coins, Wrench, Network, Search, User, ExternalLink, Home, TreePine, GraduationCap } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import EnterpriseCard from "@/components/directory/EnterpriseCard";
import CategorySection from "@/components/directory/CategorySection";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import CreateEnterpriseDialog from "@/components/crm/CreateEnterpriseDialog";
import { freeMemberFlow } from "@/lib/onboardingFlows";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import type { Enterprise } from "@shared/schema";

export default function Landing() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFreeMemberOnboarding, setShowFreeMemberOnboarding] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const { user, isAuthenticated } = useAuth();
  const { isFlowComplete } = useOnboarding();

  useEffect(() => {
    if (isAuthenticated && user && user.role === 'free' && !isFlowComplete('free_member')) {
      setShowFreeMemberOnboarding(true);
    }
  }, [isAuthenticated, user, isFlowComplete]);

  const handleAddEnterpriseClick = () => {
    if (isAuthenticated) {
      setShowCreateDialog(true);
    } else {
      window.location.href = "/api/login";
    }
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
      description: "Are you regenerating the land? Connect with farms, food forests, and permaculture pioneers transforming Earth one acre at a time.",
      icon: Sprout,
      count: enterprises.filter(e => e.category === "land_projects").length,
    },
    {
      id: "capital_sources",
      title: "Capital Sources", 
      description: "Ready to fund the future? Discover impact investors and regenerative funders who share your vision for a thriving planet.",
      icon: Coins,
      count: enterprises.filter(e => e.category === "capital_sources").length,
    },
    {
      id: "open_source_tools",
      title: "Open Source Tools",
      description: "Access powerful tools once reserved for corporations. Monitor, map, and manage your regenerative project with confidence.",
      icon: Wrench,
      count: enterprises.filter(e => e.category === "open_source_tools").length,
    },
    {
      id: "network_organizers", 
      title: "Network Organizers",
      description: "Building community together. Find organizations weaving networks and movements that amplify regenerative impact worldwide.",
      icon: Network,
      count: enterprises.filter(e => e.category === "network_organizers").length,
    },
    {
      id: "homes_that_heal",
      title: "Homes that Heal",
      description: "Design spaces that nurture life. Partner with eco-luxury builders creating regenerative living environments for you and your loved ones.",
      icon: Home,
      count: enterprises.filter(e => e.category === "homes_that_heal").length,
    },
    {
      id: "landscapes_that_nourish",
      title: "Landscapes that Nourish",
      description: "Transform your landscape into abundance. Connect with designers and installers crafting thriving ecosystems that feed communities.",
      icon: TreePine,
      count: enterprises.filter(e => e.category === "landscapes_that_nourish").length,
    },
    {
      id: "lifelong_learning_providers",
      title: "Lifelong Learning",
      description: "Grow your knowledge, expand your impact. Explore holistic education programs that develop regenerative leaders and practitioners.",
      icon: GraduationCap,
      count: enterprises.filter(e => e.category === "lifelong_learning_providers").length,
    },
  ];

  return (
    <div className="min-h-screen bg-background">

      {/* Hero Section */}
      <section className="hero-gradient earth-pattern text-white py-32 md:py-40">
        <div className="max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <h1 className="text-5xl md:text-7xl font-bold mb-8 text-white tracking-tight">
            Build Your Regenerative Enterprise Together
          </h1>
          <p className="text-xl md:text-2xl mb-12 text-[#F5F5F0]/90 font-light max-w-3xl mx-auto leading-relaxed">
            Join a thriving community of earth care pioneers. Connect with aligned partners, access powerful tools, and grow your impact on the planet.
          </p>
          
          {/* Search Bar */}
          <div className="mb-12">
            <SearchBar 
              value={searchQuery}
              onChange={setSearchQuery}
              onCategorySelect={setSelectedCategory}
              data-testid="hero-search"
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="gold-button text-[#0A0E0D] px-10 py-6 text-lg font-semibold border-0 hover:border-0"
              data-testid="button-add-enterprise"
              onClick={handleAddEnterpriseClick}
            >
              {isAuthenticated ? "Start Your Journey" : "Join the Network"}
            </Button>
            <Button 
              variant="outline" 
              className="bg-transparent backdrop-blur-sm text-[#F5F5F0] border-[#D4AF37]/40 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37] px-10 py-6 text-lg font-medium transition-all duration-300"
              data-testid="button-explore-directory"
              onClick={() => {
                document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Discover Your Community
            </Button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-20 md:py-28 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground tracking-tight">
              Find Your Path to Regenerative Impact
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Explore seven pathways to earth care. Connect with aligned partners who share your commitment to regenerating the planet, caring for people, and creating fair share economies.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
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
      <section id="featured" className="py-20 md:py-28 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-16">
            <h2 className="text-4xl font-bold text-foreground tracking-tight">
              {selectedCategory 
                ? `${categories.find(c => c.id === selectedCategory)?.title} Enterprises`
                : "Thriving Regenerative Enterprises"
              }
            </h2>
            {selectedCategory && (
              <Button 
                variant="outline" 
                onClick={() => setSelectedCategory(null)}
                data-testid="button-clear-filter"
              >
                Explore All
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
                <p className="text-lg">Your community awaits</p>
                <p className="text-sm">
                  {searchQuery || selectedCategory 
                    ? "Try a different search or explore all categories to discover more opportunities"
                    : "Be a pioneer! Share your regenerative enterprise and inspire others on their journey"
                  }
                </p>
              </div>
              <Button 
                onClick={handleAddEnterpriseClick}
                data-testid="button-add-first-enterprise"
              >
                {isAuthenticated ? "Start Your Journey" : "Share Your Enterprise"}
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
            <div className="text-center mt-16">
              <Button 
                className="gold-button text-[#0A0E0D] px-10 py-6 text-lg font-semibold"
                data-testid="button-explore-all"
                onClick={() => window.location.href = "/api/login"}
              >
                Discover More Partners
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Sponsor Section */}
      <section className="py-20 md:py-28 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground tracking-tight">Supported By Visionaries</h2>
            <div className="flex justify-center items-center space-x-6 mb-6">
              <div className="text-5xl text-primary">
                <Globe />
              </div>
              <div className="text-left">
                <h3 className="text-3xl font-bold text-foreground">TerraLux</h3>
                <p className="text-muted-foreground text-lg">Illuminating regenerative futures</p>
              </div>
            </div>
            <p className="text-muted-foreground mt-6 max-w-2xl mx-auto text-lg leading-relaxed">
              TerraLux empowers regenerative enterprises with innovative technology solutions. Together, we're making powerful tools accessible to those healing our planet.
            </p>
            <div className="mt-10 space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
              <Button 
                className="gold-button text-[#0A0E0D] px-8 py-4 text-base font-semibold"
                data-testid="button-become-sponsor"
                onClick={() => window.open("https://terra-lux.org/terraluxtech/", "_blank")}
              >
                Support the Movement
              </Button>
              <Button 
                variant="outline"
                className="px-8 py-4 text-base border-primary/30 hover:border-primary hover:bg-primary/5 transition-all duration-300"
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
      <section className="py-20 md:py-32 bg-gradient-to-br from-[#0A0E0D] via-[#1E3A3A] to-[#2D4A3E] text-white relative overflow-hidden">
        <div className="absolute inset-0 earth-pattern opacity-30"></div>
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Your Community is Waiting</h2>
          <p className="text-xl md:text-2xl mb-8 text-[#F5F5F0]/90 font-light max-w-3xl mx-auto leading-relaxed">
            Join a growing movement of regenerative enterprises transforming how we care for Earth, each other, and create fair share economies.
          </p>
          <p className="text-lg mb-12 text-[#D4AF37] font-medium">
            Together, we're building the future our planet deserves
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="gold-button text-[#0A0E0D] px-10 py-6 text-lg font-semibold"
              data-testid="button-add-enterprise-cta"
              onClick={handleAddEnterpriseClick}
            >
              {isAuthenticated ? "Create Your Enterprise" : "Get Started Free"}
            </Button>
            <Button 
              variant="outline"
              className="bg-transparent backdrop-blur-sm text-[#F5F5F0] border-[#D4AF37]/40 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37] px-10 py-6 text-lg font-medium transition-all duration-300"
              data-testid="button-claim-profile"
              onClick={() => window.open("https://thespatialnetwork.net", "_blank")}
            >
              Claim Your Profile
            </Button>
          </div>
          <p className="mt-10 text-sm text-[#F5F5F0]/80 leading-relaxed">
            Powered by <a 
              href="https://terra-lux.org/terraluxtech/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#D4AF37] hover:text-[#C9A961] underline transition-colors"
              data-testid="link-terralux-powered"
            >
              TerraLux Technology
            </a> • Partner with <a
              href="https://thespatialnetwork.net"
              target="_blank"
              rel="noopener noreferrer" 
              className="text-[#D4AF37] hover:text-[#C9A961] underline transition-colors"
              data-testid="link-spatial-network"
            >
              The Spatial Network
            </a>
          </p>
        </div>
      </section>

      {/* Free Member Onboarding Modal */}
      <OnboardingModal
        flowKey="free_member"
        steps={freeMemberFlow.steps}
        isOpen={showFreeMemberOnboarding}
        onComplete={() => setShowFreeMemberOnboarding(false)}
        onDismiss={() => setShowFreeMemberOnboarding(false)}
      />

      {/* Create Enterprise Dialog */}
      <CreateEnterpriseDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
