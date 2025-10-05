import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sprout } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface PledgeAffirmationModalProps {
  enterpriseId: string;
  enterpriseName: string;
  existingPledge?: any; // EarthCarePledge type
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const pledgeFormSchema = z.object({
  affirmed: z.boolean().refine(val => val === true, "You must affirm the commitment to proceed"),
  narrative: z.string().optional(),
});

type PledgeFormValues = z.infer<typeof pledgeFormSchema>;

export default function PledgeAffirmationModal({
  enterpriseId,
  enterpriseName,
  existingPledge,
  open,
  onOpenChange,
  onSuccess,
}: PledgeAffirmationModalProps) {
  const { toast } = useToast();

  const form = useForm<PledgeFormValues>({
    resolver: zodResolver(pledgeFormSchema),
    defaultValues: {
      affirmed: existingPledge?.status === 'affirmed' || false,
      narrative: existingPledge?.narrative || "",
    },
  });

  const pledgeMutation = useMutation({
    mutationFn: async (data: PledgeFormValues) => {
      const method = existingPledge ? "PATCH" : "POST";
      const response = await apiRequest(method, `/api/enterprises/${enterpriseId}/pledge`, {
        narrative: data.narrative
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/enterprises', enterpriseId] });
      toast({
        title: "Success",
        description: "Pledge affirmed successfully!",
      });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to affirm pledge",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PledgeFormValues) => {
    pledgeMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" data-testid="dialog-pledge-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sprout className="h-5 w-5 text-primary" />
            Sign the Earth Care Enterprise Plan
          </DialogTitle>
          <DialogDescription>
            Affirm your commitment to universal ethics: Earth Care, People Care, and Fair Share
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Unified Commitment Statement */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-6">
              <p className="text-lg font-medium text-foreground mb-4 leading-relaxed">
                "I commit 100% to valuing earth care, people care, and fair share for the good of the next 7 generations."
              </p>
              
              <FormField
                control={form.control}
                name="affirmed"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={pledgeMutation.isPending}
                        data-testid="checkbox-affirm-commitment"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-base font-medium">
                        I affirm this commitment on behalf of {enterpriseName}
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Narrative Textarea */}
            <FormField
              control={form.control}
              name="narrative"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Narrative (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="How does your enterprise demonstrate these values?"
                      className="min-h-[100px]"
                      disabled={pledgeMutation.isPending}
                      data-testid="input-narrative"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Share how {enterpriseName} embodies these values
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={pledgeMutation.isPending}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={pledgeMutation.isPending}
                data-testid="button-affirm-pledge"
              >
                {pledgeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>{existingPledge ? "Update Pledge" : "Affirm Pledge"}</>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
