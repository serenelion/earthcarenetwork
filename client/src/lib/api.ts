import type { 
  Enterprise, 
  Person, 
  Opportunity, 
  Task,
  PartnerApplication,
  OpportunityTransfer,
  SubscriptionPlan,
  UserFavorite
} from "@shared/schema";
import { fetchWithGateway } from "./apiGateway";

export type TeamMemberRole = 'viewer' | 'editor' | 'admin' | 'owner';

export interface CRMStats {
  enterprises: {
    total: number;
    byCategory?: Record<string, number>;
  };
  people: {
    total: number;
    byStatus?: Record<string, number>;
  };
  opportunities: {
    total: number;
    byStatus?: Record<string, number>;
    totalValue?: number;
  };
  tasks: {
    total: number;
    byStatus?: Record<string, number>;
    byPriority?: Record<string, number>;
  };
}

export interface AISuggestion {
  id: string;
  type: 'follow_up' | 'opportunity' | 'task' | 'insight';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  actionUrl?: string;
  actionable?: boolean;
  metadata?: Record<string, any>;
}

export interface LeadScore {
  score: number;
  insights: string;
  reasoning?: string;
}

export interface GlobalSearchResult {
  type: 'enterprise' | 'person' | 'opportunity' | 'task';
  id: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface FavoritesStats {
  total: number;
  byCategory: Record<string, number>;
}

export async function fetchCRMStats(): Promise<CRMStats> {
  const response = await fetch("/api/crm/stats");
  if (!response.ok) {
    throw new Error(`Failed to fetch CRM stats: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchEnterprises(
  category?: string,
  search?: string,
  limit: number = 50,
  offset: number = 0
): Promise<Enterprise[]> {
  const params = new URLSearchParams();
  if (category) params.append("category", category);
  if (search) params.append("search", search);
  params.append("limit", limit.toString());
  params.append("offset", offset.toString());

  const response = await fetchWithGateway(`/api/enterprises?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch enterprises: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchEnterprise(id: string): Promise<Enterprise> {
  const response = await fetch(`/api/enterprises/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch enterprise: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchEnterpriseContacts(id: string): Promise<Person[]> {
  const response = await fetch(`/api/enterprises/${id}/contacts`);
  if (!response.ok) {
    throw new Error(`Failed to fetch enterprise contacts: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchPeople(
  search?: string,
  limit: number = 50,
  offset: number = 0
): Promise<Person[]> {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  params.append("limit", limit.toString());
  params.append("offset", offset.toString());

  const response = await fetch(`/api/crm/people?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch people: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchOpportunities(
  search?: string,
  limit: number = 50,
  offset: number = 0
): Promise<Opportunity[]> {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  params.append("limit", limit.toString());
  params.append("offset", offset.toString());

  const response = await fetch(`/api/crm/opportunities?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch opportunities: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchTasks(
  search?: string,
  limit: number = 50,
  offset: number = 0
): Promise<Task[]> {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  params.append("limit", limit.toString());
  params.append("offset", offset.toString());

  const response = await fetch(`/api/crm/tasks?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch tasks: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchAISuggestions(): Promise<AISuggestion[]> {
  const response = await fetch("/api/crm/ai/suggestions");
  if (!response.ok) {
    throw new Error(`Failed to fetch AI suggestions: ${response.statusText}`);
  }
  return response.json();
}

export async function generateLeadScore(data: {
  enterpriseId: string;
  personId?: string;
  opportunityId?: string;
}): Promise<LeadScore> {
  const response = await fetch("/api/crm/ai/lead-score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Failed to generate lead score: ${response.statusText}`);
  }
  return response.json();
}

export async function globalSearch(
  query: string,
  entityTypes?: string[],
  limit: number = 20,
  offset: number = 0
): Promise<GlobalSearchResult[]> {
  const params = new URLSearchParams();
  params.append("q", query);
  if (entityTypes && entityTypes.length > 0) {
    params.append("type", entityTypes.join(","));
  }
  params.append("limit", limit.toString());
  params.append("offset", offset.toString());

  const response = await fetch(`/api/search?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to perform search: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchUserFavorites(
  limit: number = 50,
  offset: number = 0
): Promise<UserFavorite[]> {
  const params = new URLSearchParams();
  params.append("limit", limit.toString());
  params.append("offset", offset.toString());

  const response = await fetchWithGateway(`/api/favorites?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch favorites: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchFavoritesStats(): Promise<FavoritesStats> {
  const response = await fetchWithGateway("/api/favorites/stats");
  if (!response.ok) {
    throw new Error(`Failed to fetch favorites stats: ${response.statusText}`);
  }
  return response.json();
}

export async function checkFavoriteStatus(enterpriseId: string): Promise<{ isFavorited: boolean }> {
  const response = await fetchWithGateway(`/api/enterprises/${enterpriseId}/favorite-status`);
  if (!response.ok) {
    throw new Error(`Failed to check favorite status: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchPartnerApplications(): Promise<PartnerApplication[]> {
  const response = await fetch("/api/admin/partner-applications");
  if (!response.ok) {
    throw new Error(`Failed to fetch partner applications: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchOpportunityTransfers(): Promise<OpportunityTransfer[]> {
  const response = await fetch("/api/admin/opportunity-transfers");
  if (!response.ok) {
    throw new Error(`Failed to fetch opportunity transfers: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const response = await fetch("/api/subscription-plans");
  if (!response.ok) {
    throw new Error(`Failed to fetch subscription plans: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchSubscriptionStatus(): Promise<any> {
  const response = await fetch("/api/subscription/status");
  if (!response.ok) {
    throw new Error(`Failed to fetch subscription status: ${response.statusText}`);
  }
  return response.json();
}
