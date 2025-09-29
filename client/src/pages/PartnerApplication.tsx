import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { insertPartnerApplicationSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/Navigation";
import {
  CheckCircle,
  Building,
  Users,
  HandHeart,
  Sprout,
  Zap,
  Globe,
  Recycle,
  Leaf,
  Sun,
  Waves,
  Mountain,
  ArrowRight,
  Shield,
  Network
} from "lucide-react";

// Areas of focus options with icons
const AREAS_OF_FOCUS = [
  { value: "regenerative_agriculture", label: "Regenerative Agriculture", icon: Sprout },
  { value: "renewable_energy", label: "Renewable Energy", icon: Sun },
  { value: "sustainable_technology", label: "Sustainable Technology", icon: Zap },
  { value: "circular_economy", label: "Circular Economy", icon: Recycle },
  { value: "environmental_restoration", label: "Environmental Restoration", icon: Leaf },
  { value: "clean_water", label: "Clean Water & Sanitation", icon: Waves },
  { value: "land_conservation", label: "Land Conservation", icon: Mountain },
  { value: "green_finance", label: "Green Finance", icon: Globe },
  { value: "education_training", label: "Education & Training", icon: Users },
  { value: "community_development", label: "Community Development", icon: HandHeart },
  { value: "climate_adaptation", label: "Climate Adaptation", icon: Shield },
  { value: "network_building", label: "Network Building", icon: Network }
];

// Form validation schema - extends the base schema with frontend validation
const partnerApplicationFormSchema = insertPartnerApplicationSchema.extend({
  areasOfFocus: z.array(z.string()).min(1, "Please select at least one area of focus"),
  email: z.string().email("Please enter a valid email address"),
  website: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
  phone: z.string().optional(),
  contribution: z.string().min(50, "Please provide at least 50 characters explaining your contribution")
});

type PartnerApplicationForm = z.infer<typeof partnerApplicationFormSchema>;

export default function PartnerApplication() {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<PartnerApplicationForm>({
    resolver: zodResolver(partnerApplicationFormSchema),
    defaultValues: {
      organizationName: "",
      contactPerson: "",
      email: "",
      phone: "",
      website: "",
      description: "",
      areasOfFocus: [],
      contribution: ""
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (data: PartnerApplicationForm) => {
      const response = await fetch("/api/partner-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        throw new Error('Failed to submit application');
      }
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Application Submitted Successfully!",
        description: "We'll review your application and get back to you within 3-5 business days.",
      });
    },
    onError: (error) => {
      console.error("Error submitting application:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: PartnerApplicationForm) => {
    submitMutation.mutate(data);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-2xl mx-auto pt-24 px-4 sm:px-6 lg:px-8">
          <Card className="text-center p-8">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl text-green-700 dark:text-green-400">Application Submitted!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Thank you for your interest in partnering with Earth Care Network. 
                We've received your application and will review it within 3-5 business days.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                You'll receive an email confirmation shortly, followed by our response to your application.
              </p>
              <Button 
                onClick={() => window.location.href = "/member-benefits"}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-back-benefits"
              >
                Back to Member Benefits
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800 mb-4" data-testid="badge-partnership">
              <Building className="w-4 h-4 mr-2" />
              Partnership Application
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Join Our Regenerative Network
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Partner with Earth Care Network to amplify your impact on environmental restoration, 
              sustainable innovation, and community resilience.
            </p>
          </div>

          {/* Partnership Benefits */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Network className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Network Access</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Connect with 500+ regenerative organizations and thousands of change-makers
              </p>
            </div>
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Collaboration</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Partner on projects, share resources, and co-create solutions
              </p>
            </div>
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Global Impact</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Scale your impact through our international network and platform
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Partnership Application</CardTitle>
              <p className="text-muted-foreground">
                Tell us about your organization and how you'd like to contribute to our regenerative mission.
              </p>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="form-partner-application">
                  
                  {/* Organization Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center">
                      <Building className="w-5 h-5 mr-2" />
                      Organization Information
                    </h3>
                    
                    <FormField
                      control={form.control}
                      name="organizationName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Name *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Your organization name" 
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
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mission & Description</FormLabel>
                          <FormDescription>
                            Describe your organization's mission, values, and current activities
                          </FormDescription>
                          <FormControl>
                            <Textarea 
                              placeholder="Tell us about your organization's mission, what you do, and your impact so far..."
                              className="min-h-[120px]"
                              {...field}
                              value={field.value || ""}
                              data-testid="textarea-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      Contact Information
                    </h3>
                    
                    <FormField
                      control={form.control}
                      name="contactPerson"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Contact Person *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Full name of primary contact" 
                              {...field} 
                              data-testid="input-contact-person"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid md:grid-cols-2 gap-4">
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
                              placeholder="https://yourorganization.com" 
                              {...field} 
                              data-testid="input-website"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  {/* Areas of Focus */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center">
                      <Leaf className="w-5 h-5 mr-2" />
                      Areas of Focus
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Select all areas where your organization is active or interested in contributing
                    </p>

                    <FormField
                      control={form.control}
                      name="areasOfFocus"
                      render={() => (
                        <FormItem>
                          <div className="grid md:grid-cols-2 gap-3">
                            {AREAS_OF_FOCUS.map((area) => (
                              <FormField
                                key={area.value}
                                control={form.control}
                                name="areasOfFocus"
                                render={({ field }) => {
                                  const IconComponent = area.icon;
                                  return (
                                    <FormItem
                                      key={area.value}
                                      className="flex flex-row items-center space-x-3 space-y-0 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(area.value)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value, area.value])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== area.value
                                                  )
                                                );
                                          }}
                                          data-testid={`checkbox-${area.value}`}
                                        />
                                      </FormControl>
                                      <div className="flex items-center space-x-2">
                                        <IconComponent className="w-4 h-4 text-green-600 dark:text-green-400" />
                                        <FormLabel className="text-sm font-normal cursor-pointer">
                                          {area.label}
                                        </FormLabel>
                                      </div>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  {/* Contribution */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center">
                      <HandHeart className="w-5 h-5 mr-2" />
                      Your Contribution
                    </h3>
                    
                    <FormField
                      control={form.control}
                      name="contribution"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>How will you contribute to the network? *</FormLabel>
                          <FormDescription>
                            Describe how your organization can contribute to Earth Care Network's mission. 
                            Include specific resources, expertise, or collaborative opportunities you can offer.
                          </FormDescription>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe the specific ways your organization will contribute to the Earth Care Network community..."
                              className="min-h-[150px]"
                              {...field}
                              data-testid="textarea-contribution"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-6">
                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
                      disabled={submitMutation.isPending}
                      data-testid="button-submit-application"
                    >
                      {submitMutation.isPending ? (
                        "Submitting Application..."
                      ) : (
                        <>
                          Submit Partnership Application
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground mt-3">
                      We'll review your application within 3-5 business days and get back to you via email.
                    </p>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}