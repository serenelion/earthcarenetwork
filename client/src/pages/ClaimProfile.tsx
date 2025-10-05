import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, Mail, MapPin, Globe, CheckCircle, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ClaimData {
  claim: {
    id: string;
    invitedEmail: string;
    invitedName?: string;
    invitedAt: string;
    expiresAt: string;
    status: string;
  };
  enterprise: {
    id: string;
    name: string;
    description?: string;
    category: string;
    location?: string;
    website?: string;
    imageUrl?: string;
  };
}

export default function ClaimProfile() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [claimData, setClaimData] = useState<ClaimData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClaimData = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (!token) {
        setError("Invalid claim link - no token provided");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/enterprises/claim/${token}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch claim data");
        }

        const data = await response.json();
        setClaimData(data);
      } catch (err) {
        console.error("Error fetching claim data:", err);
        setError(err instanceof Error ? err.message : "Failed to load claim data");
      } finally {
        setLoading(false);
      }
    };

    fetchClaimData();
  }, []);

  const handleClaim = async () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token || !user) return;

    setClaiming(true);
    try {
      const response = await fetch(`/api/enterprises/claim/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to claim profile");
      }

      const result = await response.json();
      
      toast({
        title: "Success!",
        description: `You are now the owner of ${result.enterprise.name}`,
      });

      setTimeout(() => {
        navigate("/crm/dashboard");
      }, 2000);
    } catch (err) {
      console.error("Error claiming profile:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to claim profile",
        variant: "destructive",
      });
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center" data-testid="loading-claim">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading claim details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="max-w-md w-full" data-testid="error-claim">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Claim Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button
              className="w-full mt-4"
              onClick={() => navigate("/")}
              data-testid="button-home"
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!claimData) {
    return null;
  }

  const { claim, enterprise } = claimData;
  const expiresAt = new Date(claim.expiresAt);
  const isExpired = expiresAt < new Date();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card data-testid="card-claim-details">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              Claim Your Enterprise Profile
            </CardTitle>
            <CardDescription>
              You've been invited to claim ownership of this enterprise profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {enterprise.imageUrl && (
              <div className="aspect-video w-full rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img
                  src={enterprise.imageUrl}
                  alt={enterprise.name}
                  className="w-full h-full object-cover"
                  data-testid="img-enterprise"
                />
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold mb-2" data-testid="text-enterprise-name">
                  {enterprise.name}
                </h2>
                {enterprise.description && (
                  <p className="text-muted-foreground" data-testid="text-enterprise-description">
                    {enterprise.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {enterprise.location && (
                  <div className="flex items-center gap-2" data-testid="text-location">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{enterprise.location}</span>
                  </div>
                )}
                {enterprise.website && (
                  <div className="flex items-center gap-2" data-testid="text-website">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={enterprise.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {enterprise.website}
                    </a>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2" data-testid="text-invited-email">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Invited: {claim.invitedEmail}</span>
                </div>
                <div className="flex items-center gap-2" data-testid="text-expires">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {isExpired ? "Expired" : `Expires`}: {expiresAt.toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {isExpired ? (
              <Alert variant="destructive" data-testid="alert-expired">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  This invitation has expired. Please contact the person who sent the invitation to request a new one.
                </AlertDescription>
              </Alert>
            ) : !user ? (
              <div className="space-y-4">
                <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800" data-testid="alert-signin">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-900 dark:text-blue-100">
                    <strong>Join as a free member to claim this profile!</strong> Claiming gives you full control of your enterprise profile plus exclusive member benefits including networking opportunities and business growth tools.
                  </AlertDescription>
                </Alert>
                <Button
                  className="w-full"
                  onClick={() => window.location.href = "/api/login"}
                  data-testid="button-signin"
                >
                  Join Free to Claim
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert data-testid="alert-claim-ready">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Click the button below to claim ownership of this enterprise profile. You will become the enterprise owner.
                  </AlertDescription>
                </Alert>
                <Button
                  className="w-full"
                  onClick={handleClaim}
                  disabled={claiming}
                  data-testid="button-claim"
                >
                  {claiming ? "Claiming..." : "Claim This Profile"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
