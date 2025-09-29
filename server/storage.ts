import {
  users,
  enterprises,
  people,
  opportunities,
  tasks,
  copilotContext,
  businessContext,
  conversations,
  chatMessages,
  customFields,
  partnerApplications,
  opportunityTransfers,
  userRoleEnum,
  membershipStatusEnum,
  type User,
  type UpsertUser,
  type Enterprise,
  type InsertEnterprise,
  type Person,
  type InsertPerson,
  type Opportunity,
  type InsertOpportunity,
  type Task,
  type InsertTask,
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
  type OpportunityTransfer,
  type InsertOpportunityTransfer,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, like, and, or, count, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUsersByRole(role: 'visitor' | 'member' | 'enterprise_owner' | 'admin'): Promise<User[]>;
  getUsersByMembershipStatus(status: 'free' | 'trial' | 'paid_member' | 'spatial_network_subscriber' | 'cancelled'): Promise<User[]>;
  
  // Enterprise operations
  getEnterprises(category?: string, search?: string, limit?: number, offset?: number): Promise<Enterprise[]>;
  getEnterprise(id: string): Promise<Enterprise | undefined>;
  createEnterprise(enterprise: InsertEnterprise): Promise<Enterprise>;
  updateEnterprise(id: string, enterprise: Partial<InsertEnterprise>): Promise<Enterprise>;
  deleteEnterprise(id: string): Promise<void>;
  getEnterpriseStats(): Promise<{ total: number; byCategory: Record<string, number> }>;
  
  // People operations
  getPeople(search?: string, limit?: number, offset?: number): Promise<Person[]>;
  getPerson(id: string): Promise<Person | undefined>;
  createPerson(person: InsertPerson): Promise<Person>;
  updatePerson(id: string, person: Partial<InsertPerson>): Promise<Person>;
  deletePerson(id: string): Promise<void>;
  getPeopleStats(): Promise<{ total: number; byStatus: Record<string, number> }>;
  
  // Opportunity operations
  getOpportunities(search?: string, limit?: number, offset?: number): Promise<Opportunity[]>;
  getOpportunity(id: string): Promise<Opportunity | undefined>;
  createOpportunity(opportunity: InsertOpportunity): Promise<Opportunity>;
  updateOpportunity(id: string, opportunity: Partial<InsertOpportunity>): Promise<Opportunity>;
  deleteOpportunity(id: string): Promise<void>;
  getOpportunityStats(): Promise<{ total: number; byStatus: Record<string, number>; totalValue: number }>;
  
  // Task operations
  getTasks(search?: string, limit?: number, offset?: number): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  getTaskStats(): Promise<{ total: number; byStatus: Record<string, number> }>;
  
  // Copilot context operations
  getCopilotContext(userId: string): Promise<CopilotContext | undefined>;
  upsertCopilotContext(context: InsertCopilotContext): Promise<CopilotContext>;
  
  // Business context operations
  getBusinessContext(userId: string): Promise<BusinessContext | undefined>;
  upsertBusinessContext(context: InsertBusinessContext): Promise<BusinessContext>;
  
  // Chat conversation operations
  getConversations(userId: string, limit?: number, offset?: number): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: string, conversation: Partial<InsertConversation>): Promise<Conversation>;
  deleteConversation(id: string): Promise<void>;
  
  // Chat message operations
  getChatMessages(conversationId: string, limit?: number, offset?: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  deleteChatMessage(id: string): Promise<void>;
  
  // Custom fields operations
  getCustomFields(entityName: string): Promise<CustomField[]>;
  createCustomField(customField: InsertCustomField): Promise<CustomField>;
  updateCustomField(id: string, customField: Partial<InsertCustomField>): Promise<CustomField>;
  deleteCustomField(id: string): Promise<void>;
  
  // Partner application operations
  getPartnerApplications(limit?: number, offset?: number): Promise<PartnerApplication[]>;
  getPartnerApplication(id: string): Promise<PartnerApplication | undefined>;
  createPartnerApplication(application: InsertPartnerApplication): Promise<PartnerApplication>;
  updatePartnerApplication(id: string, application: Partial<InsertPartnerApplication>): Promise<PartnerApplication>;
  deletePartnerApplication(id: string): Promise<void>;
  
  // Enterprise claiming and invitation operations
  getEnterprisesWithClaimInfo(search?: string, claimStatus?: 'unclaimed' | 'claimed' | 'verified', limit?: number, offset?: number): Promise<Array<Enterprise & { contacts: Person[] }>>;
  getEnterpriseClaimStats(): Promise<{ 
    total: number; 
    byClaim: Record<string, number>; 
    byInvitation: Record<string, number>;
    pendingClaims: number;
  }>;
  sendInvitation(personId: string, enterpriseId: string): Promise<Person>;
  updateInvitationStatus(personId: string, status: 'not_invited' | 'invited' | 'signed_up' | 'active'): Promise<Person>;
  updateClaimStatus(personId: string, status: 'unclaimed' | 'claimed' | 'verified'): Promise<Person>;
  getInvitationHistory(limit?: number, offset?: number): Promise<Person[]>;
  getPeopleByEnterpriseId(enterpriseId: string): Promise<Person[]>;
  
  // Opportunity transfer operations
  getOpportunityTransfers(search?: string, status?: 'pending' | 'accepted' | 'declined' | 'completed', limit?: number, offset?: number): Promise<Array<OpportunityTransfer & { opportunity: Opportunity; transferredByUser: User; transferredToUser: User }>>;
  getOpportunityTransfer(id: string): Promise<OpportunityTransfer | undefined>;
  createOpportunityTransfer(transfer: InsertOpportunityTransfer): Promise<OpportunityTransfer>;
  updateOpportunityTransfer(id: string, transfer: Partial<InsertOpportunityTransfer>): Promise<OpportunityTransfer>;
  deleteOpportunityTransfer(id: string): Promise<void>;
  getTransfersByUserId(userId: string, limit?: number, offset?: number): Promise<Array<OpportunityTransfer & { opportunity: Opportunity; transferredByUser: User }>>;
  getTransferStats(): Promise<{ 
    total: number; 
    byStatus: Record<string, number>; 
    pendingTransfers: number 
  }>;
  acceptOpportunityTransfer(transferId: string, userId: string): Promise<OpportunityTransfer>;
  declineOpportunityTransfer(transferId: string, userId: string, reason?: string): Promise<OpportunityTransfer>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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

  async getUsersByRole(role: 'visitor' | 'member' | 'enterprise_owner' | 'admin'): Promise<User[]> {
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

  // People operations
  async getPeople(search?: string, limit = 50, offset = 0): Promise<Person[]> {
    if (search) {
      return await db.select().from(people)
        .where(
          or(
            like(people.firstName, `%${search}%`),
            like(people.lastName, `%${search}%`),
            like(people.email, `%${search}%`),
            like(people.title, `%${search}%`)
          )
        )
        .orderBy(desc(people.createdAt))
        .limit(limit)
        .offset(offset);
    }
    
    return await db.select().from(people)
      .orderBy(desc(people.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getPerson(id: string): Promise<Person | undefined> {
    const [person] = await db.select().from(people).where(eq(people.id, id));
    return person;
  }

  async createPerson(person: InsertPerson): Promise<Person> {
    const [newPerson] = await db.insert(people).values(person).returning();
    return newPerson;
  }

  async updatePerson(id: string, person: Partial<InsertPerson>): Promise<Person> {
    const [updated] = await db
      .update(people)
      .set({ ...person, updatedAt: new Date() })
      .where(eq(people.id, id))
      .returning();
    return updated;
  }

  async deletePerson(id: string): Promise<void> {
    await db.delete(people).where(eq(people.id, id));
  }

  async getPeopleStats(): Promise<{ total: number; byStatus: Record<string, number> }> {
    const [totalResult] = await db.select({ count: count() }).from(people);
    
    const statusStats = await db
      .select({
        status: people.invitationStatus,
        count: count(),
      })
      .from(people)
      .groupBy(people.invitationStatus);
    
    const byStatus: Record<string, number> = {};
    statusStats.forEach(stat => {
      if (stat.status) {
        byStatus[stat.status] = stat.count;
      }
    });
    
    return {
      total: totalResult.count,
      byStatus,
    };
  }

  // Opportunity operations
  async getOpportunities(search?: string, limit = 50, offset = 0): Promise<Opportunity[]> {
    if (search) {
      return await db.select().from(opportunities)
        .where(
          or(
            like(opportunities.title, `%${search}%`),
            like(opportunities.description, `%${search}%`)
          )
        )
        .orderBy(desc(opportunities.createdAt))
        .limit(limit)
        .offset(offset);
    }
    
    return await db.select().from(opportunities)
      .orderBy(desc(opportunities.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getOpportunity(id: string): Promise<Opportunity | undefined> {
    const [opportunity] = await db.select().from(opportunities).where(eq(opportunities.id, id));
    return opportunity;
  }

  async createOpportunity(opportunity: InsertOpportunity): Promise<Opportunity> {
    const [newOpportunity] = await db.insert(opportunities).values(opportunity).returning();
    return newOpportunity;
  }

  async updateOpportunity(id: string, opportunity: Partial<InsertOpportunity>): Promise<Opportunity> {
    const [updated] = await db
      .update(opportunities)
      .set({ ...opportunity, updatedAt: new Date() })
      .where(eq(opportunities.id, id))
      .returning();
    return updated;
  }

  async deleteOpportunity(id: string): Promise<void> {
    await db.delete(opportunities).where(eq(opportunities.id, id));
  }

  async getOpportunityStats(): Promise<{ total: number; byStatus: Record<string, number>; totalValue: number }> {
    const [totalResult] = await db.select({ count: count() }).from(opportunities);
    
    const [valueResult] = await db.select({ 
      total: sql<number>`coalesce(sum(${opportunities.value}), 0)`
    }).from(opportunities);
    
    const statusStats = await db
      .select({
        status: opportunities.status,
        count: count(),
      })
      .from(opportunities)
      .groupBy(opportunities.status);
    
    const byStatus: Record<string, number> = {};
    statusStats.forEach(stat => {
      if (stat.status) {
        byStatus[stat.status] = stat.count;
      }
    });
    
    return {
      total: totalResult.count,
      byStatus,
      totalValue: valueResult.total,
    };
  }

  // Task operations
  async getTasks(search?: string, limit = 50, offset = 0): Promise<Task[]> {
    if (search) {
      return await db.select().from(tasks)
        .where(
          or(
            like(tasks.title, `%${search}%`),
            like(tasks.description, `%${search}%`)
          )
        )
        .orderBy(desc(tasks.createdAt))
        .limit(limit)
        .offset(offset);
    }
    
    return await db.select().from(tasks)
      .orderBy(desc(tasks.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: string, task: Partial<InsertTask>): Promise<Task> {
    const [updated] = await db
      .update(tasks)
      .set({ ...task, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return updated;
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async getTaskStats(): Promise<{ total: number; byStatus: Record<string, number> }> {
    const [totalResult] = await db.select({ count: count() }).from(tasks);
    
    const statusStats = await db
      .select({
        status: tasks.status,
        count: count(),
      })
      .from(tasks)
      .groupBy(tasks.status);
    
    const byStatus: Record<string, number> = {};
    statusStats.forEach(stat => {
      if (stat.status) {
        byStatus[stat.status] = stat.count;
      }
    });
    
    return {
      total: totalResult.count,
      byStatus,
    };
  }

  // Copilot context operations
  async getCopilotContext(userId: string): Promise<CopilotContext | undefined> {
    const [context] = await db.select().from(copilotContext).where(eq(copilotContext.userId, userId));
    return context;
  }

  async upsertCopilotContext(context: InsertCopilotContext): Promise<CopilotContext> {
    const [result] = await db
      .insert(copilotContext)
      .values(context)
      .onConflictDoUpdate({
        target: copilotContext.userId,
        set: {
          ...context,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  // Business context operations
  async getBusinessContext(userId: string): Promise<BusinessContext | undefined> {
    const [context] = await db.select().from(businessContext).where(eq(businessContext.userId, userId));
    return context;
  }

  async upsertBusinessContext(context: InsertBusinessContext): Promise<BusinessContext> {
    const [result] = await db
      .insert(businessContext)
      .values(context)
      .onConflictDoUpdate({
        target: businessContext.userId,
        set: {
          ...context,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  // Chat conversation operations
  async getConversations(userId: string, limit = 50, offset = 0): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.lastMessageAt))
      .limit(limit)
      .offset(offset);
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation;
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [result] = await db.insert(conversations).values(conversation).returning();
    return result;
  }

  async updateConversation(id: string, conversation: Partial<InsertConversation>): Promise<Conversation> {
    const [updated] = await db
      .update(conversations)
      .set({ ...conversation, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return updated;
  }

  async deleteConversation(id: string): Promise<void> {
    // Delete all messages first, then the conversation
    await db.delete(chatMessages).where(eq(chatMessages.conversationId, id));
    await db.delete(conversations).where(eq(conversations.id, id));
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
  async getCustomFields(entityName: string): Promise<CustomField[]> {
    return await db
      .select()
      .from(customFields)
      .where(eq(customFields.entityName, entityName))
      .orderBy(customFields.createdAt);
  }

  async createCustomField(customField: InsertCustomField): Promise<CustomField> {
    const [result] = await db.insert(customFields).values(customField).returning();
    return result;
  }

  async updateCustomField(id: string, customField: Partial<InsertCustomField>): Promise<CustomField> {
    const [updated] = await db
      .update(customFields)
      .set({ ...customField, updatedAt: new Date() })
      .where(eq(customFields.id, id))
      .returning();
    return updated;
  }

  async deleteCustomField(id: string): Promise<void> {
    await db.delete(customFields).where(eq(customFields.id, id));
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

  // Enterprise claiming and invitation operations
  async getEnterprisesWithClaimInfo(search?: string, claimStatus?: 'unclaimed' | 'claimed' | 'verified', limit = 50, offset = 0): Promise<Array<Enterprise & { contacts: Person[] }>> {
    let enterpriseQuery = db.select().from(enterprises);
    const conditions = [];
    
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
      enterpriseQuery = enterpriseQuery.where(and(...conditions));
    }
    
    const enterpriseResults = await enterpriseQuery
      .orderBy(desc(enterprises.createdAt))
      .limit(limit)
      .offset(offset);

    // Get all people for these enterprises
    const enterpriseIds = enterpriseResults.map(e => e.id);
    const allContacts = enterpriseIds.length > 0 
      ? await db.select().from(people).where(inArray(people.enterpriseId, enterpriseIds))
      : [];

    // Group contacts by enterprise and filter by claim status if specified
    const enterpriseWithContacts = enterpriseResults.map(enterprise => {
      let contacts = allContacts.filter(p => p.enterpriseId === enterprise.id);
      
      // Filter by claim status if specified
      if (claimStatus) {
        contacts = contacts.filter(p => p.claimStatus === claimStatus);
      }
      
      return {
        ...enterprise,
        contacts
      };
    });

    // If filtering by claim status, only return enterprises that have contacts with that status
    if (claimStatus) {
      return enterpriseWithContacts.filter(e => e.contacts.length > 0);
    }
    
    return enterpriseWithContacts;
  }

  async getEnterpriseClaimStats(): Promise<{ 
    total: number; 
    byClaim: Record<string, number>; 
    byInvitation: Record<string, number>;
    pendingClaims: number;
  }> {
    const [totalResult] = await db.select({ count: count() }).from(enterprises);
    
    // Get claim status distribution
    const claimStats = await db
      .select({
        status: people.claimStatus,
        count: count(),
      })
      .from(people)
      .where(sql`${people.enterpriseId} IS NOT NULL`)
      .groupBy(people.claimStatus);
    
    // Get invitation status distribution
    const invitationStats = await db
      .select({
        status: people.invitationStatus,
        count: count(),
      })
      .from(people)
      .where(sql`${people.enterpriseId} IS NOT NULL`)
      .groupBy(people.invitationStatus);
    
    // Get pending claims (invited but not yet claimed)
    const [pendingResult] = await db
      .select({ count: count() })
      .from(people)
      .where(
        and(
          sql`${people.enterpriseId} IS NOT NULL`,
          eq(people.invitationStatus, 'invited'),
          eq(people.claimStatus, 'unclaimed')
        )
      );

    const byClaim: Record<string, number> = {};
    claimStats.forEach(stat => {
      if (stat.status) {
        byClaim[stat.status] = stat.count;
      }
    });

    const byInvitation: Record<string, number> = {};
    invitationStats.forEach(stat => {
      if (stat.status) {
        byInvitation[stat.status] = stat.count;
      }
    });
    
    return {
      total: totalResult.count,
      byClaim,
      byInvitation,
      pendingClaims: pendingResult.count,
    };
  }

  async sendInvitation(personId: string, enterpriseId: string): Promise<Person> {
    const [updated] = await db
      .update(people)
      .set({ 
        invitationStatus: 'invited',
        lastContactedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(people.id, personId))
      .returning();
    return updated;
  }

  async updateInvitationStatus(personId: string, status: 'not_invited' | 'invited' | 'signed_up' | 'active'): Promise<Person> {
    const [updated] = await db
      .update(people)
      .set({ 
        invitationStatus: status,
        updatedAt: new Date()
      })
      .where(eq(people.id, personId))
      .returning();
    return updated;
  }

  async updateClaimStatus(personId: string, status: 'unclaimed' | 'claimed' | 'verified'): Promise<Person> {
    const [updated] = await db
      .update(people)
      .set({ 
        claimStatus: status,
        updatedAt: new Date()
      })
      .where(eq(people.id, personId))
      .returning();
    return updated;
  }

  async getInvitationHistory(limit = 50, offset = 0): Promise<Person[]> {
    return await db
      .select()
      .from(people)
      .where(sql`${people.invitationStatus} != 'not_invited'`)
      .orderBy(desc(people.lastContactedAt), desc(people.updatedAt))
      .limit(limit)
      .offset(offset);
  }

  async getPeopleByEnterpriseId(enterpriseId: string): Promise<Person[]> {
    return await db
      .select()
      .from(people)
      .where(eq(people.enterpriseId, enterpriseId))
      .orderBy(desc(people.createdAt));
  }

  // Opportunity transfer operations
  async getOpportunityTransfers(search?: string, status?: 'pending' | 'accepted' | 'declined' | 'completed', limit = 50, offset = 0): Promise<Array<OpportunityTransfer & { opportunity: Opportunity; transferredByUser: User; transferredToUser: User }>> {
    // First get the basic transfers with opportunities
    let baseQuery = db
      .select()
      .from(opportunityTransfers)
      .innerJoin(opportunities, eq(opportunityTransfers.opportunityId, opportunities.id));

    const conditions = [];
    
    if (search) {
      conditions.push(
        or(
          like(opportunities.title, `%${search}%`),
          like(opportunities.description, `%${search}%`)
        )
      );
    }
    
    if (status) {
      conditions.push(eq(opportunityTransfers.status, status));
    }

    if (conditions.length > 0) {
      baseQuery = baseQuery.where(and(...conditions));
    }

    const transfersWithOpportunities = await baseQuery
      .orderBy(desc(opportunityTransfers.createdAt))
      .limit(limit)
      .offset(offset);

    // Now enrich with user data
    const result = [];
    for (const row of transfersWithOpportunities) {
      const [transferredByUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, row.opportunity_transfers.transferredBy));
      
      const [transferredToUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, row.opportunity_transfers.transferredTo));

      result.push({
        ...row.opportunity_transfers,
        opportunity: row.opportunities,
        transferredByUser,
        transferredToUser,
      });
    }

    return result;
  }

  async getOpportunityTransfer(id: string): Promise<OpportunityTransfer | undefined> {
    const [transfer] = await db
      .select()
      .from(opportunityTransfers)
      .where(eq(opportunityTransfers.id, id));
    return transfer;
  }

  async createOpportunityTransfer(transfer: InsertOpportunityTransfer): Promise<OpportunityTransfer> {
    const [created] = await db
      .insert(opportunityTransfers)
      .values(transfer)
      .returning();
    return created;
  }

  async updateOpportunityTransfer(id: string, transfer: Partial<InsertOpportunityTransfer>): Promise<OpportunityTransfer> {
    const [updated] = await db
      .update(opportunityTransfers)
      .set({ ...transfer, updatedAt: new Date() })
      .where(eq(opportunityTransfers.id, id))
      .returning();
    return updated;
  }

  async deleteOpportunityTransfer(id: string): Promise<void> {
    await db
      .delete(opportunityTransfers)
      .where(eq(opportunityTransfers.id, id));
  }

  async getTransfersByUserId(userId: string, limit = 50, offset = 0): Promise<Array<OpportunityTransfer & { opportunity: Opportunity; transferredByUser: User }>> {
    return await db
      .select({
        ...opportunityTransfers,
        opportunity: opportunities,
        transferredByUser: users,
      })
      .from(opportunityTransfers)
      .innerJoin(opportunities, eq(opportunityTransfers.opportunityId, opportunities.id))
      .innerJoin(users, eq(opportunityTransfers.transferredBy, users.id))
      .where(eq(opportunityTransfers.transferredTo, userId))
      .orderBy(desc(opportunityTransfers.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getTransferStats(): Promise<{ total: number; byStatus: Record<string, number>; pendingTransfers: number }> {
    const [totalResult] = await db
      .select({ count: count() })
      .from(opportunityTransfers);

    const statusResults = await db
      .select({ 
        status: opportunityTransfers.status,
        count: count()
      })
      .from(opportunityTransfers)
      .groupBy(opportunityTransfers.status);

    const [pendingResult] = await db
      .select({ count: count() })
      .from(opportunityTransfers)
      .where(eq(opportunityTransfers.status, 'pending'));

    const byStatus = statusResults.reduce((acc, { status, count }) => {
      acc[status!] = count;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: totalResult.count,
      byStatus,
      pendingTransfers: pendingResult.count,
    };
  }

  async acceptOpportunityTransfer(transferId: string, userId: string): Promise<OpportunityTransfer> {
    const [updated] = await db
      .update(opportunityTransfers)
      .set({ 
        status: 'accepted',
        respondedAt: new Date(),
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(
        eq(opportunityTransfers.id, transferId),
        eq(opportunityTransfers.transferredTo, userId)
      ))
      .returning();
    return updated;
  }

  async declineOpportunityTransfer(transferId: string, userId: string, reason?: string): Promise<OpportunityTransfer> {
    const [updated] = await db
      .update(opportunityTransfers)
      .set({ 
        status: 'declined',
        respondedAt: new Date(),
        notes: reason ? `Declined: ${reason}` : 'Declined',
        updatedAt: new Date()
      })
      .where(and(
        eq(opportunityTransfers.id, transferId),
        eq(opportunityTransfers.transferredTo, userId)
      ))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
