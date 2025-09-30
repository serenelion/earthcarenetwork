import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, LucideIcon } from "lucide-react";
import { Link } from "wouter";

interface CategorySectionProps {
  category: {
    id: string;
    title: string;
    description: string;
    icon: LucideIcon;
    count: number;
  };
  "data-testid"?: string;
}

export default function CategorySection({ category, "data-testid": testId }: CategorySectionProps) {
  const Icon = category.icon;
  
  // Convert category ID to route path
  const categoryRoute = `/directory/${category.id.replace(/_/g, '-')}`;

  return (
    <Link href={categoryRoute}>
      <Card 
        className="p-6 shadow-lg border border-border hover:shadow-xl transition-shadow group cursor-pointer"
        data-testid={testId}
      >
      <CardContent className="p-0">
        <div className="text-primary mb-4">
          <Icon className="w-8 h-8" />
        </div>
        
        <h3 className="text-xl font-semibold mb-3 text-foreground group-hover:text-primary transition-colors font-lato">
          {category.title}
        </h3>
        
        <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
          {category.description}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {category.count} enterprises
          </span>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-primary font-medium hover:underline p-0 h-auto"
            data-testid={testId ? `${testId}-view-directory` : undefined}
          >
            View Directory
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
    </Link>
  );
}
