import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, ExternalLink, Users, CheckCircle, ArrowRight, Sprout } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Enterprise, EarthCarePledge } from "@shared/schema";

interface EnterpriseCardProps {
  enterprise: Enterprise;
  "data-testid"?: string;
}

const categoryColors = {
  land_projects: "bg-green-100 text-green-800",
  capital_sources: "bg-yellow-100 text-yellow-800", 
  open_source_tools: "bg-blue-100 text-blue-800",
  network_organizers: "bg-purple-100 text-purple-800",
};

const categoryLabels = {
  land_projects: "Land Project",
  capital_sources: "Capital Source",
  open_source_tools: "Open Source Tool", 
  network_organizers: "Network Organizer",
};

export default function EnterpriseCard({ enterprise, "data-testid": testId }: EnterpriseCardProps) {
  const categoryClass = categoryColors[enterprise.category as keyof typeof categoryColors] || "bg-gray-100 text-gray-800";
  const categoryLabel = categoryLabels[enterprise.category as keyof typeof categoryLabels] || enterprise.category;

  const { data: pledgeData } = useQuery<{ pledge: EarthCarePledge } | null>({
    queryKey: ["/api/enterprises", enterprise.id, "pledge"],
    queryFn: async () => {
      const response = await fetch(`/api/enterprises/${enterprise.id}/pledge`);
      if (!response.ok) return null;
      return response.json();
    },
  });

  const hasAffirmedPledge = pledgeData?.pledge?.status === 'affirmed';

  return (
    <Link href={`/enterprises/${enterprise.id}`}>
      <Card className="overflow-hidden shadow-lg border border-border hover:shadow-xl transition-shadow group cursor-pointer relative">
        {hasAffirmedPledge && (
          <div className="absolute top-2 right-2 z-10 bg-green-600 text-white rounded-full p-1.5 shadow-md" data-testid="indicator-pledge-affirmed">
            <Sprout className="w-4 h-4" />
          </div>
        )}
        {/* Enterprise Image Placeholder */}
        <div className="h-48 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
        {enterprise.imageUrl ? (
          <img 
            src={enterprise.imageUrl} 
            alt={enterprise.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to gradient background if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : (
          <div className="text-6xl text-primary/30">
            {enterprise.category === 'land_projects' && '🌱'}
            {enterprise.category === 'capital_sources' && '💰'}
            {enterprise.category === 'open_source_tools' && '🔧'}
            {enterprise.category === 'network_organizers' && '🌐'}
          </div>
        )}
      </div>
      
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <Badge className={`${categoryClass} text-sm font-medium`}>
            {categoryLabel}
          </Badge>
          {enterprise.location && (
            <div className="flex items-center text-muted-foreground text-sm">
              <MapPin className="w-3 h-3 mr-1" />
              <span data-testid={testId ? `${testId}-location` : undefined}>
                {enterprise.location}
              </span>
            </div>
          )}
        </div>
        
        <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors font-lato">
          {enterprise.name}
        </h3>
        
        <p className="text-muted-foreground mb-4 line-clamp-3">
          {enterprise.description || "No description available"}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {enterprise.isVerified && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
            {enterprise.followerCount !== undefined && enterprise.followerCount !== null && enterprise.followerCount > 0 && (
              <Badge variant="outline" className="text-muted-foreground">
                <Users className="w-3 h-3 mr-1" />
                {enterprise.followerCount} Followers
              </Badge>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary/80 hover:underline text-sm font-medium"
            data-testid={testId ? `${testId}-view-profile` : "button-view-profile"}
          >
            View Details
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
        
        {/* Tags */}
        {enterprise.tags && enterprise.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {enterprise.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {enterprise.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{enterprise.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
    </Link>
  );
}
