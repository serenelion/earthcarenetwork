import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User role enum for role-based access control
export const userRoleEnum = pgEnum('user_role', [
  'visitor',
  'member',
  'enterprise_owner',
  'admin'
]);

// Membership status enum for tracking subscription status
export const membershipStatusEnum = pgEnum('membership_status', [
  'free',
  'trial',
  'paid_member',
  'spatial_network_subscriber',
  'cancelled'
]);

// Subscription status enum for Stripe subscriptions
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'trial',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'incomplete',
  'incomplete_expired'
]);

// Plan types for subscription tiers
export const planTypeEnum = pgEnum('plan_type', [
  'free',
  'crm_basic',
  'build_pro_bundle'
]);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default('visitor'),
  membershipStatus: membershipStatusEnum("membership_status").default('free'),
  // Stripe integration fields
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: subscriptionStatusEnum("subscription_status"),
  currentPlanType: planTypeEnum("current_plan_type").default('free'),
  subscriptionCurrentPeriodEnd: timestamp("subscription_current_period_end"),
  // AI Usage tracking
  tokenUsageThisMonth: integer("token_usage_this_month").default(0),
  tokenQuotaLimit: integer("token_quota_limit").default(10000), // Default free tier limit
  lastTokenUsageReset: timestamp("last_token_usage_reset").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enterprise categories
export const enterpriseCategoryEnum = pgEnum('enterprise_category', [
  'land_projects',
  'capital_sources', 
  'open_source_tools',
  'network_organizers'
]);

// User journey status tracking
export const invitationStatusEnum = pgEnum('invitation_status', [
  'not_invited',
  'invited',
  'signed_up',
  'active'
]);

export const claimStatusEnum = pgEnum('claim_status', [
  'unclaimed',
  'claimed',
  'verified'
]);

export const buildProStatusEnum = pgEnum('build_pro_status', [
  'not_offered',
  'offered',
  'trial',
  'subscribed',
  'cancelled'
]);

export const supportStatusEnum = pgEnum('support_status', [
  'no_inquiry',
  'inquiry_sent',
  'in_progress',
  'resolved'
]);

// Enterprises table
export const enterprises = pgTable("enterprises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  category: enterpriseCategoryEnum("category").notNull(),
  location: varchar("location"),
  website: varchar("website"),
  imageUrl: varchar("image_url"),
  isVerified: boolean("is_verified").default(false),
  followerCount: integer("follower_count").default(0),
  tags: text("tags").array(),
  contactEmail: varchar("contact_email"),
  sourceUrl: varchar("source_url"), // Original URL if imported
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// People table
export const people = pgTable("people", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email").unique(),
  phone: varchar("phone"),
  title: varchar("title"),
  enterpriseId: varchar("enterprise_id").references(() => enterprises.id),
  linkedinUrl: varchar("linkedin_url"),
  notes: text("notes"),
  invitationStatus: invitationStatusEnum("invitation_status").default('not_invited'),
  claimStatus: claimStatusEnum("claim_status").default('unclaimed'),
  buildProStatus: buildProStatusEnum("build_pro_status").default('not_offered'),
  supportStatus: supportStatusEnum("support_status").default('no_inquiry'),
  lastContactedAt: timestamp("last_contacted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Opportunity status
export const opportunityStatusEnum = pgEnum('opportunity_status', [
  'lead',
  'qualified',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost'
]);

// Opportunities table
export const opportunities = pgTable("opportunities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  value: integer("value"), // in cents
  status: opportunityStatusEnum("status").default('lead'),
  probability: integer("probability").default(0), // 0-100
  enterpriseId: varchar("enterprise_id").references(() => enterprises.id),
  primaryContactId: varchar("primary_contact_id").references(() => people.id),
  expectedCloseDate: timestamp("expected_close_date"),
  notes: text("notes"),
  aiScore: integer("ai_score"), // AI-generated lead score 0-100
  aiInsights: text("ai_insights"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Task priority and status
export const taskPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high', 'urgent']);
export const taskStatusEnum = pgEnum('task_status', ['pending', 'in_progress', 'completed', 'cancelled']);

// Tasks table
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  priority: taskPriorityEnum("priority").default('medium'),
  status: taskStatusEnum("status").default('pending'),
  dueDate: timestamp("due_date"),
  assignedToId: varchar("assigned_to_id").references(() => users.id),
  relatedEnterpriseId: varchar("related_enterprise_id").references(() => enterprises.id),
  relatedPersonId: varchar("related_person_id").references(() => people.id),
  relatedOpportunityId: varchar("related_opportunity_id").references(() => opportunities.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI Copilot context configuration
export const copilotContext = pgTable("copilot_context", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  leadScoringCriteria: jsonb("lead_scoring_criteria"),
  automationRules: jsonb("automation_rules"),
  focusAreas: text("focus_areas").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Business context for AI copilot
export const businessContext = pgTable("business_context", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  companyName: varchar("company_name"),
  website: varchar("website"),
  description: text("description"),
  awards: text("awards"),
  outreachGoal: text("outreach_goal"),
  customerProfiles: jsonb("customer_profiles"), // Array of customer profile objects
  guidanceRules: text("guidance_rules").array(), // Array of guidance rules
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat conversations for copilot
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: varchar("title"), // Auto-generated or user-set title
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat messages within conversations
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id).notNull(),
  role: varchar("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  metadata: jsonb("metadata"), // For storing additional context, attachments, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Custom field types
export const customFieldTypeEnum = pgEnum('custom_field_type', [
  'varchar',
  'text', 
  'integer',
  'boolean',
  'timestamp',
  'enum'
]);

// Custom fields for dynamic schema extension
export const customFields = pgTable("custom_fields", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityName: varchar("entity_name").notNull(), // e.g., 'enterprises', 'people', etc.
  fieldName: varchar("field_name").notNull(), // e.g., 'industry', 'custom_rating'
  fieldType: customFieldTypeEnum("field_type").notNull(),
  description: text("description"),
  isRequired: boolean("is_required").default(false),
  isUnique: boolean("is_unique").default(false),
  enumValues: text("enum_values").array(), // For enum type fields
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Ensure unique field names per entity
  index("custom_fields_entity_field_idx").on(table.entityName, table.fieldName)
]);

// Transfer status for opportunity transfers
export const transferStatusEnum = pgEnum('transfer_status', [
  'pending',
  'accepted',
  'declined',
  'completed'
]);

// Partner application status
export const partnerApplicationStatusEnum = pgEnum('partner_application_status', [
  'pending',
  'under_review',
  'approved',
  'rejected'
]);

// Partner applications for Council of New Earth Enterprises
export const partnerApplications = pgTable("partner_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationName: varchar("organization_name").notNull(),
  contactPerson: varchar("contact_person").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone"),
  website: varchar("website"),
  description: text("description"), // Organization/Mission description
  areasOfFocus: text("areas_of_focus").array(), // Areas they focus on
  contribution: text("contribution"), // How they'd contribute to the network
  status: partnerApplicationStatusEnum("status").default('pending'),
  notes: text("notes"), // Internal notes for review
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Opportunity transfers for admin to enterprise owner workflow
export const opportunityTransfers = pgTable("opportunity_transfers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  opportunityId: varchar("opportunity_id").references(() => opportunities.id).notNull(),
  transferredBy: varchar("transferred_by").references(() => users.id).notNull(), // Admin who initiated transfer
  transferredTo: varchar("transferred_to").references(() => users.id).notNull(), // Enterprise owner receiving transfer
  previousOwnerId: varchar("previous_owner_id").references(() => users.id), // Previous owner (can be null for new opportunities)
  status: transferStatusEnum("status").default('pending'),
  reason: text("reason"), // Reason for transfer
  notes: text("notes"), // Additional notes
  transferredAt: timestamp("transferred_at").defaultNow(),
  respondedAt: timestamp("responded_at"), // When the recipient responded
  completedAt: timestamp("completed_at"), // When transfer was completed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscription plans table - defines available subscription tiers
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  planType: planTypeEnum("plan_type").notNull(),
  name: varchar("name").notNull(), // "CRM Basic", "Build Pro Bundle", etc.
  description: text("description"),
  priceMonthly: integer("price_monthly").notNull(), // in cents
  priceYearly: integer("price_yearly"), // in cents, optional
  stripePriceIdMonthly: varchar("stripe_price_id_monthly"), // Stripe price ID for monthly billing
  stripePriceIdYearly: varchar("stripe_price_id_yearly"), // Stripe price ID for yearly billing
  features: text("features").array(), // Array of feature descriptions
  tokenQuotaLimit: integer("token_quota_limit").default(10000), // AI usage token limit
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User subscriptions table - tracks active subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  planId: varchar("plan_id").references(() => subscriptionPlans.id).notNull(),
  // Stripe fields
  stripeSubscriptionId: varchar("stripe_subscription_id").unique(),
  stripeCustomerId: varchar("stripe_customer_id").notNull(),
  stripePriceId: varchar("stripe_price_id").notNull(),
  // Subscription status and timing
  status: subscriptionStatusEnum("status").notNull(),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  trialStart: timestamp("trial_start"),
  trialEnd: timestamp("trial_end"),
  cancelAt: timestamp("cancel_at"), // When subscription is scheduled to cancel
  canceledAt: timestamp("canceled_at"), // When subscription was actually canceled
  // Billing
  isYearly: boolean("is_yearly").default(false),
  lastPaymentAmount: integer("last_payment_amount"), // in cents
  lastPaymentAt: timestamp("last_payment_at"),
  nextBillingDate: timestamp("next_billing_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI usage tracking table - detailed token usage logs
export const aiUsageLogs = pgTable("ai_usage_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  subscriptionId: varchar("subscription_id").references(() => subscriptions.id),
  // Usage details
  operationType: varchar("operation_type").notNull(), // 'chat', 'lead_score', 'content_generation', etc.
  tokensUsed: integer("tokens_used").notNull(),
  cost: integer("cost"), // in cents, for future billing
  // Context
  entityType: varchar("entity_type"), // 'opportunity', 'person', 'enterprise', etc.
  entityId: varchar("entity_id"), // ID of the related entity
  metadata: jsonb("metadata"), // Additional context, request details
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertEnterpriseSchema = createInsertSchema(enterprises).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPersonSchema = createInsertSchema(people).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOpportunitySchema = createInsertSchema(opportunities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCopilotContextSchema = createInsertSchema(copilotContext).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBusinessContextSchema = createInsertSchema(businessContext).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertCustomFieldSchema = createInsertSchema(customFields).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPartnerApplicationSchema = createInsertSchema(partnerApplications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOpportunityTransferSchema = createInsertSchema(opportunityTransfers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiUsageLogSchema = createInsertSchema(aiUsageLogs).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertEnterprise = z.infer<typeof insertEnterpriseSchema>;
export type Enterprise = typeof enterprises.$inferSelect;
export type InsertPerson = z.infer<typeof insertPersonSchema>;
export type Person = typeof people.$inferSelect;
export type InsertOpportunity = z.infer<typeof insertOpportunitySchema>;
export type Opportunity = typeof opportunities.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertCopilotContext = z.infer<typeof insertCopilotContextSchema>;
export type CopilotContext = typeof copilotContext.$inferSelect;
export type InsertBusinessContext = z.infer<typeof insertBusinessContextSchema>;
export type BusinessContext = typeof businessContext.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertCustomField = z.infer<typeof insertCustomFieldSchema>;
export type CustomField = typeof customFields.$inferSelect;
export type InsertPartnerApplication = z.infer<typeof insertPartnerApplicationSchema>;
export type PartnerApplication = typeof partnerApplications.$inferSelect;
export type InsertOpportunityTransfer = z.infer<typeof insertOpportunityTransferSchema>;
export type OpportunityTransfer = typeof opportunityTransfers.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertAiUsageLog = z.infer<typeof insertAiUsageLogSchema>;
export type AiUsageLog = typeof aiUsageLogs.$inferSelect;
