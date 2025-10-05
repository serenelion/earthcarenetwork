import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites, useRecentFavorites, useFavoriteStats } from "@/contexts/FavoritesContext";
import { useOnboarding } from "@/hooks/useOnboarding";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, User, Gift, BookOpen, Star, Users, ArrowRight, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { freeMemberFlow } from "@/lib/onboardingFlows";

// Favorites Card Component for Dashboard
function FavoritesCard() {
  const { stats, isLoading: isLoadingStats } = useFavoriteStats();
  const { recentFavorites, isLoading: isLoadingRecent } = useRecentFavorites(3);
  
  const isLoading = isLoadingStats || isLoadingRecent;
  const totalFavorites = stats?.total || 0;
  const hasRecentFavorites = recentFavorites.length > 0;

  return (
    <Card data-testid="card-favorites" className="group hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          My Favorites
        </CardTitle>
        <CardDescription>
          Enterprises and opportunities you've saved
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-3">
              <div className="text-2xl font-bold text-primary">{totalFavorites}</div>
              <div className="text-sm text-muted-foreground">
                {totalFavorites === 1 ? 'favorite' : 'favorites'}
              </div>
            </div>

            {/* Recent Favorites Preview */}
            {hasRecentFavorites ? (
              <div className="space-y-2 mb-4">
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  Recently Added:
                </div>
                {recentFavorites.map((favorite) => (
                  <Link key={favorite.id} href={`/enterprises/${favorite.enterpriseId}`}>
                    <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer group">
                      <Heart className="h-3 w-3 text-red-500 fill-red-500" />
                      <span className="text-sm truncate group-hover:text-primary">
                        {favorite.enterprise.name}
                      </span>
                    </div>
                  </Link>
                ))}
                {totalFavorites > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{totalFavorites - 3} more
                  </div>
                )}
              </div>
            ) : totalFavorites === 0 ? (
              <p className="text-sm text-muted-foreground mb-4">No favorites yet</p>
            ) : null}

            {/* Category Breakdown */}
            {stats?.byCategory && Object.keys(stats.byCategory).length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  Categories:
                </div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(stats.byCategory).map(([category, count]) => (
                    <Badge key={category} variant="outline" className="text-xs">
                      {category.replace('_', ' ')}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              {totalFavorites > 0 ? (
                <Link href="/favorites">
                  <Button variant="outline" className="w-full group" data-testid="button-view-all-favorites">
                    View All Favorites
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              ) : (
                <Link href="/enterprises">
                  <Button variant="outline" className="w-full" data-testid="button-browse-enterprises">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Browse Enterprises
                  </Button>
                </Link>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function MemberDashboard() {
  const { user } = useAuth();
  const { isFlowComplete } = useOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!isFlowComplete('free_member')) {
      setShowOnboarding(true);
    }
  }, [isFlowComplete]);

  return (
    <div className="container mx-auto px-4 py-8" data-testid="member-dashboard">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="member-dashboard-title">
          Welcome back, {user?.firstName || 'Member'}!
        </h1>
        <p className="text-muted-foreground" data-testid="member-dashboard-subtitle">
          Manage your Earth Care Network membership and explore member benefits.
        </p>
        <Badge variant="secondary" className="mt-2" data-testid="member-role-badge">
          Member
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Onboarding Checklist */}
        {!isFlowComplete('free_member') && (
          <div className="md:col-span-2 lg:col-span-3">
            <OnboardingChecklist
              flowKey="free_member"
              steps={freeMemberFlow.steps}
              title="Getting Started"
              description="Complete these steps to unlock all member features"
            />
          </div>
        )}

        {/* Profile Management */}
        <Card data-testid="card-profile-management">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              My Profile
            </CardTitle>
            <CardDescription>
              Update your personal information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" data-testid="button-edit-profile">
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        {/* Favorites */}
        <FavoritesCard />

        {/* Member Benefits */}
        <Card data-testid="card-member-benefits">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Member Benefits
            </CardTitle>
            <CardDescription>
              Explore exclusive member perks and resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" data-testid="button-view-benefits">
              View All Benefits
            </Button>
          </CardContent>
        </Card>

        {/* Learning Resources */}
        <Card data-testid="card-learning-resources">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Learning Hub
            </CardTitle>
            <CardDescription>
              Educational content and sustainability guides
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" data-testid="button-access-learning">
              Access Resources
            </Button>
          </CardContent>
        </Card>

        {/* Community */}
        <Card data-testid="card-community">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Community
            </CardTitle>
            <CardDescription>
              Connect with other Earth Care Network members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" data-testid="button-join-community">
              Join Discussions
            </Button>
          </CardContent>
        </Card>

        {/* Member Rating */}
        <Card data-testid="card-member-rating">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Impact Score
            </CardTitle>
            <CardDescription>
              Your contribution to sustainable initiatives
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary mb-2">0</div>
            <p className="text-sm text-muted-foreground">Start exploring to earn points</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4" data-testid="quick-actions-title">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-4">
          <Button data-testid="button-find-opportunities">
            Find Opportunities
          </Button>
          <Button variant="outline" data-testid="button-update-preferences">
            Update Preferences
          </Button>
          <Button variant="outline" data-testid="button-invite-friends">
            Invite Friends
          </Button>
        </div>
      </div>

      {/* Free Member Onboarding Modal */}
      <OnboardingModal
        flowKey="free_member"
        steps={freeMemberFlow.steps}
        isOpen={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
        onDismiss={() => setShowOnboarding(false)}
      />
    </div>
  );
}