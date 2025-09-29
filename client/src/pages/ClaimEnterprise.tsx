import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Building2, 
  CheckCircle, 
  Gift, 
  Star, 
  Award, 
  Sparkles,
  Mail,
  Globe,
  Users,
  TrendingUp,
  Shield,
  Crown,
  ArrowRight,
  ExternalLink
} from "lucide-react";
import type { Enterprise, Person } from "@shared/schema";

interface ClaimEnterpriseData {
  enterprise: Enterprise;
  contact: Person;
  isEligible: boolean;
  message?: string;
}

export default function ClaimEnterprise() {
  const [, params] = useRoute("/claim-enterprise/:enterpriseId/:contactId");
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // If no params, show generic claim page
  if (!params) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-blue-950 dark:to-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <Crown className="h-16 w-16 mx-auto mb-6 text-blue-600" />
            <h1 className="text-4xl font-bold mb-4" data-testid="heading-claim-enterprise">
              Claim Your Enterprise Profile
            </h1>
            <p className="text-xl text-muted-foreground mb-8" data-testid="text-claim-description">
              Join the Earth Care Network and take control of your business profile with exclusive benefits.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                <CardContent className="pt-6 text-center">
                  <Gift className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="font-semibold mb-2">Free Profile Claiming</h3>
                  <p className="text-sm text-muted-foreground">
                    Claim and verify your business profile at no cost
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                <CardContent className="pt-6 text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-green-600" />
                  <h3 className="font-semibold mb-2">11% Build Pro Discount</h3>
                  <p className="text-sm text-muted-foreground">
                    Exclusive discount on Spatial Network Build Pro services
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950 dark:border-purple-800">
                <CardContent className="pt-6 text-center">
                  <Crown className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                  <h3 className="font-semibold mb-2">Priority Support</h3>
                  <p className="text-sm text-muted-foreground">
                    Enhanced support for verified business owners
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="bg-white dark:bg-card rounded-lg p-8 border shadow-sm">
              <h2 className="text-2xl font-semibold mb-4">Ready to Get Started?</h2>
              <p className="text-muted-foreground mb-6">
                If you've received an invitation to claim your enterprise, please use the link provided in your email.
                Otherwise, contact our support team to get started.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" data-testid="button-contact-support">
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Support
                </Button>
                <Button variant="outline" size="lg" onClick={() => setLocation("/enterprises")} data-testid="button-browse-directory">
                  <Globe className="w-4 h-4 mr-2" />
                  Browse Directory
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { enterpriseId, contactId } = params;

  // Fetch enterprise and contact data
  const { data: enterprise, isLoading: loadingEnterprise } = useQuery({
    queryKey: ['/api/enterprises', enterpriseId],
    queryFn: async (): Promise<Enterprise> => {
      const response = await fetch(`/api/enterprises/${enterpriseId}`);
      if (!response.ok) throw new Error('Enterprise not found');
      return response.json();
    },
  });

  // Fetch contacts for this enterprise to verify claim eligibility
  const { data: contacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ['/api/enterprises', enterpriseId, 'contacts'],
    queryFn: async (): Promise<Person[]> => {
      const response = await fetch(`/api/enterprises/${enterpriseId}/contacts`);
      if (!response.ok) throw new Error('Failed to fetch contacts');
      return response.json();
    },
  });

  // Find the specific contact
  const contact = contacts.find(c => c.id === contactId);
  const isEligible = contact && (contact.invitationStatus === 'invited' || contact.claimStatus === 'unclaimed');

  // Claim enterprise mutation
  const claimMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated) {
        throw new Error('You must be logged in to claim an enterprise');
      }
      const response = await fetch('/api/claim-enterprise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId: contactId, enterpriseId })
      });
      if (!response.ok) throw new Error('Failed to claim enterprise');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Enterprise Claimed Successfully!",
        description: "Congratulations! You now have access to manage your enterprise profile and exclusive benefits.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/enterprises'] });
      // Redirect to enterprise dashboard
      setLocation('/enterprise/dashboard');
    },
    onError: (error: any) => {
      toast({
        title: "Claim Failed",
        description: error.message || "Failed to claim enterprise. Please contact support.",
        variant: "destructive",
      });
    },
  });

  if (loadingEnterprise || loadingContacts) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p data-testid="text-loading">Loading enterprise information...</p>
        </div>
      </div>
    );
  }

  if (!enterprise) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-8">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Enterprise Not Found</h2>
            <p className="text-muted-foreground mb-4" data-testid="text-enterprise-not-found">
              The enterprise you're looking for doesn't exist or is no longer available.
            </p>
            <Button onClick={() => setLocation("/")} data-testid="button-go-home">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Contact Not Found</h2>
            <p className="text-muted-foreground mb-4" data-testid="text-contact-not-found">
              We couldn't find your contact information for this enterprise.
            </p>
            <Button onClick={() => setLocation("/")} data-testid="button-go-home">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-blue-950 dark:to-background" data-testid="page-claim-enterprise">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-3 mr-4">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 mb-2">
                  <Gift className="w-3 h-3 mr-1" />
                  Exclusive Invitation
                </Badge>
                <h1 className="text-3xl font-bold" data-testid="heading-claim-title">
                  Claim Your Enterprise Profile
                </h1>
              </div>
            </div>
            <p className="text-lg text-muted-foreground" data-testid="text-claim-subtitle">
              You've been invited to claim and manage your business profile on Earth Care Network
            </p>
          </div>

          {/* Enterprise Details */}
          <Card className="mb-8" data-testid="card-enterprise-details">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2" data-testid="text-enterprise-name">
                    {enterprise.name}
                  </CardTitle>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" data-testid="badge-category">
                      {enterprise.category}
                    </Badge>
                    {enterprise.location && (
                      <Badge variant="outline" data-testid="badge-location">
                        {enterprise.location}
                      </Badge>
                    )}
                    {enterprise.isVerified && (
                      <Badge variant="default" className="bg-green-600" data-testid="badge-verified">
                        <Shield className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  {enterprise.description && (
                    <CardDescription data-testid="text-enterprise-description">
                      {enterprise.description}
                    </CardDescription>
                  )}
                </div>
                {enterprise.website && (
                  <Button variant="outline" size="sm" asChild data-testid="button-visit-website">
                    <a href={enterprise.website} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Visit Website
                    </a>
                  </Button>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Contact Information */}
          <Card className="mb-8" data-testid="card-contact-info">
            <CardHeader>
              <CardTitle className="text-lg">Your Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 rounded-full p-2">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium" data-testid="text-contact-name">
                    {contact.firstName} {contact.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground" data-testid="text-contact-details">
                    {contact.title && `${contact.title} • `}{contact.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benefits Section */}
          <Card className="mb-8 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
            <CardHeader>
              <CardTitle className="flex items-center" data-testid="heading-benefits">
                <Sparkles className="h-5 w-5 mr-2 text-blue-600" />
                Your Exclusive Benefits
              </CardTitle>
              <CardDescription>
                As a verified enterprise owner on Earth Care Network, you'll receive:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3" data-testid="benefit-free-claiming">
                  <div className="bg-green-100 dark:bg-green-900 rounded-full p-2 mt-1">
                    <Gift className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Free Profile Management</h4>
                    <p className="text-sm text-muted-foreground">
                      Complete control over your enterprise profile, listings, and contact information at no cost.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3" data-testid="benefit-discount">
                  <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-2 mt-1">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">11% Build Pro Discount</h4>
                    <p className="text-sm text-muted-foreground">
                      Exclusive discount on Spatial Network Build Pro services and premium features.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3" data-testid="benefit-priority">
                  <div className="bg-purple-100 dark:bg-purple-900 rounded-full p-2 mt-1">
                    <Crown className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Priority Support</h4>
                    <p className="text-sm text-muted-foreground">
                      Fast-track support and direct access to our enterprise success team.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3" data-testid="benefit-network">
                  <div className="bg-amber-100 dark:bg-amber-900 rounded-full p-2 mt-1">
                    <Star className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Network Access</h4>
                    <p className="text-sm text-muted-foreground">
                      Connect with other verified enterprises and access exclusive networking opportunities.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Claim Status & Actions */}
          {!isAuthenticated ? (
            <Alert className="mb-8">
              <Mail className="h-4 w-4" />
              <AlertTitle>Authentication Required</AlertTitle>
              <AlertDescription>
                Please log in or create an account to claim your enterprise profile.
              </AlertDescription>
            </Alert>
          ) : !isEligible ? (
            <Alert className="mb-8">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Already Claimed</AlertTitle>
              <AlertDescription>
                This enterprise has already been claimed or your invitation is no longer valid.
              </AlertDescription>
            </Alert>
          ) : (
            <Card className="mb-8 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
              <CardHeader>
                <CardTitle className="flex items-center text-green-900 dark:text-green-100" data-testid="heading-ready-to-claim">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Ready to Claim Your Enterprise
                </CardTitle>
                <CardDescription className="text-green-800 dark:text-green-200">
                  Click the button below to claim your enterprise profile and unlock all your benefits.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  size="lg" 
                  className="w-full md:w-auto bg-green-600 hover:bg-green-700"
                  onClick={() => claimMutation.mutate()}
                  disabled={claimMutation.isPending}
                  data-testid="button-claim-enterprise"
                >
                  {claimMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Claiming...
                    </>
                  ) : (
                    <>
                      <Award className="w-4 h-4 mr-2" />
                      Claim My Enterprise
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle data-testid="heading-next-steps">What Happens Next?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold text-blue-600 mt-1">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Instant Access</p>
                    <p className="text-sm text-muted-foreground">
                      Immediately gain access to your enterprise dashboard and management tools.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold text-blue-600 mt-1">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Profile Setup</p>
                    <p className="text-sm text-muted-foreground">
                      Update your enterprise information, add photos, and customize your profile.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold text-blue-600 mt-1">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Verification Process</p>
                    <p className="text-sm text-muted-foreground">
                      Our team will verify your enterprise for enhanced credibility and additional benefits.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}