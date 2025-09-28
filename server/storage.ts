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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, like, and, or, count, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
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
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // First try to find existing user by email
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, userData.email!))
      .limit(1);

    if (existingUser.length > 0) {
      // Update existing user
      const [user] = await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date(),
        })
        .where(eq(users.email, userData.email!))
        .returning();
      return user;
    } else {
      // Insert new user
      const [user] = await db
        .insert(users)
        .values(userData)
        .returning();
      return user;
    }
  }

  // Enterprise operations
  async getEnterprises(category?: string, search?: string, limit = 50, offset = 0): Promise<Enterprise[]> {
    let query = db.select().from(enterprises);
    
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
      query = query.where(and(...conditions));
    }
    
    return query.orderBy(desc(enterprises.createdAt)).limit(limit).offset(offset);
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
    let query = db.select().from(people);
    
    if (search) {
      query = query.where(
        or(
          like(people.firstName, `%${search}%`),
          like(people.lastName, `%${search}%`),
          like(people.email, `%${search}%`),
          like(people.title, `%${search}%`)
        )
      );
    }
    
    return query.orderBy(desc(people.createdAt)).limit(limit).offset(offset);
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
    let query = db.select().from(opportunities);
    
    if (search) {
      query = query.where(
        or(
          like(opportunities.title, `%${search}%`),
          like(opportunities.description, `%${search}%`)
        )
      );
    }
    
    return query.orderBy(desc(opportunities.createdAt)).limit(limit).offset(offset);
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
    let query = db.select().from(tasks);
    
    if (search) {
      query = query.where(
        or(
          like(tasks.title, `%${search}%`),
          like(tasks.description, `%${search}%`)
        )
      );
    }
    
    return query.orderBy(desc(tasks.createdAt)).limit(limit).offset(offset);
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
}

export const storage = new DatabaseStorage();
