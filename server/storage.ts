import {
  users,
  enterprises,
  crmWorkspaceEnterprises,
  crmWorkspacePeople,
  crmWorkspaceOpportunities,
  crmWorkspaceTasks,
  crmWorkspaceEnterpriseNotes,
  crmWorkspaceEnterprisePeople,
  crmWorkspaceEmailLogs,
  copilotContext,
  businessContext,
  conversations,
  chatMessages,
  customFields,
  partnerApplications,
  subscriptionPlans,
  subscriptions,
  aiUsageLogs,
  creditPurchases,
  userFavorites,
  profileClaims,
  earthCarePledges,
  externalApiTokens,
  externalSearchCache,
  externalEntities,
  externalSyncJobs,
  importJobs,
  importJobErrors,
  enterpriseTeamMembers,
  enterpriseInvitations,
  integrationConfigs,
  auditLogs,
  userRoleEnum,
  membershipStatusEnum,
  subscriptionStatusEnum,
  planTypeEnum,
  type User,
  type UpsertUser,
  type Enterprise,
  type InsertEnterprise,
  type CrmWorkspaceEnterprise,
  type InsertCrmWorkspaceEnterprise,
  type CrmWorkspacePerson,
  type InsertCrmWorkspacePerson,
  type CrmWorkspaceOpportunity,
  type InsertCrmWorkspaceOpportunity,
  type CrmWorkspaceTask,
  type InsertCrmWorkspaceTask,
  type CrmWorkspaceEnterpriseNote,
  type InsertCrmWorkspaceEnterpriseNote,
  type CrmWorkspaceEnterprisePerson,
  type InsertCrmWorkspaceEnterprisePerson,
  type CrmWorkspaceEmailLog,
  type InsertCrmWorkspaceEmailLog,
  type CopilotContext,
  type InsertCopilotContext,
  type BusinessContext,
  type InsertBusinessContext,
  type Conversation,
  type InsertConversation,
  type ChatMessage,
  type InsertChatMessage,
  type CustomField,
  type InsertCustomField,
  type PartnerApplication,
  type InsertPartnerApplication,
  type SubscriptionPlan,
  type InsertSubscriptionPlan,
  type Subscription,
  type InsertSubscription,
  type AiUsageLog,
  type InsertAiUsageLog,
  type CreditPurchase,
  type InsertCreditPurchase,
  type UserFavorite,
  type InsertUserFavorite,
  type ProfileClaim,
  type InsertProfileClaim,
  type EarthCarePledge,
  type InsertEarthCarePledge,
  type ExternalApiToken,
  type InsertExternalApiToken,
  type ExternalSearchCache,
  type InsertExternalSearchCache,
  type IntegrationConfig,
  type InsertIntegrationConfig,
  type ExternalEntity,
  type InsertExternalEntity,
  type ExternalSyncJob,
  type InsertExternalSyncJob,
  type ImportJob,
  type InsertImportJob,
  type ImportJobError,
  type InsertImportJobError,
  type EnterpriseTeamMember,
  type InsertEnterpriseTeamMember,
  type EnterpriseInvitation,
  type InsertEnterpriseInvitation,
  type AuditLog,
  type InsertAuditLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, like, and, or, count, sql, inArray, ne } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUsersByRole(role: 'free' | 'crm_pro' | 'admin'): Promise<User[]>;
  getUsersByMembershipStatus(status: 'free' | 'trial' | 'paid_member' | 'spatial_network_subscriber' | 'cancelled'): Promise<User[]>;
  
  // Enterprise operations
  getEnterprises(category?: string, search?: string, limit?: number, offset?: number): Promise<Enterprise[]>;
  getEnterprise(id: string): Promise<Enterprise | undefined>;
  getEnterpriseByName(name: string): Promise<Enterprise | null>;
  createEnterprise(enterprise: InsertEnterprise): Promise<Enterprise>;
  updateEnterprise(id: string, enterprise: Partial<InsertEnterprise>): Promise<Enterprise>;
  deleteEnterprise(id: string): Promise<void>;
  getEnterpriseStats(): Promise<{ total: number; byCategory: Record<string, number> }>;
  
  // User favorites operations
  getUserFavorites(userId: string, limit?: number, offset?: number): Promise<Array<UserFavorite & { enterprise: Enterprise }>>;
  addUserFavorite(userId: string, enterpriseId: string, notes?: string): Promise<UserFavorite>;
  removeUserFavorite(userId: string, enterpriseId: string): Promise<void>;
  getUserFavorite(userId: string, enterpriseId: string): Promise<UserFavorite | undefined>;
  isEnterpriseFavorited(userId: string, enterpriseId: string): Promise<boolean>;
  getUserFavoritesCount(userId: string): Promise<number>;
  getFavoritesByCategory(userId: string): Promise<Record<string, number>>;
  
  // Workspace Enterprises (link/unlink directory entries, create standalone)
  getWorkspaceEnterprises(workspaceId: string, options?: { includeDeleted?: boolean }): Promise<CrmWorkspaceEnterprise[]>;
  getWorkspaceEnterprise(workspaceId: string, id: string): Promise<CrmWorkspaceEnterprise | undefined>;
  createWorkspaceEnterprise(enterprise: InsertCrmWorkspaceEnterprise): Promise<CrmWorkspaceEnterprise>;
  linkDirectoryEnterprise(workspaceId: string, directoryEnterpriseId: string, createdBy: string): Promise<CrmWorkspaceEnterprise>;
  unlinkWorkspaceEnterprise(workspaceId: string, id: string): Promise<void>;
  updateWorkspaceEnterprise(workspaceId: string, id: string, updates: Partial<InsertCrmWorkspaceEnterprise>): Promise<CrmWorkspaceEnterprise>;

  // Workspace People
  getWorkspacePeople(workspaceId: string, options?: { search?: string; limit?: number; offset?: number }): Promise<CrmWorkspacePerson[]>;
  getWorkspacePerson(workspaceId: string, id: string): Promise<CrmWorkspacePerson | undefined>;
  createWorkspacePerson(person: InsertCrmWorkspacePerson): Promise<CrmWorkspacePerson>;
  updateWorkspacePerson(workspaceId: string, id: string, updates: Partial<InsertCrmWorkspacePerson>): Promise<CrmWorkspacePerson>;
  deleteWorkspacePerson(workspaceId: string, id: string): Promise<void>;

  // Workspace Opportunities
  getWorkspaceOpportunities(workspaceId: string, options?: { status?: string; limit?: number; offset?: number }): Promise<CrmWorkspaceOpportunity[]>;
  getWorkspaceOpportunity(workspaceId: string, id: string): Promise<CrmWorkspaceOpportunity | undefined>;
  createWorkspaceOpportunity(opportunity: InsertCrmWorkspaceOpportunity): Promise<CrmWorkspaceOpportunity>;
  updateWorkspaceOpportunity(workspaceId: string, id: string, updates: Partial<InsertCrmWorkspaceOpportunity>): Promise<CrmWorkspaceOpportunity>;
  deleteWorkspaceOpportunity(workspaceId: string, id: string): Promise<void>;

  // Workspace Tasks
  getWorkspaceTasks(workspaceId: string, options?: { status?: string; assignedToId?: string; limit?: number; offset?: number }): Promise<CrmWorkspaceTask[]>;
  getWorkspaceTask(workspaceId: string, id: string): Promise<CrmWorkspaceTask | undefined>;
  createWorkspaceTask(task: InsertCrmWorkspaceTask): Promise<CrmWorkspaceTask>;
  updateWorkspaceTask(workspaceId: string, id: string, updates: Partial<InsertCrmWorkspaceTask>): Promise<CrmWorkspaceTask>;
  deleteWorkspaceTask(workspaceId: string, id: string): Promise<void>;

  // CRM Workspace Enterprise Notes
  getEnterpriseNotes(workspaceId: string, workspaceEnterpriseId: string): Promise<CrmWorkspaceEnterpriseNote[]>;
  createEnterpriseNote(note: InsertCrmWorkspaceEnterpriseNote): Promise<CrmWorkspaceEnterpriseNote>;
  deleteEnterpriseNote(workspaceId: string, noteId: string): Promise<void>;

  // CRM Workspace Enterprise-People Connections
  getEnterprisePersonConnections(workspaceId: string, enterpriseId?: string, personId?: string): Promise<CrmWorkspaceEnterprisePerson[]>;
  createEnterprisePersonConnection(connection: InsertCrmWorkspaceEnterprisePerson): Promise<CrmWorkspaceEnterprisePerson>;
  updateEnterprisePersonConnection(workspaceId: string, connectionId: string, isPrimary: boolean): Promise<CrmWorkspaceEnterprisePerson>;
  deleteEnterprisePersonConnection(workspaceId: string, connectionId: string): Promise<void>;

  // CRM Workspace Email Logs
  getEmailLogs(workspaceId: string, personId?: string): Promise<CrmWorkspaceEmailLog[]>;
  createEmailLog(log: InsertCrmWorkspaceEmailLog): Promise<CrmWorkspaceEmailLog>;
  updateEmailLogStatus(workspaceId: string, logId: string, status: string, sentAt?: Date, errorMessage?: string): Promise<CrmWorkspaceEmailLog>;

  // Workspace Stats (lightweight aggregates)
  getWorkspaceStats(workspaceId: string): Promise<{
    enterprisesCount: number;
    peopleCount: number;
    opportunitiesCount: number;
    tasksCount: number;
    totalOpportunityValue: number;
  }>;
  
  // Copilot context operations
  getCopilotContext(userId: string, enterpriseId: string): Promise<CopilotContext | undefined>;
  upsertCopilotContext(context: InsertCopilotContext, enterpriseId: string): Promise<CopilotContext>;
  
  // Business context operations
  getBusinessContext(userId: string, enterpriseId: string): Promise<BusinessContext | undefined>;
  upsertBusinessContext(context: InsertBusinessContext, enterpriseId: string): Promise<BusinessContext>;
  
  // Chat conversation operations
  getConversations(userId: string, enterpriseId: string, limit?: number, offset?: number): Promise<Conversation[]>;
  getConversation(id: string, enterpriseId?: string): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation, enterpriseId: string): Promise<Conversation>;
  updateConversation(id: string, conversation: Partial<InsertConversation>, enterpriseId: string): Promise<Conversation>;
  deleteConversation(id: string, enterpriseId: string): Promise<void>;
  
  // Chat message operations
  getChatMessages(conversationId: string, limit?: number, offset?: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  deleteChatMessage(id: string): Promise<void>;
  
  // Custom fields operations
  getCustomFields(enterpriseId: string, entityName: string): Promise<CustomField[]>;
  createCustomField(customField: InsertCustomField, enterpriseId: string): Promise<CustomField>;
  updateCustomField(id: string, customField: Partial<InsertCustomField>, enterpriseId: string): Promise<CustomField>;
  deleteCustomField(id: string, enterpriseId: string): Promise<void>;
  
  // Partner application operations
  getPartnerApplications(limit?: number, offset?: number): Promise<PartnerApplication[]>;
  getPartnerApplication(id: string): Promise<PartnerApplication | undefined>;
  createPartnerApplication(application: InsertPartnerApplication): Promise<PartnerApplication>;
  updatePartnerApplication(id: string, application: Partial<InsertPartnerApplication>): Promise<PartnerApplication>;
  deletePartnerApplication(id: string): Promise<void>;
  

  // Subscription plan operations
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined>;
  getSubscriptionPlanByType(planType: 'free' | 'crm_basic' | 'crm_pro' | 'build_pro_bundle'): Promise<SubscriptionPlan | undefined>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  updateSubscriptionPlan(id: string, plan: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan>;
  deleteSubscriptionPlan(id: string): Promise<void>;

  // User subscription operations
  getUserSubscription(userId: string): Promise<Subscription | undefined>;
  getSubscription(id: string): Promise<Subscription | undefined>;
  getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: string, subscription: Partial<InsertSubscription>): Promise<Subscription>;
  updateSubscriptionByStripeId(stripeSubscriptionId: string, subscription: Partial<InsertSubscription>): Promise<Subscription>;
  cancelSubscription(id: string, canceledAt?: Date): Promise<Subscription>;
  
  // Subscription management for Stripe integration
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User>;
  getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined>;
  updateUserSubscriptionStatus(userId: string, status: 'trial' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'incomplete_expired', currentPeriodEnd?: Date): Promise<User>;
  updateUserPlanAndCredits(userId: string, planType: 'free' | 'crm_basic' | 'crm_pro' | 'build_pro_bundle', creditAllocation: number, isYearly?: boolean): Promise<User>;

  // AI usage tracking operations
  logAiUsage(usage: InsertAiUsageLog): Promise<AiUsageLog>;
  getAiUsageLogs(userId: string): Promise<AiUsageLog[]>;

  // Credit balance operations
  getUserCredits(userId: string): Promise<{ balance: number; limit: number; monthlyAllocation: number }>;
  hasEnoughCredits(userId: string, requiredAmount: number): Promise<boolean>;
  deductCredits(userId: string, amount: number): Promise<void>;
  addCredits(userId: string, amount: number): Promise<void>;
  resetMonthlyCredits(userId: string): Promise<void>;

  // Credit purchase operations
  createCreditPurchase(data: InsertCreditPurchase): Promise<CreditPurchase>;
  updateCreditPurchaseStatus(id: string, status: 'completed' | 'failed'): Promise<void>;
  getCreditPurchases(userId: string): Promise<CreditPurchase[]>;

  // Subscription analytics and admin operations
  getSubscriptionStats(): Promise<{ 
    total: number; 
    byPlan: Record<string, number>; 
    byStatus: Record<string, number>;
    totalMrr: number; // Monthly Recurring Revenue in cents
    churnRate: number;
  }>;
  getAllSubscriptions(limit?: number, offset?: number): Promise<Array<Subscription & { user: User; plan: SubscriptionPlan }>>;
  getSubscriptionsByStatus(status: 'trial' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'incomplete_expired', limit?: number, offset?: number): Promise<Array<Subscription & { user: User; plan: SubscriptionPlan }>>;

  // Profile claim operations
  createProfileClaim(claim: InsertProfileClaim): Promise<ProfileClaim>;
  getProfileClaim(token: string): Promise<ProfileClaim | undefined>;
  getProfileClaimById(id: string): Promise<ProfileClaim | undefined>;
  claimProfile(token: string, userId: string): Promise<{ claim: ProfileClaim; enterprise: Enterprise }>;
  updateProfileClaimStatus(id: string, status: 'pending' | 'claimed' | 'expired'): Promise<ProfileClaim>;

  // Earth Care Pledge operations
  createPledge(pledge: InsertEarthCarePledge): Promise<EarthCarePledge>;
  getPledge(id: string): Promise<EarthCarePledge | undefined>;
  getPledgeByEnterpriseId(enterpriseId: string): Promise<EarthCarePledge | undefined>;
  updatePledge(id: string, pledge: Partial<InsertEarthCarePledge>): Promise<EarthCarePledge>;
  revokePledge(id: string, revokedBy: string): Promise<EarthCarePledge>;
  getEnterprisesWithPledgeStatus(status?: 'pending' | 'affirmed' | 'revoked', limit?: number, offset?: number): Promise<Array<{enterprise: Enterprise, pledge: EarthCarePledge | null}>>;
  getPledgeStats(): Promise<{
    totalEnterprises: number;
    affirmedCount: number;
    pendingCount: number;
    revokedCount: number;
    recentSignups: number;
    recentPledges: Array<{
      id: string;
      enterpriseId: string;
      enterpriseName: string;
      signedAt: string;
      narrative: string | null;
    }>;
  }>;

  // External API Token operations
  getExternalApiTokens(userId: string, provider?: 'apollo' | 'google_maps' | 'foursquare' | 'pipedrive' | 'twenty_crm'): Promise<ExternalApiToken[]>;
  getExternalApiToken(id: string): Promise<ExternalApiToken | undefined>;
  getUserProviderToken(userId: string, provider: 'apollo' | 'google_maps' | 'foursquare' | 'pipedrive' | 'twenty_crm'): Promise<ExternalApiToken | undefined>;
  createExternalApiToken(token: InsertExternalApiToken): Promise<ExternalApiToken>;
  updateExternalApiToken(id: string, token: Partial<InsertExternalApiToken>): Promise<ExternalApiToken>;
  deleteExternalApiToken(id: string): Promise<void>;
  updateTokenLastUsed(id: string): Promise<void>;

  // External Search Cache operations
  getCachedSearch(provider: 'apollo' | 'google_maps' | 'foursquare' | 'pipedrive' | 'twenty_crm', queryKey: string): Promise<ExternalSearchCache | undefined>;
  createSearchCache(cache: InsertExternalSearchCache): Promise<ExternalSearchCache>;
  deleteExpiredCaches(): Promise<void>;
  clearProviderCache(provider: 'apollo' | 'google_maps' | 'foursquare' | 'pipedrive' | 'twenty_crm'): Promise<void>;

  // External Entity operations
  getExternalEntities(provider?: 'apollo' | 'google_maps' | 'foursquare' | 'pipedrive' | 'twenty_crm', entityType?: 'enterprise' | 'person' | 'opportunity', limit?: number, offset?: number): Promise<ExternalEntity[]>;
  getExternalEntity(id: string): Promise<ExternalEntity | undefined>;
  getExternalEntityByExternalId(provider: 'apollo' | 'google_maps' | 'foursquare' | 'pipedrive' | 'twenty_crm', externalId: string): Promise<ExternalEntity | undefined>;
  getExternalEntityByInternalId(internalId: string): Promise<ExternalEntity | undefined>;
  createExternalEntity(entity: InsertExternalEntity): Promise<ExternalEntity>;
  updateExternalEntity(id: string, entity: Partial<InsertExternalEntity>): Promise<ExternalEntity>;
  deleteExternalEntity(id: string): Promise<void>;
  updateEntitySyncStatus(id: string, status: 'pending' | 'synced' | 'failed' | 'stale'): Promise<void>;

  // External Sync Job operations
  getExternalSyncJobs(userId?: string, provider?: 'apollo' | 'google_maps' | 'foursquare' | 'pipedrive' | 'twenty_crm', limit?: number, offset?: number): Promise<ExternalSyncJob[]>;
  getExternalSyncJob(id: string): Promise<ExternalSyncJob | undefined>;
  createExternalSyncJob(job: InsertExternalSyncJob): Promise<ExternalSyncJob>;
  updateExternalSyncJob(id: string, job: Partial<InsertExternalSyncJob>): Promise<ExternalSyncJob>;
  deleteExternalSyncJob(id: string): Promise<void>;
  updateJobProgress(id: string, progress: number, processedRecords: number): Promise<void>;
  updateJobStatus(id: string, status: 'queued' | 'running' | 'completed' | 'failed', errorMessage?: string): Promise<void>;

  // Import Job operations
  getImportJob(id: string): Promise<ImportJob | undefined>;
  getUserImportJobs(userId: string, limit?: number, offset?: number): Promise<ImportJob[]>;
  createImportJob(job: InsertImportJob): Promise<ImportJob>;
  updateImportJob(id: string, job: Partial<InsertImportJob>): Promise<ImportJob>;
  updateImportJobProgress(id: string, processedRows: number, successfulRows: number, failedRows: number): Promise<ImportJob>;
  updateImportJobStatus(id: string, status: 'uploaded' | 'mapping' | 'processing' | 'completed' | 'failed' | 'cancelled', errorSummary?: string): Promise<ImportJob>;

  // Import Error operations
  createImportError(error: InsertImportJobError): Promise<ImportJobError>;
  getJobErrors(jobId: string, limit?: number, offset?: number): Promise<ImportJobError[]>;
  getErrorsByJob(jobId: string): Promise<ImportJobError[]>;

  // Team Member operations
  getTeamMembers(enterpriseId: string, limit?: number, offset?: number): Promise<Array<EnterpriseTeamMember & { user: User }>>;
  getTeamMember(id: string): Promise<EnterpriseTeamMember | undefined>;
  getTeamMemberByUserAndEnterprise(userId: string, enterpriseId: string): Promise<EnterpriseTeamMember | undefined>;
  createTeamMember(teamMember: InsertEnterpriseTeamMember): Promise<EnterpriseTeamMember>;
  updateTeamMember(id: string, teamMember: Partial<InsertEnterpriseTeamMember>): Promise<EnterpriseTeamMember>;
  deleteTeamMember(id: string): Promise<void>;
  getUserTeamMemberships(userId: string, limit?: number, offset?: number): Promise<Array<EnterpriseTeamMember & { enterprise: Enterprise }>>;
  hasEnterpriseOwner(enterpriseId: string): Promise<boolean>;

  // Invitation operations
  createInvitation(invitation: InsertEnterpriseInvitation): Promise<EnterpriseInvitation>;
  getInvitation(id: string): Promise<EnterpriseInvitation | undefined>;
  getInvitationByToken(token: string): Promise<EnterpriseInvitation | undefined>;
  getEnterpriseInvitations(enterpriseId: string, limit?: number, offset?: number): Promise<EnterpriseInvitation[]>;
  getUserInvitations(email: string, limit?: number, offset?: number): Promise<Array<EnterpriseInvitation & { enterprise: Enterprise }>>;
  updateInvitation(id: string, invitation: Partial<InsertEnterpriseInvitation>): Promise<EnterpriseInvitation>;
  cancelInvitation(id: string): Promise<EnterpriseInvitation>;

  // Onboarding progress operations
  getOnboardingProgress(userId: string, flowKey: string): Promise<{ completed: boolean; steps: Record<string, boolean>; completedAt?: string }>;
  updateOnboardingProgress(userId: string, flowKey: string, progress: { completed: boolean; steps: Record<string, boolean>; completedAt?: string }): Promise<void>;
  markOnboardingStepComplete(userId: string, flowKey: string, stepId: string): Promise<void>;
  markOnboardingComplete(userId: string, flowKey: string): Promise<void>;

  // Featured enterprises operations
  getFeaturedEnterprises(): Promise<Enterprise[]>;
  featureEnterprise(id: string): Promise<Enterprise>;
  unfeatureEnterprise(id: string): Promise<Enterprise>;
  reorderFeaturedEnterprises(reorderData: Array<{ id: string; featuredOrder: number }>): Promise<void>;

  // Audit log operations
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(filters?: {
    userId?: string;
    enterpriseId?: string;
    actionType?: 'create' | 'update' | 'delete' | 'feature' | 'unfeature' | 'export' | 'import' | 'configure_tool' | 'test_integration' | 'bulk_operation';
    tableName?: string;
    limit?: number;
    offset?: number;
  }): Promise<AuditLog[]>;

  // Integration config operations
  getIntegrationConfigs(status?: 'active' | 'inactive' | 'error'): Promise<IntegrationConfig[]>;
  getIntegrationConfig(id: string): Promise<IntegrationConfig | undefined>;
  getIntegrationConfigByName(name: string): Promise<IntegrationConfig | undefined>;
  createIntegrationConfig(config: InsertIntegrationConfig): Promise<IntegrationConfig>;
  updateIntegrationConfig(id: string, config: Partial<InsertIntegrationConfig>): Promise<IntegrationConfig>;
  deleteIntegrationConfig(id: string): Promise<void>;
  updateIntegrationStatus(id: string, status: 'active' | 'inactive' | 'error', errorMessage?: string): Promise<IntegrationConfig>;
  updateIntegrationTestResult(id: string, testResult: string, success: boolean): Promise<IntegrationConfig>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // First try to find existing user by email or id
    let existingUser;
    if (userData.id) {
      existingUser = await db
        .select()
        .from(users)
        .where(eq(users.id, userData.id))
        .limit(1);
    }
    
    // If not found by id, try by email
    if ((!existingUser || existingUser.length === 0) && userData.email) {
      existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email))
        .limit(1);
    }

    if (existingUser && existingUser.length > 0) {
      // Update existing user - only update profile fields, preserve role/membership unless explicitly provided
      const updateData: any = {
        updatedAt: new Date(),
      };
      
      // Only update fields that are provided
      if (userData.firstName !== undefined) updateData.firstName = userData.firstName;
      if (userData.lastName !== undefined) updateData.lastName = userData.lastName;
      if (userData.profileImageUrl !== undefined) updateData.profileImageUrl = userData.profileImageUrl;
      
      // Only update role/membership if explicitly provided (for admin updates)
      if (userData.role !== undefined) updateData.role = userData.role;
      if (userData.membershipStatus !== undefined) updateData.membershipStatus = userData.membershipStatus;
      
      const whereClause = userData.id 
        ? eq(users.id, userData.id)
        : eq(users.email, userData.email!);
      
      const [user] = await db
        .update(users)
        .set(updateData)
        .where(whereClause)
        .returning();
      return user;
    } else {
      // Insert new user with all provided data (including defaults)
      const [user] = await db
        .insert(users)
        .values(userData)
        .returning();
      return user;
    }
  }

  async getUsersByRole(role: 'free' | 'crm_pro' | 'admin'): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role)).orderBy(desc(users.createdAt));
  }

  async getUsersByMembershipStatus(status: 'free' | 'trial' | 'paid_member' | 'spatial_network_subscriber' | 'cancelled'): Promise<User[]> {
    return await db.select().from(users).where(eq(users.membershipStatus, status)).orderBy(desc(users.createdAt));
  }

  // Enterprise operations
  async getEnterprises(category?: string, search?: string, limit = 50, offset = 0): Promise<Enterprise[]> {
    const conditions = [];
    if (category) {
      conditions.push(eq(enterprises.category, category as any));
    }
    if (search) {
      conditions.push(
        or(
          like(enterprises.name, `%${search}%`),
          like(enterprises.description, `%${search}%`),
          like(enterprises.location, `%${search}%`)
        )
      );
    }
    
    if (conditions.length > 0) {
      return await db.select().from(enterprises)
        .where(and(...conditions))
        .orderBy(desc(enterprises.createdAt))
        .limit(limit)
        .offset(offset);
    }
    
    return await db.select().from(enterprises)
      .orderBy(desc(enterprises.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getEnterprise(id: string): Promise<Enterprise | undefined> {
    const [enterprise] = await db.select().from(enterprises).where(eq(enterprises.id, id));
    return enterprise;
  }

  async getEnterpriseByName(name: string): Promise<Enterprise | null> {
    const results = await db
      .select()
      .from(enterprises)
      .where(sql`LOWER(${enterprises.name}) = LOWER(${name})`)
      .limit(1);
    return results[0] || null;
  }

  async createEnterprise(enterprise: InsertEnterprise): Promise<Enterprise> {
    const [newEnterprise] = await db.insert(enterprises).values(enterprise).returning();
    return newEnterprise;
  }

  async updateEnterprise(id: string, enterprise: Partial<InsertEnterprise>): Promise<Enterprise> {
    const [updated] = await db
      .update(enterprises)
      .set({ ...enterprise, updatedAt: new Date() })
      .where(eq(enterprises.id, id))
      .returning();
    return updated;
  }

  async deleteEnterprise(id: string): Promise<void> {
    await db.delete(enterprises).where(eq(enterprises.id, id));
  }

  async getEnterpriseStats(): Promise<{ total: number; byCategory: Record<string, number> }> {
    const [totalResult] = await db.select({ count: count() }).from(enterprises);
    
    const categoryStats = await db
      .select({
        category: enterprises.category,
        count: count(),
      })
      .from(enterprises)
      .groupBy(enterprises.category);
    
    const byCategory: Record<string, number> = {};
    categoryStats.forEach(stat => {
      byCategory[stat.category] = stat.count;
    });
    
    return {
      total: totalResult.count,
      byCategory,
    };
  }

  // User favorites operations
  async getUserFavorites(userId: string, limit = 50, offset = 0): Promise<Array<UserFavorite & { enterprise: Enterprise }>> {
    const results = await db
      .select({
        id: userFavorites.id,
        userId: userFavorites.userId,
        enterpriseId: userFavorites.enterpriseId,
        notes: userFavorites.notes,
        createdAt: userFavorites.createdAt,
        enterprise: enterprises,
      })
      .from(userFavorites)
      .innerJoin(enterprises, eq(userFavorites.enterpriseId, enterprises.id))
      .where(eq(userFavorites.userId, userId))
      .orderBy(desc(userFavorites.createdAt))
      .limit(limit)
      .offset(offset);

    return results.map(result => ({
      id: result.id,
      userId: result.userId,
      enterpriseId: result.enterpriseId,
      notes: result.notes,
      createdAt: result.createdAt,
      enterprise: result.enterprise,
    }));
  }

  async addUserFavorite(userId: string, enterpriseId: string, notes?: string): Promise<UserFavorite> {
    const [favorite] = await db
      .insert(userFavorites)
      .values({
        userId,
        enterpriseId,
        notes,
      })
      .onConflictDoNothing({
        target: [userFavorites.userId, userFavorites.enterpriseId],
      })
      .returning();
    
    if (!favorite) {
      // If conflict, return existing favorite
      const [existing] = await db
        .select()
        .from(userFavorites)
        .where(and(
          eq(userFavorites.userId, userId),
          eq(userFavorites.enterpriseId, enterpriseId)
        ));
      return existing;
    }
    
    return favorite;
  }

  async removeUserFavorite(userId: string, enterpriseId: string): Promise<void> {
    await db
      .delete(userFavorites)
      .where(and(
        eq(userFavorites.userId, userId),
        eq(userFavorites.enterpriseId, enterpriseId)
      ));
  }

  async getUserFavorite(userId: string, enterpriseId: string): Promise<UserFavorite | undefined> {
    const [favorite] = await db
      .select()
      .from(userFavorites)
      .where(and(
        eq(userFavorites.userId, userId),
        eq(userFavorites.enterpriseId, enterpriseId)
      ));
    return favorite;
  }

  async isEnterpriseFavorited(userId: string, enterpriseId: string): Promise<boolean> {
    const favorite = await this.getUserFavorite(userId, enterpriseId);
    return !!favorite;
  }

  async getUserFavoritesCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(userFavorites)
      .where(eq(userFavorites.userId, userId));
    return result.count;
  }

  async getFavoritesByCategory(userId: string): Promise<Record<string, number>> {
    const results = await db
      .select({
        category: enterprises.category,
        count: count(),
      })
      .from(userFavorites)
      .innerJoin(enterprises, eq(userFavorites.enterpriseId, enterprises.id))
      .where(eq(userFavorites.userId, userId))
      .groupBy(enterprises.category);

    const byCategory: Record<string, number> = {};
    results.forEach(result => {
      byCategory[result.category] = result.count;
    });

    return byCategory;
  }

  // Workspace Enterprises
  async getWorkspaceEnterprises(workspaceId: string, options?: { includeDeleted?: boolean }): Promise<CrmWorkspaceEnterprise[]> {
    const conditions = [eq(crmWorkspaceEnterprises.workspaceId, workspaceId)];
    
    if (!options?.includeDeleted) {
      conditions.push(eq(crmWorkspaceEnterprises.isDeleted, false));
    }
    
    return await db.select().from(crmWorkspaceEnterprises)
      .where(and(...conditions))
      .orderBy(desc(crmWorkspaceEnterprises.createdAt));
  }

  async getWorkspaceEnterprise(workspaceId: string, id: string): Promise<CrmWorkspaceEnterprise | undefined> {
    const [enterprise] = await db.select().from(crmWorkspaceEnterprises)
      .where(and(
        eq(crmWorkspaceEnterprises.workspaceId, workspaceId),
        eq(crmWorkspaceEnterprises.id, id)
      ));
    return enterprise;
  }

  /**
   * INTERNAL USE ONLY - DO NOT CALL DIRECTLY
   * 
   * This method should ONLY be used internally by the storage layer (e.g., by linkDirectoryEnterprise).
   * ALL enterprise creation must go through the public directory first via createEnterprise(),
   * then link to workspace via linkDirectoryEnterprise().
   * 
   * This ensures:
   * - All enterprises exist in the public directory
   * - No orphaned workspace-only records
   * - Consistent data across directory and workspace
   * 
   * Validation enforces that critical fields (name, category) are provided to prevent
   * incomplete workspace-only records.
   */
  async createWorkspaceEnterprise(enterprise: InsertCrmWorkspaceEnterprise): Promise<CrmWorkspaceEnterprise> {
    if (!enterprise.name || !enterprise.category) {
      throw new Error('createWorkspaceEnterprise requires name and category. All enterprises must be created in the public directory first via createEnterprise(), then linked via linkDirectoryEnterprise().');
    }

    const [created] = await db.insert(crmWorkspaceEnterprises)
      .values(enterprise)
      .returning();
    return created;
  }

  async linkDirectoryEnterprise(workspaceId: string, directoryEnterpriseId: string, createdBy: string): Promise<CrmWorkspaceEnterprise> {
    const [directoryEnterprise] = await db.select().from(enterprises)
      .where(eq(enterprises.id, directoryEnterpriseId));
    
    if (!directoryEnterprise) {
      throw new Error('Directory enterprise not found');
    }

    const [linked] = await db.insert(crmWorkspaceEnterprises)
      .values({
        workspaceId,
        directoryEnterpriseId,
        name: directoryEnterprise.name,
        description: directoryEnterprise.description,
        category: directoryEnterprise.category,
        website: directoryEnterprise.website,
        location: directoryEnterprise.location,
        contactEmail: directoryEnterprise.contactEmail,
        createdBy,
      })
      .returning();
    
    return linked;
  }

  async unlinkWorkspaceEnterprise(workspaceId: string, id: string): Promise<void> {
    await db.update(crmWorkspaceEnterprises)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(and(
        eq(crmWorkspaceEnterprises.workspaceId, workspaceId),
        eq(crmWorkspaceEnterprises.id, id)
      ));
  }

  async updateWorkspaceEnterprise(workspaceId: string, id: string, updates: Partial<InsertCrmWorkspaceEnterprise>): Promise<CrmWorkspaceEnterprise> {
    const [updated] = await db.update(crmWorkspaceEnterprises)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(crmWorkspaceEnterprises.workspaceId, workspaceId),
        eq(crmWorkspaceEnterprises.id, id)
      ))
      .returning();
    return updated;
  }

  // Workspace People
  async getWorkspacePeople(workspaceId: string, options?: { search?: string; limit?: number; offset?: number }): Promise<CrmWorkspacePerson[]> {
    const conditions = [eq(crmWorkspacePeople.workspaceId, workspaceId)];
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    
    if (options?.search) {
      conditions.push(
        or(
          like(crmWorkspacePeople.firstName, `%${options.search}%`),
          like(crmWorkspacePeople.lastName, `%${options.search}%`),
          like(crmWorkspacePeople.email, `%${options.search}%`),
          like(crmWorkspacePeople.title, `%${options.search}%`)
        )!
      );
    }
    
    return await db.select().from(crmWorkspacePeople)
      .where(and(...conditions))
      .orderBy(desc(crmWorkspacePeople.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getWorkspacePerson(workspaceId: string, id: string): Promise<CrmWorkspacePerson | undefined> {
    const [person] = await db.select().from(crmWorkspacePeople)
      .where(and(
        eq(crmWorkspacePeople.workspaceId, workspaceId),
        eq(crmWorkspacePeople.id, id)
      ));
    return person;
  }

  async createWorkspacePerson(person: InsertCrmWorkspacePerson): Promise<CrmWorkspacePerson> {
    const [created] = await db.insert(crmWorkspacePeople)
      .values(person)
      .returning();
    return created;
  }

  async updateWorkspacePerson(workspaceId: string, id: string, updates: Partial<InsertCrmWorkspacePerson>): Promise<CrmWorkspacePerson> {
    const [updated] = await db.update(crmWorkspacePeople)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(crmWorkspacePeople.workspaceId, workspaceId),
        eq(crmWorkspacePeople.id, id)
      ))
      .returning();
    return updated;
  }

  async deleteWorkspacePerson(workspaceId: string, id: string): Promise<void> {
    await db.delete(crmWorkspacePeople)
      .where(and(
        eq(crmWorkspacePeople.workspaceId, workspaceId),
        eq(crmWorkspacePeople.id, id)
      ));
  }

  // Workspace Opportunities
  async getWorkspaceOpportunities(workspaceId: string, options?: { status?: string; limit?: number; offset?: number }): Promise<CrmWorkspaceOpportunity[]> {
    const conditions = [eq(crmWorkspaceOpportunities.workspaceId, workspaceId)];
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    
    if (options?.status) {
      conditions.push(eq(crmWorkspaceOpportunities.status, options.status as any));
    }
    
    return await db.select().from(crmWorkspaceOpportunities)
      .where(and(...conditions))
      .orderBy(desc(crmWorkspaceOpportunities.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getWorkspaceOpportunity(workspaceId: string, id: string): Promise<CrmWorkspaceOpportunity | undefined> {
    const [opportunity] = await db.select().from(crmWorkspaceOpportunities)
      .where(and(
        eq(crmWorkspaceOpportunities.workspaceId, workspaceId),
        eq(crmWorkspaceOpportunities.id, id)
      ));
    return opportunity;
  }

  async createWorkspaceOpportunity(opportunity: InsertCrmWorkspaceOpportunity): Promise<CrmWorkspaceOpportunity> {
    const [created] = await db.insert(crmWorkspaceOpportunities)
      .values(opportunity)
      .returning();
    return created;
  }

  async updateWorkspaceOpportunity(workspaceId: string, id: string, updates: Partial<InsertCrmWorkspaceOpportunity>): Promise<CrmWorkspaceOpportunity> {
    const [updated] = await db.update(crmWorkspaceOpportunities)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(crmWorkspaceOpportunities.workspaceId, workspaceId),
        eq(crmWorkspaceOpportunities.id, id)
      ))
      .returning();
    return updated;
  }

  async deleteWorkspaceOpportunity(workspaceId: string, id: string): Promise<void> {
    await db.delete(crmWorkspaceOpportunities)
      .where(and(
        eq(crmWorkspaceOpportunities.workspaceId, workspaceId),
        eq(crmWorkspaceOpportunities.id, id)
      ));
  }

  // Workspace Tasks
  async getWorkspaceTasks(workspaceId: string, options?: { status?: string; assignedToId?: string; limit?: number; offset?: number }): Promise<CrmWorkspaceTask[]> {
    const conditions = [eq(crmWorkspaceTasks.workspaceId, workspaceId)];
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    
    if (options?.status) {
      conditions.push(eq(crmWorkspaceTasks.status, options.status as any));
    }
    
    if (options?.assignedToId) {
      conditions.push(eq(crmWorkspaceTasks.assignedToId, options.assignedToId));
    }
    
    return await db.select().from(crmWorkspaceTasks)
      .where(and(...conditions))
      .orderBy(desc(crmWorkspaceTasks.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getWorkspaceTask(workspaceId: string, id: string): Promise<CrmWorkspaceTask | undefined> {
    const [task] = await db.select().from(crmWorkspaceTasks)
      .where(and(
        eq(crmWorkspaceTasks.workspaceId, workspaceId),
        eq(crmWorkspaceTasks.id, id)
      ));
    return task;
  }

  async createWorkspaceTask(task: InsertCrmWorkspaceTask): Promise<CrmWorkspaceTask> {
    const [created] = await db.insert(crmWorkspaceTasks)
      .values(task)
      .returning();
    return created;
  }

  async updateWorkspaceTask(workspaceId: string, id: string, updates: Partial<InsertCrmWorkspaceTask>): Promise<CrmWorkspaceTask> {
    const [updated] = await db.update(crmWorkspaceTasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(crmWorkspaceTasks.workspaceId, workspaceId),
        eq(crmWorkspaceTasks.id, id)
      ))
      .returning();
    return updated;
  }

  async deleteWorkspaceTask(workspaceId: string, id: string): Promise<void> {
    await db.delete(crmWorkspaceTasks)
      .where(and(
        eq(crmWorkspaceTasks.workspaceId, workspaceId),
        eq(crmWorkspaceTasks.id, id)
      ));
  }

  // CRM Workspace Enterprise Notes
  async getEnterpriseNotes(workspaceId: string, workspaceEnterpriseId: string): Promise<CrmWorkspaceEnterpriseNote[]> {
    const enterprise = await db
      .select()
      .from(crmWorkspaceEnterprises)
      .where(and(
        eq(crmWorkspaceEnterprises.id, workspaceEnterpriseId),
        eq(crmWorkspaceEnterprises.workspaceId, workspaceId)
      ))
      .limit(1);
    
    if (!enterprise.length) {
      throw new Error('Enterprise not found in workspace');
    }

    return await db
      .select()
      .from(crmWorkspaceEnterpriseNotes)
      .where(eq(crmWorkspaceEnterpriseNotes.workspaceEnterpriseId, workspaceEnterpriseId))
      .orderBy(desc(crmWorkspaceEnterpriseNotes.createdAt));
  }

  async createEnterpriseNote(note: InsertCrmWorkspaceEnterpriseNote): Promise<CrmWorkspaceEnterpriseNote> {
    const [created] = await db
      .insert(crmWorkspaceEnterpriseNotes)
      .values(note)
      .returning();
    return created;
  }

  async deleteEnterpriseNote(workspaceId: string, noteId: string): Promise<void> {
    const note = await db
      .select({ workspaceEnterpriseId: crmWorkspaceEnterpriseNotes.workspaceEnterpriseId })
      .from(crmWorkspaceEnterpriseNotes)
      .innerJoin(
        crmWorkspaceEnterprises,
        eq(crmWorkspaceEnterpriseNotes.workspaceEnterpriseId, crmWorkspaceEnterprises.id)
      )
      .where(and(
        eq(crmWorkspaceEnterpriseNotes.id, noteId),
        eq(crmWorkspaceEnterprises.workspaceId, workspaceId)
      ))
      .limit(1);

    if (!note.length) {
      throw new Error('Note not found in workspace');
    }

    await db
      .delete(crmWorkspaceEnterpriseNotes)
      .where(eq(crmWorkspaceEnterpriseNotes.id, noteId));
  }

  // CRM Workspace Enterprise-People Connections
  async getEnterprisePersonConnections(workspaceId: string, enterpriseId?: string, personId?: string): Promise<CrmWorkspaceEnterprisePerson[]> {
    const conditions = [eq(crmWorkspaceEnterprisePeople.workspaceId, workspaceId)];
    
    if (enterpriseId) {
      conditions.push(eq(crmWorkspaceEnterprisePeople.workspaceEnterpriseId, enterpriseId));
    }
    
    if (personId) {
      conditions.push(eq(crmWorkspaceEnterprisePeople.workspacePersonId, personId));
    }

    return await db
      .select()
      .from(crmWorkspaceEnterprisePeople)
      .where(and(...conditions))
      .orderBy(desc(crmWorkspaceEnterprisePeople.createdAt));
  }

  async createEnterprisePersonConnection(connection: InsertCrmWorkspaceEnterprisePerson): Promise<CrmWorkspaceEnterprisePerson> {
    // Check for duplicate
    const existing = await db
      .select()
      .from(crmWorkspaceEnterprisePeople)
      .where(and(
        eq(crmWorkspaceEnterprisePeople.workspaceEnterpriseId, connection.workspaceEnterpriseId),
        eq(crmWorkspaceEnterprisePeople.workspacePersonId, connection.workspacePersonId)
      ))
      .limit(1);

    if (existing.length > 0) {
      throw new Error('Connection already exists');
    }

    const [created] = await db
      .insert(crmWorkspaceEnterprisePeople)
      .values(connection)
      .returning();
    
    return created;
  }

  async updateEnterprisePersonConnection(workspaceId: string, connectionId: string, isPrimary: boolean): Promise<CrmWorkspaceEnterprisePerson> {
    // Verify workspace access
    const connection = await db
      .select()
      .from(crmWorkspaceEnterprisePeople)
      .where(and(
        eq(crmWorkspaceEnterprisePeople.id, connectionId),
        eq(crmWorkspaceEnterprisePeople.workspaceId, workspaceId)
      ))
      .limit(1);

    if (!connection.length) {
      throw new Error('Connection not found in workspace');
    }

    // If setting as primary, unset other primary flags for this person IN THIS WORKSPACE ONLY
    if (isPrimary) {
      await db
        .update(crmWorkspaceEnterprisePeople)
        .set({ isPrimary: false })
        .where(and(
          eq(crmWorkspaceEnterprisePeople.workspacePersonId, connection[0].workspacePersonId),
          eq(crmWorkspaceEnterprisePeople.workspaceId, workspaceId),
          ne(crmWorkspaceEnterprisePeople.id, connectionId)
        ));
    }

    const [updated] = await db
      .update(crmWorkspaceEnterprisePeople)
      .set({ isPrimary })
      .where(eq(crmWorkspaceEnterprisePeople.id, connectionId))
      .returning();

    return updated;
  }

  async deleteEnterprisePersonConnection(workspaceId: string, connectionId: string): Promise<void> {
    // Verify workspace access
    const connection = await db
      .select()
      .from(crmWorkspaceEnterprisePeople)
      .where(and(
        eq(crmWorkspaceEnterprisePeople.id, connectionId),
        eq(crmWorkspaceEnterprisePeople.workspaceId, workspaceId)
      ))
      .limit(1);

    if (!connection.length) {
      throw new Error('Connection not found in workspace');
    }

    await db
      .delete(crmWorkspaceEnterprisePeople)
      .where(eq(crmWorkspaceEnterprisePeople.id, connectionId));
  }

  // CRM Workspace Email Logs
  async getEmailLogs(workspaceId: string, personId?: string): Promise<CrmWorkspaceEmailLog[]> {
    const conditions = [eq(crmWorkspaceEmailLogs.workspaceId, workspaceId)];
    
    if (personId) {
      conditions.push(eq(crmWorkspaceEmailLogs.workspacePersonId, personId));
    }

    return await db
      .select()
      .from(crmWorkspaceEmailLogs)
      .where(and(...conditions))
      .orderBy(desc(crmWorkspaceEmailLogs.createdAt));
  }

  async createEmailLog(log: InsertCrmWorkspaceEmailLog): Promise<CrmWorkspaceEmailLog> {
    const [created] = await db
      .insert(crmWorkspaceEmailLogs)
      .values(log)
      .returning();
    
    return created;
  }

  async updateEmailLogStatus(workspaceId: string, logId: string, status: string, sentAt?: Date, errorMessage?: string): Promise<CrmWorkspaceEmailLog> {
    const [updated] = await db
      .update(crmWorkspaceEmailLogs)
      .set({
        status: status as any,
        sentAt: sentAt || null,
        errorMessage: errorMessage || null,
      })
      .where(and(
        eq(crmWorkspaceEmailLogs.id, logId),
        eq(crmWorkspaceEmailLogs.workspaceId, workspaceId)
      ))
      .returning();

    return updated;
  }

  // Workspace Stats
  async getWorkspaceStats(workspaceId: string): Promise<{
    enterprisesCount: number;
    peopleCount: number;
    opportunitiesCount: number;
    tasksCount: number;
    totalOpportunityValue: number;
  }> {
    const [enterprisesCount] = await db.select({ count: count() })
      .from(crmWorkspaceEnterprises)
      .where(and(
        eq(crmWorkspaceEnterprises.workspaceId, workspaceId),
        eq(crmWorkspaceEnterprises.isDeleted, false)
      ));

    const [peopleCount] = await db.select({ count: count() })
      .from(crmWorkspacePeople)
      .where(eq(crmWorkspacePeople.workspaceId, workspaceId));

    const [opportunitiesData] = await db.select({ 
      count: count(),
      totalValue: sql<number>`COALESCE(SUM(${crmWorkspaceOpportunities.value}), 0)`
    })
      .from(crmWorkspaceOpportunities)
      .where(eq(crmWorkspaceOpportunities.workspaceId, workspaceId));

    const [tasksCount] = await db.select({ count: count() })
      .from(crmWorkspaceTasks)
      .where(eq(crmWorkspaceTasks.workspaceId, workspaceId));

    return {
      enterprisesCount: enterprisesCount.count,
      peopleCount: peopleCount.count,
      opportunitiesCount: opportunitiesData.count,
      tasksCount: tasksCount.count,
      totalOpportunityValue: Number(opportunitiesData.totalValue) || 0,
    };
  }


  // Copilot context operations
  async getCopilotContext(userId: string, enterpriseId: string): Promise<CopilotContext | undefined> {
    const [context] = await db.select().from(copilotContext)
      .where(and(
        eq(copilotContext.userId, userId),
        eq(copilotContext.enterpriseId, enterpriseId)
      ));
    return context;
  }

  async upsertCopilotContext(context: InsertCopilotContext, enterpriseId: string): Promise<CopilotContext> {
    const [result] = await db
      .insert(copilotContext)
      .values({
        ...context,
        enterpriseId
      })
      .onConflictDoUpdate({
        target: [copilotContext.userId, copilotContext.enterpriseId],
        set: {
          ...context,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  // Business context operations
  async getBusinessContext(userId: string, enterpriseId: string): Promise<BusinessContext | undefined> {
    const [context] = await db.select().from(businessContext)
      .where(and(
        eq(businessContext.userId, userId),
        eq(businessContext.enterpriseId, enterpriseId)
      ));
    return context;
  }

  async upsertBusinessContext(context: InsertBusinessContext, enterpriseId: string): Promise<BusinessContext> {
    const [result] = await db
      .insert(businessContext)
      .values({
        ...context,
        enterpriseId
      })
      .onConflictDoUpdate({
        target: [businessContext.userId, businessContext.enterpriseId],
        set: {
          ...context,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  // Chat conversation operations
  async getConversations(userId: string, enterpriseId: string, limit = 50, offset = 0): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(and(
        eq(conversations.userId, userId),
        eq(conversations.enterpriseId, enterpriseId)
      ))
      .orderBy(desc(conversations.lastMessageAt))
      .limit(limit)
      .offset(offset);
  }

  async getConversation(id: string, enterpriseId?: string): Promise<Conversation | undefined> {
    const conditions = [eq(conversations.id, id)];
    if (enterpriseId) {
      conditions.push(eq(conversations.enterpriseId, enterpriseId));
    }
    const [conversation] = await db.select().from(conversations)
      .where(and(...conditions));
    return conversation;
  }

  async createConversation(conversation: InsertConversation, enterpriseId: string): Promise<Conversation> {
    const [result] = await db.insert(conversations).values({
      ...conversation,
      enterpriseId
    }).returning();
    return result;
  }

  async updateConversation(id: string, conversation: Partial<InsertConversation>, enterpriseId: string): Promise<Conversation> {
    const [updated] = await db
      .update(conversations)
      .set({ ...conversation, updatedAt: new Date() })
      .where(and(
        eq(conversations.id, id),
        eq(conversations.enterpriseId, enterpriseId)
      ))
      .returning();
    return updated;
  }

  async deleteConversation(id: string, enterpriseId: string): Promise<void> {
    // First verify conversation belongs to enterprise
    const conversation = await this.getConversation(id, enterpriseId);
    if (!conversation) return;
    
    // Delete all messages first, then the conversation
    await db.delete(chatMessages).where(eq(chatMessages.conversationId, id));
    await db.delete(conversations).where(and(
      eq(conversations.id, id),
      eq(conversations.enterpriseId, enterpriseId)
    ));
  }

  // Chat message operations
  async getChatMessages(conversationId: string, limit = 100, offset = 0): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(chatMessages.createdAt)
      .limit(limit)
      .offset(offset);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    // Update conversation's lastMessageAt when creating a message
    await db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, message.conversationId));

    const [result] = await db.insert(chatMessages).values(message).returning();
    return result;
  }

  async deleteChatMessage(id: string): Promise<void> {
    await db.delete(chatMessages).where(eq(chatMessages.id, id));
  }

  // Custom fields operations
  async getCustomFields(enterpriseId: string, entityName: string): Promise<CustomField[]> {
    return await db
      .select()
      .from(customFields)
      .where(and(
        eq(customFields.enterpriseId, enterpriseId),
        eq(customFields.entityName, entityName)
      ))
      .orderBy(customFields.createdAt);
  }

  async createCustomField(customField: InsertCustomField, enterpriseId: string): Promise<CustomField> {
    const [result] = await db.insert(customFields).values({
      ...customField,
      enterpriseId
    }).returning();
    return result;
  }

  async updateCustomField(id: string, customField: Partial<InsertCustomField>, enterpriseId: string): Promise<CustomField> {
    const [updated] = await db
      .update(customFields)
      .set({ ...customField, updatedAt: new Date() })
      .where(and(
        eq(customFields.id, id),
        eq(customFields.enterpriseId, enterpriseId)
      ))
      .returning();
    return updated;
  }

  async deleteCustomField(id: string, enterpriseId: string): Promise<void> {
    await db.delete(customFields).where(and(
      eq(customFields.id, id),
      eq(customFields.enterpriseId, enterpriseId)
    ));
  }

  // Partner application operations
  async getPartnerApplications(limit = 50, offset = 0): Promise<PartnerApplication[]> {
    return await db
      .select()
      .from(partnerApplications)
      .orderBy(desc(partnerApplications.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getPartnerApplication(id: string): Promise<PartnerApplication | undefined> {
    const [application] = await db.select().from(partnerApplications).where(eq(partnerApplications.id, id));
    return application;
  }

  async createPartnerApplication(application: InsertPartnerApplication): Promise<PartnerApplication> {
    const [result] = await db.insert(partnerApplications).values(application).returning();
    return result;
  }

  async updatePartnerApplication(id: string, application: Partial<InsertPartnerApplication>): Promise<PartnerApplication> {
    const [updated] = await db
      .update(partnerApplications)
      .set({ ...application, updatedAt: new Date() })
      .where(eq(partnerApplications.id, id))
      .returning();
    return updated;
  }

  async deletePartnerApplication(id: string): Promise<void> {
    await db.delete(partnerApplications).where(eq(partnerApplications.id, id));
  }

  // Subscription plan operations
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db.select().from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true))
      .orderBy(subscriptionPlans.displayOrder);
  }

  async getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db.select().from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, id));
    return plan;
  }

  async getSubscriptionPlanByType(planType: 'free' | 'crm_basic' | 'crm_pro' | 'build_pro_bundle'): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db.select().from(subscriptionPlans)
      .where(and(
        eq(subscriptionPlans.planType, planType),
        eq(subscriptionPlans.isActive, true)
      ));
    return plan;
  }

  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [created] = await db.insert(subscriptionPlans)
      .values(plan)
      .returning();
    return created;
  }

  async updateSubscriptionPlan(id: string, plan: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan> {
    const [updated] = await db.update(subscriptionPlans)
      .set({ ...plan, updatedAt: new Date() })
      .where(eq(subscriptionPlans.id, id))
      .returning();
    return updated;
  }

  async deleteSubscriptionPlan(id: string): Promise<void> {
    await db.delete(subscriptionPlans).where(eq(subscriptionPlans.id, id));
  }

  // User subscription operations
  async getUserSubscription(userId: string): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    return subscription;
  }

  async getSubscription(id: string): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions)
      .where(eq(subscriptions.id, id));
    return subscription;
  }

  async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
    return subscription;
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [created] = await db.insert(subscriptions)
      .values(subscription)
      .returning();
    return created;
  }

  async updateSubscription(id: string, subscription: Partial<InsertSubscription>): Promise<Subscription> {
    const [updated] = await db.update(subscriptions)
      .set({ ...subscription, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return updated;
  }

  async updateSubscriptionByStripeId(stripeSubscriptionId: string, subscription: Partial<InsertSubscription>): Promise<Subscription> {
    const [updated] = await db.update(subscriptions)
      .set({ ...subscription, updatedAt: new Date() })
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
      .returning();
    return updated;
  }

  async cancelSubscription(id: string, canceledAt?: Date): Promise<Subscription> {
    const [updated] = await db.update(subscriptions)
      .set({ 
        status: 'canceled', 
        canceledAt: canceledAt || new Date(),
        updatedAt: new Date() 
      })
      .where(eq(subscriptions.id, id))
      .returning();
    return updated;
  }

  // Subscription management for Stripe integration
  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User> {
    const updateData: Partial<User> = {
      stripeCustomerId,
      updatedAt: new Date()
    };
    if (stripeSubscriptionId) {
      updateData.stripeSubscriptionId = stripeSubscriptionId;
    }

    const [updated] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users)
      .where(eq(users.stripeCustomerId, stripeCustomerId));
    return user;
  }

  async updateUserSubscriptionStatus(
    userId: string, 
    status: 'trial' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'incomplete_expired', 
    currentPeriodEnd?: Date
  ): Promise<User> {
    const updateData: Partial<User> = {
      subscriptionStatus: status,
      updatedAt: new Date()
    };
    if (currentPeriodEnd) {
      updateData.subscriptionCurrentPeriodEnd = currentPeriodEnd;
    }

    const [updated] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async updateUserPlanAndCredits(
    userId: string, 
    planType: 'free' | 'crm_basic' | 'crm_pro' | 'build_pro_bundle',
    creditAllocation: number,
    isYearly: boolean = false
  ): Promise<User> {
    // Calculate credit reset date based on billing cycle
    const resetDays = isYearly ? 365 : 30;
    const creditResetDate = new Date(Date.now() + resetDays * 24 * 60 * 60 * 1000);
    
    const updateData: Partial<User> = {
      currentPlanType: planType,
      creditBalance: creditAllocation,
      creditLimit: creditAllocation,
      monthlyAllocation: creditAllocation,
      creditResetDate,
      overageAllowed: planType !== 'free', // Paid plans allow overage
      maxClaimedProfiles: planType === 'free' ? 1 : 999999, // Paid plans get unlimited
      updatedAt: new Date()
    };

    const [updated] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  // AI usage tracking operations
  async logAiUsage(usage: InsertAiUsageLog): Promise<AiUsageLog> {
    const [created] = await db.insert(aiUsageLogs)
      .values(usage)
      .returning();
    return created;
  }

  async getAiUsageLogs(userId: string): Promise<AiUsageLog[]> {
    return await db.select()
      .from(aiUsageLogs)
      .where(eq(aiUsageLogs.userId, userId))
      .orderBy(desc(aiUsageLogs.createdAt));
  }

  // Credit balance operations
  async getUserCredits(userId: string): Promise<{ balance: number; limit: number; monthlyAllocation: number }> {
    const [user] = await db.select({
      creditBalance: users.creditBalance,
      creditLimit: users.creditLimit,
      monthlyAllocation: users.monthlyAllocation
    })
    .from(users)
    .where(eq(users.id, userId));

    if (!user) {
      throw new Error("User not found");
    }

    return {
      balance: user.creditBalance || 0,
      limit: user.creditLimit || 10,
      monthlyAllocation: user.monthlyAllocation || 10
    };
  }

  async hasEnoughCredits(userId: string, requiredAmount: number): Promise<boolean> {
    const [user] = await db.select({
      creditBalance: users.creditBalance,
      overageAllowed: users.overageAllowed
    })
    .from(users)
    .where(eq(users.id, userId));

    if (!user) {
      return false;
    }

    const balance = user.creditBalance || 0;
    if (balance >= requiredAmount) {
      return true;
    }

    return user.overageAllowed || false;
  }

  async deductCredits(userId: string, amount: number): Promise<void> {
    await db.transaction(async (tx) => {
      const [user] = await tx.select({
        creditBalance: users.creditBalance,
        overageAllowed: users.overageAllowed
      })
      .from(users)
      .where(eq(users.id, userId))
      .for('update');

      if (!user) {
        throw new Error("User not found");
      }

      const currentBalance = user.creditBalance || 0;
      const newBalance = currentBalance - amount;

      if (newBalance < 0 && !user.overageAllowed) {
        throw new Error("Insufficient credits");
      }

      await tx.update(users)
        .set({
          creditBalance: newBalance,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
    });
  }

  async addCredits(userId: string, amount: number): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.update(users)
        .set({
          creditBalance: sql`${users.creditBalance} + ${amount}`,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
    });
  }

  async resetMonthlyCredits(userId: string): Promise<void> {
    const [user] = await db.select({
      monthlyAllocation: users.monthlyAllocation
    })
    .from(users)
    .where(eq(users.id, userId));

    if (!user) {
      throw new Error("User not found");
    }

    const nextResetDate = new Date();
    nextResetDate.setMonth(nextResetDate.getMonth() + 1);

    await db.update(users)
      .set({
        creditBalance: user.monthlyAllocation || 10,
        creditResetDate: nextResetDate,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  // Credit purchase operations
  async createCreditPurchase(data: InsertCreditPurchase): Promise<CreditPurchase> {
    const [created] = await db.insert(creditPurchases)
      .values(data)
      .returning();
    return created;
  }

  async updateCreditPurchaseStatus(id: string, status: 'completed' | 'failed'): Promise<void> {
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    if (status === 'completed') {
      updateData.purchasedAt = new Date();
    }

    await db.update(creditPurchases)
      .set(updateData)
      .where(eq(creditPurchases.id, id));
  }

  async getCreditPurchases(userId: string): Promise<CreditPurchase[]> {
    return await db.select()
      .from(creditPurchases)
      .where(eq(creditPurchases.userId, userId))
      .orderBy(desc(creditPurchases.createdAt));
  }

  // Subscription analytics and admin operations
  async getSubscriptionStats(): Promise<{ 
    total: number; 
    byPlan: Record<string, number>; 
    byStatus: Record<string, number>;
    totalMrr: number;
    churnRate: number;
  }> {
    // Get total subscriptions
    const [totalResult] = await db.select({ count: count() })
      .from(subscriptions);

    // Get counts by plan type
    const planCounts = await db.select({
      planType: subscriptionPlans.planType,
      count: count()
    })
    .from(subscriptions)
    .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
    .groupBy(subscriptionPlans.planType);

    // Get counts by status
    const statusCounts = await db.select({
      status: subscriptions.status,
      count: count()
    })
    .from(subscriptions)
    .groupBy(subscriptions.status);

    // Calculate MRR (Monthly Recurring Revenue)
    const mrrResult = await db.select({
      totalMrr: sql<number>`SUM(CASE WHEN ${subscriptions.isYearly} = true THEN ${subscriptions.lastPaymentAmount} / 12 ELSE ${subscriptions.lastPaymentAmount} END)`
    })
    .from(subscriptions)
    .where(eq(subscriptions.status, 'active'));

    // Calculate churn rate (simplified - canceled this month / total active last month)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [churnResult] = await db.select({
      canceledThisMonth: count(sql`CASE WHEN ${subscriptions.canceledAt} >= ${thirtyDaysAgo} THEN 1 END`),
      totalActive: count(sql`CASE WHEN ${subscriptions.status} = 'active' THEN 1 END`)
    })
    .from(subscriptions);

    const churnRate = churnResult.totalActive > 0 ? 
      (churnResult.canceledThisMonth / churnResult.totalActive) * 100 : 0;

    return {
      total: totalResult.count,
      byPlan: Object.fromEntries(planCounts.map(p => [p.planType || 'unknown', p.count])),
      byStatus: Object.fromEntries(statusCounts.map(s => [s.status, s.count])),
      totalMrr: mrrResult[0]?.totalMrr || 0,
      churnRate
    };
  }

  async getAllSubscriptions(limit: number = 50, offset: number = 0): Promise<Array<Subscription & { user: User; plan: SubscriptionPlan }>> {
    const results = await db.select()
      .from(subscriptions)
      .leftJoin(users, eq(subscriptions.userId, users.id))
      .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .orderBy(desc(subscriptions.createdAt))
      .limit(limit)
      .offset(offset);

    return results.map(result => ({
      ...result.subscriptions,
      user: result.users!,
      plan: result.subscription_plans!
    }));
  }

  async getSubscriptionsByStatus(
    status: 'trial' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'incomplete_expired',
    limit: number = 50,
    offset: number = 0
  ): Promise<Array<Subscription & { user: User; plan: SubscriptionPlan }>> {
    const results = await db.select()
      .from(subscriptions)
      .leftJoin(users, eq(subscriptions.userId, users.id))
      .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(eq(subscriptions.status, status))
      .orderBy(desc(subscriptions.createdAt))
      .limit(limit)
      .offset(offset);

    return results.map(result => ({
      ...result.subscriptions,
      user: result.users!,
      plan: result.subscription_plans!
    }));
  }

  // Profile claim operations
  async createProfileClaim(claim: InsertProfileClaim): Promise<ProfileClaim> {
    const [newClaim] = await db.insert(profileClaims).values(claim).returning();
    return newClaim;
  }

  async getProfileClaim(token: string): Promise<ProfileClaim | undefined> {
    const [claim] = await db.select().from(profileClaims).where(eq(profileClaims.claimToken, token));
    return claim;
  }

  async getProfileClaimById(id: string): Promise<ProfileClaim | undefined> {
    const [claim] = await db.select().from(profileClaims).where(eq(profileClaims.id, id));
    return claim;
  }

  async claimProfile(token: string, userId: string): Promise<{ claim: ProfileClaim; enterprise: Enterprise }> {
    const claim = await this.getProfileClaim(token);
    if (!claim) {
      throw new Error("Claim not found");
    }

    if (claim.status !== 'pending') {
      throw new Error("Claim has already been processed");
    }

    if (new Date() > new Date(claim.expiresAt)) {
      await db.update(profileClaims)
        .set({ status: 'expired', updatedAt: new Date() })
        .where(eq(profileClaims.id, claim.id));
      throw new Error("Claim has expired");
    }

    const [updatedClaim] = await db.update(profileClaims)
      .set({ 
        status: 'claimed',
        claimedAt: new Date(),
        claimedBy: userId,
        updatedAt: new Date()
      })
      .where(eq(profileClaims.id, claim.id))
      .returning();

    const enterprise = await this.getEnterprise(claim.enterpriseId);
    if (!enterprise) {
      throw new Error("Enterprise not found");
    }

    await db.update(users)
      .set({ 
        role: 'enterprise_owner',
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    return { claim: updatedClaim, enterprise };
  }

  async updateProfileClaimStatus(id: string, status: 'pending' | 'claimed' | 'expired'): Promise<ProfileClaim> {
    const [updatedClaim] = await db.update(profileClaims)
      .set({ status, updatedAt: new Date() })
      .where(eq(profileClaims.id, id))
      .returning();
    return updatedClaim;
  }

  // Earth Care Pledge operations
  async createPledge(pledge: InsertEarthCarePledge): Promise<EarthCarePledge> {
    const [newPledge] = await db.insert(earthCarePledges).values({
      ...pledge,
      earthCare: true,
      peopleCare: true,
      fairShare: true,
    }).returning();
    return newPledge;
  }

  async getPledge(id: string): Promise<EarthCarePledge | undefined> {
    const [pledge] = await db.select().from(earthCarePledges).where(eq(earthCarePledges.id, id));
    return pledge;
  }

  async getPledgeByEnterpriseId(enterpriseId: string): Promise<EarthCarePledge | undefined> {
    const [pledge] = await db.select().from(earthCarePledges)
      .where(eq(earthCarePledges.enterpriseId, enterpriseId))
      .orderBy(desc(earthCarePledges.createdAt))
      .limit(1);
    return pledge;
  }

  async updatePledge(id: string, pledge: Partial<InsertEarthCarePledge>): Promise<EarthCarePledge> {
    const [updated] = await db
      .update(earthCarePledges)
      .set({ 
        ...pledge, 
        earthCare: true,
        peopleCare: true,
        fairShare: true,
        updatedAt: new Date() 
      })
      .where(eq(earthCarePledges.id, id))
      .returning();
    return updated;
  }

  async revokePledge(id: string, revokedBy: string): Promise<EarthCarePledge> {
    const [updated] = await db
      .update(earthCarePledges)
      .set({ 
        status: 'revoked',
        revokedAt: new Date(),
        revokedBy,
        updatedAt: new Date()
      })
      .where(eq(earthCarePledges.id, id))
      .returning();
    return updated;
  }

  async getEnterprisesWithPledgeStatus(
    status?: 'pending' | 'affirmed' | 'revoked',
    limit: number = 50,
    offset: number = 0
  ): Promise<Array<{enterprise: Enterprise, pledge: EarthCarePledge | null}>> {
    let query = db
      .select({
        enterprise: enterprises,
        pledge: earthCarePledges,
      })
      .from(enterprises)
      .leftJoin(earthCarePledges, eq(enterprises.id, earthCarePledges.enterpriseId));

    if (status) {
      query = query.where(eq(earthCarePledges.status, status)) as any;
    }

    const results = await query
      .orderBy(desc(enterprises.createdAt))
      .limit(limit)
      .offset(offset);

    return results.map(result => ({
      enterprise: result.enterprise,
      pledge: result.pledge
    }));
  }

  async getPledgeStats() {
    const [totalEnterprisesResult] = await db
      .select({ count: count() })
      .from(enterprises);
    const totalEnterprises = totalEnterprisesResult?.count || 0;

    const [affirmedCountResult] = await db
      .select({ count: count() })
      .from(earthCarePledges)
      .where(eq(earthCarePledges.status, 'affirmed'));
    const affirmedCount = affirmedCountResult?.count || 0;

    const [pendingCountResult] = await db
      .select({ count: count() })
      .from(earthCarePledges)
      .where(eq(earthCarePledges.status, 'pending'));
    const pendingCount = pendingCountResult?.count || 0;

    const [revokedCountResult] = await db
      .select({ count: count() })
      .from(earthCarePledges)
      .where(eq(earthCarePledges.status, 'revoked'));
    const revokedCount = revokedCountResult?.count || 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const [recentSignupsResult] = await db
      .select({ count: count() })
      .from(earthCarePledges)
      .where(
        and(
          eq(earthCarePledges.status, 'affirmed'),
          sql`${earthCarePledges.signedAt} >= ${sevenDaysAgo}`
        )
      );
    const recentSignups = recentSignupsResult?.count || 0;

    const recentPledgesData = await db
      .select({
        id: earthCarePledges.id,
        enterpriseId: earthCarePledges.enterpriseId,
        enterpriseName: enterprises.name,
        signedAt: earthCarePledges.signedAt,
        narrative: earthCarePledges.narrative,
      })
      .from(earthCarePledges)
      .innerJoin(enterprises, eq(earthCarePledges.enterpriseId, enterprises.id))
      .where(eq(earthCarePledges.status, 'affirmed'))
      .orderBy(desc(earthCarePledges.signedAt))
      .limit(10);

    return {
      totalEnterprises,
      affirmedCount,
      pendingCount,
      revokedCount,
      recentSignups,
      recentPledges: recentPledgesData.map(pledge => ({
        id: pledge.id,
        enterpriseId: pledge.enterpriseId,
        enterpriseName: pledge.enterpriseName,
        signedAt: pledge.signedAt.toISOString(),
        narrative: pledge.narrative,
      })),
    };
  }

  // External API Token operations
  async getExternalApiTokens(userId: string, provider?: 'apollo' | 'google_maps' | 'foursquare' | 'pipedrive' | 'twenty_crm'): Promise<ExternalApiToken[]> {
    const conditions = [eq(externalApiTokens.userId, userId)];
    if (provider) {
      conditions.push(eq(externalApiTokens.provider, provider));
    }
    return await db.select().from(externalApiTokens).where(and(...conditions)).orderBy(desc(externalApiTokens.createdAt));
  }

  async getExternalApiToken(id: string): Promise<ExternalApiToken | undefined> {
    const [token] = await db.select().from(externalApiTokens).where(eq(externalApiTokens.id, id));
    return token;
  }

  async getUserProviderToken(userId: string, provider: 'apollo' | 'google_maps' | 'foursquare' | 'pipedrive' | 'twenty_crm'): Promise<ExternalApiToken | undefined> {
    const [token] = await db.select().from(externalApiTokens)
      .where(and(
        eq(externalApiTokens.userId, userId),
        eq(externalApiTokens.provider, provider),
        eq(externalApiTokens.isActive, true)
      ))
      .orderBy(desc(externalApiTokens.createdAt))
      .limit(1);
    return token;
  }

  async createExternalApiToken(token: InsertExternalApiToken): Promise<ExternalApiToken> {
    const [newToken] = await db.insert(externalApiTokens).values(token).returning();
    return newToken;
  }

  async updateExternalApiToken(id: string, token: Partial<InsertExternalApiToken>): Promise<ExternalApiToken> {
    const [updated] = await db
      .update(externalApiTokens)
      .set({ ...token, updatedAt: new Date() })
      .where(eq(externalApiTokens.id, id))
      .returning();
    return updated;
  }

  async deleteExternalApiToken(id: string): Promise<void> {
    await db.delete(externalApiTokens).where(eq(externalApiTokens.id, id));
  }

  async updateTokenLastUsed(id: string): Promise<void> {
    await db
      .update(externalApiTokens)
      .set({ lastUsed: new Date(), updatedAt: new Date() })
      .where(eq(externalApiTokens.id, id));
  }

  // External Search Cache operations
  async getCachedSearch(provider: 'apollo' | 'google_maps' | 'foursquare' | 'pipedrive' | 'twenty_crm', queryKey: string): Promise<ExternalSearchCache | undefined> {
    const [cache] = await db.select().from(externalSearchCache)
      .where(and(
        eq(externalSearchCache.provider, provider),
        eq(externalSearchCache.queryKey, queryKey),
        sql`${externalSearchCache.expiresAt} > NOW()`
      ))
      .limit(1);
    return cache;
  }

  async createSearchCache(cache: InsertExternalSearchCache): Promise<ExternalSearchCache> {
    const [newCache] = await db.insert(externalSearchCache).values(cache).returning();
    return newCache;
  }

  async deleteExpiredCaches(): Promise<void> {
    await db.delete(externalSearchCache).where(sql`${externalSearchCache.expiresAt} <= NOW()`);
  }

  async clearProviderCache(provider: 'apollo' | 'google_maps' | 'foursquare' | 'pipedrive' | 'twenty_crm'): Promise<void> {
    await db.delete(externalSearchCache).where(eq(externalSearchCache.provider, provider));
  }

  // External Entity operations
  async getExternalEntities(provider?: 'apollo' | 'google_maps' | 'foursquare' | 'pipedrive' | 'twenty_crm', entityType?: 'enterprise' | 'person' | 'opportunity', limit = 50, offset = 0): Promise<ExternalEntity[]> {
    const conditions = [];
    if (provider) {
      conditions.push(eq(externalEntities.provider, provider));
    }
    if (entityType) {
      conditions.push(eq(externalEntities.entityType, entityType));
    }

    if (conditions.length > 0) {
      return await db.select().from(externalEntities)
        .where(and(...conditions))
        .orderBy(desc(externalEntities.createdAt))
        .limit(limit)
        .offset(offset);
    }

    return await db.select().from(externalEntities)
      .orderBy(desc(externalEntities.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getExternalEntity(id: string): Promise<ExternalEntity | undefined> {
    const [entity] = await db.select().from(externalEntities).where(eq(externalEntities.id, id));
    return entity;
  }

  async getExternalEntityByExternalId(provider: 'apollo' | 'google_maps' | 'foursquare' | 'pipedrive' | 'twenty_crm', externalId: string): Promise<ExternalEntity | undefined> {
    const [entity] = await db.select().from(externalEntities)
      .where(and(
        eq(externalEntities.provider, provider),
        eq(externalEntities.externalId, externalId)
      ))
      .limit(1);
    return entity;
  }

  async getExternalEntityByInternalId(internalId: string): Promise<ExternalEntity | undefined> {
    const [entity] = await db.select().from(externalEntities)
      .where(eq(externalEntities.internalId, internalId))
      .limit(1);
    return entity;
  }

  async createExternalEntity(entity: InsertExternalEntity): Promise<ExternalEntity> {
    const [newEntity] = await db.insert(externalEntities).values(entity).returning();
    return newEntity;
  }

  async updateExternalEntity(id: string, entity: Partial<InsertExternalEntity>): Promise<ExternalEntity> {
    const [updated] = await db
      .update(externalEntities)
      .set({ ...entity, updatedAt: new Date() })
      .where(eq(externalEntities.id, id))
      .returning();
    return updated;
  }

  async deleteExternalEntity(id: string): Promise<void> {
    await db.delete(externalEntities).where(eq(externalEntities.id, id));
  }

  async updateEntitySyncStatus(id: string, status: 'pending' | 'synced' | 'failed' | 'stale'): Promise<void> {
    await db
      .update(externalEntities)
      .set({ syncStatus: status, lastSyncedAt: new Date(), updatedAt: new Date() })
      .where(eq(externalEntities.id, id));
  }

  // External Sync Job operations
  async getExternalSyncJobs(userId?: string, provider?: 'apollo' | 'google_maps' | 'foursquare' | 'pipedrive' | 'twenty_crm', limit = 50, offset = 0): Promise<ExternalSyncJob[]> {
    const conditions = [];
    if (userId) {
      conditions.push(eq(externalSyncJobs.userId, userId));
    }
    if (provider) {
      conditions.push(eq(externalSyncJobs.provider, provider));
    }

    if (conditions.length > 0) {
      return await db.select().from(externalSyncJobs)
        .where(and(...conditions))
        .orderBy(desc(externalSyncJobs.createdAt))
        .limit(limit)
        .offset(offset);
    }

    return await db.select().from(externalSyncJobs)
      .orderBy(desc(externalSyncJobs.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getExternalSyncJob(id: string): Promise<ExternalSyncJob | undefined> {
    const [job] = await db.select().from(externalSyncJobs).where(eq(externalSyncJobs.id, id));
    return job;
  }

  async createExternalSyncJob(job: InsertExternalSyncJob): Promise<ExternalSyncJob> {
    const [newJob] = await db.insert(externalSyncJobs).values(job).returning();
    return newJob;
  }

  async updateExternalSyncJob(id: string, job: Partial<InsertExternalSyncJob>): Promise<ExternalSyncJob> {
    const [updated] = await db
      .update(externalSyncJobs)
      .set({ ...job, updatedAt: new Date() })
      .where(eq(externalSyncJobs.id, id))
      .returning();
    return updated;
  }

  async deleteExternalSyncJob(id: string): Promise<void> {
    await db.delete(externalSyncJobs).where(eq(externalSyncJobs.id, id));
  }

  async updateJobProgress(id: string, progress: number, processedRecords: number): Promise<void> {
    await db
      .update(externalSyncJobs)
      .set({ progress, processedRecords, updatedAt: new Date() })
      .where(eq(externalSyncJobs.id, id));
  }

  async updateJobStatus(id: string, status: 'queued' | 'running' | 'completed' | 'failed', errorMessage?: string): Promise<void> {
    const updateData: any = { status, updatedAt: new Date() };
    
    if (status === 'running' && !errorMessage) {
      updateData.startedAt = new Date();
    }
    
    if (status === 'completed' || status === 'failed') {
      updateData.completedAt = new Date();
    }
    
    if (errorMessage) {
      updateData.errorMessage = errorMessage;
    }
    
    await db
      .update(externalSyncJobs)
      .set(updateData)
      .where(eq(externalSyncJobs.id, id));
  }

  // Import Job operations
  async getImportJob(id: string): Promise<ImportJob | undefined> {
    const [job] = await db.select().from(importJobs).where(eq(importJobs.id, id));
    return job;
  }

  async getUserImportJobs(userId: string, limit = 50, offset = 0): Promise<ImportJob[]> {
    return await db
      .select()
      .from(importJobs)
      .where(eq(importJobs.userId, userId))
      .orderBy(desc(importJobs.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async createImportJob(job: InsertImportJob): Promise<ImportJob> {
    const [newJob] = await db.insert(importJobs).values(job).returning();
    return newJob;
  }

  async updateImportJob(id: string, job: Partial<InsertImportJob>): Promise<ImportJob> {
    const [updated] = await db
      .update(importJobs)
      .set({ ...job, updatedAt: new Date() })
      .where(eq(importJobs.id, id))
      .returning();
    return updated;
  }

  async updateImportJobProgress(id: string, processedRows: number, successfulRows: number, failedRows: number): Promise<ImportJob> {
    const [updated] = await db
      .update(importJobs)
      .set({ 
        processedRows, 
        successfulRows, 
        failedRows, 
        updatedAt: new Date() 
      })
      .where(eq(importJobs.id, id))
      .returning();
    return updated;
  }

  async updateImportJobStatus(id: string, status: 'uploaded' | 'mapping' | 'processing' | 'completed' | 'failed' | 'cancelled', errorSummary?: string): Promise<ImportJob> {
    const updateData: any = { status, updatedAt: new Date() };
    
    if (status === 'processing') {
      updateData.startedAt = new Date();
    }
    
    if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      updateData.completedAt = new Date();
    }
    
    if (errorSummary) {
      updateData.errorSummary = errorSummary;
    }
    
    const [updated] = await db
      .update(importJobs)
      .set(updateData)
      .where(eq(importJobs.id, id))
      .returning();
    return updated;
  }

  // Import Error operations
  async createImportError(error: InsertImportJobError): Promise<ImportJobError> {
    const [newError] = await db.insert(importJobErrors).values(error).returning();
    return newError;
  }

  async getJobErrors(jobId: string, limit = 100, offset = 0): Promise<ImportJobError[]> {
    return await db
      .select()
      .from(importJobErrors)
      .where(eq(importJobErrors.jobId, jobId))
      .orderBy(importJobErrors.rowNumber)
      .limit(limit)
      .offset(offset);
  }

  async getErrorsByJob(jobId: string): Promise<ImportJobError[]> {
    return await db
      .select()
      .from(importJobErrors)
      .where(eq(importJobErrors.jobId, jobId))
      .orderBy(importJobErrors.rowNumber);
  }

  // Team Member operations
  async getTeamMembers(enterpriseId: string, limit = 50, offset = 0): Promise<Array<EnterpriseTeamMember & { user: User }>> {
    const results = await db
      .select({
        id: enterpriseTeamMembers.id,
        enterpriseId: enterpriseTeamMembers.enterpriseId,
        userId: enterpriseTeamMembers.userId,
        role: enterpriseTeamMembers.role,
        invitedBy: enterpriseTeamMembers.invitedBy,
        invitedAt: enterpriseTeamMembers.invitedAt,
        acceptedAt: enterpriseTeamMembers.acceptedAt,
        status: enterpriseTeamMembers.status,
        createdAt: enterpriseTeamMembers.createdAt,
        updatedAt: enterpriseTeamMembers.updatedAt,
        user: users,
      })
      .from(enterpriseTeamMembers)
      .innerJoin(users, eq(enterpriseTeamMembers.userId, users.id))
      .where(eq(enterpriseTeamMembers.enterpriseId, enterpriseId))
      .orderBy(desc(enterpriseTeamMembers.createdAt))
      .limit(limit)
      .offset(offset);

    return results.map(result => ({
      id: result.id,
      enterpriseId: result.enterpriseId,
      userId: result.userId,
      role: result.role,
      invitedBy: result.invitedBy,
      invitedAt: result.invitedAt,
      acceptedAt: result.acceptedAt,
      status: result.status,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      user: result.user,
    }));
  }

  async getTeamMember(id: string): Promise<EnterpriseTeamMember | undefined> {
    const [member] = await db.select().from(enterpriseTeamMembers).where(eq(enterpriseTeamMembers.id, id));
    return member;
  }

  async getTeamMemberByUserAndEnterprise(userId: string, enterpriseId: string): Promise<EnterpriseTeamMember | undefined> {
    const [member] = await db
      .select()
      .from(enterpriseTeamMembers)
      .where(
        and(
          eq(enterpriseTeamMembers.userId, userId),
          eq(enterpriseTeamMembers.enterpriseId, enterpriseId)
        )
      )
      .limit(1);
    return member;
  }

  async createTeamMember(teamMember: InsertEnterpriseTeamMember): Promise<EnterpriseTeamMember> {
    const [newMember] = await db.insert(enterpriseTeamMembers).values(teamMember).returning();
    return newMember;
  }

  async updateTeamMember(id: string, teamMember: Partial<InsertEnterpriseTeamMember>): Promise<EnterpriseTeamMember> {
    const [updated] = await db
      .update(enterpriseTeamMembers)
      .set({ ...teamMember, updatedAt: new Date() })
      .where(eq(enterpriseTeamMembers.id, id))
      .returning();
    return updated;
  }

  async deleteTeamMember(id: string): Promise<void> {
    await db.delete(enterpriseTeamMembers).where(eq(enterpriseTeamMembers.id, id));
  }

  async getUserTeamMemberships(userId: string, limit = 50, offset = 0): Promise<Array<EnterpriseTeamMember & { enterprise: Enterprise }>> {
    const results = await db
      .select({
        id: enterpriseTeamMembers.id,
        enterpriseId: enterpriseTeamMembers.enterpriseId,
        userId: enterpriseTeamMembers.userId,
        role: enterpriseTeamMembers.role,
        invitedBy: enterpriseTeamMembers.invitedBy,
        invitedAt: enterpriseTeamMembers.invitedAt,
        acceptedAt: enterpriseTeamMembers.acceptedAt,
        status: enterpriseTeamMembers.status,
        createdAt: enterpriseTeamMembers.createdAt,
        updatedAt: enterpriseTeamMembers.updatedAt,
        enterprise: enterprises,
      })
      .from(enterpriseTeamMembers)
      .innerJoin(enterprises, eq(enterpriseTeamMembers.enterpriseId, enterprises.id))
      .where(
        and(
          eq(enterpriseTeamMembers.userId, userId),
          eq(enterpriseTeamMembers.status, 'active')
        )
      )
      .orderBy(desc(enterpriseTeamMembers.createdAt))
      .limit(limit)
      .offset(offset);

    return results.map(result => ({
      id: result.id,
      enterpriseId: result.enterpriseId,
      userId: result.userId,
      role: result.role,
      invitedBy: result.invitedBy,
      invitedAt: result.invitedAt,
      acceptedAt: result.acceptedAt,
      status: result.status,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      enterprise: result.enterprise,
    }));
  }

  async hasEnterpriseOwner(enterpriseId: string): Promise<boolean> {
    const owners = await db
      .select()
      .from(enterpriseTeamMembers)
      .where(
        and(
          eq(enterpriseTeamMembers.enterpriseId, enterpriseId),
          eq(enterpriseTeamMembers.role, 'owner'),
          eq(enterpriseTeamMembers.status, 'active')
        )
      )
      .limit(1);
    
    return owners.length > 0;
  }

  // Invitation operations
  async createInvitation(invitation: InsertEnterpriseInvitation): Promise<EnterpriseInvitation> {
    const [newInvitation] = await db.insert(enterpriseInvitations).values(invitation).returning();
    return newInvitation;
  }

  async getInvitation(id: string): Promise<EnterpriseInvitation | undefined> {
    const [invitation] = await db.select().from(enterpriseInvitations).where(eq(enterpriseInvitations.id, id));
    return invitation;
  }

  async getInvitationByToken(token: string): Promise<EnterpriseInvitation | undefined> {
    const [invitation] = await db.select().from(enterpriseInvitations).where(eq(enterpriseInvitations.token, token));
    return invitation;
  }

  async getEnterpriseInvitations(enterpriseId: string, limit = 50, offset = 0): Promise<EnterpriseInvitation[]> {
    return await db
      .select()
      .from(enterpriseInvitations)
      .where(eq(enterpriseInvitations.enterpriseId, enterpriseId))
      .orderBy(desc(enterpriseInvitations.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getUserInvitations(email: string, limit = 50, offset = 0): Promise<Array<EnterpriseInvitation & { enterprise: Enterprise }>> {
    const results = await db
      .select({
        id: enterpriseInvitations.id,
        enterpriseId: enterpriseInvitations.enterpriseId,
        email: enterpriseInvitations.email,
        role: enterpriseInvitations.role,
        inviterId: enterpriseInvitations.inviterId,
        token: enterpriseInvitations.token,
        expiresAt: enterpriseInvitations.expiresAt,
        acceptedBy: enterpriseInvitations.acceptedBy,
        acceptedAt: enterpriseInvitations.acceptedAt,
        status: enterpriseInvitations.status,
        createdAt: enterpriseInvitations.createdAt,
        updatedAt: enterpriseInvitations.updatedAt,
        enterprise: enterprises,
      })
      .from(enterpriseInvitations)
      .innerJoin(enterprises, eq(enterpriseInvitations.enterpriseId, enterprises.id))
      .where(eq(enterpriseInvitations.email, email))
      .orderBy(desc(enterpriseInvitations.createdAt))
      .limit(limit)
      .offset(offset);

    return results.map(result => ({
      id: result.id,
      enterpriseId: result.enterpriseId,
      email: result.email,
      role: result.role,
      inviterId: result.inviterId,
      token: result.token,
      expiresAt: result.expiresAt,
      acceptedBy: result.acceptedBy,
      acceptedAt: result.acceptedAt,
      status: result.status,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      enterprise: result.enterprise,
    }));
  }

  async updateInvitation(id: string, invitation: Partial<InsertEnterpriseInvitation>): Promise<EnterpriseInvitation> {
    const [updated] = await db
      .update(enterpriseInvitations)
      .set({ ...invitation, updatedAt: new Date() })
      .where(eq(enterpriseInvitations.id, id))
      .returning();
    return updated;
  }

  async cancelInvitation(id: string): Promise<EnterpriseInvitation> {
    const [updated] = await db
      .update(enterpriseInvitations)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(enterpriseInvitations.id, id))
      .returning();
    return updated;
  }

  // Onboarding progress operations
  async getOnboardingProgress(userId: string, flowKey: string): Promise<{ completed: boolean; steps: Record<string, boolean>; completedAt?: string }> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const progress = user.onboardingProgress as Record<string, { completed: boolean; steps: Record<string, boolean>; completedAt?: string }> || {};
    
    // Return existing progress or default empty state
    return progress[flowKey] || {
      completed: false,
      steps: {},
      completedAt: undefined
    };
  }

  async updateOnboardingProgress(userId: string, flowKey: string, progress: { completed: boolean; steps: Record<string, boolean>; completedAt?: string }): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const newProgressData = {
      [flowKey]: progress
    };

    await db
      .update(users)
      .set({ 
        onboardingProgress: sql`COALESCE(onboarding_progress, '{}'::jsonb) || ${JSON.stringify(newProgressData)}::jsonb`,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId));
  }

  async markOnboardingStepComplete(userId: string, flowKey: string, stepId: string): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const currentProgress = user.onboardingProgress as Record<string, { completed: boolean; steps: Record<string, boolean>; completedAt?: string }> || {};
    
    const flowProgress = currentProgress[flowKey] || {
      completed: false,
      steps: {},
      completedAt: undefined
    };

    flowProgress.steps[stepId] = true;

    const newProgressData = {
      [flowKey]: flowProgress
    };

    await db
      .update(users)
      .set({ 
        onboardingProgress: sql`COALESCE(onboarding_progress, '{}'::jsonb) || ${JSON.stringify(newProgressData)}::jsonb`,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId));
  }

  async markOnboardingComplete(userId: string, flowKey: string): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const currentProgress = user.onboardingProgress as Record<string, { completed: boolean; steps: Record<string, boolean>; completedAt?: string }> || {};
    
    const flowProgress = currentProgress[flowKey] || {
      completed: false,
      steps: {},
      completedAt: undefined
    };

    flowProgress.completed = true;
    flowProgress.completedAt = new Date().toISOString();

    const newProgressData = {
      [flowKey]: flowProgress
    };

    await db
      .update(users)
      .set({ 
        onboardingProgress: sql`COALESCE(onboarding_progress, '{}'::jsonb) || ${JSON.stringify(newProgressData)}::jsonb`,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId));
  }

  async getFeaturedEnterprises(): Promise<Enterprise[]> {
    return await db
      .select()
      .from(enterprises)
      .where(eq(enterprises.isFeatured, true))
      .orderBy(enterprises.featuredOrder, enterprises.name);
  }

  async featureEnterprise(id: string): Promise<Enterprise> {
    const enterprise = await this.getEnterprise(id);
    if (!enterprise) {
      throw new Error("Enterprise not found");
    }

    if (enterprise.isFeatured) {
      return enterprise;
    }

    const maxOrderResult = await db
      .select({ maxOrder: sql<number>`COALESCE(MAX(${enterprises.featuredOrder}), 0)` })
      .from(enterprises)
      .where(eq(enterprises.isFeatured, true));

    const nextOrder = (maxOrderResult[0]?.maxOrder || 0) + 1;

    const [updated] = await db
      .update(enterprises)
      .set({
        isFeatured: true,
        featuredAt: new Date(),
        featuredOrder: nextOrder,
        updatedAt: new Date(),
      })
      .where(eq(enterprises.id, id))
      .returning();

    return updated;
  }

  async unfeatureEnterprise(id: string): Promise<Enterprise> {
    const enterprise = await this.getEnterprise(id);
    if (!enterprise) {
      throw new Error("Enterprise not found");
    }

    const [updated] = await db
      .update(enterprises)
      .set({
        isFeatured: false,
        featuredAt: null,
        featuredOrder: 999999,
        updatedAt: new Date(),
      })
      .where(eq(enterprises.id, id))
      .returning();

    return updated;
  }

  async reorderFeaturedEnterprises(reorderData: Array<{ id: string; featuredOrder: number }>): Promise<void> {
    const enterpriseIds = reorderData.map(item => item.id);

    const existingEnterprises = await db
      .select()
      .from(enterprises)
      .where(inArray(enterprises.id, enterpriseIds));

    if (existingEnterprises.length !== enterpriseIds.length) {
      throw new Error("One or more enterprises not found");
    }

    const nonFeaturedEnterprises = existingEnterprises.filter(e => !e.isFeatured);
    if (nonFeaturedEnterprises.length > 0) {
      throw new Error("Cannot reorder non-featured enterprises");
    }

    for (const item of reorderData) {
      await db
        .update(enterprises)
        .set({
          featuredOrder: item.featuredOrder,
          updatedAt: new Date(),
        })
        .where(eq(enterprises.id, item.id));
    }
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [auditLog] = await db.insert(auditLogs).values(log).returning();
    return auditLog;
  }

  async getAuditLogs(filters?: {
    userId?: string;
    enterpriseId?: string;
    actionType?: 'create' | 'update' | 'delete' | 'feature' | 'unfeature' | 'export' | 'import' | 'configure_tool' | 'test_integration' | 'bulk_operation';
    tableName?: string;
    limit?: number;
    offset?: number;
  }): Promise<AuditLog[]> {
    const conditions = [];
    
    if (filters?.userId) {
      conditions.push(eq(auditLogs.userId, filters.userId));
    }
    if (filters?.enterpriseId) {
      conditions.push(eq(auditLogs.enterpriseId, filters.enterpriseId));
    }
    if (filters?.actionType) {
      conditions.push(eq(auditLogs.actionType, filters.actionType));
    }
    if (filters?.tableName) {
      conditions.push(eq(auditLogs.tableName, filters.tableName));
    }

    const limit = filters?.limit || 100;
    const offset = filters?.offset || 0;

    if (conditions.length > 0) {
      return await db
        .select()
        .from(auditLogs)
        .where(and(...conditions))
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset(offset);
    }

    return await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getIntegrationConfigs(status?: 'active' | 'inactive' | 'error'): Promise<IntegrationConfig[]> {
    if (status) {
      return await db
        .select()
        .from(integrationConfigs)
        .where(eq(integrationConfigs.status, status))
        .orderBy(integrationConfigs.displayName);
    }
    return await db.select().from(integrationConfigs).orderBy(integrationConfigs.displayName);
  }

  async getIntegrationConfig(id: string): Promise<IntegrationConfig | undefined> {
    const [config] = await db
      .select()
      .from(integrationConfigs)
      .where(eq(integrationConfigs.id, id));
    return config;
  }

  async getIntegrationConfigByName(name: string): Promise<IntegrationConfig | undefined> {
    const [config] = await db
      .select()
      .from(integrationConfigs)
      .where(eq(integrationConfigs.name, name));
    return config;
  }

  async createIntegrationConfig(config: InsertIntegrationConfig): Promise<IntegrationConfig> {
    const [integrationConfig] = await db
      .insert(integrationConfigs)
      .values(config)
      .returning();
    return integrationConfig;
  }

  async updateIntegrationConfig(id: string, config: Partial<InsertIntegrationConfig>): Promise<IntegrationConfig> {
    const [integrationConfig] = await db
      .update(integrationConfigs)
      .set({ ...config, updatedAt: new Date() })
      .where(eq(integrationConfigs.id, id))
      .returning();
    return integrationConfig;
  }

  async deleteIntegrationConfig(id: string): Promise<void> {
    await db.delete(integrationConfigs).where(eq(integrationConfigs.id, id));
  }

  async updateIntegrationStatus(id: string, status: 'active' | 'inactive' | 'error', errorMessage?: string): Promise<IntegrationConfig> {
    const updateData: any = {
      status,
      updatedAt: new Date()
    };
    if (errorMessage !== undefined) {
      updateData.errorMessage = errorMessage;
    }
    const [integrationConfig] = await db
      .update(integrationConfigs)
      .set(updateData)
      .where(eq(integrationConfigs.id, id))
      .returning();
    return integrationConfig;
  }

  async updateIntegrationTestResult(id: string, testResult: string, success: boolean): Promise<IntegrationConfig> {
    const [integrationConfig] = await db
      .update(integrationConfigs)
      .set({
        testResult,
        lastTestedAt: new Date(),
        status: success ? 'active' : 'error',
        errorMessage: success ? null : testResult,
        updatedAt: new Date()
      })
      .where(eq(integrationConfigs.id, id))
      .returning();
    return integrationConfig;
  }
}

export const storage = new DatabaseStorage();
