import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  change?: string;
  icon: LucideIcon;
  color?: string;
  bgColor?: string;
  "data-testid"?: string;
}

export default function StatCard({
  title,
  value,
  change,
  icon: Icon,
  color = "text-primary",
  bgColor = "bg-primary/10",
  "data-testid": testId,
}: StatCardProps) {
  return (
    <Card data-testid={testId} className="touch-manipulation">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-muted-foreground text-xs md:text-sm truncate">{title}</p>
            <p className="text-lg md:text-2xl font-bold text-foreground">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
          </div>
          <div className={`${bgColor} p-2 md:p-3 rounded-lg flex-shrink-0 ml-2`}>
            <Icon className={`${color} w-4 h-4 md:w-5 md:h-5`} />
          </div>
        </div>
        {change && (
          <div className="mt-3 md:mt-4 flex items-center text-xs md:text-sm">
            <span className="text-primary">{change}</span>
            <span className="text-muted-foreground ml-2 hidden sm:inline">from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
