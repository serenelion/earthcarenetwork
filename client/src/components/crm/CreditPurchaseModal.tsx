import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Coins, Check, Loader2, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface CreditPurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CREDIT_PACKAGES = [
  { amount: 10, credits: 1000, popular: false },
  { amount: 25, credits: 2500, popular: true },
  { amount: 50, credits: 5000, popular: false },
  { amount: 100, credits: 10000, popular: false },
];

export default function CreditPurchaseModal({ open, onOpenChange }: CreditPurchaseModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(25);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isCustom, setIsCustom] = useState(false);
  const { toast } = useToast();

  const { data: subscriptionStatus, isLoading: loadingStatus } = useQuery<{
    user: {
      currentPlanType: string;
      creditBalance: number;
      creditLimit: number;
      monthlyAllocation: number;
    };
  }>({
    queryKey: ["/api/subscription/status"],
  });

  const checkoutMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest("POST", "/api/stripe/create-credit-checkout", { amount });
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create checkout session",
        variant: "destructive",
      });
    },
  });

  const handlePurchase = () => {
    const amount = isCustom ? parseFloat(customAmount) : selectedAmount;
    
    if (!amount || amount < 5) {
      toast({
        title: "Invalid Amount",
        description: "Minimum purchase is $5",
        variant: "destructive",
      });
      return;
    }

    checkoutMutation.mutate(amount);
  };

  const getCreditsForAmount = (amount: number) => {
    return amount * 100;
  };

  const currentBalance = subscriptionStatus?.user?.creditBalance || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" data-testid="credit-purchase-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Purchase AI Credits
          </DialogTitle>
          <DialogDescription>
            Buy credits to use AI features across the platform
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Balance */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className="text-2xl font-bold" data-testid="current-credit-balance">
                  {loadingStatus ? "..." : currentBalance.toLocaleString()} credits
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ${(currentBalance / 100).toFixed(2)} worth of AI credits
                </p>
              </div>
              {currentBalance < 100 && (
                <div className="flex items-center gap-2 text-orange-500">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Low Balance</span>
                </div>
              )}
            </div>
          </div>

          {/* Package Selection */}
          <div className="space-y-3">
            <Label>Select Package</Label>
            <div className="grid grid-cols-2 gap-3">
              {CREDIT_PACKAGES.map((pkg) => (
                <button
                  key={pkg.amount}
                  onClick={() => {
                    setSelectedAmount(pkg.amount);
                    setIsCustom(false);
                  }}
                  className={`
                    relative p-4 rounded-lg border-2 transition-all text-left
                    ${selectedAmount === pkg.amount && !isCustom
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                    }
                  `}
                  data-testid={`package-${pkg.amount}`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                      Popular
                    </div>
                  )}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-lg font-bold">${pkg.amount}</p>
                      <p className="text-sm text-muted-foreground">
                        {pkg.credits.toLocaleString()} credits
                      </p>
                    </div>
                    {selectedAmount === pkg.amount && !isCustom && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="space-y-3">
            <Label>Or Enter Custom Amount</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Enter amount (min $5)"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setIsCustom(true);
                    setSelectedAmount(null);
                  }}
                  min={5}
                  step={1}
                  data-testid="input-custom-amount"
                />
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                {customAmount && parseFloat(customAmount) >= 5 && (
                  <span data-testid="custom-credits-display">
                    = {getCreditsForAmount(parseFloat(customAmount)).toLocaleString()} credits
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Purchase Info */}
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium">Purchase Details:</p>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>• Credits never expire</p>
              <p>• 1 credit = $0.01 in AI costs</p>
              <p>• Use credits for AI features like lead scoring and chat</p>
              <p>• Secure payment via Stripe</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={checkoutMutation.isPending || (!selectedAmount && !customAmount)}
              className="flex-1"
              data-testid="button-buy-credits"
            >
              {checkoutMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Buy {isCustom && customAmount 
                    ? `$${parseFloat(customAmount).toFixed(2)}` 
                    : selectedAmount 
                      ? `$${selectedAmount}` 
                      : "Credits"}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
