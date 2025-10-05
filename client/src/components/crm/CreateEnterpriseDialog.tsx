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
  category: z.enum(["land_projects", "capital_sources", "open_source_tools", "network_organizers"]),
  contactEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
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
        title: pledgeSignedSuccessfully ? "Workspace Created!" : "Workspace Created!",
        description: pledgeSignedSuccessfully
          ? "Your workspace is ready and you've signed the Earth Care Pledge. Welcome!"
          : signPledge
            ? "Your workspace is ready! There was an issue with the pledge, but you can sign it later."
            : "Your workspace and CRM are ready to use. Start managing your partnerships!",
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
        title: "Workspace creation failed",
        description: error instanceof Error ? error.message : "Please try again or contact support if the issue persists.",
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
            Create Your Enterprise Workspace
          </DialogTitle>
          <DialogDescription className="text-base">
            Set up your free enterprise profile and workspace. Get discovered in the global directory and access powerful CRM tools to manage your partnerships and opportunities.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Your Free Workspace */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-sm">What You Get (Free):</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Globe className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold">Global Visibility:</span> A public profile in the regenerative enterprise directory. 
                  Get discovered by potential partners, customers, and collaborators.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Lock className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold">Private CRM Workspace:</span> Manage contacts, track opportunities, 
                  and build meaningful partnerships. Invite team members and work together.
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

              {/* Earth Care Pledge Invitation */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <FormField
                  control={form.control}
                  name="signPledge"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="mt-1"
                          data-testid="checkbox-sign-pledge"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="font-semibold text-sm">
                          Sign the Earth Care Pledge (Optional)
                        </FormLabel>
                        <FormDescription className="text-sm">
                          Showcase yourself as a pioneer of ethical enterprise. The Earth Care Pledge is a 
                          commitment to regenerative practices that helps others recognize your values. 
                          By signing, you'll be featured in our directory of pledge signatories.
                        </FormDescription>
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
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating workspace...
                    </>
                  ) : (
                    <>
                      <Building2 className="mr-2 h-4 w-4" />
                      Create My Workspace
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
