import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  generateLeadScore, 
  generateCopilotSuggestions,
  generateCopilotResponse,
} from "./openai";
import { 
  scrapeUrl, 
  bulkScrapeUrls, 
  importScrapedEnterprises,
  scrapeRegenerativeSources 
} from "./scraperService";
import { 
  insertEnterpriseSchema,
  insertPersonSchema,
  insertOpportunitySchema,
  insertTaskSchema,
  insertCopilotContextSchema,
  insertBusinessContextSchema,
  insertConversationSchema,
  insertChatMessageSchema,
  insertCustomFieldSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch user", error: errorMessage });
    }
  });

  // Public Enterprise Routes (no auth required)
  app.get('/api/enterprises', async (req, res) => {
    try {
      const { category, search, limit = 50, offset = 0 } = req.query;
      const enterprises = await storage.getEnterprises(
        category as string,
        search as string,
        parseInt(limit as string),
        parseInt(offset as string)
      );
      res.json(enterprises);
    } catch (error) {
      console.error("Error fetching enterprises:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch enterprises", error: errorMessage });
    }
  });

  app.get('/api/enterprises/:id', async (req, res) => {
    try {
      const enterprise = await storage.getEnterprise(req.params.id);
      if (!enterprise) {
        return res.status(404).json({ message: "Enterprise not found" });
      }
      res.json(enterprise);
    } catch (error) {
      console.error("Error fetching enterprise:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch enterprise", error: errorMessage });
    }
  });

  // Protected CRM Routes
  app.get('/api/crm/stats', isAuthenticated, async (req, res) => {
    try {
      const [enterpriseStats, peopleStats, opportunityStats, taskStats] = await Promise.all([
        storage.getEnterpriseStats(),
        storage.getPeopleStats(),
        storage.getOpportunityStats(),
        storage.getTaskStats(),
      ]);

      res.json({
        enterprises: enterpriseStats,
        people: peopleStats,
        opportunities: opportunityStats,
        tasks: taskStats,
      });
    } catch (error) {
      console.error("Error fetching CRM stats:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch CRM stats", error: errorMessage });
    }
  });

  // Enterprise management
  app.post('/api/crm/enterprises', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertEnterpriseSchema.parse(req.body);
      const enterprise = await storage.createEnterprise(validatedData);
      res.status(201).json(enterprise);
    } catch (error) {
      console.error("Error creating enterprise:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ message: "Failed to create enterprise", error: errorMessage });
    }
  });

  app.put('/api/crm/enterprises/:id', isAuthenticated, async (req, res) => {
    try {
      const enterprise = await storage.updateEnterprise(req.params.id, req.body);
      res.json(enterprise);
    } catch (error) {
      console.error("Error updating enterprise:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ message: "Failed to update enterprise", error: errorMessage });
    }
  });

  app.delete('/api/crm/enterprises/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteEnterprise(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting enterprise:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to delete enterprise", error: errorMessage });
    }
  });

  // People management
  app.get('/api/crm/people', isAuthenticated, async (req, res) => {
    try {
      const { search, limit = 50, offset = 0 } = req.query;
      const people = await storage.getPeople(
        search as string,
        parseInt(limit as string),
        parseInt(offset as string)
      );
      res.json(people);
    } catch (error) {
      console.error("Error fetching people:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch people", error: errorMessage });
    }
  });

  app.post('/api/crm/people', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertPersonSchema.parse(req.body);
      const person = await storage.createPerson(validatedData);
      res.status(201).json(person);
    } catch (error) {
      console.error("Error creating person:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ message: "Failed to create person", error: errorMessage });
    }
  });

  app.put('/api/crm/people/:id', isAuthenticated, async (req, res) => {
    try {
      const person = await storage.updatePerson(req.params.id, req.body);
      res.json(person);
    } catch (error) {
      console.error("Error updating person:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ message: "Failed to update person", error: errorMessage });
    }
  });

  app.delete('/api/crm/people/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deletePerson(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting person:", error);
      res.status(500).json({ message: "Failed to delete person" });
    }
  });

  // Opportunities management
  app.get('/api/crm/opportunities', isAuthenticated, async (req, res) => {
    try {
      const { search, limit = 50, offset = 0 } = req.query;
      const opportunities = await storage.getOpportunities(
        search as string,
        parseInt(limit as string),
        parseInt(offset as string)
      );
      res.json(opportunities);
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      res.status(500).json({ message: "Failed to fetch opportunities" });
    }
  });

  app.post('/api/crm/opportunities', isAuthenticated, async (req, res) => {
    try {
      // Transform date string to Date object if present
      const body = { ...req.body };
      if (body.expectedCloseDate && typeof body.expectedCloseDate === 'string') {
        body.expectedCloseDate = new Date(body.expectedCloseDate);
      }
      
      const validatedData = insertOpportunitySchema.parse(body);
      const opportunity = await storage.createOpportunity(validatedData);
      res.status(201).json(opportunity);
    } catch (error) {
      console.error("Error creating opportunity:", error);
      res.status(400).json({ message: "Failed to create opportunity", error: error.message });
    }
  });

  app.put('/api/crm/opportunities/:id', isAuthenticated, async (req, res) => {
    try {
      // Transform date string to Date object if present
      const body = { ...req.body };
      if (body.expectedCloseDate && typeof body.expectedCloseDate === 'string') {
        body.expectedCloseDate = new Date(body.expectedCloseDate);
      }
      
      const opportunity = await storage.updateOpportunity(req.params.id, body);
      res.json(opportunity);
    } catch (error) {
      console.error("Error updating opportunity:", error);
      res.status(400).json({ message: "Failed to update opportunity", error: error.message });
    }
  });

  app.delete('/api/crm/opportunities/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteOpportunity(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting opportunity:", error);
      res.status(500).json({ message: "Failed to delete opportunity" });
    }
  });

  // Tasks management
  app.get('/api/crm/tasks', isAuthenticated, async (req, res) => {
    try {
      const { search, limit = 50, offset = 0 } = req.query;
      const tasks = await storage.getTasks(
        search as string,
        parseInt(limit as string),
        parseInt(offset as string)
      );
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post('/api/crm/tasks', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(400).json({ message: "Failed to create task", error: error.message });
    }
  });

  app.put('/api/crm/tasks/:id', isAuthenticated, async (req, res) => {
    try {
      const task = await storage.updateTask(req.params.id, req.body);
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(400).json({ message: "Failed to update task", error: error.message });
    }
  });

  app.delete('/api/crm/tasks/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteTask(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // AI Copilot routes
  app.post('/api/crm/ai/lead-score', isAuthenticated, async (req, res) => {
    try {
      const { enterpriseId, personId } = req.body;
      
      const enterprise = await storage.getEnterprise(enterpriseId);
      const person = personId ? await storage.getPerson(personId) : null;
      
      if (!enterprise) {
        return res.status(404).json({ message: "Enterprise not found" });
      }

      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const context = await storage.getCopilotContext(userId);
      
      const leadScore = await generateLeadScore(enterprise, person, context);
      
      // Update opportunity with AI score if it exists
      if (req.body.opportunityId) {
        await storage.updateOpportunity(req.body.opportunityId, {
          aiScore: leadScore.score,
          aiInsights: leadScore.insights,
        });
      }
      
      res.json(leadScore);
    } catch (error) {
      console.error("Error generating lead score:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to generate lead score", error: errorMessage });
    }
  });

  app.get('/api/crm/ai/suggestions', isAuthenticated, async (req, res) => {
    try {
      // Get recent activity and stats for context
      const [recentEnterprises, recentOpportunities, stats] = await Promise.all([
        storage.getEnterprises(undefined, undefined, 10, 0),
        storage.getOpportunities(undefined, 10, 0),
        storage.getEnterpriseStats(),
      ]);

      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const context = await storage.getCopilotContext(userId);

      const recentActivity = [
        ...recentEnterprises.map(e => ({ type: 'enterprise', data: e })),
        ...recentOpportunities.map(o => ({ type: 'opportunity', data: o })),
      ];

      const suggestions = await generateCopilotSuggestions(recentActivity, stats, context);
      res.json(suggestions);
    } catch (error) {
      console.error("Error generating suggestions:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to generate suggestions", error: errorMessage });
    }
  });

  app.get('/api/crm/ai/context', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const context = await storage.getCopilotContext(userId);
      res.json(context || { focusAreas: [], leadScoringCriteria: {}, automationRules: {} });
    } catch (error) {
      console.error("Error fetching copilot context:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch copilot context", error: errorMessage });
    }
  });

  app.post('/api/crm/ai/context', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const validatedData = insertCopilotContextSchema.parse({
        ...req.body,
        userId,
      });
      
      const context = await storage.upsertCopilotContext(validatedData);
      res.json(context);
    } catch (error) {
      console.error("Error updating copilot context:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ message: "Failed to update copilot context", error: errorMessage });
    }
  });

  // Business context routes
  app.get('/api/crm/ai/business-context', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const context = await storage.getBusinessContext(userId);
      res.json(context || { companyName: '', website: '', description: '', awards: '', outreachGoal: '', customerProfiles: [], guidanceRules: [] });
    } catch (error) {
      console.error("Error fetching business context:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch business context", error: errorMessage });
    }
  });

  app.post('/api/crm/ai/business-context', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const validatedData = insertBusinessContextSchema.parse({
        ...req.body,
        userId,
      });
      
      const context = await storage.upsertBusinessContext(validatedData);
      res.json(context);
    } catch (error) {
      console.error("Error updating business context:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ message: "Failed to update business context", error: errorMessage });
    }
  });

  // Chat conversation routes
  app.get('/api/crm/ai/conversations', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { limit = 50, offset = 0 } = req.query;
      const conversations = await storage.getConversations(
        userId,
        parseInt(limit as string),
        parseInt(offset as string)
      );
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch conversations", error: errorMessage });
    }
  });

  app.post('/api/crm/ai/conversations', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const validatedData = insertConversationSchema.parse({
        ...req.body,
        userId,
      });
      
      const conversation = await storage.createConversation(validatedData);
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ message: "Failed to create conversation", error: errorMessage });
    }
  });

  app.get('/api/crm/ai/conversations/:id/messages', isAuthenticated, async (req, res) => {
    try {
      const { limit = 100, offset = 0 } = req.query;
      const messages = await storage.getChatMessages(
        req.params.id,
        parseInt(limit as string),
        parseInt(offset as string)
      );
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch messages", error: errorMessage });
    }
  });

  app.post('/api/crm/ai/chat', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { message, conversationId } = req.body;
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      let conversation;
      let messages: any[] = [];

      // If conversationId provided, get existing conversation and messages
      if (conversationId) {
        conversation = await storage.getConversation(conversationId);
        if (!conversation) {
          return res.status(404).json({ message: "Conversation not found" });
        }
        messages = await storage.getChatMessages(conversationId);
      } else {
        // Create new conversation
        conversation = await storage.createConversation({
          userId,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        });
      }

      // Save user message
      const userMessage = await storage.createChatMessage({
        conversationId: conversation.id,
        role: 'user',
        content: message,
      });

      // Get business context for AI
      const businessContext = await storage.getBusinessContext(userId);
      const copilotContext = await storage.getCopilotContext(userId);

      // Generate AI response using OpenAI
      const aiResponse = await generateCopilotResponse(
        message,
        messages,
        businessContext,
        copilotContext
      );

      // Save AI response
      const assistantMessage = await storage.createChatMessage({
        conversationId: conversation.id,
        role: 'assistant',
        content: aiResponse,
      });

      res.json({
        conversation,
        userMessage,
        assistantMessage,
        response: aiResponse,
      });
    } catch (error) {
      console.error("Error in chat:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to process chat", error: errorMessage });
    }
  });

  // Schema information routes
  app.get('/api/crm/schema', isAuthenticated, async (req, res) => {
    try {
      // Define schema information for all entities
      const schemaInfo = {
        enterprises: {
          name: "Enterprises",
          description: "Companies and organizations in your network",
          category: "Core CRM",
          status: "Standard",
          fields: [
            { name: "id", type: "varchar", isPrimary: true, isRequired: true, description: "Unique identifier" },
            { name: "name", type: "varchar", isPrimary: false, isRequired: true, description: "Enterprise name" },
            { name: "description", type: "text", isPrimary: false, isRequired: false, description: "Enterprise description" },
            { name: "category", type: "enum", isPrimary: false, isRequired: true, description: "Enterprise category", enumValues: ["land_projects", "capital_sources", "open_source_tools", "network_organizers"] },
            { name: "location", type: "varchar", isPrimary: false, isRequired: false, description: "Geographic location" },
            { name: "website", type: "varchar", isPrimary: false, isRequired: false, description: "Website URL" },
            { name: "imageUrl", type: "varchar", isPrimary: false, isRequired: false, description: "Logo image URL" },
            { name: "isVerified", type: "boolean", isPrimary: false, isRequired: false, description: "Verification status" },
            { name: "followerCount", type: "integer", isPrimary: false, isRequired: false, description: "Number of followers" },
            { name: "tags", type: "text[]", isPrimary: false, isRequired: false, description: "Associated tags" },
            { name: "contactEmail", type: "varchar", isPrimary: false, isRequired: false, description: "Contact email address" },
            { name: "sourceUrl", type: "varchar", isPrimary: false, isRequired: false, description: "Original source URL" },
            { name: "createdAt", type: "timestamp", isPrimary: false, isRequired: false, description: "Creation timestamp" },
            { name: "updatedAt", type: "timestamp", isPrimary: false, isRequired: false, description: "Last update timestamp" }
          ],
          relationships: [
            { type: "hasMany", target: "people", foreignKey: "enterpriseId", description: "People associated with this enterprise" },
            { type: "hasMany", target: "opportunities", foreignKey: "enterpriseId", description: "Opportunities for this enterprise" },
            { type: "hasMany", target: "tasks", foreignKey: "relatedEnterpriseId", description: "Tasks related to this enterprise" }
          ]
        },
        people: {
          name: "People",
          description: "Contacts and individuals",
          category: "Core CRM",
          status: "Standard",
          fields: [
            { name: "id", type: "varchar", isPrimary: true, isRequired: true, description: "Unique identifier" },
            { name: "firstName", type: "varchar", isPrimary: false, isRequired: true, description: "First name" },
            { name: "lastName", type: "varchar", isPrimary: false, isRequired: true, description: "Last name" },
            { name: "email", type: "varchar", isPrimary: false, isRequired: false, description: "Email address", isUnique: true },
            { name: "phone", type: "varchar", isPrimary: false, isRequired: false, description: "Phone number" },
            { name: "title", type: "varchar", isPrimary: false, isRequired: false, description: "Job title" },
            { name: "enterpriseId", type: "varchar", isPrimary: false, isRequired: false, description: "Associated enterprise ID", references: "enterprises.id" },
            { name: "linkedinUrl", type: "varchar", isPrimary: false, isRequired: false, description: "LinkedIn profile URL" },
            { name: "notes", type: "text", isPrimary: false, isRequired: false, description: "Additional notes" },
            { name: "invitationStatus", type: "enum", isPrimary: false, isRequired: false, description: "Invitation status", enumValues: ["not_invited", "invited", "signed_up", "active"] },
            { name: "claimStatus", type: "enum", isPrimary: false, isRequired: false, description: "Claim status", enumValues: ["unclaimed", "claimed", "verified"] },
            { name: "buildProStatus", type: "enum", isPrimary: false, isRequired: false, description: "Build Pro subscription status", enumValues: ["not_offered", "offered", "trial", "subscribed", "cancelled"] },
            { name: "supportStatus", type: "enum", isPrimary: false, isRequired: false, description: "Support inquiry status", enumValues: ["no_inquiry", "inquiry_sent", "in_progress", "resolved"] },
            { name: "lastContactedAt", type: "timestamp", isPrimary: false, isRequired: false, description: "Last contact timestamp" }
          ],
          relationships: [
            { type: "belongsTo", target: "enterprises", foreignKey: "enterpriseId", description: "Associated enterprise" },
            { type: "hasMany", target: "opportunities", foreignKey: "primaryContactId", description: "Opportunities where this person is primary contact" },
            { type: "hasMany", target: "tasks", foreignKey: "relatedPersonId", description: "Tasks related to this person" }
          ]
        },
        opportunities: {
          name: "Opportunities",
          description: "Sales opportunities and deals",
          category: "Core CRM", 
          status: "Standard",
          fields: [
            { name: "id", type: "varchar", isPrimary: true, isRequired: true, description: "Unique identifier" },
            { name: "title", type: "varchar", isPrimary: false, isRequired: true, description: "Opportunity title" },
            { name: "description", type: "text", isPrimary: false, isRequired: false, description: "Opportunity description" },
            { name: "value", type: "integer", isPrimary: false, isRequired: false, description: "Value in cents" },
            { name: "status", type: "enum", isPrimary: false, isRequired: false, description: "Opportunity status", enumValues: ["lead", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"] },
            { name: "probability", type: "integer", isPrimary: false, isRequired: false, description: "Success probability (0-100)" },
            { name: "enterpriseId", type: "varchar", isPrimary: false, isRequired: false, description: "Associated enterprise ID", references: "enterprises.id" },
            { name: "primaryContactId", type: "varchar", isPrimary: false, isRequired: false, description: "Primary contact person ID", references: "people.id" },
            { name: "expectedCloseDate", type: "timestamp", isPrimary: false, isRequired: false, description: "Expected close date" },
            { name: "notes", type: "text", isPrimary: false, isRequired: false, description: "Additional notes" },
            { name: "aiScore", type: "integer", isPrimary: false, isRequired: false, description: "AI-generated lead score (0-100)" },
            { name: "aiInsights", type: "text", isPrimary: false, isRequired: false, description: "AI-generated insights" }
          ],
          relationships: [
            { type: "belongsTo", target: "enterprises", foreignKey: "enterpriseId", description: "Associated enterprise" },
            { type: "belongsTo", target: "people", foreignKey: "primaryContactId", description: "Primary contact person" },
            { type: "hasMany", target: "tasks", foreignKey: "relatedOpportunityId", description: "Tasks related to this opportunity" }
          ]
        },
        tasks: {
          name: "Tasks",
          description: "Action items and to-dos",
          category: "System",
          status: "Standard",
          fields: [
            { name: "id", type: "varchar", isPrimary: true, isRequired: true, description: "Unique identifier" },
            { name: "title", type: "varchar", isPrimary: false, isRequired: true, description: "Task title" },
            { name: "description", type: "text", isPrimary: false, isRequired: false, description: "Task description" },
            { name: "priority", type: "enum", isPrimary: false, isRequired: false, description: "Task priority", enumValues: ["low", "medium", "high", "urgent"] },
            { name: "status", type: "enum", isPrimary: false, isRequired: false, description: "Task status", enumValues: ["pending", "in_progress", "completed", "cancelled"] },
            { name: "dueDate", type: "timestamp", isPrimary: false, isRequired: false, description: "Due date" },
            { name: "assignedToId", type: "varchar", isPrimary: false, isRequired: false, description: "Assigned user ID", references: "users.id" },
            { name: "relatedEnterpriseId", type: "varchar", isPrimary: false, isRequired: false, description: "Related enterprise ID", references: "enterprises.id" },
            { name: "relatedPersonId", type: "varchar", isPrimary: false, isRequired: false, description: "Related person ID", references: "people.id" },
            { name: "relatedOpportunityId", type: "varchar", isPrimary: false, isRequired: false, description: "Related opportunity ID", references: "opportunities.id" }
          ],
          relationships: [
            { type: "belongsTo", target: "users", foreignKey: "assignedToId", description: "Assigned user" },
            { type: "belongsTo", target: "enterprises", foreignKey: "relatedEnterpriseId", description: "Related enterprise" },
            { type: "belongsTo", target: "people", foreignKey: "relatedPersonId", description: "Related person" },
            { type: "belongsTo", target: "opportunities", foreignKey: "relatedOpportunityId", description: "Related opportunity" }
          ]
        },
        users: {
          name: "Users",
          description: "System users and authentication",
          category: "System",
          status: "Standard", 
          fields: [
            { name: "id", type: "varchar", isPrimary: true, isRequired: true, description: "Unique identifier" },
            { name: "email", type: "varchar", isPrimary: false, isRequired: false, description: "Email address", isUnique: true },
            { name: "firstName", type: "varchar", isPrimary: false, isRequired: false, description: "First name" },
            { name: "lastName", type: "varchar", isPrimary: false, isRequired: false, description: "Last name" },
            { name: "profileImageUrl", type: "varchar", isPrimary: false, isRequired: false, description: "Profile image URL" },
            { name: "createdAt", type: "timestamp", isPrimary: false, isRequired: false, description: "Creation timestamp" },
            { name: "updatedAt", type: "timestamp", isPrimary: false, isRequired: false, description: "Last update timestamp" }
          ],
          relationships: [
            { type: "hasMany", target: "tasks", foreignKey: "assignedToId", description: "Assigned tasks" },
            { type: "hasMany", target: "copilotContext", foreignKey: "userId", description: "Copilot context settings" },
            { type: "hasMany", target: "businessContext", foreignKey: "userId", description: "Business context settings" },
            { type: "hasMany", target: "conversations", foreignKey: "userId", description: "Chat conversations" }
          ]
        }
      };

      // Get custom fields for each entity and merge them with standard fields
      const entities = Object.keys(schemaInfo);
      for (const entityName of entities) {
        const customFields = await storage.getCustomFields(entityName);
        
        // Convert custom fields to the same format as standard fields
        const customFieldsFormatted = customFields.map(field => ({
          name: field.fieldName,
          type: field.fieldType,
          isPrimary: false,
          isRequired: field.isRequired || false,
          isUnique: field.isUnique || false,
          description: field.description || `Custom ${field.fieldType} field`,
          enumValues: field.enumValues || undefined,
          isCustom: true, // Mark as custom field for frontend identification
        }));
        
        // Add custom fields to the entity's fields array
        schemaInfo[entityName].fields.push(...customFieldsFormatted);
      }

      res.json(schemaInfo);
    } catch (error) {
      console.error("Error fetching schema info:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch schema info", error: errorMessage });
    }
  });

  // Custom fields management
  app.post('/api/crm/schema/entities/:entityName/fields', isAuthenticated, async (req, res) => {
    try {
      const { entityName } = req.params;
      
      // Validate entity name exists in our schema
      const validEntities = ['enterprises', 'people', 'opportunities', 'tasks', 'users'];
      if (!validEntities.includes(entityName)) {
        return res.status(400).json({ message: "Invalid entity name" });
      }

      const validatedData = insertCustomFieldSchema.parse({
        ...req.body,
        entityName,
      });

      const customField = await storage.createCustomField(validatedData);
      res.status(201).json(customField);
    } catch (error) {
      console.error("Error creating custom field:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ message: "Failed to create custom field", error: errorMessage });
    }
  });

  // Bulk import routes
  app.post('/api/crm/bulk-import/urls', isAuthenticated, async (req, res) => {
    try {
      const { urls } = req.body;
      
      if (!Array.isArray(urls) || urls.length === 0) {
        return res.status(400).json({ message: "URLs array is required" });
      }

      // Start async processing
      const scrapingResults = await bulkScrapeUrls(urls);
      const importResults = await importScrapedEnterprises(scrapingResults);
      
      res.json({
        processed: urls.length,
        ...importResults,
        details: scrapingResults,
      });
    } catch (error) {
      console.error("Error bulk importing URLs:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to bulk import URLs", error: errorMessage });
    }
  });

  app.post('/api/crm/bulk-import/regenerative-sources', isAuthenticated, async (req, res) => {
    try {
      // Discover URLs from regenerative sources
      const sourceUrls = await scrapeRegenerativeSources();
      
      if (sourceUrls.length === 0) {
        return res.json({ 
          message: "No enterprise URLs found in regenerative sources",
          processed: 0,
          imported: 0,
          failed: 0,
          errors: []
        });
      }

      // Limit to first 50 URLs to avoid overwhelming the system
      const limitedUrls = sourceUrls.slice(0, 50);
      
      const scrapingResults = await bulkScrapeUrls(limitedUrls);
      const importResults = await importScrapedEnterprises(scrapingResults);
      
      res.json({
        message: `Processed ${limitedUrls.length} URLs from regenerative sources`,
        sourceUrlsFound: sourceUrls.length,
        processed: limitedUrls.length,
        ...importResults,
      });
    } catch (error) {
      console.error("Error importing from regenerative sources:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to import from regenerative sources", error: errorMessage });
    }
  });

  app.post('/api/crm/scrape-url', isAuthenticated, async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ message: "URL is required" });
      }

      const result = await scrapeUrl(url);
      res.json(result);
    } catch (error) {
      console.error("Error scraping URL:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to scrape URL", error: errorMessage });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
