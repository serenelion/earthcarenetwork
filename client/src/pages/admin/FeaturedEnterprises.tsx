import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  useFeaturedEnterprises,
  useFeatureEnterprise,
  useUnfeatureEnterprise,
  useReorderFeaturedEnterprises,
} from "@/lib/admin-queries";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Star, Search, GripVertical, Plus, X } from "lucide-react";
import type { Enterprise } from "@shared/schema";

const categoryColors: Record<string, string> = {
  land_projects: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  capital_sources: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  open_source_tools: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  network_organizers: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

function SortableItem({ enterprise, onUnfeature }: { enterprise: Enterprise; onUnfeature: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: enterprise.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card border rounded-lg p-4 flex items-center gap-4"
      data-testid={`featured-enterprise-${enterprise.id}`}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      
      <Avatar className="h-12 w-12">
        <AvatarImage src={enterprise.imageUrl || undefined} alt={enterprise.name} />
        <AvatarFallback>{enterprise.name.substring(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold truncate" data-testid={`enterprise-name-${enterprise.id}`}>
          {enterprise.name}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className={categoryColors[enterprise.category] || "bg-gray-100 text-gray-800"}>
            {enterprise.category.replace(/_/g, " ")}
          </Badge>
          <span className="text-sm text-muted-foreground">Order: {enterprise.featuredOrder}</span>
        </div>
      </div>

      <Button
        variant="destructive"
        size="sm"
        onClick={() => onUnfeature(enterprise.id)}
        data-testid={`button-unfeature-${enterprise.id}`}
      >
        <X className="h-4 w-4 mr-1" />
        Unfeature
      </Button>
    </div>
  );
}

function AddEnterpriseDialog() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: allEnterprises, isLoading } = useQuery<Enterprise[]>({
    queryKey: ["/api/enterprises"],
  });

  const featureMutation = useFeatureEnterprise();

  const unfeaturedEnterprises = useMemo(() => {
    if (!allEnterprises) return [];
    return allEnterprises.filter(e => !e.isFeatured);
  }, [allEnterprises]);

  const filteredEnterprises = useMemo(() => {
    if (!searchQuery) return unfeaturedEnterprises;
    const query = searchQuery.toLowerCase();
    return unfeaturedEnterprises.filter(
      e =>
        e.name.toLowerCase().includes(query) ||
        e.category.toLowerCase().includes(query) ||
        e.description?.toLowerCase().includes(query)
    );
  }, [unfeaturedEnterprises, searchQuery]);

  const handleFeature = async (enterpriseId: string) => {
    try {
      await featureMutation.mutateAsync(enterpriseId);
      toast({
        title: "Success",
        description: "Enterprise featured successfully",
      });
      setOpen(false);
      setSearchQuery("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to feature enterprise",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-featured">
          <Plus className="h-4 w-4 mr-2" />
          Add Featured Enterprise
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add Featured Enterprise</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search enterprises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-enterprises"
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))
            ) : filteredEnterprises.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {searchQuery ? "No enterprises found" : "All enterprises are already featured"}
              </p>
            ) : (
              filteredEnterprises.map((enterprise) => (
                <div
                  key={enterprise.id}
                  className="bg-card border rounded-lg p-3 flex items-center gap-3"
                  data-testid={`enterprise-option-${enterprise.id}`}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={enterprise.imageUrl || undefined} alt={enterprise.name} />
                    <AvatarFallback>{enterprise.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{enterprise.name}</h4>
                    <Badge variant="secondary" className={categoryColors[enterprise.category] || "bg-gray-100 text-gray-800"}>
                      {enterprise.category.replace(/_/g, " ")}
                    </Badge>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleFeature(enterprise.id)}
                    disabled={featureMutation.isPending}
                    data-testid={`button-feature-${enterprise.id}`}
                  >
                    <Star className="h-4 w-4 mr-1" />
                    Feature
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function FeaturedEnterprises() {
  const { toast } = useToast();
  const { data: featuredEnterprises, isLoading } = useFeaturedEnterprises();
  const unfeatureMutation = useUnfeatureEnterprise();
  const reorderMutation = useReorderFeaturedEnterprises();

  const [localEnterprises, setLocalEnterprises] = useState<Enterprise[]>([]);

  // Update local state when data changes
  useMemo(() => {
    if (featuredEnterprises) {
      setLocalEnterprises([...featuredEnterprises].sort((a, b) => a.featuredOrder - b.featuredOrder));
    }
  }, [featuredEnterprises]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localEnterprises.findIndex((e) => e.id === active.id);
      const newIndex = localEnterprises.findIndex((e) => e.id === over.id);

      const reorderedEnterprises = arrayMove(localEnterprises, oldIndex, newIndex);
      setLocalEnterprises(reorderedEnterprises);

      const items = reorderedEnterprises.map((e, index) => ({
        id: e.id,
        featuredOrder: index + 1,
      }));

      try {
        await reorderMutation.mutateAsync(items);
        toast({
          title: "Success",
          description: "Featured enterprises reordered successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to reorder enterprises",
          variant: "destructive",
        });
        // Revert on error
        if (featuredEnterprises) {
          setLocalEnterprises([...featuredEnterprises].sort((a, b) => a.featuredOrder - b.featuredOrder));
        }
      }
    }
  };

  const handleUnfeature = async (enterpriseId: string) => {
    try {
      await unfeatureMutation.mutateAsync(enterpriseId);
      toast({
        title: "Success",
        description: "Enterprise unfeatured successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unfeature enterprise",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-8" data-testid="featured-enterprises-page">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Featured Enterprises</h1>
            <p className="text-muted-foreground">
              Manage which enterprises appear as featured on the homepage
            </p>
          </div>
          <AddEnterpriseDialog />
        </div>

        {isLoading ? (
          <div className="space-y-4" data-testid="featured-enterprises-loading">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : !localEnterprises || localEnterprises.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No Featured Enterprises</p>
                <p>Add enterprises to feature them on the homepage</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Featured Enterprises ({localEnterprises.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop to reorder featured enterprises
              </p>
              
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={localEnterprises.map((e) => e.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3" data-testid="featured-enterprises-list">
                    {localEnterprises.map((enterprise) => (
                      <SortableItem
                        key={enterprise.id}
                        enterprise={enterprise}
                        onUnfeature={handleUnfeature}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
