import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Globe, 
  Heart, 
  Users, 
  Sprout, 
  Code, 
  Network, 
  Zap, 
  Target, 
  Handshake,
  Building2,
  Coins,
  TrendingUp,
  ArrowRight,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function About() {
  const { isAuthenticated } = useAuth();

  const pillars = [
    {
      icon: Sprout,
      title: "Earth Care",
      description: "Operating in harmony with nature, minimizing environmental impact, and promoting ecological sustainability for generations to come.",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/20"
    },
    {
      icon: Heart,
      title: "People Care",
      description: "Fostering positive, equitable environments for employees, partners, and communities. Putting human wellbeing at the center.",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/20"
    },
    {
      icon: Handshake,
      title: "Fair Share",
      description: "Transparent, ethical business practices ensuring fair distribution of resources and opportunities across all stakeholders.",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/20"
    }
  ];

  const valueProps = [
    {
      icon: Building2,
      title: "For Social Enterprises",
      description: "Get discovered by aligned partners, investors, and collaborators. Access a full CRM suite to manage your relationships and grow your impact.",
      benefits: [
        "Global directory presence",
        "Full-featured CRM workspace",
        "Team collaboration tools",
        "Partnership opportunities"
      ],
      cta: "Activate Your Enterprise",
      ctaLink: isAuthenticated ? "/dashboard" : "/api/login"
    },
    {
      icon: Coins,
      title: "For Impact Investors",
      description: "Discover vetted regenerative enterprises committed to earth care, people care, and fair share. Connect directly with founders building the future.",
      benefits: [
        "Curated enterprise directory",
        "Pledge-verified organizations",
        "Direct partnership channels",
        "Impact measurement tools"
      ],
      cta: "Explore Enterprises",
      ctaLink: "/#categories"
    },
    {
      icon: Network,
      title: "For Network Builders",
      description: "Leverage open source tools to build your own regenerative network. Fork, customize, and deploy your own instance of Earth Care Network.",
      benefits: [
        "Open source codebase",
        "Federated architecture",
        "API access",
        "Self-hosting options"
      ],
      cta: "View Documentation",
      ctaLink: "/docs"
    }
  ];

  const features = [
    {
      icon: Globe,
      title: "Open Source & Federated",
      description: "Built on open principles. Deploy your own instance or join the global network."
    },
    {
      icon: Code,
      title: "Developer-Friendly APIs",
      description: "RESTful APIs for seamless integration with your existing tools and workflows."
    },
    {
      icon: Zap,
      title: "Powerful CRM Suite",
      description: "Manage contacts, opportunities, tasks, and partnerships all in one place."
    },
    {
      icon: Target,
      title: "Impact-Focused",
      description: "Built specifically for organizations committed to regenerative principles."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0A0E0D] via-[#1E3A3A] to-[#2D4A3E] py-32 md:py-40">
        <div className="absolute inset-0 earth-pattern opacity-20"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center space-y-8 md:space-y-10">
            <Badge className="bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30 px-5 py-2 text-base backdrop-blur-sm" data-testid="badge-open-source">
              <Code className="w-4 h-4 mr-2 inline" />
              Open Source Social Enterprise Toolkit
            </Badge>
            
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-tight tracking-tight">
              The Digital White Pages for
              <span className="block mt-3 text-[#D4AF37]">
                Regenerative Enterprises
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl md:text-3xl text-[#F5F5F0]/90 max-w-4xl mx-auto leading-relaxed font-light">
              Earth Care Network is where social enterprise creators discover each other, 
              build meaningful partnerships, and activate their next level together.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
              <Button 
                size="lg" 
                className="gold-button text-[#0A0E0D] px-10 py-6 text-lg font-semibold w-full sm:w-auto"
                onClick={() => window.location.href = isAuthenticated ? "/dashboard" : "/api/login"}
                data-testid="button-get-started"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="bg-transparent text-[#F5F5F0] border-[#D4AF37]/40 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37] px-10 py-6 text-lg w-full sm:w-auto transition-all duration-300"
                onClick={() => document.getElementById('pillars')?.scrollIntoView({ behavior: 'smooth' })}
                data-testid="button-learn-more"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Three Pillars Section */}
      <section id="pillars" className="py-20 md:py-32 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6 tracking-tight">
              Our Three Pillars
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              The foundation of every enterprise in our network is a commitment to these core values
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            {pillars.map((pillar, index) => (
              <Card 
                key={index} 
                className="premium-card border-2 group"
                data-testid={`pillar-card-${index}`}
              >
                <CardContent className="p-8 md:p-10 space-y-6">
                  <div className="bg-primary/10 w-20 h-20 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                    <pillar.icon className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-3xl font-bold text-foreground tracking-tight">{pillar.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">{pillar.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Value Propositions Section */}
      <section className="py-20 md:py-32 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6 tracking-tight">
              Built for the Regenerative Economy
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Whether you're building, investing, or organizing—we have tools for your journey
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
            {valueProps.map((prop, index) => (
              <Card 
                key={index}
                className="premium-card border-2 group"
                data-testid={`value-prop-${index}`}
              >
                <CardContent className="p-8 md:p-10 space-y-8">
                  <div className="space-y-6">
                    <div className="bg-primary/10 w-16 h-16 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                      <prop.icon className="w-9 h-9 text-primary" />
                    </div>
                    <h3 className="text-3xl font-bold text-foreground tracking-tight">{prop.title}</h3>
                    <p className="text-muted-foreground leading-relaxed text-lg">{prop.description}</p>
                  </div>

                  <div className="space-y-4">
                    {prop.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                        <span className="text-base text-muted-foreground leading-relaxed">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  <Link href={prop.ctaLink}>
                    <Button className="w-full gold-button text-[#0A0E0D] font-semibold py-6" data-testid={`button-${prop.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      {prop.cta}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 md:py-32 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6 tracking-tight">
              Powerful Tools, Open Foundation
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Enterprise-grade features with the freedom of open source
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="text-center space-y-4 p-8 rounded-xl hover:bg-card transition-colors duration-300 group"
                data-testid={`feature-${index}`}
              >
                <div className="bg-primary/10 w-16 h-16 rounded-xl flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors duration-300">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground tracking-tight">{feature.title}</h3>
                <p className="text-base text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Source Ethos */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-[#0A0E0D] via-[#1E3A3A] to-[#2D4A3E] relative overflow-hidden">
        <div className="absolute inset-0 earth-pattern opacity-20"></div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-10 relative z-10">
          <div className="space-y-6">
            <Sparkles className="w-16 h-16 text-[#D4AF37] mx-auto" />
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight">
              Open Source, Open Future
            </h2>
          </div>
          
          <p className="text-xl md:text-2xl text-[#F5F5F0]/90 leading-relaxed max-w-4xl mx-auto font-light">
            Earth Care Network is built on the principle that the tools for regeneration should be 
            accessible to all. Our open source codebase and federated architecture mean you can fork, 
            customize, and deploy your own instance—or join our growing global network.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 pt-12">
            <div className="space-y-3">
              <div className="text-5xl md:text-6xl font-bold text-[#D4AF37]">100%</div>
              <div className="text-base text-[#F5F5F0]/80">Open Source</div>
            </div>
            <div className="space-y-3">
              <div className="text-5xl md:text-6xl font-bold text-[#D4AF37]">Forever</div>
              <div className="text-base text-[#F5F5F0]/80">Free Core Features</div>
            </div>
            <div className="space-y-3">
              <div className="text-5xl md:text-6xl font-bold text-[#D4AF37]">Global</div>
              <div className="text-base text-[#F5F5F0]/80">Federated Network</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-10">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground tracking-tight">
            Ready to Activate Your Next Level?
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Join thousands of regenerative enterprises building the future together. 
            Create your free profile in minutes and start making meaningful connections.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button 
              size="lg" 
              className="gold-button text-[#0A0E0D] px-10 py-6 text-lg font-semibold w-full sm:w-auto"
              onClick={() => window.location.href = isAuthenticated ? "/dashboard" : "/api/login"}
              data-testid="button-cta-activate"
            >
              <Building2 className="mr-2 h-6 w-6" />
              Activate Your Enterprise
            </Button>
            <Link href="/#categories">
              <Button 
                size="lg" 
                variant="outline"
                className="border-primary/30 hover:border-primary hover:bg-primary/5 px-10 py-6 text-lg w-full sm:w-auto transition-all duration-300"
                data-testid="button-cta-explore"
              >
                <Globe className="mr-2 h-6 w-6" />
                Explore Directory
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
