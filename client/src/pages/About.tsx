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
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-20 md:py-32">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center space-y-6 md:space-y-8">
            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1" data-testid="badge-open-source">
              <Code className="w-3 h-3 mr-1 inline" />
              Open Source Social Enterprise Toolkit
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground leading-tight">
              The Digital White Pages for
              <span className="block mt-2 bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400 bg-clip-text text-transparent">
                Regenerative Enterprises
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Earth Care Network is where social enterprise creators discover each other, 
              build meaningful partnerships, and activate their next level together.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-white px-8 w-full sm:w-auto"
                onClick={() => window.location.href = isAuthenticated ? "/dashboard" : "/api/login"}
                data-testid="button-get-started"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto"
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
      <section id="pillars" className="py-16 md:py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
              Our Three Pillars
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The foundation of every enterprise in our network is a commitment to these core values
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {pillars.map((pillar, index) => (
              <Card 
                key={index} 
                className="border-2 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                data-testid={`pillar-card-${index}`}
              >
                <CardContent className="p-6 md:p-8 space-y-4">
                  <div className={`${pillar.bgColor} w-16 h-16 rounded-2xl flex items-center justify-center`}>
                    <pillar.icon className={`w-8 h-8 ${pillar.color}`} />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">{pillar.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{pillar.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Value Propositions Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
              Built for the Regenerative Economy
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Whether you're building, investing, or organizing—we have tools for your journey
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {valueProps.map((prop, index) => (
              <Card 
                key={index}
                className="border-2 hover:border-primary/50 transition-all duration-300"
                data-testid={`value-prop-${index}`}
              >
                <CardContent className="p-6 md:p-8 space-y-6">
                  <div className="space-y-4">
                    <div className="bg-primary/10 w-14 h-14 rounded-xl flex items-center justify-center">
                      <prop.icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">{prop.title}</h3>
                    <p className="text-muted-foreground">{prop.description}</p>
                  </div>

                  <div className="space-y-3">
                    {prop.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  <Link href={prop.ctaLink}>
                    <Button className="w-full" variant="outline" data-testid={`button-${prop.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      {prop.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
              Powerful Tools, Open Foundation
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Enterprise-grade features with the freedom of open source
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="text-center space-y-3 p-6 rounded-xl hover:bg-background transition-colors"
                data-testid={`feature-${index}`}
              >
                <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mx-auto">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Source Ethos */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="space-y-4">
            <Sparkles className="w-12 h-12 text-primary mx-auto" />
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
              Open Source, Open Future
            </h2>
          </div>
          
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            Earth Care Network is built on the principle that the tools for regeneration should be 
            accessible to all. Our open source codebase and federated architecture mean you can fork, 
            customize, and deploy your own instance—or join our growing global network.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8">
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary">100%</div>
              <div className="text-sm text-muted-foreground">Open Source</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary">Forever</div>
              <div className="text-sm text-muted-foreground">Free Core Features</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary">Global</div>
              <div className="text-sm text-muted-foreground">Federated Network</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
            Ready to Activate Your Next Level?
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of regenerative enterprises building the future together. 
            Create your free profile in minutes and start making meaningful connections.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-white px-8 w-full sm:w-auto"
              onClick={() => window.location.href = isAuthenticated ? "/dashboard" : "/api/login"}
              data-testid="button-cta-activate"
            >
              <Building2 className="mr-2 h-5 w-5" />
              Activate Your Enterprise
            </Button>
            <Link href="/#categories">
              <Button 
                size="lg" 
                variant="outline"
                className="w-full sm:w-auto"
                data-testid="button-cta-explore"
              >
                <Globe className="mr-2 h-5 w-5" />
                Explore Directory
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
