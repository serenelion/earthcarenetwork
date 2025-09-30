import { Link } from "wouter";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building,
  MapPin,
  ExternalLink,
  CheckCircle,
  Users,
  Sparkles,
  Edit,
  Trash2,
} from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import { type Enterprise } from "@shared/schema";
import { cn } from "@/lib/utils";

interface EnterpriseSummaryProps {
  enterprise: Enterprise;
  variant?: 'card' | 'list' | 'compact';
  showActions?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

const categories = [
  { value: "land_projects", label: "Land Projects" },
  { value: "capital_sources", label: "Capital Sources" },
  { value: "open_source_tools", label: "Open Source Tools" },
  { value: "network_organizers", label: "Network Organizers" },
];

const categoryColors = {
  land_projects: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  capital_sources: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  open_source_tools: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  network_organizers: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

export default function EnterpriseSummary({
  enterprise,
  variant = 'card',
  showActions = false,
  onEdit,
  onDelete,
  className,
}: EnterpriseSummaryProps) {
  const categoryClass = categoryColors[enterprise.category as keyof typeof categoryColors] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  const categoryLabel = categories.find(c => c.value === enterprise.category)?.label || enterprise.category;

  if (variant === 'card') {
    return (
      <Card 
        className={cn("overflow-hidden hover:shadow-xl transition-all duration-300 group", className)}
        data-testid={`enterprise-card-${enterprise.id}`}
      >
        {/* Header with Favorite */}
        <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 p-6 border-b">
          {!showActions && (
            <div className="absolute top-3 right-3">
              <FavoriteButton 
                enterpriseId={enterprise.id} 
                enterpriseName={enterprise.name}
                size="sm"
              />
            </div>
          )}
          
          <div className={cn("flex items-start gap-3", !showActions && "pr-8")}>
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-foreground truncate group-hover:text-primary transition-colors">
                  {enterprise.name}
                </h3>
                {enterprise.isVerified && (
                  <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" data-testid={`verified-${enterprise.id}`} />
                )}
              </div>
              <Badge className={`${categoryClass} text-xs`}>
                {categoryLabel}
              </Badge>
            </div>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-6">
          {enterprise.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
              {enterprise.description}
            </p>
          )}
          
          <div className="space-y-2 mb-4">
            {enterprise.location && (
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">{enterprise.location}</span>
              </div>
            )}
            
            {enterprise.followerCount != null && enterprise.followerCount > 0 && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>{enterprise.followerCount.toLocaleString()} followers</span>
              </div>
            )}
          </div>

          {enterprise.tags && enterprise.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {enterprise.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {enterprise.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{enterprise.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            {showActions ? (
              <>
                <Button 
                  asChild
                  variant="default" 
                  size="sm" 
                  className="flex-1"
                  data-testid={`view-details-${enterprise.id}`}
                >
                  <Link href={`/enterprises/${enterprise.id}`}>
                    <Sparkles className="w-4 h-4 mr-1" />
                    View Details
                  </Link>
                </Button>
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(enterprise.id)}
                    data-testid={`edit-${enterprise.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(enterprise.id)}
                    data-testid={`delete-${enterprise.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
                {enterprise.website && (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    data-testid={`visit-website-${enterprise.id}`}
                  >
                    <a
                      href={enterprise.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button 
                  asChild
                  variant="default" 
                  size="sm" 
                  className="flex-1"
                  data-testid={`view-details-${enterprise.id}`}
                >
                  <Link href={`/enterprises/${enterprise.id}`}>
                    <Sparkles className="w-4 h-4 mr-1" />
                    View Details
                  </Link>
                </Button>
                
                {enterprise.website && (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    data-testid={`visit-website-${enterprise.id}`}
                  >
                    <a
                      href={enterprise.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'list') {
    return (
      <div 
        className={cn(
          "flex items-center gap-4 p-4 border-b hover:bg-muted/50 transition-colors",
          className
        )}
        data-testid={`enterprise-list-${enterprise.id}`}
      >
        {/* Icon and Name */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link href={`/enterprises/${enterprise.id}`}>
                <span className="font-semibold text-foreground hover:text-primary transition-colors truncate">
                  {enterprise.name}
                </span>
              </Link>
              {enterprise.isVerified && (
                <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" data-testid={`verified-${enterprise.id}`} />
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`${categoryClass} text-xs`}>
                {categoryLabel}
              </Badge>
              {enterprise.location && (
                <span className="text-xs text-muted-foreground truncate flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  {enterprise.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description (hidden on mobile) */}
        {enterprise.description && (
          <div className="hidden md:block flex-1 min-w-0">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {enterprise.description}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {showActions ? (
            <>
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(enterprise.id)}
                  data-testid={`edit-${enterprise.id}`}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(enterprise.id)}
                  data-testid={`delete-${enterprise.id}`}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              )}
              {enterprise.website && (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  data-testid={`visit-website-${enterprise.id}`}
                >
                  <a
                    href={enterprise.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              )}
            </>
          ) : (
            <>
              <Button 
                asChild
                variant="ghost" 
                size="sm"
                data-testid={`view-details-${enterprise.id}`}
              >
                <Link href={`/enterprises/${enterprise.id}`}>
                  <Sparkles className="w-4 h-4" />
                </Link>
              </Button>
              {enterprise.website && (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  data-testid={`visit-website-${enterprise.id}`}
                >
                  <a
                    href={enterprise.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div 
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors",
          className
        )}
        data-testid={`enterprise-compact-${enterprise.id}`}
      >
        {/* Icon */}
        <div className="w-8 h-8 bg-primary/20 rounded-md flex items-center justify-center flex-shrink-0">
          <Building className="w-4 h-4 text-primary" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link href={`/enterprises/${enterprise.id}`}>
              <span className="text-sm font-semibold text-foreground hover:text-primary transition-colors truncate">
                {enterprise.name}
              </span>
            </Link>
            {enterprise.isVerified && (
              <CheckCircle className="w-3 h-3 text-blue-500 flex-shrink-0" data-testid={`verified-${enterprise.id}`} />
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge className={`${categoryClass} text-[10px] px-1.5 py-0`}>
              {categoryLabel}
            </Badge>
            {enterprise.followerCount != null && enterprise.followerCount > 0 && (
              <span className="text-xs text-muted-foreground flex items-center">
                <Users className="w-3 h-3 mr-1" />
                {enterprise.followerCount.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onEdit(enterprise.id)}
                data-testid={`edit-${enterprise.id}`}
              >
                <Edit className="w-3 h-3" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onDelete(enterprise.id)}
                data-testid={`delete-${enterprise.id}`}
              >
                <Trash2 className="w-3 h-3 text-destructive" />
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
}
