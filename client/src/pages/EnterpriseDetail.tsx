import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { hasRole } from "@/lib/authUtils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  ExternalLink, 
  Users, 
  CheckCircle, 
  Mail, 
  Edit, 
  ArrowLeft,
  Globe
} from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import type { Enterprise } from "@shared/schema";

const categoryColors = {
  land_projects: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  capital_sources: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400", 
  open_source_tools: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  network_organizers: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
};

const categoryLabels = {
  land_projects: "Land Project",
  capital_sources: "Capital Source",
  open_source_tools: "Open Source Tool", 
  network_organizers: "Network Organizer",
};

export default function EnterpriseDetail() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const isAdmin = hasRole(user, ["admin"]);

  const { data: enterprise, isLoading, error } = useQuery<Enterprise>({
    queryKey: ["/api/enterprises", id],
    queryFn: async () => {
      const response = await fetch(`/api/enterprises/${id}`);
      if (!response.ok) throw new Error("Failed to fetch enterprise");
      return response.json();
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse">
            <div className="h-64 bg-muted rounded-lg mb-8"></div>
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-muted rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !enterprise) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Enterprise Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The enterprise you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild data-testid="button-back-to-directory">
            <Link href="/enterprises">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Directory
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const categoryClass = categoryColors[enterprise.category as keyof typeof categoryColors] || "bg-gray-100 text-gray-800";
  const categoryLabel = categoryLabels[enterprise.category as keyof typeof categoryLabels] || enterprise.category;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          asChild 
          className="mb-6"
          data-testid="button-back-navigation"
        >
          <Link href="/enterprises">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Directory
          </Link>
        </Button>

        {/* Enterprise Header Card */}
        <Card className="overflow-hidden">
          {/* Hero Image */}
          <div className="h-64 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center relative">
            {enterprise.imageUrl ? (
              <img 
                src={enterprise.imageUrl} 
                alt={enterprise.name}
                className="w-full h-full object-cover"
                data-testid="img-enterprise"
              />
            ) : (
              <div className="text-8xl">
                {enterprise.category === 'land_projects' && '🌱'}
                {enterprise.category === 'capital_sources' && '💰'}
                {enterprise.category === 'open_source_tools' && '🔧'}
                {enterprise.category === 'network_organizers' && '🌐'}
              </div>
            )}
          </div>

          <CardContent className="p-6 sm:p-8">
            {/* Title and Actions Row */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Badge className={`${categoryClass} text-sm font-medium`} data-testid="badge-category">
                    {categoryLabel}
                  </Badge>
                  {enterprise.isVerified && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" data-testid="badge-verified">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                
                <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-foreground" data-testid="text-enterprise-name">
                  {enterprise.name}
                </h1>
                
                {enterprise.location && (
                  <div className="flex items-center text-muted-foreground mb-4">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span data-testid="text-location">{enterprise.location}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {isAuthenticated && (
                  <FavoriteButton 
                    enterpriseId={enterprise.id} 
                    data-testid="button-favorite"
                  />
                )}
                {isAdmin && (
                  <Button 
                    variant="outline" 
                    asChild
                    data-testid="button-edit"
                  >
                    <Link href={`/admin/enterprises/${enterprise.id}/edit`}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            <Separator className="my-6" />

            {/* Description */}
            {enterprise.description && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">About</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap" data-testid="text-description">
                  {enterprise.description}
                </p>
              </div>
            )}

            {/* Contact Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {enterprise.website && (
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => window.open(enterprise.website!, "_blank", "noopener,noreferrer")}
                  data-testid="button-website"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Visit Website
                  <ExternalLink className="w-3 h-3 ml-auto" />
                </Button>
              )}
              
              {enterprise.contactEmail && (
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => window.location.href = `mailto:${enterprise.contactEmail}`}
                  data-testid="button-contact"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Contact
                </Button>
              )}
            </div>

            {/* Tags */}
            {enterprise.tags && enterprise.tags.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-3">Tags</h2>
                <div className="flex flex-wrap gap-2" data-testid="container-tags">
                  {enterprise.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-sm" data-testid={`tag-${index}`}>
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Follower Count */}
            {enterprise.followerCount !== undefined && enterprise.followerCount !== null && enterprise.followerCount > 0 && (
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center text-muted-foreground">
                  <Users className="w-5 h-5 mr-2" />
                  <span data-testid="text-followers">
                    {enterprise.followerCount} {enterprise.followerCount === 1 ? 'Follower' : 'Followers'}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Related Opportunities Section - Placeholder for future */}
        {isAuthenticated && (
          <Card className="mt-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-3">Related Opportunities</h2>
              <p className="text-muted-foreground">
                No opportunities associated with this enterprise yet.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
