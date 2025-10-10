import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { z } from "zod";
import { insertEnterpriseSchema } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
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
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  Globe,
  Lock,
  Loader2
} from "lucide-react";

const createEnterpriseFormSchema = insertEnterpriseSchema.extend({
  name: z.string().min(1, "Enterprise name is required").max(255),
  description: z.string().optional(),
  category: z.enum(["land_projects", "capital_sources", "open_source_tools", "network_organizers", "homes_that_heal", "landscapes_that_nourish", "lifelong_learning_providers"]),
  location: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  signPledge: z.boolean().optional().default(false),
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
  homes_that_heal: "Homes that Heal",
  landscapes_that_nourish: "Landscapes that Nourish",
  lifelong_learning_providers: "Lifelong Learning",
};

const categoryDescriptions = {
  land_projects: "Regenerative farms, food forests, permaculture sites",
  capital_sources: "Impact investment funds, grantmaking organizations",
  open_source_tools: "Digital tools for mapping, monitoring, and managing",
  network_organizers: "Organizations building communities and movements",
  homes_that_heal: "Eco luxury home design and manufacturing partners",
  landscapes_that_nourish: "Landscape designers, urban planners, food forest installers",
  lifelong_learning_providers: "Holistic educational programs for human development",
};

export default function CreateEnterpriseDialog({ 
  open, 
  onOpenChange,
  onSuccess 
}: CreateEnterpriseDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateEnterpriseFormData>({
    resolver: zodResolver(createEnterpriseFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "land_projects",
      location: "",
      website: "",
      signPledge: false,
    },
  });

  const onSubmit = async (data: CreateEnterpriseFormData) => {
    setIsSubmitting(true);
    try {
      const { signPledge, ...enterpriseData } = data;
      
      const response = await fetch("/api/crm/enterprises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enterpriseData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create enterprise");
      }

      const enterprise = await response.json();

      let pledgeSignedSuccessfully = false;

      // If user wants to sign the pledge, create the pledge record
      if (signPledge) {
        try {
          const pledgeResponse = await fetch(`/api/enterprises/${enterprise.id}/pledge`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              narrative: "" // Optional narrative, can be empty for now
            }),
          });

          if (pledgeResponse.ok) {
            pledgeSignedSuccessfully = true;
          } else {
            console.error("Pledge signing failed:", await pledgeResponse.text());
          }
        } catch (pledgeError) {
          console.error("Error signing pledge:", pledgeError);
        }
      }

      // Invalidate the user enterprises query to refresh the list
      await queryClient.invalidateQueries({ queryKey: ['/api/crm/user/enterprises'] });

      toast({
        title: pledgeSignedSuccessfully ? "🌱 Enterprise Activated!" : "Enterprise Activated!",
        description: pledgeSignedSuccessfully
          ? "Welcome to the regenerative economy! You've signed the Earth Care Pledge and your workspace is ready."
          : signPledge
            ? "Your enterprise is now live! There was an issue with the pledge - you can sign it later from your profile."
            : "Your enterprise is live and your CRM workspace is ready. Start building partnerships!",
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
        title: "Activation failed",
        description: error instanceof Error ? error.message : "Unable to activate your enterprise. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="create-enterprise-dialog">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Activate Your Enterprise
          </DialogTitle>
          <DialogDescription className="text-base">
            Join the regenerative economy by activating your free enterprise profile. Get global visibility and access powerful tools to grow meaningful partnerships.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* What You Get */}
          <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-4 space-y-3 border border-primary/20">
            <h3 className="font-semibold text-sm">Activation Benefits (Free Forever):</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Globe className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold">Global Presence:</span> Appear in the regenerative enterprise directory where partners, investors, and collaborators discover aligned organizations.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Lock className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold">Full CRM Suite:</span> Track contacts, opportunities, and partnerships. Invite your team to collaborate and grow together.
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

              {/* Earth Care Pledge Invitation */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-3">
                <FormField
                  control={form.control}
                  name="signPledge"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <div className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="mt-1"
                            data-testid="checkbox-sign-pledge"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none flex-1">
                          <FormLabel className="font-semibold text-sm">
                            Sign the Earth Care Pledge (Optional)
                          </FormLabel>
                          <FormDescription className="text-sm">
                            Stand out as a verified regenerative enterprise and get featured in our pledge directory.
                          </FormDescription>
                        </div>
                      </div>
                      
                      {/* The Pledge Text */}
                      <div className="ml-6 pl-4 border-l-2 border-green-300 dark:border-green-700 space-y-2 text-sm">
                        <p className="font-medium italic text-green-800 dark:text-green-200">
                          "I commit 100% to valuing earth care, people care, and fair share for the good of the next 7 generations."
                        </p>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p><strong>Earth Care:</strong> We commit to operating in a way that minimizes our environmental impact and promotes ecological sustainability.</p>
                          <p><strong>People Care:</strong> We commit to fostering a positive and equitable environment for our employees, partners, and communities.</p>
                          <p><strong>Fair Share:</strong> We commit to transparent and ethical business practices, ensuring fair distribution of resources and opportunities.</p>
                        </div>
                      </div>
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
                  className="bg-primary hover:bg-primary/90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Activating...
                    </>
                  ) : (
                    <>
                      <Building2 className="mr-2 h-4 w-4" />
                      Activate My Enterprise
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
