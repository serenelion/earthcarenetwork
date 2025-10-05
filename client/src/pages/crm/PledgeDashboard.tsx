import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sprout, TrendingUp, Users, CheckCircle } from "lucide-react";
import { BarChart, PieChart, Pie, Bar, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Link } from "wouter";

interface PledgeStats {
  totalEnterprises: number;
  affirmedCount: number;
  pendingCount: number;
  revokedCount: number;
  recentSignups: number;
  pillarBreakdown: {
    earthCare: number;
    peopleCare: number;
    fairShare: number;
  };
  recentPledges: Array<{
    id: string;
    enterpriseId: string;
    enterpriseName: string;
    signedAt: string;
    earthCare: boolean;
    peopleCare: boolean;
    fairShare: boolean;
    narrative: string | null;
  }>;
}

const COLORS = {
  affirmed: '#10b981',
  noPledge: '#94a3b8',
  revoked: '#ef4444',
  earthCare: '#059669',
  peopleCare: '#3b82f6',
  fairShare: '#f59e0b',
};

export default function PledgeDashboard() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<PledgeStats>({
    queryKey: ["/api/admin/pledge-stats"],
    enabled: isAuthenticated,
    retry: false,
    refetchInterval: 30000,
  });

  if (authLoading || statsLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="mb-6 md:mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const totalEnterprises = stats?.totalEnterprises || 0;
  const affirmedCount = stats?.affirmedCount || 0;
  const pendingCount = stats?.pendingCount || 0;
  const revokedCount = stats?.revokedCount || 0;
  const noPledgeCount = totalEnterprises - affirmedCount - pendingCount - revokedCount;

  const affirmedPercentage = totalEnterprises > 0 
    ? Math.round((affirmedCount / totalEnterprises) * 100) 
    : 0;

  const pledgeStatusData = [
    { name: 'Affirmed', value: affirmedCount, color: COLORS.affirmed },
    { name: 'No Pledge', value: noPledgeCount, color: COLORS.noPledge },
    { name: 'Revoked', value: revokedCount, color: COLORS.revoked },
  ].filter(item => item.value > 0);

  const pillarData = [
    { name: 'Earth Care', value: stats?.pillarBreakdown.earthCare || 0, color: COLORS.earthCare },
    { name: 'People Care', value: stats?.pillarBreakdown.peopleCare || 0, color: COLORS.peopleCare },
    { name: 'Fair Share', value: stats?.pillarBreakdown.fairShare || 0, color: COLORS.fairShare },
  ];

  const statsCards = [
    {
      title: "Total Enterprises",
      value: totalEnterprises,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
      testId: "metric-total-enterprises",
    },
    {
      title: "Affirmed Pledges",
      value: affirmedCount,
      subtitle: `${affirmedPercentage}% of total`,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
      testId: "metric-affirmed-pledges",
    },
    {
      title: "Pending Claims",
      value: pendingCount,
      icon: TrendingUp,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      testId: "metric-pending-claims",
    },
    {
      title: "Recent Signups",
      value: stats?.recentSignups || 0,
      subtitle: "Last 7 days",
      icon: Sprout,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      testId: "metric-recent-signups",
    },
  ];

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 font-lato">
          Pledge Dashboard
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Monitor pledge adoption and enterprise earth care commitments
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} data-testid={stat.testId} className="touch-manipulation">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-muted-foreground text-xs md:text-sm truncate">{stat.title}</p>
                    <p className="text-lg md:text-2xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
                    {stat.subtitle && (
                      <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                    )}
                  </div>
                  <div className={`${stat.bgColor} p-2 md:p-3 rounded-lg flex-shrink-0 ml-2`}>
                    <Icon className={`${stat.color} w-4 h-4 md:w-5 md:h-5`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
        <Card data-testid="chart-pledge-breakdown">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="font-lato text-base md:text-lg">Pledge Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pledgeStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => 
                    `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pledgeStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card data-testid="chart-values-breakdown">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="font-lato text-base md:text-lg">Values Affirmation Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pillarData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8">
                  {pillarData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="font-lato text-base md:text-lg">Recent Pledge Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="overflow-x-auto" data-testid="table-recent-pledges">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Enterprise Name</TableHead>
                  <TableHead>Date Signed</TableHead>
                  <TableHead>Pillars Affirmed</TableHead>
                  <TableHead className="hidden md:table-cell">Narrative Preview</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats?.recentPledges && stats.recentPledges.length > 0 ? (
                  stats.recentPledges.map((pledge) => (
                    <TableRow key={pledge.id} data-testid={`pledge-row-${pledge.id}`}>
                      <TableCell>
                        <Link 
                          href={`/enterprises/${pledge.enterpriseId}`}
                          className="text-primary hover:underline font-medium"
                          data-testid={`link-enterprise-${pledge.enterpriseId}`}
                        >
                          {pledge.enterpriseName}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {new Date(pledge.signedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {pledge.earthCare && (
                            <Badge 
                              variant="secondary" 
                              className="bg-green-100 text-green-800 text-xs"
                              data-testid={`badge-earth-care-${pledge.id}`}
                            >
                              Earth Care
                            </Badge>
                          )}
                          {pledge.peopleCare && (
                            <Badge 
                              variant="secondary" 
                              className="bg-blue-100 text-blue-800 text-xs"
                              data-testid={`badge-people-care-${pledge.id}`}
                            >
                              People Care
                            </Badge>
                          )}
                          {pledge.fairShare && (
                            <Badge 
                              variant="secondary" 
                              className="bg-yellow-100 text-yellow-800 text-xs"
                              data-testid={`badge-fair-share-${pledge.id}`}
                            >
                              Fair Share
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-xs">
                        <p className="text-sm text-muted-foreground truncate">
                          {pledge.narrative || 'No narrative provided'}
                        </p>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <Sprout className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No pledges signed yet</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
