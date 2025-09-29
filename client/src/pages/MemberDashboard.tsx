import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, User, Gift, BookOpen, Star, Users } from "lucide-react";

export default function MemberDashboard() {
  const { user } = useAuth();

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
        <Card data-testid="card-favorites">
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
            <div className="text-2xl font-bold text-muted-foreground mb-2">0</div>
            <p className="text-sm text-muted-foreground">No favorites yet</p>
            <Button variant="outline" className="w-full mt-4" data-testid="button-browse-enterprises">
              Browse Enterprises
            </Button>
          </CardContent>
        </Card>

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
    </div>
  );
}