import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { z } from "zod";
import { insertEnterpriseSchema } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  MapPin,
  Lock,
  Sparkles,
  Crown,
  Loader2
} from "lucide-react";

const createEnterpriseFormSchema = insertEnterpriseSchema.extend({
  name: z.string().min(1, "Enterprise name is required").max(255),
  description: z.string().optional(),
  category: z.enum(["land_projects", "capital_sources", "open_source_tools", "network_organizers"]),
  contactEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  location: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
});

type CreateEnterpriseFormData = z.infer<typeof createEnterpriseFormSchema>;

interface CreateEnterpriseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (enterpriseId: string) => void;
}

const categoryLabels = {
  land_projects: "Land Projects",
  capital_sources: "Capital Sources",
  open_source_tools: "Open Source Tools",
  network_organizers: "Network Organizers",
};

const categoryDescriptions = {
  land_projects: "Regenerative farms, food forests, permaculture sites",
  capital_sources: "Impact investment funds, grantmaking organizations",
  open_source_tools: "Digital tools for mapping, monitoring, and managing",
  network_organizers: "Organizations building communities and movements",
};

export default function CreateEnterpriseDialog({ 
  open, 
  onOpenChange,
  onSuccess 
}: CreateEnterpriseDialogProps) {
  const { user } = useAuth();
  const { userSubscription } = useSubscription();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateEnterpriseFormData>({
    resolver: zodResolver(createEnterpriseFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "land_projects",
      contactEmail: user?.email || "",
      location: "",
      website: "",
    },
  });

  const onSubmit = async (data: CreateEnterpriseFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/crm/enterprises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create enterprise");
      }

      const enterprise = await response.json();

      // Invalidate the user enterprises query to refresh the list
      await queryClient.invalidateQueries({ queryKey: ['/api/crm/user/enterprises'] });

      toast({
        title: "Enterprise setup complete!",
        description: "Your public profile and CRM workspace are ready.",
      });

      onOpenChange(false);
      form.reset();

      if (onSuccess) {
        onSuccess(enterprise.id);
      } else {
        // Navigate to the CRM people page which is more reliable than dashboard
        setLocation(`/crm/${enterprise.id}/people`);
      }
    } catch (error) {
      console.error("Error creating enterprise:", error);
      toast({
        title: "Failed to setup enterprise",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentPlanType = userSubscription?.currentPlanType || "free";
  const isFreeUser = currentPlanType === "free";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="create-enterprise-dialog">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Setup Your Enterprise
          </DialogTitle>
          <DialogDescription className="text-base">
            Create your public profile and CRM workspace. Features vary by membership tier.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Two Sides of Your Enterprise */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Two Sides of Your Enterprise:
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold">Public Profile:</span> Visible on the directory, discoverable globally
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Lock className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold">CRM Workspace:</span> Private tools for managing your business
                </div>
              </div>
            </div>
          </div>

          {/* Value Proposition Section */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              What you'll get:
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-base">📍</span>
                <span>Public profile on the regenerative enterprise directory</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-base">📊</span>
                <span>CRM workspace to manage contacts and opportunities</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-base">🤝</span>
                <span>Team collaboration with customizable access</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-base">✨</span>
                <span>Features based on your membership tier</span>
              </li>
            </ul>
          </div>

          {/* Subscription Tier Info */}
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Your Plan:</span>
                <Badge variant={isFreeUser ? "secondary" : "default"} data-testid="user-plan-badge">
                  {currentPlanType === "free" && "Free"}
                  {currentPlanType === "crm_basic" && "CRM Basic"}
                  {currentPlanType === "crm_pro" && "CRM Pro"}
                </Badge>
              </div>
              {isFreeUser && (
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={() => {
                    onOpenChange(false);
                    setLocation("/pricing");
                  }}
                  data-testid="link-upgrade-plan"
                >
                  Upgrade to CRM Pro
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {isFreeUser 
                ? "Free: Basic features. CRM Pro: Full CRM access ($42/month or $420/year)"
                : `Your ${currentPlanType.replace("_", " ")} plan includes full CRM access with all features.`
              }
            </p>

            {/* Dreaming Session Invitation */}
            <div className="mt-4 bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Upgrade Your Earth Care Profile</h4>
                  <p className="text-sm text-muted-foreground">
                    Apply for a Dreaming Session with Terralux Agency to transform your enterprise 
                    with our spatial network storytelling technology. Get a story on the map, 
                    digital twin tools, and AI-powered sales landing pages.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => window.open("/apply-dreaming", "_blank")}
                    data-testid="apply-dreaming-button"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Apply for Dreaming Session
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Enterprise Creation Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enterprise Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Green Valley Farm, Regenerative Fund" 
                        {...field}
                        data-testid="input-enterprise-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-enterprise-category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(categoryLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value} data-testid={`category-option-${value}`}>
                            <div>
                              <div className="font-medium">{label}</div>
                              <div className="text-xs text-muted-foreground">
                                {categoryDescriptions[value as keyof typeof categoryDescriptions]}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell us about your enterprise and mission..."
                        className="min-h-[100px]"
                        {...field}
                        data-testid="textarea-enterprise-description"
                      />
                    </FormControl>
                    <FormDescription>
                      Share what makes your enterprise unique
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="contact@example.com"
                        {...field}
                        data-testid="input-contact-email"
                      />
                    </FormControl>
                    <FormDescription>
                      Public email for inquiries (defaults to your account email)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location/Region</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., California, USA"
                          {...field}
                          data-testid="input-location"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website URL</FormLabel>
                      <FormControl>
                        <Input 
                          type="url"
                          placeholder="https://example.com"
                          {...field}
                          data-testid="input-website"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  data-testid="button-create-enterprise"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <Building2 className="mr-2 h-4 w-4" />
                      Setup Enterprise
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
