import { useState } from "react";
import { useAdminUsers, useUpdateUser, useUserUsage, type AdminUser } from "@/lib/admin-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Search, ChevronLeft, ChevronRight, Edit, DollarSign, Activity } from "lucide-react";
import { format } from "date-fns";

const roleColors = {
  free: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  crm_pro: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  admin: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
};

const subscriptionStatusColors = {
  trial: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  active: "bg-green-500/10 text-green-600 dark:text-green-400",
  past_due: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  canceled: "bg-red-500/10 text-red-600 dark:text-red-400",
  unpaid: "bg-red-500/10 text-red-600 dark:text-red-400",
  incomplete: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  incomplete_expired: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
};

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const limit = 50;
  const offset = page * limit;

  const { data, isLoading } = useAdminUsers({
    limit,
    offset,
    search: search || undefined,
    role: roleFilter !== "all" ? (roleFilter as any) : undefined,
    subscriptionStatus: subscriptionFilter !== "all" ? subscriptionFilter : undefined,
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    setPage(0);
  };

  const handleSubscriptionFilterChange = (value: string) => {
    setSubscriptionFilter(value);
    setPage(0);
  };

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getUserDisplayName = (user: AdminUser) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) return user.firstName;
    if (user.lastName) return user.lastName;
    return "—";
  };

  return (
    <div className="p-8" data-testid="admin-users-page">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2" data-testid="page-title">User Management</h1>
        <p className="text-muted-foreground" data-testid="page-description">
          Manage users, roles, credit balances, and subscriptions
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Search & Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email or name..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
              <SelectTrigger className="w-full md:w-[180px]" data-testid="select-role-filter">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="crm_pro">CRM Pro</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={subscriptionFilter} onValueChange={handleSubscriptionFilterChange}>
              <SelectTrigger className="w-full md:w-[200px]" data-testid="select-subscription-filter">
                <SelectValue placeholder="Filter by subscription" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subscriptions</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" data-testid={`skeleton-row-${i}`} />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : !data || data.users.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground" data-testid="text-no-users">No users found</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden md:block">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead data-testid="header-email">Email</TableHead>
                    <TableHead data-testid="header-name">Name</TableHead>
                    <TableHead data-testid="header-role">Role</TableHead>
                    <TableHead data-testid="header-credits">Credit Balance</TableHead>
                    <TableHead data-testid="header-subscription">Subscription</TableHead>
                    <TableHead data-testid="header-plan">Plan</TableHead>
                    <TableHead data-testid="header-created">Created</TableHead>
                    <TableHead data-testid="header-actions">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.users.map((user) => (
                    <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                      <TableCell className="font-medium" data-testid={`text-email-${user.id}`}>
                        {user.email || "—"}
                      </TableCell>
                      <TableCell data-testid={`text-name-${user.id}`}>
                        {getUserDisplayName(user)}
                      </TableCell>
                      <TableCell data-testid={`badge-role-${user.id}`}>
                        <Badge className={roleColors[user.role] || roleColors.free}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`text-credits-${user.id}`}>
                        {formatCurrency(user.creditBalance)}
                      </TableCell>
                      <TableCell data-testid={`badge-subscription-${user.id}`}>
                        {user.subscriptionStatus ? (
                          <Badge className={subscriptionStatusColors[user.subscriptionStatus]}>
                            {user.subscriptionStatus}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell data-testid={`text-plan-${user.id}`}>
                        {user.currentPlanType || "free"}
                      </TableCell>
                      <TableCell data-testid={`text-created-${user.id}`}>
                        {format(new Date(user.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          data-testid={`button-edit-${user.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          <div className="md:hidden space-y-4">
            {data.users.map((user) => (
              <Card key={user.id} data-testid={`card-user-${user.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base" data-testid={`text-email-mobile-${user.id}`}>
                        {user.email || "—"}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1" data-testid={`text-name-mobile-${user.id}`}>
                        {getUserDisplayName(user)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                      data-testid={`button-edit-mobile-${user.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Role:</span>
                    <Badge className={roleColors[user.role] || roleColors.free} data-testid={`badge-role-mobile-${user.id}`}>
                      {user.role}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Credits:</span>
                    <span className="text-sm font-medium" data-testid={`text-credits-mobile-${user.id}`}>
                      {formatCurrency(user.creditBalance)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Subscription:</span>
                    {user.subscriptionStatus ? (
                      <Badge className={subscriptionStatusColors[user.subscriptionStatus]} data-testid={`badge-subscription-mobile-${user.id}`}>
                        {user.subscriptionStatus}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Plan:</span>
                    <span className="text-sm" data-testid={`text-plan-mobile-${user.id}`}>
                      {user.currentPlanType || "free"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground" data-testid="text-pagination-info">
              Showing {offset + 1} to {Math.min(offset + limit, data.total)} of {data.total} users
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
                data-testid="button-previous-page"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages - 1}
                data-testid="button-next-page"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </>
      )}

      {selectedUser && (
        <EditUserDialog
          user={selectedUser}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={() => {
            setEditDialogOpen(false);
            toast({
              title: "User updated",
              description: "User details have been updated successfully",
            });
          }}
        />
      )}
    </div>
  );
}

interface EditUserDialogProps {
  user: AdminUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function EditUserDialog({ user, open, onOpenChange, onSuccess }: EditUserDialogProps) {
  const [role, setRole] = useState(user.role);
  const [creditBalance, setCreditBalance] = useState(user.creditBalance.toString());
  const [creditLimit, setCreditLimit] = useState(user.creditLimit.toString());
  const [overageAllowed, setOverageAllowed] = useState(user.overageAllowed);
  const { toast } = useToast();
  
  const updateUserMutation = useUpdateUser();
  const { data: usageData, isLoading: usageLoading } = useUserUsage(user.id, { limit: 10 });

  const handleSubmit = async () => {
    try {
      await updateUserMutation.mutateAsync({
        userId: user.id,
        data: {
          role,
          creditBalance: parseInt(creditBalance),
          creditLimit: parseInt(creditLimit),
          overageAllowed,
        },
      });
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user",
        variant: "destructive",
      });
    }
  };

  const handleQuickTopUp = (amount: number) => {
    const newBalance = parseInt(creditBalance) + (amount * 100);
    setCreditBalance(newBalance.toString());
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-edit-user">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title">Edit User</DialogTitle>
          <DialogDescription data-testid="dialog-description">
            {user.email} • ID: {user.id}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details" data-testid="tab-details">
              Details
            </TabsTrigger>
            <TabsTrigger value="usage" data-testid="tab-usage">
              AI Usage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="role" data-testid="label-role">Role</Label>
                <Select value={role} onValueChange={(value: any) => setRole(value)}>
                  <SelectTrigger id="role" data-testid="select-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="crm_pro">CRM Pro</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="creditBalance" data-testid="label-credit-balance">
                  Credit Balance (in cents)
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="creditBalance"
                    type="number"
                    value={creditBalance}
                    onChange={(e) => setCreditBalance(e.target.value)}
                    data-testid="input-credit-balance"
                  />
                  <span className="flex items-center text-sm text-muted-foreground whitespace-nowrap" data-testid="text-credit-display">
                    ({formatCurrency(parseInt(creditBalance) || 0)})
                  </span>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickTopUp(100)}
                    data-testid="button-topup-100"
                  >
                    <DollarSign className="h-3 w-3 mr-1" />
                    +$100
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickTopUp(500)}
                    data-testid="button-topup-500"
                  >
                    <DollarSign className="h-3 w-3 mr-1" />
                    +$500
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickTopUp(1000)}
                    data-testid="button-topup-1000"
                  >
                    <DollarSign className="h-3 w-3 mr-1" />
                    +$1000
                  </Button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="creditLimit" data-testid="label-credit-limit">
                  Credit Limit (in cents)
                </Label>
                <Input
                  id="creditLimit"
                  type="number"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  data-testid="input-credit-limit"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label data-testid="label-overage-allowed">Allow Overage</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow user to go into negative balance
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={overageAllowed}
                  onChange={(e) => setOverageAllowed(e.target.checked)}
                  className="h-4 w-4"
                  data-testid="checkbox-overage-allowed"
                />
              </div>

              <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-sm" data-testid="text-subscription-info">Subscription Info</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <span className="ml-2" data-testid="text-subscription-status">
                      {user.subscriptionStatus || "None"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Plan:</span>
                    <span className="ml-2" data-testid="text-subscription-plan">
                      {user.currentPlanType || "free"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Membership:</span>
                    <span className="ml-2" data-testid="text-membership-status">
                      {user.membershipStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="usage" className="mt-4">
            {usageLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" data-testid={`skeleton-usage-${i}`} />
                ))}
              </div>
            ) : !usageData || usageData.usage.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground" data-testid="text-no-usage">No AI usage found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {usageData.usage.map((log) => (
                  <Card key={log.id} data-testid={`card-usage-${log.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" data-testid={`badge-feature-${log.id}`}>
                              {log.feature}
                            </Badge>
                            <span className="text-sm text-muted-foreground" data-testid={`text-model-${log.id}`}>
                              {log.model}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1" data-testid={`text-tokens-${log.id}`}>
                            {log.totalTokens.toLocaleString()} tokens
                            ({log.promptTokens.toLocaleString()} prompt + {log.completionTokens.toLocaleString()} completion)
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium" data-testid={`text-cost-${log.id}`}>
                            {formatCurrency(log.costInCents)}
                          </div>
                          <div className="text-xs text-muted-foreground" data-testid={`text-date-${log.id}`}>
                            {format(new Date(log.createdAt), "MMM d, h:mm a")}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={updateUserMutation.isPending}
            data-testid="button-save"
          >
            {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
