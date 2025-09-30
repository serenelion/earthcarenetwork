import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Handshake, 
  Users, 
  Globe, 
  Lightbulb, 
  Home, 
  Cpu, 
  Heart, 
  Building, 
  ExternalLink,
  CheckCircle,
  Leaf,
  Target,
  Network,
  Zap
} from "lucide-react";

// Partner application form schema
const partnerApplicationSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  website: z.string().url("Valid website URL required").optional().or(z.literal("")),
  description: z.string().min(50, "Please provide at least 50 characters describing your organization"),
  areasOfFocus: z.string().min(1, "Please describe your areas of focus"),
  contribution: z.string().min(50, "Please describe how you would contribute to the network (minimum 50 characters)"),
});

type PartnerApplicationData = z.infer<typeof partnerApplicationSchema>;

const partners = [
  {
    id: "terralux-agency",
    name: "TerraLux Agency",
    tagline: "bridge the gap between digital and reality",
    description: "Transform your vision into powerful digital experiences that connect, engage, and drive meaningful results for your business.",
    services: ["digital solutions", "creative design", "strategic consulting"],
    website: "https://terraluxagency.replit.app/",
    theme: "professional",
    gradient: "from-amber-400 to-yellow-600",
    icon: Lightbulb,
  },
  {
    id: "terralux",
    name: "TerraLux",
    tagline: "Your Future Life",
    description: "Pioneering the future of sustainable living through innovative solutions across HOME, TECH, HEALTH, and LIVING sectors.",
    services: ["modular homes", "smart design", "custom AI solutions", "health technologies", "luxury retreat properties"],
    website: "https://terra-lux.org/",
    theme: "luxury",
    gradient: "from-emerald-500 to-green-600",
    icon: Home,
    highlights: [
      { icon: Home, label: "HOME", desc: "Modular homes, smart design" },
      { icon: Cpu, label: "TECH", desc: "Custom AI solutions" },
      { icon: Heart, label: "HEALTH", desc: "Health technologies" },
      { icon: Building, label: "LIVING", desc: "Luxury retreat properties" }
    ]
  },
  {
    id: "spatial-network",
    name: "The Spatial Network",
    tagline: "build the future of humanity",
    description: "We are a living, collaborative eco-system that connects mission-driven projects with the tools, people, and visibility they need to grow.",
    services: ["Global Atlas", "Project Management", "Group Buying", "Barter & Trade", "Immersive Design", "Global Collaboration"],
    website: "https://thespatialnetwork.net/",
    theme: "ecosystem",
    gradient: "from-green-600 to-emerald-700",
    icon: Network,
  }
];

const benefits = [
  {
    icon: Network,
    title: "Global Network Access",
    description: "Connect with regenerative enterprises, investors, and changemakers worldwide."
  },
  {
    icon: Target,
    title: "Collaborative Opportunities",
    description: "Participate in joint ventures, partnerships, and mission-aligned projects."
  },
  {
    icon: Zap,
    title: "Resource Sharing",
    description: "Access shared tools, knowledge bases, and collective purchasing power."
  },
  {
    icon: Leaf,
    title: "Impact Amplification",
    description: "Amplify your regenerative impact through coordinated network initiatives."
  }
];

export default function Partners() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PartnerApplicationData>({
    resolver: zodResolver(partnerApplicationSchema),
    defaultValues: {
      organizationName: "",
      contactPerson: "",
      email: "",
      phone: "",
      website: "",
      description: "",
      areasOfFocus: "",
      contribution: "",
    },
  });

  const submitApplication = useMutation({
    mutationFn: async (data: PartnerApplicationData) => {
      // Split areas of focus into array
      const formattedData = {
        ...data,
        areasOfFocus: data.areasOfFocus.split(',').map(area => area.trim()).filter(Boolean),
      };
      return apiRequest('POST', '/api/partner-applications', formattedData);
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted!",
        description: "Thank you for your interest in joining the Council of New Earth Enterprises. We'll review your application and get back to you soon.",
      });
      form.reset();
      setIsSubmitting(false);
    },
    onError: (error: any) => {
      console.error('Error submitting application:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (data: PartnerApplicationData) => {
    setIsSubmitting(true);
    submitApplication.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-emerald-500/10 to-secondary/20"></div>
        <div className="earth-pattern absolute inset-0"></div>
        <div className="relative z-10 py-24 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground font-lato">
                Partnering to Transform Reality
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-muted-foreground">
                Join the Council of New Earth Enterprises - a regenerative network of visionary organizations 
                building the infrastructure for ecological abundance and human flourishing.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3"
                  data-testid="button-explore-partners"
                  onClick={() => {
                    document.getElementById('partners')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <Users className="w-5 h-5 mr-2" />
                  Meet Our Partners
                </Button>
                <Button 
                  variant="outline" 
                  className="border-primary text-primary hover:bg-primary/10 px-8 py-3"
                  data-testid="button-join-council"
                  onClick={() => {
                    document.getElementById('application')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <Handshake className="w-5 h-5 mr-2" />
                  Join the Council
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Showcase */}
      <section id="partners" className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-lato">
              Our Founding Partners
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Pioneering organizations leading the regenerative transformation across digital innovation, 
              sustainable living, and collaborative ecosystems.
            </p>
          </div>

          <div className="space-y-16">
            {partners.map((partner, index) => {
              const IconComponent = partner.icon;
              const isEven = index % 2 === 0;
              
              return (
                <div 
                  key={partner.id}
                  className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-12`}
                  data-testid={`partner-${partner.id}`}
                >
                  {/* Partner Image/Logo Area */}
                  <div className="flex-1">
                    <Card className="overflow-hidden border-0 shadow-lg">
                      <div className={`h-64 bg-gradient-to-br ${partner.gradient} relative`}>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center text-white">
                            <IconComponent className="w-16 h-16 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold font-lato">{partner.name}</h3>
                            <p className="text-lg opacity-90 italic">"{partner.tagline}"</p>
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-black/10"></div>
                      </div>
                    </Card>
                  </div>

                  {/* Partner Content */}
                  <div className="flex-1 space-y-6">
                    <div>
                      <h3 className="text-3xl font-bold text-foreground mb-3 font-lato">
                        {partner.name}
                      </h3>
                      <p className="text-lg text-muted-foreground leading-relaxed">
                        {partner.description}
                      </p>
                    </div>

                    {/* Special highlights for TerraLux */}
                    {partner.highlights && (
                      <div className="grid grid-cols-2 gap-4">
                        {partner.highlights.map((highlight, idx) => {
                          const HighlightIcon = highlight.icon;
                          return (
                            <div key={idx} className="flex items-start space-x-3 p-3 rounded-lg bg-card">
                              <HighlightIcon className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                              <div>
                                <div className="font-semibold text-sm text-foreground">{highlight.label}</div>
                                <div className="text-xs text-muted-foreground">{highlight.desc}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Services/Features */}
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">Key Focus Areas:</h4>
                      <div className="flex flex-wrap gap-2">
                        {partner.services.map((service, idx) => (
                          <Badge 
                            key={idx} 
                            variant="secondary"
                            className="bg-primary/10 text-primary hover:bg-primary/20"
                          >
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Button
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        data-testid={`button-visit-${partner.id}`}
                        onClick={() => window.open(partner.website, '_blank')}
                      >
                        Visit {partner.name} <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4 font-lato">
              Benefits of Partnership
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Join a growing network of regenerative enterprises committed to ecological abundance and collaborative innovation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const BenefitIcon = benefit.icon;
              return (
                <Card key={index} className="text-center p-6 border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                      <BenefitIcon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground font-lato">
                      {benefit.title}
                    </h3>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Application Form Section */}
      <section id="application" className="py-16 bg-muted/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4 font-lato">
              Join the Council of New Earth Enterprises
            </h2>
            <p className="text-lg text-muted-foreground">
              Ready to be part of the regenerative transformation? Apply to join our partner network 
              and help build the infrastructure for a thriving ecological future.
            </p>
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="bg-primary text-primary-foreground text-center rounded-t-lg">
              <h3 className="text-2xl font-bold font-lato">Partner Application</h3>
              <p className="text-primary-foreground/90">Tell us about your organization and vision</p>
            </CardHeader>
            <CardContent className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="form-partner-application">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="organizationName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Name *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your organization name" 
                              {...field} 
                              data-testid="input-organization-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contactPerson"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Person *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Your full name" 
                              {...field} 
                              data-testid="input-contact-person"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address *</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="contact@yourorg.com" 
                              {...field} 
                              data-testid="input-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input 
                              type="tel" 
                              placeholder="+1 (555) 123-4567" 
                              {...field} 
                              data-testid="input-phone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input 
                            type="url" 
                            placeholder="https://yourwebsite.com" 
                            {...field} 
                            data-testid="input-website"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Description & Mission *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your organization's mission, values, and current activities. What impact are you making in the regenerative space?"
                            className="min-h-[120px]"
                            {...field}
                            data-testid="textarea-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="areasOfFocus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Areas of Focus *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="List your key focus areas (e.g., renewable energy, regenerative agriculture, sustainable tech, community building, etc.)"
                            {...field}
                            data-testid="textarea-areas-focus"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contribution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>How You'd Contribute to the Network *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe how you would contribute to and benefit from the Council network. What unique value do you bring? What collaborative opportunities interest you?"
                            className="min-h-[120px]"
                            {...field}
                            data-testid="textarea-contribution"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-center pt-6">
                    <Button
                      type="submit"
                      size="lg"
                      disabled={isSubmitting}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-4 text-lg"
                      data-testid="button-submit-application"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Join the Council
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4 font-lato">
            Together, We Transform Reality
          </h2>
          <p className="text-xl mb-8 text-primary-foreground/90">
            Join the Council of New Earth Enterprises and become part of a regenerative network 
            building the infrastructure for ecological abundance and human flourishing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="outline"
              className="bg-white text-primary border-white hover:bg-gray-100 px-8 py-3"
              data-testid="button-footer-apply"
              onClick={() => {
                document.getElementById('application')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <Handshake className="w-5 h-5 mr-2" />
              Apply to Join
            </Button>
            <Button 
              variant="ghost"
              className="text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/10 px-8 py-3"
              data-testid="button-footer-explore"
              onClick={() => {
                document.getElementById('partners')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <Globe className="w-5 h-5 mr-2" />
              Explore Partners
            </Button>
          </div>
          <p className="mt-8 text-sm text-primary-foreground/70">
            Powered by{" "}
            <a 
              href="https://terra-lux.org/terraluxtech/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:text-primary-foreground"
              data-testid="link-terralux-tech"
            >
              TerraLux Technology
            </a>
            {" "} • Partner with{" "}
            <a
              href="https://thespatialnetwork.net"
              target="_blank"
              rel="noopener noreferrer" 
              className="underline hover:text-primary-foreground"
              data-testid="link-spatial-network-footer"
            >
              The Spatial Network
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}