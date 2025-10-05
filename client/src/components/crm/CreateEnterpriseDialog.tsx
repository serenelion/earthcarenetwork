import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { z } from "zod";
import { insertEnterpriseSchema } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/contexts/SubscriptionContext";
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
  Target, 
  Lightbulb, 
  BarChart3, 
  Users, 
  Globe, 
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

      toast({
        title: "Workspace created!",
        description: "Welcome to your CRM. Let's get started!",
      });

      onOpenChange(false);
      form.reset();

      if (onSuccess) {
        onSuccess(enterprise.id);
      } else {
        setLocation(`/crm/${enterprise.id}/dashboard`);
      }
    } catch (error) {
      console.error("Error creating enterprise:", error);
      toast({
        title: "Failed to create workspace",
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
            Create Your Enterprise Workspace
          </DialogTitle>
          <DialogDescription className="text-base">
            Set up your CRM to manage contacts, track opportunities, and grow your regenerative business
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Value Proposition Section */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              What you'll get:
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Target className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Track unlimited contacts and opportunities</span>
              </li>
              <li className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>AI-powered lead scoring and insights</span>
              </li>
              <li className="flex items-start gap-2">
                <BarChart3 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Pipeline management and analytics</span>
              </li>
              <li className="flex items-start gap-2">
                <Users className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Team collaboration with role-based access</span>
              </li>
              <li className="flex items-start gap-2">
                <Globe className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Join the global regenerative enterprise directory</span>
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
                  {currentPlanType === "build_pro_bundle" && "Build Pro"}
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
                ? "Upgrade to CRM Pro to unlock advanced features like AI-powered insights and unlimited team members."
                : `Your ${currentPlanType.replace("_", " ")} plan includes full CRM access with all features.`
              }
            </p>
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
                      Creating...
                    </>
                  ) : (
                    <>
                      <Building2 className="mr-2 h-4 w-4" />
                      Create Workspace
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
