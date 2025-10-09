import express, { type Express, type RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { eq, desc, and, count, sql, or, like } from "drizzle-orm";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { requireEnterpriseRole } from "./middleware/auth";
import { 
  generateLeadScore, 
  generateCopilotSuggestions,
  generateCopilotResponse,
} from "./openai";
import { InsufficientCreditsError } from "./ai-billing";
import { 
  scrapeUrl, 
  bulkScrapeUrls, 
  importScrapedEnterprises,
  scrapeRegenerativeSources 
} from "./scraperService";
import { 
  startBulkSeeding, 
  getJobStatus, 
  discoverEnterprises 
} from "./seedingOrchestrator";
import { generateMurmurationsProfile } from "./murmurations";
import { 
  startBatchInvitations, 
  getInvitationJobStatus 
} from "./invitationBatch";
import { createAuditLog } from "./utils/audit";
import { integrationService } from "./services/integrations";
import { aiAgent } from "./services/ai-agent";
import { 
  insertEnterpriseSchema,
  editorEnterpriseUpdateSchema,
  adminEnterpriseUpdateSchema,
  ownerEnterpriseUpdateSchema,
  insertCrmWorkspaceEnterpriseSchema,
  insertCrmWorkspacePersonSchema,
  insertCrmWorkspaceOpportunitySchema,
  insertCrmWorkspaceTaskSchema,
  insertCrmWorkspaceEnterpriseNoteSchema,
  insertCrmWorkspaceEnterprisePersonSchema,
  insertCopilotContextSchema,
  insertBusinessContextSchema,
  insertConversationSchema,
  insertChatMessageSchema,
  insertCustomFieldSchema,
  insertPartnerApplicationSchema,
  insertSubscriptionPlanSchema,
  insertSubscriptionSchema,
  insertAiUsageLogSchema,
  insertUserFavoriteSchema,
  insertProfileClaimSchema,
  insertEarthCarePledgeSchema,
  insertIntegrationConfigSchema,
  crmWorkspaceOpportunities,
  crmWorkspacePeople,
  enterprises,
  enterpriseOwners,
  users
} from "@shared/schema";
import {
  listTables,
  getTableSchema,
  getTableData,
  createTableRecord,
  updateTableRecord,
  deleteTableRecord,
  bulkDeleteTableRecords,
  validateTableName,
} from "./services/database-introspection";
import { parseCSVStream } from "./imports/csvParser";
import { nanoid } from "nanoid";
import Stripe from "stripe";
import { z } from "zod";
import integrationRouters from "./integrations/routers";
import importRouters from "./imports/routers";
import { enterpriseTeamRouter, teamInvitationRouter } from "./teams/routers";
import { getUserEnterpriseRole, type TeamMemberRole } from "./teams/authorization";
import "./types";

// Initialize Stripe (will be used when API keys are available)
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-08-27.basil",
  });
}

// Role-based authorization middleware
function requireRole(roles: Array<'free' | 'crm_pro' | 'admin'>): RequestHandler {
  return async (req: any, res, next) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.role) {
        return res.status(401).json({ error: "User not found" });
      }

      if (!roles.includes(user.role)) {
        return res.status(403).json({ error: "Forbidden - insufficient permissions" });
      }

      next();
    } catch (error) {
      console.error("Error checking user role:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

// Subscription-based authorization middleware
function requireSubscription(planType: 'crm_basic' | 'crm_pro' | 'build_pro_bundle'): RequestHandler {
  return async (req: any, res, next) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      // Allow platform admins to bypass subscription checks
      if (user.role === 'admin') {
        return next();
      }

      const planHierarchy: Record<string, number> = {
        'free': 0,
        'crm_basic': 1,
        'crm_pro': 2,
        'build_pro_bundle': 3
      };

      const userPlanLevel = planHierarchy[user.currentPlanType || 'free'] || 0;
      const requiredPlanLevel = planHierarchy[planType];

      if (userPlanLevel < requiredPlanLevel) {
        return res.status(403).json({ 
          error: "Subscription required", 
          message: `This feature requires a ${planType} subscription or higher`,
          requiredPlan: planType,
          currentPlan: user.currentPlanType || 'free'
        });
      }

      next();
    } catch (error) {
      console.error("Error checking subscription:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

// Middleware to check if user is platform admin
const requireAdmin: RequestHandler = async (req: any, res, next) => {
  try {
    const userId = (req.user as any)?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const user = await storage.getUser(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    console.error("Error checking admin role:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
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

  // Get contacts for a specific enterprise (deprecated - workspace-scoped contacts only)
  app.get('/api/enterprises/:id/contacts', async (req, res) => {
    res.json([]);
  });

  // Public endpoint to check if enterprise is claimed
  app.get('/api/enterprises/:id/claim-status', async (req, res) => {
    try {
      const { id } = req.params;
      
      const hasOwner = await storage.hasEnterpriseOwner(id);
      
      res.json({ 
        isClaimed: hasOwner,
        canClaim: !hasOwner 
      });
    } catch (error) {
      console.error("Error checking claim status:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to check claim status", error: errorMessage });
    }
  });

  // Direct claim endpoint (no token required) - authenticated members can claim unclaimed enterprises
  app.post('/api/enterprises/:id/claim-direct', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id: enterpriseId } = req.params;
      
      // Get enterprise details
      const enterprise = await storage.getEnterprise(enterpriseId);
      if (!enterprise) {
        return res.status(404).json({ message: "Enterprise not found" });
      }
      
      // Check if enterprise is already claimed
      const hasOwner = await storage.hasEnterpriseOwner(enterpriseId);
      if (hasOwner) {
        return res.status(400).json({ message: "This enterprise is already claimed" });
      }

      // Get user details
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // SECURITY: Only allow claiming if user's email matches enterprise contact email
      // This ensures only legitimate enterprise representatives can claim
      if (!enterprise.contactEmail || enterprise.contactEmail.toLowerCase() !== user.email?.toLowerCase()) {
        return res.status(403).json({ 
          message: "You can only claim enterprises where your email matches the enterprise contact email. Please contact support for assistance.",
          requiresVerification: true
        });
      }

      // Check claim limits based on plan type
      const maxClaims = user.maxClaimedProfiles ?? (user.currentPlanType === 'free' ? 1 : 999);
      const currentClaims = user.claimedProfilesCount ?? 0;

      if (currentClaims >= maxClaims) {
        // Free users get upgrade message
        if (user.currentPlanType === 'free') {
          return res.status(403).json({ 
            message: "You've reached your free plan limit of 1 enterprise claim. Upgrade to CRM Pro for unlimited claims.",
            requiresUpgrade: true 
          });
        } else {
          // Paid users who somehow hit limit
          return res.status(403).json({ 
            message: `You've reached your plan's limit of ${maxClaims} enterprise claims.`,
            requiresUpgrade: false
          });
        }
      }

      try {
        // Add user as owner to enterprise team
        await storage.createTeamMember({
          enterpriseId,
          userId,
          role: 'owner',
          status: 'active',
          invitedAt: new Date(),
          acceptedAt: new Date()
        });
      } catch (memberError) {
        // Check if error is due to duplicate membership
        if (memberError instanceof Error && memberError.message.includes('unique')) {
          return res.status(409).json({ 
            message: "You are already a member of this enterprise team." 
          });
        }
        throw memberError; // Re-throw if it's a different error
      }

      // Increment claimed profiles count (ownership tracked in enterpriseTeamMembers)
      await db.update(users)
        .set({ 
          claimedProfilesCount: (user.claimedProfilesCount || 0) + 1,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      res.json({ 
        success: true,
        message: "Enterprise claimed successfully",
        enterprise 
      });
    } catch (error) {
      console.error("Error claiming enterprise:", error);
      res.status(500).json({ message: "Failed to claim enterprise" });
    }
  });

  // Pledge lifecycle routes
  app.get('/api/enterprises/:id/pledge', async (req, res) => {
    try {
      const pledge = await storage.getPledgeByEnterpriseId(req.params.id);
      res.json({ pledge: pledge || null });
    } catch (error) {
      console.error("Error fetching pledge:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch pledge", error: errorMessage });
    }
  });

  app.post('/api/enterprises/:id/pledge', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const enterpriseId = req.params.id;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const isAdmin = user.role === 'admin';
      const [ownerRecord] = await db
        .select()
        .from(enterpriseOwners)
        .where(
          and(
            eq(enterpriseOwners.enterpriseId, enterpriseId),
            eq(enterpriseOwners.userId, userId)
          )
        )
        .limit(1);
      
      const isOwner = ownerRecord && (ownerRecord.role === 'owner' || ownerRecord.role === 'editor');

      if (!isAdmin && !isOwner) {
        return res.status(403).json({ message: "Forbidden - must be enterprise owner or admin" });
      }

      const existingPledge = await storage.getPledgeByEnterpriseId(enterpriseId);
      if (existingPledge) {
        return res.status(400).json({ message: "Pledge already exists for this enterprise" });
      }

      const pledgeSchema = z.object({
        narrative: z.string().optional()
      });
      const validatedData = pledgeSchema.parse(req.body);

      const pledge = await storage.createPledge({
        enterpriseId,
        status: 'affirmed',
        narrative: validatedData.narrative,
        signedAt: new Date(),
        signedBy: userId,
        revokedAt: null,
        revokedBy: null
      });

      res.status(201).json({ message: "Pledge created successfully", pledge });
    } catch (error) {
      console.error("Error creating pledge:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", error: error.message });
      }
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to create pledge", error: errorMessage });
    }
  });

  app.patch('/api/enterprises/:id/pledge', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const enterpriseId = req.params.id;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const isAdmin = user.role === 'admin';
      const [ownerRecord] = await db
        .select()
        .from(enterpriseOwners)
        .where(
          and(
            eq(enterpriseOwners.enterpriseId, enterpriseId),
            eq(enterpriseOwners.userId, userId)
          )
        )
        .limit(1);
      
      const isOwner = ownerRecord && (ownerRecord.role === 'owner' || ownerRecord.role === 'editor');

      if (!isAdmin && !isOwner) {
        return res.status(403).json({ message: "Forbidden - must be enterprise owner or admin" });
      }

      const existingPledge = await storage.getPledgeByEnterpriseId(enterpriseId);
      if (!existingPledge) {
        return res.status(404).json({ message: "No pledge found for this enterprise" });
      }

      const updateSchema = z.object({
        narrative: z.string().optional()
      });
      const validatedData = updateSchema.parse(req.body);

      const updatedFields: any = {
        narrative: validatedData.narrative,
      };

      const pledge = await storage.updatePledge(existingPledge.id, updatedFields);

      res.json({ message: "Pledge updated successfully", pledge });
    } catch (error) {
      console.error("Error updating pledge:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", error: error.message });
      }
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to update pledge", error: errorMessage });
    }
  });

  app.delete('/api/enterprises/:id/pledge', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const enterpriseId = req.params.id;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const isAdmin = user.role === 'admin';
      const [ownerRecord] = await db
        .select()
        .from(enterpriseOwners)
        .where(
          and(
            eq(enterpriseOwners.enterpriseId, enterpriseId),
            eq(enterpriseOwners.userId, userId)
          )
        )
        .limit(1);
      
      const isOwner = ownerRecord && (ownerRecord.role === 'owner' || ownerRecord.role === 'editor');

      if (!isAdmin && !isOwner) {
        return res.status(403).json({ message: "Forbidden - must be enterprise owner or admin" });
      }

      const existingPledge = await storage.getPledgeByEnterpriseId(enterpriseId);
      if (!existingPledge) {
        return res.status(404).json({ message: "No pledge found for this enterprise" });
      }

      const pledge = await storage.revokePledge(existingPledge.id, userId);

      res.json({ message: "Pledge revoked successfully", pledge });
    } catch (error) {
      console.error("Error revoking pledge:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to revoke pledge", error: errorMessage });
    }
  });

  app.get('/api/my-enterprises', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const memberships = await storage.getUserTeamMemberships(userId);
      
      const result = memberships.map((membership) => ({
        enterprise: membership.enterprise,
        role: membership.role,
        joinedAt: membership.acceptedAt || membership.invitedAt
      }));

      res.json(result);
    } catch (error) {
      console.error("Error fetching user enterprise memberships:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch enterprise memberships", error: errorMessage });
    }
  });

  app.patch('/api/enterprises/:id/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const enterpriseId = req.params.id;

      const enterprise = await storage.getEnterprise(enterpriseId);
      if (!enterprise) {
        return res.status(404).json({ message: "Enterprise not found" });
      }

      const userRole = await getUserEnterpriseRole(userId, enterpriseId);
      if (!userRole) {
        return res.status(403).json({ 
          message: "Forbidden - not a member of this enterprise" 
        });
      }

      if (userRole === 'viewer') {
        return res.status(403).json({ 
          message: "Forbidden - viewers cannot update enterprise profiles" 
        });
      }

      const allowedFields: Record<string, any> = {};
      
      if (userRole === 'editor') {
        const validatedData = editorEnterpriseUpdateSchema.parse(req.body);
        if (validatedData.description !== undefined) allowedFields.description = validatedData.description;
        if (validatedData.contactEmail !== undefined) allowedFields.contactEmail = validatedData.contactEmail;
        if (validatedData.tags !== undefined) allowedFields.tags = validatedData.tags;
      } else if (userRole === 'admin') {
        const validatedData = adminEnterpriseUpdateSchema.parse(req.body);
        if (validatedData.description !== undefined) allowedFields.description = validatedData.description;
        if (validatedData.contactEmail !== undefined) allowedFields.contactEmail = validatedData.contactEmail;
        if (validatedData.tags !== undefined) allowedFields.tags = validatedData.tags;
        if (validatedData.name !== undefined) allowedFields.name = validatedData.name;
        if (validatedData.location !== undefined) allowedFields.location = validatedData.location;
        if (validatedData.category !== undefined) allowedFields.category = validatedData.category;
        if (validatedData.website !== undefined) allowedFields.website = validatedData.website;
        if (validatedData.imageUrl !== undefined) allowedFields.imageUrl = validatedData.imageUrl;
      } else if (userRole === 'owner') {
        const validatedData = ownerEnterpriseUpdateSchema.parse(req.body);
        if (validatedData.description !== undefined) allowedFields.description = validatedData.description;
        if (validatedData.contactEmail !== undefined) allowedFields.contactEmail = validatedData.contactEmail;
        if (validatedData.tags !== undefined) allowedFields.tags = validatedData.tags;
        if (validatedData.name !== undefined) allowedFields.name = validatedData.name;
        if (validatedData.location !== undefined) allowedFields.location = validatedData.location;
        if (validatedData.category !== undefined) allowedFields.category = validatedData.category;
        if (validatedData.website !== undefined) allowedFields.website = validatedData.website;
        if (validatedData.imageUrl !== undefined) allowedFields.imageUrl = validatedData.imageUrl;
      } else {
        return res.status(403).json({ 
          message: "Forbidden - insufficient permissions" 
        });
      }
      
      const updatedEnterprise = await storage.updateEnterprise(enterpriseId, allowedFields);

      res.json(updatedEnterprise);
    } catch (error) {
      console.error("Error updating enterprise:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to update enterprise", error: errorMessage });
    }
  });

  // Global search route (deprecated - use workspace-specific search)
  app.get('/api/search', async (req, res) => {
    res.status(501).json({ 
      message: "Global search has been deprecated. Use workspace-specific search endpoints instead." 
    });
  });

  // Protected CRM Routes
  app.get('/api/crm/:enterpriseId/stats', isAuthenticated, requireEnterpriseRole('viewer'), async (req: any, res) => {
    try {
      const { enterpriseId } = req.params;
      const [enterpriseStats, workspaceStats] = await Promise.all([
        storage.getEnterpriseStats(),
        storage.getWorkspaceStats(enterpriseId),
      ]);

      res.json({
        enterprises: enterpriseStats,
        people: { total: workspaceStats.peopleCount },
        opportunities: { 
          total: workspaceStats.opportunitiesCount,
          totalValue: workspaceStats.totalOpportunityValue 
        },
        tasks: { total: workspaceStats.tasksCount },
      });
    } catch (error) {
      console.error("Error fetching CRM stats:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch CRM stats", error: errorMessage });
    }
  });

  // CRM Enterprise management - Create new enterprise (any authenticated user)
  app.post('/api/crm/enterprises', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const validatedData = insertEnterpriseSchema.parse(req.body);
      
      // Create the enterprise
      const enterprise = await storage.createEnterprise(validatedData);
      
      // Automatically add the user as owner
      await storage.createTeamMember({
        enterpriseId: enterprise.id,
        userId: userId,
        role: 'owner',
        invitedBy: userId,
        invitedAt: new Date(),
        acceptedAt: new Date(),
        status: 'active',
      });
      
      res.status(201).json(enterprise);
    } catch (error) {
      console.error("Error creating enterprise:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put('/api/crm/enterprises/:id', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const validatedData = insertEnterpriseSchema.parse(req.body);
      const enterprise = await storage.updateEnterprise(req.params.id, validatedData);
      res.json(enterprise);
    } catch (error) {
      console.error("Error updating enterprise:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete('/api/crm/enterprises/:id', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      await storage.deleteEnterprise(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting enterprise:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Workspace Enterprise Management (CRM workspace-specific)
  app.post('/api/crm/:enterpriseId/workspace/enterprises', isAuthenticated, requireEnterpriseRole('editor'), async (req: any, res) => {
    try {
      const { enterpriseId } = req.params;
      const userId = (req.user as any)?.claims?.sub;
      const { mode, directoryEnterpriseId, ...enterpriseData } = req.body;

      if (mode === 'link' && directoryEnterpriseId) {
        const workspaceEnterprise = await storage.linkDirectoryEnterprise(
          enterpriseId,
          directoryEnterpriseId,
          userId
        );
        return res.status(201).json(workspaceEnterprise);
      } else if (mode === 'create') {
        const { name, category, description, website, location, contactEmail } = enterpriseData;
        
        const publicEnterprise = await storage.createEnterprise({
          name, 
          category, 
          description, 
          website, 
          location, 
          contactEmail
        });
        
        const workspaceEnterprise = await storage.linkDirectoryEnterprise(
          enterpriseId,
          publicEnterprise.id,
          userId
        );
        return res.status(201).json(workspaceEnterprise);
      } else {
        return res.status(400).json({ error: 'Invalid mode. Must be "link" or "create"' });
      }
    } catch (error) {
      console.error('Error creating workspace enterprise:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      return res.status(500).json({ error: 'Failed to create workspace enterprise' });
    }
  });

  app.get('/api/crm/:enterpriseId/workspace/enterprises', isAuthenticated, requireEnterpriseRole('viewer'), async (req: any, res) => {
    try {
      const { enterpriseId } = req.params;
      const enterprises = await storage.getWorkspaceEnterprises(enterpriseId, {
        includeDeleted: req.query.includeDeleted === 'true'
      });
      res.json(enterprises);
    } catch (error) {
      console.error('Error fetching workspace enterprises:', error);
      return res.status(500).json({ error: 'Failed to fetch workspace enterprises' });
    }
  });

  app.put('/api/crm/:enterpriseId/workspace/enterprises/:id', isAuthenticated, requireEnterpriseRole('editor'), async (req: any, res) => {
    try {
      const { enterpriseId, id } = req.params;
      const validatedData = insertCrmWorkspaceEnterpriseSchema.partial().parse(req.body);
      const workspaceEnterprise = await storage.updateWorkspaceEnterprise(enterpriseId, id, validatedData);
      res.json(workspaceEnterprise);
    } catch (error) {
      console.error('Error updating workspace enterprise:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      return res.status(500).json({ error: 'Failed to update workspace enterprise' });
    }
  });

  app.delete('/api/crm/:enterpriseId/workspace/enterprises/:id', isAuthenticated, requireEnterpriseRole('editor'), async (req: any, res) => {
    try {
      const { enterpriseId, id } = req.params;
      await storage.unlinkWorkspaceEnterprise(enterpriseId, id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting workspace enterprise:', error);
      return res.status(500).json({ error: 'Failed to delete workspace enterprise' });
    }
  });

  // GET /api/crm/:enterpriseId/workspace/enterprises/:id/notes
  app.get("/api/crm/:enterpriseId/workspace/enterprises/:id/notes",
    isAuthenticated,
    requireEnterpriseRole("viewer"),
    async (req: any, res) => {
      try {
        const { enterpriseId, id } = req.params;
        const notes = await storage.getEnterpriseNotes(enterpriseId, id);
        
        // Join with users to get author info
        const notesWithAuthors = await Promise.all(
          notes.map(async (note) => {
            const user = await storage.getUser(note.authorId);
            return {
              ...note,
              author: user ? {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
              } : null,
            };
          })
        );
        
        res.json(notesWithAuthors);
      } catch (error) {
        console.error("Error fetching enterprise notes:", error);
        res.status(500).json({ error: "Failed to fetch notes" });
      }
    }
  );

  // POST /api/crm/:enterpriseId/workspace/enterprises/:id/notes
  app.post("/api/crm/:enterpriseId/workspace/enterprises/:id/notes",
    isAuthenticated,
    requireEnterpriseRole("editor"),
    async (req: any, res) => {
      try {
        const { enterpriseId, id } = req.params;
        const userId = (req.user as any)?.claims?.sub;
        
        const validatedData = insertCrmWorkspaceEnterpriseNoteSchema.parse({
          workspaceEnterpriseId: id,
          authorId: userId,
          body: req.body.body,
        });
        
        const note = await storage.createEnterpriseNote(validatedData);
        
        // Get author info
        const user = await storage.getUser(note.authorId);
        
        res.json({
          ...note,
          author: user ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
          } : null,
        });
      } catch (error) {
        console.error("Error creating enterprise note:", error);
        res.status(500).json({ error: "Failed to create note" });
      }
    }
  );

  // DELETE /api/crm/:enterpriseId/workspace/enterprises/:id/notes/:noteId
  app.delete("/api/crm/:enterpriseId/workspace/enterprises/:id/notes/:noteId",
    isAuthenticated,
    requireEnterpriseRole("editor"),
    async (req: any, res) => {
      try {
        const { enterpriseId, noteId } = req.params;
        const userId = (req.user as any)?.claims?.sub;
        
        // Get note to verify author
        const notes = await storage.getEnterpriseNotes(enterpriseId, req.params.id);
        const note = notes.find(n => n.id === noteId);
        
        if (!note) {
          return res.status(404).json({ error: "Note not found" });
        }
        
        // Get user's role in this workspace
        const userMemberships = await storage.getUserTeamMemberships(userId);
        const userMembership = userMemberships.find(m => m.enterpriseId === enterpriseId);
        
        // Only author can delete, OR admin/owner can delete any note
        const isAuthor = note.authorId === userId;
        const isAdminOrOwner = userMembership?.role === 'admin' || userMembership?.role === 'owner';
        
        if (!isAuthor && !isAdminOrOwner) {
          return res.status(403).json({ error: "Not authorized to delete this note" });
        }
        
        await storage.deleteEnterpriseNote(enterpriseId, noteId);
        res.json({ success: true });
      } catch (error) {
        console.error("Error deleting enterprise note:", error);
        res.status(500).json({ error: "Failed to delete note" });
      }
    }
  );

  // Admin: Featured enterprises management
  app.get('/api/admin/featured-enterprises', isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const enterprises = await storage.getFeaturedEnterprises();
      res.json(enterprises);
    } catch (error) {
      console.error("Error fetching featured enterprises:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to fetch featured enterprises", message: errorMessage });
    }
  });

  app.post('/api/admin/featured-enterprises/:id/feature', isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const enterpriseId = req.params.id;
      const enterprise = await storage.getEnterprise(enterpriseId);
      
      if (!enterprise) {
        return res.status(404).json({ error: "Enterprise not found" });
      }

      const oldState = {
        isFeatured: enterprise.isFeatured,
        featuredOrder: enterprise.featuredOrder,
        featuredAt: enterprise.featuredAt
      };

      const updatedEnterprise = await storage.featureEnterprise(enterpriseId);

      const newState = {
        isFeatured: updatedEnterprise.isFeatured,
        featuredOrder: updatedEnterprise.featuredOrder,
        featuredAt: updatedEnterprise.featuredAt
      };

      await createAuditLog(req, {
        userId,
        actionType: 'feature',
        tableName: 'enterprises',
        recordId: enterpriseId,
        enterpriseId,
        changes: {
          before: oldState,
          after: newState
        },
        metadata: {
          enterpriseName: enterprise.name,
          action: 'feature_enterprise'
        }
      });

      res.json(updatedEnterprise);
    } catch (error) {
      console.error("Error featuring enterprise:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      const userId = (req.user as any)?.claims?.sub;
      if (userId) {
        await createAuditLog(req, {
          userId,
          actionType: 'feature',
          tableName: 'enterprises',
          recordId: req.params.id,
          success: false,
          errorMessage: errorMessage
        });
      }
      
      res.status(500).json({ error: "Failed to feature enterprise", message: errorMessage });
    }
  });

  app.delete('/api/admin/featured-enterprises/:id/unfeature', isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const enterpriseId = req.params.id;
      const enterprise = await storage.getEnterprise(enterpriseId);
      
      if (!enterprise) {
        return res.status(404).json({ error: "Enterprise not found" });
      }

      const oldState = {
        isFeatured: enterprise.isFeatured,
        featuredOrder: enterprise.featuredOrder,
        featuredAt: enterprise.featuredAt
      };

      const updatedEnterprise = await storage.unfeatureEnterprise(enterpriseId);

      const newState = {
        isFeatured: updatedEnterprise.isFeatured,
        featuredOrder: updatedEnterprise.featuredOrder,
        featuredAt: updatedEnterprise.featuredAt
      };

      await createAuditLog(req, {
        userId,
        actionType: 'unfeature',
        tableName: 'enterprises',
        recordId: enterpriseId,
        enterpriseId,
        changes: {
          before: oldState,
          after: newState
        },
        metadata: {
          enterpriseName: enterprise.name,
          action: 'unfeature_enterprise'
        }
      });

      res.json(updatedEnterprise);
    } catch (error) {
      console.error("Error unfeaturing enterprise:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      const userId = (req.user as any)?.claims?.sub;
      if (userId) {
        await createAuditLog(req, {
          userId,
          actionType: 'unfeature',
          tableName: 'enterprises',
          recordId: req.params.id,
          success: false,
          errorMessage: errorMessage
        });
      }
      
      res.status(500).json({ error: "Failed to unfeature enterprise", message: errorMessage });
    }
  });

  app.patch('/api/admin/featured-enterprises/reorder', isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const reorderSchema = z.object({
        items: z.array(z.object({
          id: z.string(),
          featuredOrder: z.number().int().min(1)
        }))
      });

      const validatedData = reorderSchema.parse(req.body);

      await storage.reorderFeaturedEnterprises(validatedData.items);

      await createAuditLog(req, {
        userId,
        actionType: 'bulk_operation',
        tableName: 'enterprises',
        changes: {
          reorderData: validatedData.items
        },
        metadata: {
          action: 'reorder_featured_enterprises',
          itemCount: validatedData.items.length
        }
      });

      res.json({ success: true, message: "Featured enterprises reordered successfully" });
    } catch (error) {
      console.error("Error reordering featured enterprises:", error);
      let errorMessage = "Unknown error";
      let statusCode = 500;
      
      if (error instanceof z.ZodError) {
        errorMessage = error.message;
        statusCode = 400;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      const userId = (req.user as any)?.claims?.sub;
      if (userId) {
        await createAuditLog(req, {
          userId,
          actionType: 'bulk_operation',
          tableName: 'enterprises',
          success: false,
          errorMessage: errorMessage
        });
      }
      
      res.status(statusCode).json({ error: "Failed to reorder featured enterprises", message: errorMessage });
    }
  });

  // User favorites operations (member-only)
  app.get('/api/favorites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { limit = 50, offset = 0 } = req.query;
      const favorites = await storage.getUserFavorites(
        userId,
        parseInt(limit as string),
        parseInt(offset as string)
      );
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching user favorites:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch favorites", error: errorMessage });
    }
  });

  app.post('/api/favorites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const validatedData = insertUserFavoriteSchema.parse({
        ...req.body,
        userId
      });
      
      const favorite = await storage.addUserFavorite(
        userId,
        validatedData.enterpriseId,
        validatedData.notes || undefined
      );
      res.status(201).json(favorite);
    } catch (error) {
      console.error("Error adding favorite:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ message: "Failed to add favorite", error: errorMessage });
    }
  });

  app.delete('/api/favorites/:enterpriseId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      await storage.removeUserFavorite(userId, req.params.enterpriseId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing favorite:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ message: "Failed to remove favorite", error: errorMessage });
    }
  });

  app.get('/api/enterprises/:id/favorite-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const isFavorited = await storage.isEnterpriseFavorited(userId, req.params.id);
      res.json({ isFavorited });
    } catch (error) {
      console.error("Error checking favorite status:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to check favorite status", error: errorMessage });
    }
  });

  app.get('/api/favorites/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const [count, byCategory] = await Promise.all([
        storage.getUserFavoritesCount(userId),
        storage.getFavoritesByCategory(userId)
      ]);

      res.json({
        total: count,
        byCategory
      });
    } catch (error) {
      console.error("Error fetching favorites stats:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch favorites stats", error: errorMessage });
    }
  });

  // CRM User Enterprises - Get list of enterprises user has access to
  app.get('/api/crm/user/enterprises', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get user's team memberships with enterprise details
      const memberships = await storage.getUserTeamMemberships(userId, 100, 0);
      
      // Transform to frontend-friendly format
      const userEnterprises = memberships.map(membership => ({
        id: membership.enterprise.id,
        name: membership.enterprise.name,
        category: membership.enterprise.category,
        isVerified: membership.enterprise.isVerified,
        imageUrl: membership.enterprise.imageUrl,
        role: membership.role,
      }));

      res.json(userEnterprises);
    } catch (error) {
      console.error("Error fetching user enterprises:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch user enterprises", error: errorMessage });
    }
  });

  // People management
  app.get('/api/crm/:enterpriseId/people', isAuthenticated, requireEnterpriseRole('viewer'), async (req: any, res) => {
    try {
      const { enterpriseId } = req.params;
      const { search, limit = 50, offset = 0 } = req.query;
      const people = await storage.getWorkspacePeople(
        enterpriseId,
        {
          search: search as string,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        }
      );
      res.json(people);
    } catch (error) {
      console.error("Error fetching people:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch people", error: errorMessage });
    }
  });

  app.post('/api/crm/:enterpriseId/people', isAuthenticated, requireEnterpriseRole('editor'), async (req: any, res) => {
    try {
      const { enterpriseId } = req.params;
      const validatedData = insertCrmWorkspacePersonSchema.parse({ ...req.body, workspaceId: enterpriseId });
      const person = await storage.createWorkspacePerson(validatedData);
      res.status(201).json(person);
    } catch (error) {
      console.error("Error creating person:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ message: "Failed to create person", error: errorMessage });
    }
  });

  app.put('/api/crm/:enterpriseId/people/:id', isAuthenticated, requireEnterpriseRole('editor'), async (req: any, res) => {
    try {
      const { enterpriseId, id } = req.params;
      const person = await storage.updateWorkspacePerson(enterpriseId, id, req.body);
      res.json(person);
    } catch (error) {
      console.error("Error updating person:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ message: "Failed to update person", error: errorMessage });
    }
  });

  app.delete('/api/crm/:enterpriseId/people/:id', isAuthenticated, requireEnterpriseRole('admin'), async (req: any, res) => {
    try {
      const { enterpriseId, id } = req.params;
      await storage.deleteWorkspacePerson(enterpriseId, id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting person:", error);
      res.status(500).json({ message: "Failed to delete person" });
    }
  });

  // Workspace People routes (used by frontend)
  app.get('/api/crm/:enterpriseId/workspace/people', isAuthenticated, requireEnterpriseRole('viewer'), async (req: any, res) => {
    try {
      const { enterpriseId } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      const people = await storage.getWorkspacePeople(
        enterpriseId,
        {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        }
      );
      res.json(people);
    } catch (error) {
      console.error("Error fetching workspace people:", error);
      res.status(500).json({ message: "Failed to fetch people" });
    }
  });

  app.get('/api/crm/:enterpriseId/workspace/people/:id', isAuthenticated, requireEnterpriseRole('viewer'), async (req: any, res) => {
    try {
      const { enterpriseId, id } = req.params;
      const person = await storage.getWorkspacePerson(enterpriseId, id);
      if (!person) {
        return res.status(404).json({ message: "Person not found" });
      }
      res.json(person);
    } catch (error) {
      console.error("Error fetching workspace person:", error);
      res.status(500).json({ message: "Failed to fetch person" });
    }
  });

  app.post('/api/crm/:enterpriseId/workspace/people', isAuthenticated, requireEnterpriseRole('editor'), async (req: any, res) => {
    try {
      const { enterpriseId } = req.params;
      const userId = (req.user as any)?.claims?.sub;
      const body = { ...req.body };
      
      // Auto-add enterprise to workspace if linking to one that's not in workspace yet
      if (body.workspaceEnterpriseId) {
        let workspaceEnterprise = await storage.getWorkspaceEnterpriseByDirectoryId(enterpriseId, body.workspaceEnterpriseId);
        if (!workspaceEnterprise) {
          // Link the directory enterprise to the workspace
          workspaceEnterprise = await storage.linkDirectoryEnterprise(enterpriseId, body.workspaceEnterpriseId, userId);
        }
        // Update to use the workspace enterprise ID (not the directory enterprise ID)
        body.workspaceEnterpriseId = workspaceEnterprise.id;
      }
      
      const validatedData = insertCrmWorkspacePersonSchema.parse({ ...body, workspaceId: enterpriseId });
      const person = await storage.createWorkspacePerson(validatedData);
      res.status(200).json(person);
    } catch (error) {
      console.error("Error creating workspace person:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ message: "Failed to create person", error: errorMessage });
    }
  });

  app.put('/api/crm/:enterpriseId/workspace/people/:id', isAuthenticated, requireEnterpriseRole('editor'), async (req: any, res) => {
    try {
      const { enterpriseId, id } = req.params;
      const userId = (req.user as any)?.claims?.sub;
      const body = { ...req.body };
      
      // Auto-add enterprise to workspace if linking to one that's not in workspace yet
      if (body.workspaceEnterpriseId) {
        let workspaceEnterprise = await storage.getWorkspaceEnterpriseByDirectoryId(enterpriseId, body.workspaceEnterpriseId);
        if (!workspaceEnterprise) {
          // Link the directory enterprise to the workspace
          workspaceEnterprise = await storage.linkDirectoryEnterprise(enterpriseId, body.workspaceEnterpriseId, userId);
        }
        // Update to use the workspace enterprise ID (not the directory enterprise ID)
        body.workspaceEnterpriseId = workspaceEnterprise.id;
      }
      
      const person = await storage.updateWorkspacePerson(enterpriseId, id, body);
      res.json(person);
    } catch (error) {
      console.error("Error updating workspace person:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ message: "Failed to update person", error: errorMessage });
    }
  });

  app.delete('/api/crm/:enterpriseId/workspace/people/:id', isAuthenticated, requireEnterpriseRole('editor'), async (req: any, res) => {
    try {
      const { enterpriseId, id } = req.params;
      await storage.deleteWorkspacePerson(enterpriseId, id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting workspace person:", error);
      res.status(500).json({ message: "Failed to delete person" });
    }
  });

  // Opportunities management
  app.get('/api/crm/:enterpriseId/opportunities', isAuthenticated, requireEnterpriseRole('viewer'), async (req: any, res) => {
    try {
      const { enterpriseId } = req.params;
      const { status, limit = 50, offset = 0 } = req.query;
      const opportunities = await storage.getWorkspaceOpportunities(
        enterpriseId,
        {
          status: status as string,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        }
      );
      res.json(opportunities);
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      res.status(500).json({ message: "Failed to fetch opportunities" });
    }
  });

  app.post('/api/crm/:enterpriseId/opportunities', isAuthenticated, requireEnterpriseRole('editor'), async (req: any, res) => {
    try {
      const { enterpriseId } = req.params;
      // Transform date string to Date object if present
      const body = { ...req.body };
      if (body.expectedCloseDate && typeof body.expectedCloseDate === 'string') {
        body.expectedCloseDate = new Date(body.expectedCloseDate);
      }
      
      const validatedData = insertCrmWorkspaceOpportunitySchema.parse({ ...body, workspaceId: enterpriseId });
      const opportunity = await storage.createWorkspaceOpportunity(validatedData);
      res.status(201).json(opportunity);
    } catch (error) {
      console.error("Error creating opportunity:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ message: "Failed to create opportunity", error: errorMessage });
    }
  });

  app.put('/api/crm/:enterpriseId/opportunities/:id', isAuthenticated, requireEnterpriseRole('editor'), async (req: any, res) => {
    try {
      const { enterpriseId, id } = req.params;
      // Transform date string to Date object if present
      const body = { ...req.body };
      if (body.expectedCloseDate && typeof body.expectedCloseDate === 'string') {
        body.expectedCloseDate = new Date(body.expectedCloseDate);
      }
      
      const opportunity = await storage.updateWorkspaceOpportunity(enterpriseId, id, body);
      res.json(opportunity);
    } catch (error) {
      console.error("Error updating opportunity:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ message: "Failed to update opportunity", error: errorMessage });
    }
  });

  app.delete('/api/crm/:enterpriseId/opportunities/:id', isAuthenticated, requireEnterpriseRole('admin'), async (req: any, res) => {
    try {
      const { enterpriseId, id } = req.params;
      await storage.deleteWorkspaceOpportunity(enterpriseId, id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting opportunity:", error);
      res.status(500).json({ message: "Failed to delete opportunity" });
    }
  });

  // Workspace Opportunities routes (used by frontend)
  app.get('/api/crm/:enterpriseId/workspace/opportunities', isAuthenticated, requireEnterpriseRole('viewer'), async (req: any, res) => {
    try {
      const { enterpriseId } = req.params;
      const { status, limit = 50, offset = 0 } = req.query;
      const opportunities = await storage.getWorkspaceOpportunities(
        enterpriseId,
        {
          status: status as string,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        }
      );
      res.json(opportunities);
    } catch (error) {
      console.error("Error fetching workspace opportunities:", error);
      res.status(500).json({ message: "Failed to fetch opportunities" });
    }
  });

  app.get('/api/crm/:enterpriseId/workspace/opportunities/:id', isAuthenticated, requireEnterpriseRole('viewer'), async (req: any, res) => {
    try {
      const { enterpriseId, id } = req.params;
      const opportunity = await storage.getWorkspaceOpportunity(enterpriseId, id);
      if (!opportunity) {
        return res.status(404).json({ message: "Opportunity not found" });
      }
      res.json(opportunity);
    } catch (error) {
      console.error("Error fetching workspace opportunity:", error);
      res.status(500).json({ message: "Failed to fetch opportunity" });
    }
  });

  app.post('/api/crm/:enterpriseId/workspace/opportunities', isAuthenticated, requireEnterpriseRole('editor'), async (req: any, res) => {
    try {
      const { enterpriseId } = req.params;
      const userId = (req.user as any)?.claims?.sub;
      const body = { ...req.body };
      if (body.expectedCloseDate && typeof body.expectedCloseDate === 'string') {
        body.expectedCloseDate = new Date(body.expectedCloseDate);
      }
      
      // Auto-add enterprise to workspace if linking to one that's not in workspace yet
      if (body.workspaceEnterpriseId) {
        let workspaceEnterprise = await storage.getWorkspaceEnterpriseByDirectoryId(enterpriseId, body.workspaceEnterpriseId);
        if (!workspaceEnterprise) {
          // Link the directory enterprise to the workspace
          workspaceEnterprise = await storage.linkDirectoryEnterprise(enterpriseId, body.workspaceEnterpriseId, userId);
        }
        // Update to use the workspace enterprise ID (not the directory enterprise ID)
        body.workspaceEnterpriseId = workspaceEnterprise.id;
      }
      
      const validatedData = insertCrmWorkspaceOpportunitySchema.parse({ ...body, workspaceId: enterpriseId });
      const opportunity = await storage.createWorkspaceOpportunity(validatedData);
      res.status(200).json(opportunity);
    } catch (error) {
      console.error("Error creating workspace opportunity:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ message: "Failed to create opportunity", error: errorMessage });
    }
  });

  app.put('/api/crm/:enterpriseId/workspace/opportunities/:id', isAuthenticated, requireEnterpriseRole('editor'), async (req: any, res) => {
    try {
      const { enterpriseId, id } = req.params;
      const userId = (req.user as any)?.claims?.sub;
      const body = { ...req.body };
      if (body.expectedCloseDate && typeof body.expectedCloseDate === 'string') {
        body.expectedCloseDate = new Date(body.expectedCloseDate);
      }
      
      // Auto-add enterprise to workspace if linking to one that's not in workspace yet
      if (body.workspaceEnterpriseId) {
        let workspaceEnterprise = await storage.getWorkspaceEnterpriseByDirectoryId(enterpriseId, body.workspaceEnterpriseId);
        if (!workspaceEnterprise) {
          // Link the directory enterprise to the workspace
          workspaceEnterprise = await storage.linkDirectoryEnterprise(enterpriseId, body.workspaceEnterpriseId, userId);
        }
        // Update to use the workspace enterprise ID (not the directory enterprise ID)
        body.workspaceEnterpriseId = workspaceEnterprise.id;
      }
      
      const opportunity = await storage.updateWorkspaceOpportunity(enterpriseId, id, body);
      res.json(opportunity);
    } catch (error) {
      console.error("Error updating workspace opportunity:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ message: "Failed to update opportunity", error: errorMessage });
    }
  });

  app.delete('/api/crm/:enterpriseId/workspace/opportunities/:id', isAuthenticated, requireEnterpriseRole('editor'), async (req: any, res) => {
    try {
      const { enterpriseId, id } = req.params;
      await storage.deleteWorkspaceOpportunity(enterpriseId, id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting workspace opportunity:", error);
      res.status(500).json({ message: "Failed to delete opportunity" });
    }
  });

  // Export opportunities as CSV
  app.get('/api/crm/:enterpriseId/opportunities/export', isAuthenticated, requireEnterpriseRole('viewer'), async (req: any, res) => {
    try {
      const { enterpriseId } = req.params;
      // Query workspace opportunities with related enterprises and people using left joins
      const opportunitiesData = await db
        .select({
          id: crmWorkspaceOpportunities.id,
          title: crmWorkspaceOpportunities.title,
          status: crmWorkspaceOpportunities.status,
          value: crmWorkspaceOpportunities.value,
          probability: crmWorkspaceOpportunities.probability,
          expectedCloseDate: crmWorkspaceOpportunities.expectedCloseDate,
          description: crmWorkspaceOpportunities.description,
          notes: crmWorkspaceOpportunities.notes,
          enterpriseName: enterprises.name,
          enterpriseCategory: enterprises.category,
          primaryContactFirstName: crmWorkspacePeople.firstName,
          primaryContactLastName: crmWorkspacePeople.lastName,
          primaryContactEmail: crmWorkspacePeople.email,
        })
        .from(crmWorkspaceOpportunities)
        .leftJoin(enterprises, eq(crmWorkspaceOpportunities.workspaceEnterpriseId, enterprises.id))
        .leftJoin(crmWorkspacePeople, eq(crmWorkspaceOpportunities.workspacePersonId, crmWorkspacePeople.id))
        .where(eq(crmWorkspaceOpportunities.workspaceId, enterpriseId))
        .orderBy(desc(crmWorkspaceOpportunities.createdAt));

      // CSV helper function to escape special characters
      const escapeCSV = (value: any): string => {
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        // If value contains comma, quote, or newline, wrap in quotes and escape quotes
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      };

      // Format date as YYYY-MM-DD
      const formatDate = (date: Date | null | undefined): string => {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().split('T')[0];
      };

      // Format currency (value is in cents)
      const formatValue = (value: number | null | undefined): string => {
        if (value === null || value === undefined) return '';
        return (value / 100).toFixed(2);
      };

      // CSV headers
      const headers = [
        'Opportunity Title',
        'Status',
        'Value',
        'Probability',
        'Expected Close Date',
        'Enterprise Name',
        'Enterprise Category',
        'Primary Contact Name',
        'Primary Contact Email',
        'Description',
        'Notes'
      ];

      // Build CSV content
      const csvRows = [headers.join(',')];

      for (const opp of opportunitiesData) {
        const primaryContactName = opp.primaryContactFirstName && opp.primaryContactLastName
          ? `${opp.primaryContactFirstName} ${opp.primaryContactLastName}`
          : '';

        const row = [
          escapeCSV(opp.title),
          escapeCSV(opp.status),
          escapeCSV(formatValue(opp.value)),
          escapeCSV(opp.probability ?? ''),
          escapeCSV(formatDate(opp.expectedCloseDate)),
          escapeCSV(opp.enterpriseName),
          escapeCSV(opp.enterpriseCategory),
          escapeCSV(primaryContactName),
          escapeCSV(opp.primaryContactEmail),
          escapeCSV(opp.description),
          escapeCSV(opp.notes)
        ];
        csvRows.push(row.join(','));
      }

      // Add UTF-8 BOM for Excel compatibility
      const BOM = '\uFEFF';
      const csvContent = BOM + csvRows.join('\n');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const filename = `opportunities-export-${timestamp}.csv`;

      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting opportunities:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to export opportunities", error: errorMessage });
    }
  });

  // Tasks management
  app.get('/api/crm/:enterpriseId/tasks', isAuthenticated, requireEnterpriseRole('viewer'), async (req: any, res) => {
    try {
      const { enterpriseId } = req.params;
      const { status, assignedToId, limit = 50, offset = 0 } = req.query;
      const tasks = await storage.getWorkspaceTasks(
        enterpriseId,
        {
          status: status as string,
          assignedToId: assignedToId as string,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        }
      );
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post('/api/crm/:enterpriseId/tasks', isAuthenticated, requireEnterpriseRole('editor'), async (req: any, res) => {
    try {
      const { enterpriseId } = req.params;
      const validatedData = insertCrmWorkspaceTaskSchema.parse({ ...req.body, workspaceId: enterpriseId });
      const task = await storage.createWorkspaceTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ message: "Failed to create task", error: errorMessage });
    }
  });

  app.put('/api/crm/:enterpriseId/tasks/:id', isAuthenticated, requireEnterpriseRole('editor'), async (req: any, res) => {
    try {
      const { enterpriseId, id } = req.params;
      const task = await storage.updateWorkspaceTask(enterpriseId, id, req.body);
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ message: "Failed to update task", error: errorMessage });
    }
  });

  app.delete('/api/crm/:enterpriseId/tasks/:id', isAuthenticated, requireEnterpriseRole('admin'), async (req: any, res) => {
    try {
      const { enterpriseId, id } = req.params;
      await storage.deleteWorkspaceTask(enterpriseId, id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Workspace Tasks routes (used by frontend)
  app.get('/api/crm/:enterpriseId/workspace/tasks', isAuthenticated, requireEnterpriseRole('viewer'), async (req: any, res) => {
    try {
      const { enterpriseId } = req.params;
      const { status, assignedToId, limit = 50, offset = 0 } = req.query;
      const tasks = await storage.getWorkspaceTasks(
        enterpriseId,
        {
          status: status as string,
          assignedToId: assignedToId as string,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        }
      );
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching workspace tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get('/api/crm/:enterpriseId/workspace/tasks/:id', isAuthenticated, requireEnterpriseRole('viewer'), async (req: any, res) => {
    try {
      const { enterpriseId, id } = req.params;
      const task = await storage.getWorkspaceTask(enterpriseId, id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error fetching workspace task:", error);
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  app.post('/api/crm/:enterpriseId/workspace/tasks', isAuthenticated, requireEnterpriseRole('editor'), async (req: any, res) => {
    try {
      const { enterpriseId } = req.params;
      const userId = (req.user as any)?.claims?.sub;
      const body = { ...req.body };
      
      // Auto-add enterprise to workspace if linking to one that's not in workspace yet
      if (body.workspaceEnterpriseId) {
        let workspaceEnterprise = await storage.getWorkspaceEnterpriseByDirectoryId(enterpriseId, body.workspaceEnterpriseId);
        if (!workspaceEnterprise) {
          // Link the directory enterprise to the workspace
          workspaceEnterprise = await storage.linkDirectoryEnterprise(enterpriseId, body.workspaceEnterpriseId, userId);
        }
        // Update to use the workspace enterprise ID (not the directory enterprise ID)
        body.workspaceEnterpriseId = workspaceEnterprise.id;
      }
      
      const validatedData = insertCrmWorkspaceTaskSchema.parse({ ...body, workspaceId: enterpriseId });
      const task = await storage.createWorkspaceTask(validatedData);
      res.status(200).json(task);
    } catch (error) {
      console.error("Error creating workspace task:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ message: "Failed to create task", error: errorMessage });
    }
  });

  app.put('/api/crm/:enterpriseId/workspace/tasks/:id', isAuthenticated, requireEnterpriseRole('editor'), async (req: any, res) => {
    try {
      const { enterpriseId, id } = req.params;
      const userId = (req.user as any)?.claims?.sub;
      const body = { ...req.body };
      
      // Auto-add enterprise to workspace if linking to one that's not in workspace yet
      if (body.workspaceEnterpriseId) {
        let workspaceEnterprise = await storage.getWorkspaceEnterpriseByDirectoryId(enterpriseId, body.workspaceEnterpriseId);
        if (!workspaceEnterprise) {
          // Link the directory enterprise to the workspace
          workspaceEnterprise = await storage.linkDirectoryEnterprise(enterpriseId, body.workspaceEnterpriseId, userId);
        }
        // Update to use the workspace enterprise ID (not the directory enterprise ID)
        body.workspaceEnterpriseId = workspaceEnterprise.id;
      }
      
      const task = await storage.updateWorkspaceTask(enterpriseId, id, body);
      res.json(task);
    } catch (error) {
      console.error("Error updating workspace task:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ message: "Failed to update task", error: errorMessage });
    }
  });

  app.delete('/api/crm/:enterpriseId/workspace/tasks/:id', isAuthenticated, requireEnterpriseRole('editor'), async (req: any, res) => {
    try {
      const { enterpriseId, id } = req.params;
      await storage.deleteWorkspaceTask(enterpriseId, id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting workspace task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Enterprise-People Connections (Junction table for many-to-many)
  // GET /api/crm/:enterpriseId/workspace/enterprise-people-connections
  // Query params: ?enterpriseId=xxx or ?personId=xxx
  app.get("/api/crm/:enterpriseId/workspace/enterprise-people-connections",
    isAuthenticated,
    requireEnterpriseRole("viewer"),
    async (req: any, res) => {
      try {
        const workspaceId = req.params.enterpriseId;
        const { enterpriseId, personId } = req.query;
        
        const connections = await storage.getEnterprisePersonConnections(
          workspaceId,
          enterpriseId as string | undefined,
          personId as string | undefined
        );
        
        res.json(connections);
      } catch (error) {
        console.error("Error fetching enterprise-people connections:", error);
        res.status(500).json({ error: "Failed to fetch connections" });
      }
    }
  );

  // POST /api/crm/:enterpriseId/workspace/enterprise-people-connections
  app.post("/api/crm/:enterpriseId/workspace/enterprise-people-connections",
    isAuthenticated,
    requireEnterpriseRole("editor"),
    async (req: any, res) => {
      try {
        const workspaceId = req.params.enterpriseId;
        
        const validatedData = insertCrmWorkspaceEnterprisePersonSchema.parse({
          workspaceId,
          workspaceEnterpriseId: req.body.workspaceEnterpriseId,
          workspacePersonId: req.body.workspacePersonId,
          relationshipType: req.body.relationshipType || 'employee',
          isPrimary: req.body.isPrimary || false,
        });
        
        const connection = await storage.createEnterprisePersonConnection(validatedData);
        res.json(connection);
      } catch (error) {
        console.error("Error creating enterprise-person connection:", error);
        if (error instanceof Error && error.message === 'Connection already exists') {
          return res.status(409).json({ error: "Connection already exists" });
        }
        res.status(500).json({ error: "Failed to create connection" });
      }
    }
  );

  // PATCH /api/crm/:enterpriseId/workspace/enterprise-people-connections/:id
  app.patch("/api/crm/:enterpriseId/workspace/enterprise-people-connections/:id",
    isAuthenticated,
    requireEnterpriseRole("editor"),
    async (req: any, res) => {
      try {
        const { enterpriseId, id } = req.params;
        const { isPrimary } = req.body;
        
        const connection = await storage.updateEnterprisePersonConnection(enterpriseId, id, isPrimary);
        res.json(connection);
      } catch (error) {
        console.error("Error updating enterprise-person connection:", error);
        res.status(500).json({ error: "Failed to update connection" });
      }
    }
  );

  // DELETE /api/crm/:enterpriseId/workspace/enterprise-people-connections/:id
  app.delete("/api/crm/:enterpriseId/workspace/enterprise-people-connections/:id",
    isAuthenticated,
    requireEnterpriseRole("editor"),
    async (req: any, res) => {
      try {
        const { enterpriseId, id } = req.params;
        await storage.deleteEnterprisePersonConnection(enterpriseId, id);
        res.json({ success: true });
      } catch (error) {
        console.error("Error deleting enterprise-person connection:", error);
        res.status(500).json({ error: "Failed to delete connection" });
      }
    }
  );

  // Email Communications
  // POST /api/crm/:enterpriseId/communications/email
  app.post("/api/crm/:enterpriseId/communications/email",
    isAuthenticated,
    requireEnterpriseRole("editor"),
    async (req: any, res) => {
      try {
        const workspaceId = req.params.enterpriseId;
        const userId = (req.user as any)?.claims?.sub;
        if (!userId) {
          return res.status(401).json({ error: "Unauthorized" });
        }
        
        const { personId, subject, body } = req.body;

        // Get person details
        const person = await storage.getWorkspacePerson(workspaceId, personId);
        if (!person || !person.email) {
          return res.status(400).json({ error: "Person not found or has no email" });
        }

        // Create email log
        const emailLog = await storage.createEmailLog({
          workspaceId,
          senderId: userId,
          workspacePersonId: personId,
          workspaceEnterpriseId: person.workspaceEnterpriseId || null,
          recipientEmail: person.email,
          subject,
          body,
          status: 'pending',
          sentAt: null,
          errorMessage: null,
        });

        // Try to send via SendGrid if available
        // For now, just mark as sent (SendGrid integration can be added later)
        const sentAt = new Date();
        const updatedLog = await storage.updateEmailLogStatus(
          workspaceId,
          emailLog.id,
          'sent',
          sentAt,
          null
        );

        res.json(updatedLog);
      } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ error: "Failed to send email" });
      }
    }
  );

  // GET /api/crm/:enterpriseId/communications/email-logs
  // Query params: ?personId=xxx
  app.get("/api/crm/:enterpriseId/communications/email-logs",
    isAuthenticated,
    requireEnterpriseRole("viewer"),
    async (req: any, res) => {
      try {
        const workspaceId = req.params.enterpriseId;
        const { personId } = req.query;
        
        const logs = await storage.getEmailLogs(workspaceId, personId as string | undefined);
        res.json(logs);
      } catch (error) {
        console.error("Error fetching email logs:", error);
        res.status(500).json({ error: "Failed to fetch email logs" });
      }
    }
  );

  // AI Copilot routes
  app.post('/api/crm/:enterpriseId/ai/lead-score', isAuthenticated, requireEnterpriseRole('viewer'), async (req: any, res) => {
    try {
      const { enterpriseId } = req.params;
      const { personId } = req.body;
      
      const enterprise = await storage.getEnterprise(enterpriseId);
      const person = personId ? await storage.getWorkspacePerson(enterpriseId, personId) : null;
      
      if (!enterprise) {
        return res.status(404).json({ message: "Enterprise not found" });
      }

      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const context = await storage.getCopilotContext(userId, enterpriseId);
      
      const leadScore = await generateLeadScore(userId, enterprise, person, context);
      
      // Update opportunity with AI score if it exists
      if (req.body.opportunityId) {
        await storage.updateWorkspaceOpportunity(enterpriseId, req.body.opportunityId, {
          aiScore: leadScore.score,
          aiInsights: leadScore.insights,
        });
      }
      
      res.json(leadScore);
    } catch (error) {
      console.error("Error generating lead score:", error);
      if (error instanceof InsufficientCreditsError) {
        return res.status(402).json({ message: error.message, code: "INSUFFICIENT_CREDITS" });
      }
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to generate lead score", error: errorMessage });
    }
  });

  app.get('/api/crm/:enterpriseId/ai/suggestions', isAuthenticated, requireEnterpriseRole('viewer'), async (req: any, res) => {
    try {
      const { enterpriseId } = req.params;
      // Get recent activity and stats for context
      const [recentEnterprises, recentOpportunities, stats] = await Promise.all([
        storage.getEnterprises(undefined, undefined, 10, 0),
        storage.getWorkspaceOpportunities(enterpriseId, { limit: 10, offset: 0 }),
        storage.getEnterpriseStats(),
      ]);

      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const context = await storage.getCopilotContext(userId, enterpriseId);

      const recentActivity = [
        ...recentEnterprises.map(e => ({ type: 'enterprise', data: e })),
        ...recentOpportunities.map(o => ({ type: 'opportunity', data: o })),
      ];

      const suggestions = await generateCopilotSuggestions(userId, recentActivity, stats, context);
      res.json(suggestions);
    } catch (error) {
      console.error("Error generating suggestions:", error);
      if (error instanceof InsufficientCreditsError) {
        return res.status(402).json({ message: error.message, code: "INSUFFICIENT_CREDITS" });
      }
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to generate suggestions", error: errorMessage });
    }
  });

  app.get('/api/crm/:enterpriseId/ai/context', isAuthenticated, requireEnterpriseRole('viewer'), async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { enterpriseId } = req.params;
      const context = await storage.getCopilotContext(userId, enterpriseId);
      res.json(context || { focusAreas: [], leadScoringCriteria: {}, automationRules: {} });
    } catch (error) {
      console.error("Error fetching copilot context:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch copilot context", error: errorMessage });
    }
  });

  app.post('/api/crm/:enterpriseId/ai/context', isAuthenticated, requireEnterpriseRole('editor'), async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { enterpriseId } = req.params;
      const validatedData = insertCopilotContextSchema.parse({
        ...req.body,
        userId,
      });
      
      const context = await storage.upsertCopilotContext(validatedData, enterpriseId);
      res.json(context);
    } catch (error) {
      console.error("Error updating copilot context:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ message: "Failed to update copilot context", error: errorMessage });
    }
  });

  // Business context routes
  app.get('/api/crm/:enterpriseId/ai/business-context', isAuthenticated, requireEnterpriseRole('viewer'), async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { enterpriseId } = req.params;
      const context = await storage.getBusinessContext(userId, enterpriseId);
      res.json(context || { companyName: '', website: '', description: '', awards: '', outreachGoal: '', customerProfiles: [], guidanceRules: [] });
    } catch (error) {
      console.error("Error fetching business context:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch business context", error: errorMessage });
    }
  });

  app.post('/api/crm/:enterpriseId/ai/business-context', isAuthenticated, requireEnterpriseRole('editor'), async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { enterpriseId } = req.params;
      const validatedData = insertBusinessContextSchema.parse({
        ...req.body,
        userId,
      });
      
      const context = await storage.upsertBusinessContext(validatedData, enterpriseId);
      res.json(context);
    } catch (error) {
      console.error("Error updating business context:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ message: "Failed to update business context", error: errorMessage });
    }
  });

  // Chat conversation routes
  app.get('/api/crm/:enterpriseId/ai/conversations', isAuthenticated, requireEnterpriseRole('viewer'), async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { enterpriseId } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      const conversations = await storage.getConversations(
        userId,
        enterpriseId,
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

  app.post('/api/crm/:enterpriseId/ai/conversations', isAuthenticated, requireEnterpriseRole('viewer'), async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { enterpriseId } = req.params;
      const validatedData = insertConversationSchema.parse({
        ...req.body,
        userId,
      });
      
      const conversation = await storage.createConversation(validatedData, enterpriseId);
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ message: "Failed to create conversation", error: errorMessage });
    }
  });

  app.get('/api/crm/:enterpriseId/ai/conversations/:id/messages', isAuthenticated, requireEnterpriseRole('viewer'), async (req: any, res) => {
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

  app.post('/api/crm/:enterpriseId/ai/chat', isAuthenticated, requireEnterpriseRole('viewer'), async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { enterpriseId } = req.params;
      const { message, conversationId } = req.body;
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      let conversation;
      let messages: any[] = [];

      // If conversationId provided, get existing conversation and messages
      if (conversationId) {
        conversation = await storage.getConversation(conversationId, enterpriseId);
        if (!conversation) {
          return res.status(404).json({ message: "Conversation not found" });
        }
        messages = await storage.getChatMessages(conversationId);
      } else {
        // Create new conversation
        conversation = await storage.createConversation({
          userId,
          enterpriseId,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        }, enterpriseId);
      }

      // Save user message
      const userMessage = await storage.createChatMessage({
        conversationId: conversation.id,
        role: 'user',
        content: message,
      });

      // Get business context for AI
      const businessContext = await storage.getBusinessContext(userId, enterpriseId);
      const copilotContext = await storage.getCopilotContext(userId, enterpriseId);

      // Generate AI response using OpenAI
      const aiResponse = await generateCopilotResponse(
        userId,
        message,
        messages,
        businessContext,
        copilotContext
      );

      // Handle function calls
      if (aiResponse.functionCall) {
        const { name, arguments: args } = aiResponse.functionCall;
        let functionResult: any;
        let responseMessage = '';

        try {
          if (name === 'add_enterprise') {
            // Validate and create enterprise
            const validatedData = insertEnterpriseSchema.parse(args);
            const enterprise = await storage.createEnterprise(validatedData);
            functionResult = enterprise;
            responseMessage = `📂 Data from Earth Care Directory\n\n✅ Successfully added enterprise "${enterprise.name}" to the directory!\n\nID: ${enterprise.id}\nCategory: ${enterprise.category}\nLocation: ${enterprise.location || 'Not specified'}\n\nYou can view it at: /enterprises/${enterprise.id}`;
          } else if (name === 'send_invitation') {
            // Generate claim token and create invitation
            const claimToken = nanoid(32);
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30); // Expires in 30 days

            const claim = await storage.createProfileClaim({
              enterpriseId: args.enterpriseId,
              claimToken,
              invitedEmail: args.email,
              invitedName: args.name,
              invitedBy: userId,
              invitedAt: new Date(),
              expiresAt,
              status: 'pending'
            });

            functionResult = claim;
            const claimUrl = `/claim-profile?token=${claimToken}`;
            responseMessage = `📂 Data from Earth Care Directory\n\n✅ Profile claim invitation created successfully!\n\nInvitation Link: ${claimUrl}\n\nSent to: ${args.email}${args.name ? ` (${args.name})` : ''}\nExpires: ${expiresAt.toLocaleDateString()}\n\n📧 Note: Email sending is not yet implemented. Please share this link manually with the recipient.`;
          } else if (name === 'searchApollo') {
            // Search Apollo.io for companies/contacts
            const searchResponse = await fetch(`${req.protocol}://${req.get('host')}/api/integrations/apollo/search`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cookie': req.headers.cookie || ''
              },
              body: JSON.stringify({
                query: args.query,
                filters: args.filters || { type: 'companies' }
              })
            });
            
            const searchData = await searchResponse.json();
            functionResult = searchData;
            
            if (searchData.success && searchData.data && searchData.data.length > 0) {
              const resultList = searchData.data.slice(0, 5).map((item: any, idx: number) => 
                `${idx + 1}. ${item.name || item.company || 'Unknown'}${item.location ? ` - ${item.location}` : ''}${item.email ? ` (${item.email})` : ''}`
              ).join('\n');
              const dataSource = searchData.usingMockData ? '🧪 Mock Data' : '🔍 Data from Apollo.io';
              responseMessage = `${dataSource}\n\nFound ${searchData.data.length} result(s):\n\n${resultList}\n\n${searchData.usingMockData ? '⚠️ Using sample data. Configure Apollo API credentials for real results.\n\n' : ''}Would you like me to import any of these into your CRM?`;
            } else {
              const dataSource = searchData.usingMockData ? '🧪 Mock Data' : '🔍 Data from Apollo.io';
              responseMessage = `${dataSource}\n\nNo results found for "${args.query}".${searchData.usingMockData ? ' (Using sample data - configure API credentials for real results)' : ''}`;
            }
          } else if (name === 'searchGoogleMaps') {
            // Search Google Maps for places
            const searchResponse = await fetch(`${req.protocol}://${req.get('host')}/api/integrations/google_maps/search`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cookie': req.headers.cookie || ''
              },
              body: JSON.stringify({
                query: args.query,
                location: args.location
              })
            });
            
            const searchData = await searchResponse.json();
            functionResult = searchData;
            
            if (searchData.success && searchData.data && searchData.data.length > 0) {
              const resultList = searchData.data.slice(0, 5).map((item: any, idx: number) => 
                `${idx + 1}. ${item.name}${item.address ? ` - ${item.address}` : ''}${item.phone ? ` (${item.phone})` : ''}`
              ).join('\n');
              const dataSource = searchData.usingMockData ? '🧪 Mock Data' : '📍 Data from Google Maps';
              responseMessage = `${dataSource}\n\nFound ${searchData.data.length} place(s):\n\n${resultList}\n\n${searchData.usingMockData ? '⚠️ Using sample data. Configure Google Maps API credentials for real results.\n\n' : ''}Would you like me to import any of these into your CRM?`;
            } else {
              const dataSource = searchData.usingMockData ? '🧪 Mock Data' : '📍 Data from Google Maps';
              responseMessage = `${dataSource}\n\nNo places found for "${args.query}".${searchData.usingMockData ? ' (Using sample data - configure API credentials for real results)' : ''}`;
            }
          } else if (name === 'searchFoursquare') {
            // Search Foursquare for venues
            const searchResponse = await fetch(`${req.protocol}://${req.get('host')}/api/integrations/foursquare/search`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cookie': req.headers.cookie || ''
              },
              body: JSON.stringify({
                query: args.query,
                location: args.location
              })
            });
            
            const searchData = await searchResponse.json();
            functionResult = searchData;
            
            if (searchData.success && searchData.data && searchData.data.length > 0) {
              const resultList = searchData.data.slice(0, 5).map((item: any, idx: number) => 
                `${idx + 1}. ${item.name}${item.category ? ` (${item.category})` : ''}${item.address ? ` - ${item.address}` : ''}`
              ).join('\n');
              const dataSource = searchData.usingMockData ? '🧪 Mock Data' : '🗺️ Data from Foursquare';
              responseMessage = `${dataSource}\n\nFound ${searchData.data.length} venue(s):\n\n${resultList}\n\n${searchData.usingMockData ? '⚠️ Using sample data. Configure Foursquare API credentials for real results.\n\n' : ''}Would you like me to import any of these into your CRM?`;
            } else {
              const dataSource = searchData.usingMockData ? '🧪 Mock Data' : '🗺️ Data from Foursquare';
              responseMessage = `${dataSource}\n\nNo venues found for "${args.query}".${searchData.usingMockData ? ' (Using sample data - configure API credentials for real results)' : ''}`;
            }
          } else if (name === 'importEntityToCRM') {
            // Import external entity into CRM
            const importResponse = await fetch(`${req.protocol}://${req.get('host')}/api/integrations/external-entities`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cookie': req.headers.cookie || ''
              },
              body: JSON.stringify({
                entity: args.entity,
                entityType: args.entityType
              })
            });
            
            const importData = await importResponse.json();
            functionResult = importData;
            
            if (importData.success) {
              const entity = importData.data;
              const entityName = entity.name || 'Unknown';
              const entityType = args.entityType === 'enterprise' ? 'Enterprise' : 'Person';
              const sourceIcons: Record<string, string> = {
                'apollo': '🔍 Data from Apollo.io',
                'google_maps': '📍 Data from Google Maps',
                'foursquare': '🗺️ Data from Foursquare'
              };
              const dataSource = sourceIcons[args.entity.source] || `📥 Data from ${args.entity.source}`;
              responseMessage = `${dataSource}\n\n✅ Successfully imported ${entityType} "${entityName}"!\n\nID: ${entity.id}\n${entity.location ? `Location: ${entity.location}\n` : ''}${entity.email ? `Email: ${entity.email}\n` : ''}${entity.website ? `Website: ${entity.website}\n` : ''}\nYou can view it at: /${args.entityType === 'enterprise' ? 'enterprises' : 'crm/people'}/${entity.id}`;
            } else {
              responseMessage = `❌ Failed to import entity: ${importData.message || importData.error || 'Unknown error'}`;
            }
          }
        } catch (error) {
          console.error(`Error executing function ${name}:`, error);
          responseMessage = `❌ Error executing ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }

        // Save AI response with function result
        const assistantMessage = await storage.createChatMessage({
          conversationId: conversation.id,
          role: 'assistant',
          content: responseMessage,
          metadata: { functionCall: { name, arguments: args, result: functionResult } }
        });

        return res.json({
          conversation,
          userMessage,
          assistantMessage,
          response: responseMessage,
          functionCall: { name, arguments: args, result: functionResult }
        });
      }

      // Regular text response (no function call)
      const assistantMessage = await storage.createChatMessage({
        conversationId: conversation.id,
        role: 'assistant',
        content: aiResponse.content || '',
      });

      res.json({
        conversation,
        userMessage,
        assistantMessage,
        response: aiResponse.content,
      });
    } catch (error) {
      console.error("Error in chat:", error);
      if (error instanceof InsufficientCreditsError) {
        return res.status(402).json({ message: error.message, code: "INSUFFICIENT_CREDITS" });
      }
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to process chat", error: errorMessage });
    }
  });

  // Enterprise claiming routes (deprecated - use team management instead)
  app.get('/api/admin/enterprises/claiming', isAuthenticated, async (req: any, res) => {
    res.status(410).json({ message: "This endpoint has been deprecated. Use team management endpoints instead." });
  });

  app.get('/api/admin/claim-stats', isAuthenticated, async (req: any, res) => {
    res.status(410).json({ message: "This endpoint has been deprecated. Use team management endpoints instead." });
  });

  app.get('/api/admin/pledge-stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Check if user is admin
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const stats = await storage.getPledgeStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching pledge stats:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch pledge stats", error: errorMessage });
    }
  });

  // Invitation routes (deprecated - use team invitations instead)
  app.post('/api/admin/invitations', isAuthenticated, async (req: any, res) => {
    res.status(410).json({ message: "This endpoint has been deprecated. Use team invitation endpoints instead." });
  });

  app.get('/api/admin/invitations', isAuthenticated, async (req: any, res) => {
    res.status(410).json({ message: "This endpoint has been deprecated. Use team invitation endpoints instead." });
  });

  app.patch('/api/admin/invitations/:id', isAuthenticated, async (req: any, res) => {
    res.status(410).json({ message: "This endpoint has been deprecated. Use team invitation endpoints instead." });
  });

  // Bulk Enterprise Seeding Routes (Admin only)
  app.post('/api/admin/enterprises/seed', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { urls, discover } = req.body;

      let seedingUrls: string[] = [];
      
      if (discover) {
        seedingUrls = await discoverEnterprises();
      } else if (urls && Array.isArray(urls)) {
        seedingUrls = urls;
      } else {
        return res.status(400).json({ 
          message: "Either 'urls' array or 'discover' flag must be provided" 
        });
      }

      if (seedingUrls.length === 0) {
        return res.status(400).json({ message: "No URLs to process" });
      }

      const job = await startBulkSeeding(seedingUrls);
      
      res.status(201).json({
        jobId: job.id,
        message: "Seeding started",
        totalUrls: job.totalUrls
      });
    } catch (error) {
      console.error("Error starting bulk seeding:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to start seeding", error: errorMessage });
    }
  });

  app.get('/api/admin/enterprises/seed/:jobId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { jobId } = req.params;
      const job = getJobStatus(jobId);

      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      res.json(job);
    } catch (error) {
      console.error("Error fetching job status:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch job status", error: errorMessage });
    }
  });

  // Profile Claim Routes
  app.post('/api/crm/enterprises/:id/invite', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { email, name } = req.body;
      const enterpriseId = req.params.id;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const enterprise = await storage.getEnterprise(enterpriseId);
      if (!enterprise) {
        return res.status(404).json({ message: "Enterprise not found" });
      }

      // Check if user is admin or owner of this enterprise
      const user = await storage.getUser(userId);
      const isAdmin = user?.role === 'admin';
      const userEnterpriseRole = await getUserEnterpriseRole(userId, enterpriseId);
      const isOwner = userEnterpriseRole === 'owner';

      if (!isAdmin && !isOwner) {
        return res.status(403).json({ message: "Forbidden - must be enterprise owner or admin" });
      }

      const claimToken = nanoid(32);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const claim = await storage.createProfileClaim({
        enterpriseId,
        claimToken,
        invitedEmail: email,
        invitedName: name,
        invitedBy: userId,
        invitedAt: new Date(),
        expiresAt,
        status: 'pending'
      });

      const claimUrl = `/claim-profile?token=${claimToken}`;

      res.status(201).json({
        message: "Invitation created successfully",
        claim,
        claimUrl,
        note: "Email sending not yet implemented. Share this link manually with the recipient."
      });
    } catch (error) {
      console.error("Error creating invitation:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to create invitation", error: errorMessage });
    }
  });

  app.get('/api/enterprises/claim/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const claim = await storage.getProfileClaim(token);

      if (!claim) {
        return res.status(404).json({ message: "Claim not found" });
      }

      if (claim.status !== 'pending') {
        return res.status(400).json({ 
          message: "This claim has already been processed",
          status: claim.status 
        });
      }

      if (new Date() > new Date(claim.expiresAt)) {
        await storage.updateProfileClaimStatus(claim.id, 'expired');
        return res.status(400).json({ message: "This claim has expired" });
      }

      const enterprise = await storage.getEnterprise(claim.enterpriseId);
      if (!enterprise) {
        return res.status(404).json({ message: "Enterprise not found" });
      }

      res.json({
        claim: {
          id: claim.id,
          invitedEmail: claim.invitedEmail,
          invitedName: claim.invitedName,
          invitedAt: claim.invitedAt,
          expiresAt: claim.expiresAt,
          status: claim.status
        },
        enterprise: {
          id: enterprise.id,
          name: enterprise.name,
          description: enterprise.description,
          category: enterprise.category,
          location: enterprise.location,
          website: enterprise.website,
          imageUrl: enterprise.imageUrl
        }
      });
    } catch (error) {
      console.error("Error fetching claim:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch claim", error: errorMessage });
    }
  });

  app.post('/api/enterprises/claim/:token', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { token } = req.params;
      
      const result = await storage.claimProfile(token, userId);

      res.json({
        message: "Profile claimed successfully",
        claim: result.claim,
        enterprise: result.enterprise
      });
    } catch (error) {
      console.error("Error claiming profile:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ message: errorMessage });
    }
  });

  // Batch Invitation Routes (Admin only)
  app.post('/api/admin/enterprises/invite-batch', isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { enterpriseIds } = req.body;

      const job = await startBatchInvitations(userId, enterpriseIds);

      res.status(202).json({
        jobId: job.id,
        message: "Batch invitation started",
        totalEnterprises: job.totalEnterprises,
        note: "Email sending not yet implemented. Invitations create claim tokens that can be used via the claim profile flow."
      });
    } catch (error) {
      console.error("Error starting batch invitations:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to start batch invitations", error: errorMessage });
    }
  });

  app.get('/api/admin/enterprises/invite-batch/:jobId', isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const { jobId } = req.params;
      
      const job = getInvitationJobStatus(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      res.json(job);
    } catch (error) {
      console.error("Error fetching job status:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch job status", error: errorMessage });
    }
  });

  // Opportunity Transfer Routes (deprecated - feature removed)
  app.post('/api/admin/opportunity-transfers', isAuthenticated, async (req: any, res) => {
    res.status(410).json({ message: "Opportunity transfer feature has been deprecated and removed." });
  });

  app.get('/api/admin/opportunity-transfers', isAuthenticated, async (req: any, res) => {
    res.status(410).json({ message: "Opportunity transfer feature has been deprecated and removed." });
  });

  app.get('/api/admin/transfer-stats', isAuthenticated, async (req: any, res) => {
    res.status(410).json({ message: "Opportunity transfer feature has been deprecated and removed." });
  });

  app.get('/api/my-transferred-opportunities', isAuthenticated, async (req: any, res) => {
    res.status(410).json({ message: "Opportunity transfer feature has been deprecated and removed." });
  });

  app.patch('/api/opportunity-transfers/:id/accept', isAuthenticated, async (req: any, res) => {
    res.status(410).json({ message: "Opportunity transfer feature has been deprecated and removed." });
  });

  app.patch('/api/opportunity-transfers/:id/decline', isAuthenticated, async (req: any, res) => {
    res.status(410).json({ message: "Opportunity transfer feature has been deprecated and removed." });
  });

  app.get('/api/opportunity-transfers/:id', isAuthenticated, async (req: any, res) => {
    res.status(410).json({ message: "Opportunity transfer feature has been deprecated and removed." });
  });

  // Public claiming routes (deprecated - use direct claim endpoint)
  app.post('/api/claim-enterprise', isAuthenticated, async (req: any, res) => {
    res.status(410).json({ message: "This endpoint has been deprecated. Use /api/enterprises/:id/claim-direct instead." });
  });

  // Schema information routes
  app.get('/api/crm/:enterpriseId/schema', isAuthenticated, requireEnterpriseRole('viewer'), async (req: any, res) => {
    try {
      const { enterpriseId } = req.params;
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
        const customFields = await storage.getCustomFields(entityName, enterpriseId);
        
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
        (schemaInfo as any)[entityName].fields.push(...customFieldsFormatted);
      }

      res.json(schemaInfo);
    } catch (error) {
      console.error("Error fetching schema info:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch schema info", error: errorMessage });
    }
  });

  // Custom fields management
  app.post('/api/crm/:enterpriseId/schema/entities/:entityName/fields', isAuthenticated, requireEnterpriseRole('admin'), async (req: any, res) => {
    try {
      const { entityName, enterpriseId } = req.params;
      
      // Validate entity name exists in our schema
      const validEntities = ['enterprises', 'people', 'opportunities', 'tasks', 'users'];
      if (!validEntities.includes(entityName)) {
        return res.status(400).json({ message: "Invalid entity name" });
      }

      const validatedData = insertCustomFieldSchema.parse({
        ...req.body,
        entityName,
      });

      const customField = await storage.createCustomField(validatedData, enterpriseId);
      res.status(201).json(customField);
    } catch (error) {
      console.error("Error creating custom field:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ message: "Failed to create custom field", error: errorMessage });
    }
  });

  // Bulk import routes
  app.post('/api/crm/:enterpriseId/bulk-import/urls', isAuthenticated, requireEnterpriseRole('admin'), async (req: any, res) => {
    try {
      const { urls } = req.body;
      const { enterpriseId } = req.params;
      
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

  app.post('/api/crm/:enterpriseId/bulk-import/regenerative-sources', isAuthenticated, requireEnterpriseRole('admin'), async (req: any, res) => {
    try {
      const { enterpriseId } = req.params;
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

  app.post('/api/crm/:enterpriseId/scrape-url', isAuthenticated, requireEnterpriseRole('editor'), async (req: any, res) => {
    try {
      const { url } = req.body;
      const { enterpriseId } = req.params;
      
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

  // Partner application routes (public access)
  app.get('/api/partner-applications', async (req, res) => {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const applications = await storage.getPartnerApplications(
        parseInt(limit as string),
        parseInt(offset as string)
      );
      res.json(applications);
    } catch (error) {
      console.error("Error fetching partner applications:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch partner applications", error: errorMessage });
    }
  });

  app.post('/api/partner-applications', async (req, res) => {
    try {
      const validatedData = insertPartnerApplicationSchema.parse(req.body);
      const application = await storage.createPartnerApplication(validatedData);
      res.status(201).json(application);
    } catch (error) {
      console.error("Error creating partner application:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ message: "Failed to create partner application", error: errorMessage });
    }
  });

  // Protected partner application management routes
  app.get('/api/crm/partner-applications', isAuthenticated, async (req, res) => {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const applications = await storage.getPartnerApplications(
        parseInt(limit as string),
        parseInt(offset as string)
      );
      res.json(applications);
    } catch (error) {
      console.error("Error fetching partner applications:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch partner applications", error: errorMessage });
    }
  });

  app.get('/api/crm/partner-applications/:id', isAuthenticated, async (req, res) => {
    try {
      const application = await storage.getPartnerApplication(req.params.id);
      if (!application) {
        return res.status(404).json({ message: "Partner application not found" });
      }
      res.json(application);
    } catch (error) {
      console.error("Error fetching partner application:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch partner application", error: errorMessage });
    }
  });

  app.put('/api/crm/partner-applications/:id', isAuthenticated, async (req, res) => {
    try {
      const application = await storage.updatePartnerApplication(req.params.id, req.body);
      res.json(application);
    } catch (error) {
      console.error("Error updating partner application:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ message: "Failed to update partner application", error: errorMessage });
    }
  });

  app.delete('/api/crm/partner-applications/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deletePartnerApplication(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting partner application:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to delete partner application", error: errorMessage });
    }
  });

  // ====== SUBSCRIPTION MANAGEMENT ROUTES ======

  // Public subscription plans (no auth required)
  app.get('/api/subscription-plans', async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch subscription plans", error: errorMessage });
    }
  });

  // User subscription status (authenticated)
  app.get('/api/subscription/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      const subscription = await storage.getUserSubscription(userId);
      const credits = await storage.getUserCredits(userId);

      res.json({
        user: {
          currentPlanType: user?.currentPlanType || 'free',
          subscriptionStatus: user?.subscriptionStatus,
          subscriptionCurrentPeriodEnd: user?.subscriptionCurrentPeriodEnd,
          creditBalance: credits.balance,
          creditLimit: credits.limit,
          monthlyAllocation: credits.monthlyAllocation
        },
        subscription: subscription || null
      });
    } catch (error) {
      console.error("Error fetching subscription status:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch subscription status", error: errorMessage });
    }
  });

  // Create Stripe checkout session
  app.post('/api/subscription/create-checkout', isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Stripe not configured. Please add STRIPE_SECRET_KEY environment variable." });
      }

      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { planType, isYearly = false } = req.body;
      
      // Get the subscription plan
      const plan = await storage.getSubscriptionPlanByType(planType);
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.email) {
        return res.status(400).json({ message: "User email required" });
      }

      // Get or create Stripe customer
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          metadata: { userId }
        });
        stripeCustomerId = customer.id;
        await storage.updateUserStripeInfo(userId, stripeCustomerId);
      }

      // Create Stripe checkout session
      const priceId = isYearly ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly;
      if (!priceId) {
        return res.status(400).json({ message: "Price ID not configured for this plan" });
      }

      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: `${req.headers.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/subscription/canceled`,
        metadata: {
          userId,
          planId: plan.id,
          planType: plan.planType,
          isYearly: isYearly.toString()
        }
      });

      res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to create checkout session", error: errorMessage });
    }
  });

  // Create Stripe billing portal session
  app.post('/api/subscription/billing-portal', isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Stripe not configured" });
      }

      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user?.stripeCustomerId) {
        return res.status(400).json({ message: "No Stripe customer found" });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${req.headers.origin}/subscription/dashboard`,
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating billing portal session:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to create billing portal session", error: errorMessage });
    }
  });

  // Cancel subscription
  app.post('/api/subscription/cancel', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const subscription = await storage.getUserSubscription(userId);
      if (!subscription) {
        return res.status(404).json({ message: "No active subscription found" });
      }

      // Cancel the subscription (it will remain active until period end)
      const canceledSubscription = await storage.cancelSubscription(subscription.id);
      
      // Update user subscription status
      await storage.updateUserSubscriptionStatus(userId, 'canceled');

      res.json({ 
        message: "Subscription canceled successfully. Access will continue until the end of your billing period.",
        subscription: canceledSubscription 
      });
    } catch (error) {
      console.error("Error canceling subscription:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to cancel subscription", error: errorMessage });
    }
  });

  // Get user invoices from Stripe
  app.get('/api/subscription/invoices', isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Stripe not configured" });
      }

      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user?.stripeCustomerId) {
        return res.json({ invoices: [] });
      }

      const invoices = await stripe.invoices.list({
        customer: user.stripeCustomerId,
        limit: 100,
      });

      const formattedInvoices = invoices.data.map(invoice => ({
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        amount_paid: invoice.amount_paid,
        created: invoice.created,
        invoice_pdf: invoice.invoice_pdf,
        hosted_invoice_url: invoice.hosted_invoice_url,
      }));

      res.json({ invoices: formattedInvoices });
    } catch (error) {
      console.error("Error fetching invoices:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch invoices", error: errorMessage });
    }
  });

  // ====== SUPPORT REQUEST ROUTES ======

  // Submit support request
  app.post('/api/support/request', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const supportRequestSchema = z.object({
        subject: z.string().min(1, "Subject is required"),
        priority: z.enum(["low", "medium", "high", "urgent"]),
        message: z.string().min(1, "Message is required"),
        includeSubscriptionInfo: z.boolean().optional().default(true),
      });

      const validatedData = supportRequestSchema.parse(req.body);

      const user = await storage.getUser(userId);
      const subscription = await storage.getUserSubscription(userId);

      console.log("=== SUPPORT REQUEST ===");
      console.log("From:", user?.email);
      console.log("User ID:", userId);
      console.log("Subject:", validatedData.subject);
      console.log("Priority:", validatedData.priority);
      console.log("Message:", validatedData.message);
      
      if (validatedData.includeSubscriptionInfo && subscription) {
        console.log("Current Plan:", user?.currentPlanType || 'free');
        console.log("Subscription Status:", subscription.status);
        console.log("Subscription ID:", subscription.stripeSubscriptionId);
      }
      console.log("======================");

      res.json({ 
        message: "Support request submitted successfully. Our team will get back to you soon.",
        success: true 
      });
    } catch (error) {
      console.error("Error submitting support request:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to submit support request", error: errorMessage });
    }
  });

  // ====== ONBOARDING PROGRESS ROUTES ======

  // Get onboarding progress for a specific flow
  app.get('/api/onboarding/progress/:flowKey', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { flowKey } = req.params;
      
      // Validate flow key
      const validFlowKeys = ['free_member', 'crm_pro', 'build_pro', 'admin'];
      if (!validFlowKeys.includes(flowKey)) {
        return res.status(400).json({ message: "Invalid flow key" });
      }

      const progress = await storage.getOnboardingProgress(userId, flowKey);
      res.json({ flowKey, progress });
    } catch (error) {
      console.error("Error fetching onboarding progress:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch onboarding progress", error: errorMessage });
    }
  });

  // Update onboarding progress for a specific flow
  app.put('/api/onboarding/progress/:flowKey', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { flowKey } = req.params;
      
      // Validate flow key
      const validFlowKeys = ['free_member', 'crm_pro', 'build_pro', 'admin'];
      if (!validFlowKeys.includes(flowKey)) {
        return res.status(400).json({ message: "Invalid flow key" });
      }

      // Validate request body
      const progressSchema = z.object({
        completed: z.boolean(),
        steps: z.record(z.boolean()),
        completedAt: z.string().optional()
      });

      const validatedProgress = progressSchema.parse(req.body);

      await storage.updateOnboardingProgress(userId, flowKey, validatedProgress);
      
      const updatedProgress = await storage.getOnboardingProgress(userId, flowKey);
      res.json({ 
        message: "Onboarding progress updated successfully", 
        flowKey, 
        progress: updatedProgress 
      });
    } catch (error) {
      console.error("Error updating onboarding progress:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", error: error.errors });
      }
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to update onboarding progress", error: errorMessage });
    }
  });

  // Mark a specific step as complete
  app.post('/api/onboarding/progress/:flowKey/step/:stepId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { flowKey, stepId } = req.params;
      
      // Validate flow key
      const validFlowKeys = ['free_member', 'crm_pro', 'build_pro', 'admin'];
      if (!validFlowKeys.includes(flowKey)) {
        return res.status(400).json({ message: "Invalid flow key" });
      }

      if (!stepId || typeof stepId !== 'string' || stepId.trim().length === 0) {
        return res.status(400).json({ message: "Invalid step ID" });
      }

      await storage.markOnboardingStepComplete(userId, flowKey, stepId);
      
      const updatedProgress = await storage.getOnboardingProgress(userId, flowKey);
      res.json({ 
        message: "Step marked as complete", 
        flowKey, 
        stepId,
        progress: updatedProgress 
      });
    } catch (error) {
      console.error("Error marking step complete:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to mark step complete", error: errorMessage });
    }
  });

  // Mark entire flow as complete
  app.post('/api/onboarding/progress/:flowKey/complete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { flowKey } = req.params;
      
      // Validate flow key
      const validFlowKeys = ['free_member', 'crm_pro', 'build_pro', 'admin'];
      if (!validFlowKeys.includes(flowKey)) {
        return res.status(400).json({ message: "Invalid flow key" });
      }

      await storage.markOnboardingComplete(userId, flowKey);
      
      const updatedProgress = await storage.getOnboardingProgress(userId, flowKey);
      res.json({ 
        message: "Onboarding flow marked as complete", 
        flowKey,
        progress: updatedProgress 
      });
    } catch (error) {
      console.error("Error marking flow complete:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to mark flow complete", error: errorMessage });
    }
  });

  // ====== CREDIT PURCHASE ROUTES ======

  // Create Stripe checkout session for credit purchase
  app.post('/api/stripe/create-credit-checkout', isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Stripe not configured. Please add STRIPE_SECRET_KEY environment variable." });
      }

      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { amount } = req.body;
      
      // Validate amount (minimum $5, in dollars)
      if (!amount || amount < 5) {
        return res.status(400).json({ message: "Amount must be at least $5" });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.email) {
        return res.status(400).json({ message: "User email required" });
      }

      // Get or create Stripe customer
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          metadata: { userId }
        });
        stripeCustomerId = customer.id;
        await storage.updateUserStripeInfo(userId, stripeCustomerId);
      }

      // Create pending credit purchase record
      const creditAmount = amount * 100; // Convert dollars to cents
      const creditPurchase = await storage.createCreditPurchase({
        userId,
        amount: creditAmount,
        status: 'pending'
      });

      // Create Stripe checkout session for one-time payment
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'AI Credits',
              description: `${creditAmount.toLocaleString()} AI credits`,
            },
            unit_amount: amount * 100, // Convert to cents for Stripe
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${req.headers.origin}/crm?credit_purchase=success`,
        cancel_url: `${req.headers.origin}/crm?credit_purchase=canceled`,
        metadata: {
          userId,
          creditPurchaseId: creditPurchase.id,
          creditAmount: creditAmount.toString(),
          type: 'credit_purchase'
        }
      });

      res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      console.error("Error creating credit checkout session:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to create checkout session", error: errorMessage });
    }
  });

  // Get user's credit purchase history
  app.get('/api/credit-purchases', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const purchases = await storage.getCreditPurchases(userId);
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching credit purchases:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch credit purchases", error: errorMessage });
    }
  });

  // AI Usage tracking
  app.post('/api/ai-usage/log', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { operationType, tokensPrompt, entityType, entityId, metadata } = req.body;
      
      // Check credits before logging
      const hasCredits = await storage.hasEnoughCredits(userId, tokensPrompt);
      if (!hasCredits) {
        const credits = await storage.getUserCredits(userId);
        return res.status(429).json({ 
          message: "Insufficient credits", 
          creditBalance: credits.balance 
        });
      }

      const subscription = await storage.getUserSubscription(userId);
      const usage = await storage.logAiUsage({
        userId,
        subscriptionId: subscription?.id || null,
        operationType,
        tokensPrompt,
        entityType: entityType || null,
        entityId: entityId || null,
        metadata: metadata || null
      });

      const credits = await storage.getUserCredits(userId);
      res.json({ 
        usage, 
        creditBalance: credits.balance 
      });
    } catch (error) {
      console.error("Error logging AI usage:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to log AI usage", error: errorMessage });
    }
  });

  // Get user AI usage history
  app.get('/api/ai-usage/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { startDate, endDate, limit = 100, offset = 0 } = req.query;
      
      const usage = await storage.getAiUsageLogs(userId);

      // Apply pagination manually since storage method doesn't support it
      const paginatedUsage = usage.slice(
        parseInt(offset as string), 
        parseInt(offset as string) + parseInt(limit as string)
      );

      res.json({
        usage: paginatedUsage,
        total: usage.length,
        hasMore: usage.length > parseInt(offset as string) + parseInt(limit as string)
      });
    } catch (error) {
      console.error("Error fetching AI usage history:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch AI usage history", error: errorMessage });
    }
  });

  // Stripe webhook handler
  app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).send('Stripe not configured');
      }

      const sig = req.headers['stripe-signature'];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      if (!sig || !webhookSecret) {
        return res.status(400).send('Missing signature or webhook secret');
      }

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return res.status(400).send('Webhook signature verification failed');
      }

      // Handle the event
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const { userId, planId, planType, isYearly, type, creditPurchaseId, creditAmount } = session.metadata || {};
          
          // Handle credit purchase
          if (type === 'credit_purchase' && userId && creditPurchaseId && creditAmount) {
            try {
              // Update credit purchase status to completed
              await storage.updateCreditPurchaseStatus(creditPurchaseId, 'completed');
              
              // Add credits to user's account
              const amount = parseInt(creditAmount);
              await storage.addCredits(userId, amount);
              
              console.log(`Credit purchase completed: ${amount} credits added to user ${userId}`);
            } catch (error) {
              console.error('Error processing credit purchase:', error);
              // Update status to failed
              await storage.updateCreditPurchaseStatus(creditPurchaseId, 'failed');
            }
          }
          // Handle subscription checkout
          else if (userId && planId && planType) {
            try {
              // Get the subscription plan to know credit allocation
              const plan = await storage.getSubscriptionPlan(planId);
              
              if (!plan) {
                console.error('Subscription plan not found:', planId);
                break;
              }

              // Create subscription record
              await storage.createSubscription({
                userId,
                planId,
                stripeSubscriptionId: session.subscription as string,
                stripeCustomerId: session.customer as string,
                stripePriceId: session.line_items?.data[0]?.price?.id || '',
                status: 'active',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + (isYearly === 'true' ? 365 : 30) * 24 * 60 * 60 * 1000),
                isYearly: isYearly === 'true'
              });

              // Update user subscription status
              await storage.updateUserSubscriptionStatus(userId, 'active');
              
              // Update user plan type and allocate credits
              await storage.updateUserPlanAndCredits(
                userId, 
                planType as 'free' | 'crm_basic' | 'crm_pro' | 'build_pro_bundle',
                plan.creditAllocation || 0,
                isYearly === 'true'
              );
              
              console.log(`Subscription created for user ${userId}: plan=${planType}, credits=${plan.creditAllocation}`);
            } catch (error) {
              console.error('Error processing subscription checkout:', error);
            }
          }
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          const user = await storage.getUserByStripeCustomerId(subscription.customer as string);
          
          if (user) {
            const sub = subscription as any;
            await storage.updateSubscriptionByStripeId(subscription.id, {
              status: subscription.status as any,
              currentPeriodStart: new Date(sub.current_period_start * 1000),
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
              nextBillingDate: new Date(sub.current_period_end * 1000)
            });

            await storage.updateUserSubscriptionStatus(
              user.id, 
              subscription.status as any,
              new Date(sub.current_period_end * 1000)
            );
            console.log('Subscription updated for user:', user.id);
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const user = await storage.getUserByStripeCustomerId(subscription.customer as string);
          
          if (user) {
            await storage.updateSubscriptionByStripeId(subscription.id, {
              status: 'canceled',
              canceledAt: new Date()
            });

            await storage.updateUserSubscriptionStatus(user.id, 'canceled');
            
            // Revert user to free plan - fetch the actual free plan allocation
            const freePlan = await storage.getSubscriptionPlanByType('free');
            const freeCredits = freePlan?.creditAllocation || 10; // Default to 10 cents if plan not found
            await storage.updateUserPlanAndCredits(user.id, 'free', freeCredits, false);
            
            console.log('Subscription canceled for user:', user.id, '- reverted to free plan');
          }
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          const user = await storage.getUserByStripeCustomerId(invoice.customer as string);
          
          if (user) {
            await storage.updateUserSubscriptionStatus(user.id, 'past_due');
            console.log('Payment failed for user:', user.id);
          }
          break;
        }

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Stripe webhook error:', error);
      res.status(500).json({ message: 'Webhook processing failed' });
    }
  });

  // Verify and manually process Stripe checkout session (fallback for when webhooks don't fire)
  app.get('/api/subscription/verify-session/:sessionId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!stripe) {
        return res.status(503).json({ message: 'Stripe not configured' });
      }

      const { sessionId } = req.params;

      // Fetch the complete session from Stripe including metadata and line items
      let session: Stripe.Checkout.Session;
      try {
        session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ['line_items', 'customer', 'subscription']
        });
      } catch (error) {
        console.error('Error fetching Stripe session:', error);
        return res.status(404).json({ 
          message: 'Invalid session ID or session not found',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Check if the session is complete and paid
      if (session.payment_status !== 'paid') {
        return res.status(400).json({ 
          message: 'Session payment not complete',
          paymentStatus: session.payment_status,
          session: {
            id: session.id,
            status: session.status,
            paymentStatus: session.payment_status
          }
        });
      }

      const { userId: sessionUserId, planId, planType, isYearly, type, creditPurchaseId, creditAmount } = session.metadata || {};

      // Verify the session belongs to the authenticated user
      if (sessionUserId !== userId) {
        return res.status(403).json({ 
          message: 'This session does not belong to you',
          sessionUserId,
          authenticatedUserId: userId
        });
      }

      // Get current user data
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      let processed = false;
      let alreadyProcessed = false;
      let result: any = {
        session: {
          id: session.id,
          paymentStatus: session.payment_status,
          status: session.status,
          metadata: session.metadata
        },
        user: {
          id: user.id,
          email: user.email,
          currentPlanType: user.currentPlanType,
          subscriptionStatus: user.subscriptionStatus
        }
      };

      // Handle credit purchase
      if (type === 'credit_purchase' && creditPurchaseId && creditAmount) {
        const creditPurchase = await storage.getCreditPurchase(creditPurchaseId);
        
        if (creditPurchase?.status === 'completed') {
          console.log(`[VERIFY SESSION] Credit purchase already processed: ${creditPurchaseId}`);
          alreadyProcessed = true;
          result.creditPurchase = creditPurchase;
        } else {
          try {
            await storage.updateCreditPurchaseStatus(creditPurchaseId, 'completed');
            const amount = parseInt(creditAmount);
            await storage.addCredits(userId, amount);
            
            console.log(`[MANUAL SYNC] Credit purchase processed: ${amount} credits added to user ${userId}`);
            processed = true;
            
            const updatedCreditPurchase = await storage.getCreditPurchase(creditPurchaseId);
            const updatedCredits = await storage.getUserCredits(userId);
            
            result.creditPurchase = updatedCreditPurchase;
            result.credits = updatedCredits;
          } catch (error) {
            console.error('[VERIFY SESSION] Error processing credit purchase:', error);
            await storage.updateCreditPurchaseStatus(creditPurchaseId, 'failed');
            return res.status(500).json({ 
              message: 'Failed to process credit purchase',
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      }
      // Handle subscription checkout
      else if (planId && planType) {
        // Check if user is already on the target plan
        const currentPlanType = user.currentPlanType || 'free';
        const targetPlanType = planType as 'free' | 'crm_basic' | 'crm_pro' | 'build_pro_bundle';
        
        // Check if subscription already exists for this Stripe subscription
        const stripeSubscriptionId = session.subscription as string;
        let existingSubscription = null;
        
        if (stripeSubscriptionId) {
          existingSubscription = await storage.getSubscriptionByStripeId(stripeSubscriptionId);
        }

        if (existingSubscription) {
          console.log(`[VERIFY SESSION] Subscription already processed for Stripe subscription: ${stripeSubscriptionId}`);
          alreadyProcessed = true;
          result.subscription = existingSubscription;
          result.plan = await storage.getSubscriptionPlan(existingSubscription.planId);
        } else if (currentPlanType === targetPlanType && user.subscriptionStatus === 'active') {
          console.log(`[VERIFY SESSION] User already on target plan: ${targetPlanType}`);
          alreadyProcessed = true;
          const currentSubscription = await storage.getUserSubscription(userId);
          result.subscription = currentSubscription;
          if (currentSubscription) {
            result.plan = await storage.getSubscriptionPlan(currentSubscription.planId);
          }
        } else {
          // Manually process the subscription
          try {
            const plan = await storage.getSubscriptionPlan(planId);
            
            if (!plan) {
              return res.status(404).json({ 
                message: 'Subscription plan not found',
                planId 
              });
            }

            // Create subscription record
            const newSubscription = await storage.createSubscription({
              userId,
              planId,
              stripeSubscriptionId: stripeSubscriptionId || '',
              stripeCustomerId: session.customer as string,
              stripePriceId: session.line_items?.data[0]?.price?.id || '',
              status: 'active',
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + (isYearly === 'true' ? 365 : 30) * 24 * 60 * 60 * 1000),
              isYearly: isYearly === 'true'
            });

            // Update user subscription status
            await storage.updateUserSubscriptionStatus(userId, 'active');
            
            // Update user plan type and allocate credits
            await storage.updateUserPlanAndCredits(
              userId, 
              targetPlanType,
              plan.creditAllocation || 0,
              isYearly === 'true'
            );
            
            console.log(`[MANUAL SYNC] Subscription created for user ${userId}: plan=${planType}, credits=${plan.creditAllocation}`);
            processed = true;
            
            result.subscription = newSubscription;
            result.plan = plan;
            result.credits = await storage.getUserCredits(userId);
          } catch (error) {
            console.error('[VERIFY SESSION] Error processing subscription:', error);
            return res.status(500).json({ 
              message: 'Failed to process subscription',
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      } else {
        return res.status(400).json({ 
          message: 'Invalid session metadata - missing required fields',
          metadata: session.metadata
        });
      }

      // Get updated user data
      const updatedUser = await storage.getUser(userId);
      result.user = {
        id: updatedUser!.id,
        email: updatedUser!.email,
        currentPlanType: updatedUser!.currentPlanType,
        subscriptionStatus: updatedUser!.subscriptionStatus,
        creditBalance: updatedUser!.creditBalance,
        creditLimit: updatedUser!.creditLimit,
        monthlyAllocation: updatedUser!.monthlyAllocation
      };

      res.json({
        ...result,
        processed,
        alreadyProcessed,
        message: processed 
          ? 'Session processed successfully - subscription activated' 
          : alreadyProcessed 
            ? 'Session already processed by webhook or previous verification'
            : 'Session verified'
      });

    } catch (error) {
      console.error('[VERIFY SESSION] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ 
        message: 'Failed to verify session', 
        error: errorMessage 
      });
    }
  });

  // Admin subscription management routes
  app.get('/api/admin/subscriptions', isAuthenticated, async (req: any, res) => {
    try {
      // TODO: Add admin role check here
      const { limit = 50, offset = 0, status } = req.query;
      
      let subscriptions;
      if (status) {
        subscriptions = await storage.getSubscriptionsByStatus(
          status as any,
          parseInt(limit as string),
          parseInt(offset as string)
        );
      } else {
        subscriptions = await storage.getAllSubscriptions(
          parseInt(limit as string),
          parseInt(offset as string)
        );
      }

      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching admin subscriptions:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch subscriptions", error: errorMessage });
    }
  });

  app.get('/api/admin/subscription-stats', isAuthenticated, async (req, res) => {
    try {
      // TODO: Add admin role check here
      const stats = await storage.getSubscriptionStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching subscription stats:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch subscription stats", error: errorMessage });
    }
  });

  // Admin dashboard stats endpoint
  app.get('/api/admin/stats', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      // Get aggregated platform statistics
      const [usersResult, enterprisesResult, aiUsageResult, subscriptionStats] = await Promise.all([
        db.select({ count: count() }).from(users),
        db.select({ count: count() }).from(enterprises),
        db.execute<{ total_tokens: number }>(sql`
          SELECT COALESCE(SUM(tokens_used), 0) as total_tokens 
          FROM ai_usage_logs
        `),
        storage.getSubscriptionStats()
      ]);

      const totalUsers = usersResult[0]?.count || 0;
      const totalEnterprises = enterprisesResult[0]?.count || 0;
      const totalAiTokens = aiUsageResult.rows[0]?.total_tokens || 0;
      const activeSubscriptions = subscriptionStats.byStatus?.active || 0;

      res.json({
        totalUsers,
        totalEnterprises,
        totalAiTokens,
        activeSubscriptions,
        subscriptionStats
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch admin stats", error: errorMessage });
    }
  });

  // Admin activity logs endpoint
  app.get('/api/admin/activity', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { limit = 10 } = req.query;
      
      const activities = await storage.getAuditLogs({
        limit: parseInt(limit as string)
      });

      res.json({ activities });
    } catch (error) {
      console.error("Error fetching admin activity:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch admin activity", error: errorMessage });
    }
  });

  // User Management API Routes (Admin Only)
  // GET /api/admin/users - List all users with pagination, search, and filters
  app.get('/api/admin/users', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const { 
        limit = 50, 
        offset = 0, 
        search = '', 
        role, 
        subscriptionStatus 
      } = req.query;

      // Build filters
      const conditions = [];
      
      if (search) {
        conditions.push(
          or(
            like(users.email, `%${search}%`),
            like(users.firstName, `%${search}%`),
            like(users.lastName, `%${search}%`)
          )
        );
      }
      
      if (role) {
        conditions.push(eq(users.role, role as any));
      }
      
      if (subscriptionStatus) {
        conditions.push(eq(users.subscriptionStatus, subscriptionStatus as any));
      }

      // Get total count
      const countResult = await db
        .select({ count: count() })
        .from(users)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      const total = countResult[0]?.count || 0;

      // Get paginated users
      const usersList = await db
        .select()
        .from(users)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(users.createdAt))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));

      await createAuditLog(req, {
        userId,
        actionType: 'feature',
        tableName: 'users',
        metadata: { 
          action: 'list_users', 
          userCount: usersList.length, 
          filters: { search, role, subscriptionStatus } 
        },
      });

      res.json({
        users: usersList,
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to fetch users", message: errorMessage });
    }
  });

  // PATCH /api/admin/users/:userId - Update user (role, credits, etc.)
  app.patch('/api/admin/users/:userId', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const adminUserId = (req.user as any)?.claims?.sub;
      const { userId } = req.params;
      const updates = req.body;

      // Validate allowed updates
      const allowedFields = ['role', 'creditBalance', 'creditLimit', 'monthlyAllocation', 'overageAllowed', 'subscriptionStatus', 'currentPlanType'];
      const updateData: any = {};

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          updateData[field] = updates[field];
        }
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      updateData.updatedAt = new Date();

      // Update user
      const [updatedUser] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      await createAuditLog(req, {
        userId: adminUserId,
        actionType: 'update',
        tableName: 'users',
        recordId: userId,
        changes: updateData,
        metadata: { action: 'update_user', targetUserId: userId },
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to update user", message: errorMessage });
    }
  });

  // GET /api/admin/users/:userId/usage - Get user's AI usage logs
  app.get('/api/admin/users/:userId/usage', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const usageLogs = await db
        .select()
        .from(aiUsageLogs)
        .where(eq(aiUsageLogs.userId, userId))
        .orderBy(desc(aiUsageLogs.createdAt))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));

      const countResult = await db
        .select({ count: count() })
        .from(aiUsageLogs)
        .where(eq(aiUsageLogs.userId, userId));

      const total = countResult[0]?.count || 0;

      res.json({
        usage: usageLogs,
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });
    } catch (error) {
      console.error("Error fetching user usage:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to fetch user usage", message: errorMessage });
    }
  });

  // Subscription plan management (admin only)
  app.post('/api/admin/subscription-plans', isAuthenticated, async (req, res) => {
    try {
      // TODO: Add admin role check here
      const validatedData = insertSubscriptionPlanSchema.parse(req.body);
      const plan = await storage.createSubscriptionPlan(validatedData);
      res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating subscription plan:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ message: "Failed to create subscription plan", error: errorMessage });
    }
  });

  // Murmurations profile hosting endpoint (public, no auth required)
  app.get('/api/murmurations/profiles/:enterpriseId.json', async (req, res) => {
    try {
      const { enterpriseId } = req.params;
      
      const enterprise = await storage.getEnterprise(enterpriseId);
      if (!enterprise) {
        return res.status(404).json({ error: "Enterprise not found" });
      }

      const profile = generateMurmurationsProfile(enterprise);

      res.set({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });

      res.json(profile);
    } catch (error) {
      console.error("Error generating Murmurations profile:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to generate profile", message: errorMessage });
    }
  });

  // Database Admin API Routes
  // GET /api/admin/database/tables - List all database tables with metadata
  app.get('/api/admin/database/tables', isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const tables = await listTables();

      await createAuditLog(req, {
        userId,
        actionType: 'feature',
        metadata: { action: 'list_database_tables', tableCount: tables.length },
      });

      res.json({ tables });
    } catch (error) {
      console.error("Error listing database tables:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to list database tables", message: errorMessage });
    }
  });

  // GET /api/admin/database/tables/:tableName/schema - Get table schema details
  app.get('/api/admin/database/tables/:tableName/schema', isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const { tableName } = req.params;

      const schema = await getTableSchema(tableName);

      await createAuditLog(req, {
        userId,
        actionType: 'feature',
        metadata: { action: 'get_table_schema', tableName },
      });

      res.json(schema);
    } catch (error) {
      console.error("Error getting table schema:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      if (errorMessage.includes('not allowed') || errorMessage.includes('Invalid table')) {
        return res.status(400).json({ error: errorMessage });
      }
      
      res.status(500).json({ error: "Failed to get table schema", message: errorMessage });
    }
  });

  // GET /api/admin/database/tables/:tableName/data - Get table data with pagination, filtering, sorting
  app.get('/api/admin/database/tables/:tableName/data', isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const { tableName } = req.params;
      const { limit, offset, orderBy, orderDir, ...filters } = req.query;

      const result = await getTableData(tableName, {
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0,
        orderBy: orderBy as string,
        orderDir: (orderDir as 'asc' | 'desc') || 'desc',
        filters: filters as Record<string, any>,
      });

      await createAuditLog(req, {
        userId,
        actionType: 'feature',
        metadata: { 
          action: 'get_table_data', 
          tableName, 
          recordCount: result.data.length,
          filters 
        },
      });

      res.json(result);
    } catch (error) {
      console.error("Error getting table data:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      if (errorMessage.includes('not allowed') || errorMessage.includes('Invalid table')) {
        return res.status(400).json({ error: errorMessage });
      }
      
      res.status(500).json({ error: "Failed to get table data", message: errorMessage });
    }
  });

  // POST /api/admin/database/tables/:tableName/data - Create new record in any table
  app.post('/api/admin/database/tables/:tableName/data', isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const { tableName } = req.params;
      const data = req.body;

      const record = await createTableRecord(tableName, data);

      await createAuditLog(req, {
        userId,
        actionType: 'create',
        tableName,
        recordId: record.id,
        changes: data,
        metadata: { action: 'create_record', tableName },
      });

      res.status(201).json(record);
    } catch (error) {
      console.error("Error creating table record:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      if (errorMessage.includes('not allowed') || errorMessage.includes('Invalid table') || errorMessage.includes('No valid data')) {
        return res.status(400).json({ error: errorMessage });
      }
      
      await createAuditLog(req, {
        userId: (req.user as any)?.claims?.sub,
        actionType: 'create',
        tableName: req.params.tableName,
        success: false,
        errorMessage,
      });
      
      res.status(500).json({ error: "Failed to create record", message: errorMessage });
    }
  });

  // PATCH /api/admin/database/tables/:tableName/data/:id - Update record by ID
  app.patch('/api/admin/database/tables/:tableName/data/:id', isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const { tableName, id } = req.params;
      const data = req.body;

      const record = await updateTableRecord(tableName, id, data);

      await createAuditLog(req, {
        userId,
        actionType: 'update',
        tableName,
        recordId: id,
        changes: data,
        metadata: { action: 'update_record', tableName },
      });

      res.json(record);
    } catch (error) {
      console.error("Error updating table record:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      if (errorMessage.includes('not allowed') || errorMessage.includes('Invalid table') || errorMessage.includes('No valid data')) {
        return res.status(400).json({ error: errorMessage });
      }
      
      if (errorMessage.includes('not found')) {
        return res.status(404).json({ error: errorMessage });
      }
      
      await createAuditLog(req, {
        userId: (req.user as any)?.claims?.sub,
        actionType: 'update',
        tableName: req.params.tableName,
        recordId: req.params.id,
        success: false,
        errorMessage,
      });
      
      res.status(500).json({ error: "Failed to update record", message: errorMessage });
    }
  });

  // DELETE /api/admin/database/tables/:tableName/data/:id - Delete record by ID
  app.delete('/api/admin/database/tables/:tableName/data/:id', isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const { tableName, id } = req.params;

      await deleteTableRecord(tableName, id);

      await createAuditLog(req, {
        userId,
        actionType: 'delete',
        tableName,
        recordId: id,
        metadata: { action: 'delete_record', tableName },
      });

      res.json({ success: true, message: "Record deleted successfully" });
    } catch (error) {
      console.error("Error deleting table record:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      if (errorMessage.includes('not allowed') || errorMessage.includes('Invalid table')) {
        return res.status(400).json({ error: errorMessage });
      }
      
      if (errorMessage.includes('not found')) {
        return res.status(404).json({ error: errorMessage });
      }
      
      await createAuditLog(req, {
        userId: (req.user as any)?.claims?.sub,
        actionType: 'delete',
        tableName: req.params.tableName,
        recordId: req.params.id,
        success: false,
        errorMessage,
      });
      
      res.status(500).json({ error: "Failed to delete record", message: errorMessage });
    }
  });

  // POST /api/admin/database/tables/:tableName/bulk-delete - Bulk delete records
  app.post('/api/admin/database/tables/:tableName/bulk-delete', isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const { tableName } = req.params;
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "Invalid or empty ids array" });
      }

      const deletedCount = await bulkDeleteTableRecords(tableName, ids);

      await createAuditLog(req, {
        userId,
        actionType: 'bulk_operation',
        tableName,
        metadata: { 
          action: 'bulk_delete', 
          tableName, 
          deletedCount,
          ids 
        },
      });

      res.json({ success: true, deletedCount, message: `${deletedCount} records deleted successfully` });
    } catch (error) {
      console.error("Error bulk deleting table records:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      if (errorMessage.includes('not allowed') || errorMessage.includes('Invalid table')) {
        return res.status(400).json({ error: errorMessage });
      }
      
      await createAuditLog(req, {
        userId: (req.user as any)?.claims?.sub,
        actionType: 'bulk_operation',
        tableName: req.params.tableName,
        success: false,
        errorMessage,
        metadata: { action: 'bulk_delete' },
      });
      
      res.status(500).json({ error: "Failed to bulk delete records", message: errorMessage });
    }
  });

  // POST /api/admin/database/tables/:tableName/export - Export table data as CSV/JSON
  app.post('/api/admin/database/tables/:tableName/export', isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const { tableName } = req.params;
      const { format = 'json', filters = {} } = req.body;

      if (!['json', 'csv'].includes(format)) {
        return res.status(400).json({ error: "Invalid format. Must be 'json' or 'csv'" });
      }

      const result = await getTableData(tableName, {
        limit: 10000,
        offset: 0,
        filters: filters as Record<string, any>,
      });

      await createAuditLog(req, {
        userId,
        actionType: 'export',
        tableName,
        metadata: { 
          action: 'export_table_data', 
          tableName, 
          format,
          recordCount: result.data.length 
        },
      });

      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${tableName}_export.json"`);
        res.json(result.data);
      } else if (format === 'csv') {
        if (result.data.length === 0) {
          return res.status(400).json({ error: "No data to export" });
        }

        const headers = Object.keys(result.data[0]);
        const csvRows = [
          headers.join(','),
          ...result.data.map(row => 
            headers.map(header => {
              const value = row[header];
              if (value === null || value === undefined) return '';
              const stringValue = String(value);
              if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
              }
              return stringValue;
            }).join(',')
          )
        ];

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${tableName}_export.csv"`);
        res.send(csvRows.join('\n'));
      }
    } catch (error) {
      console.error("Error exporting table data:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      if (errorMessage.includes('not allowed') || errorMessage.includes('Invalid table')) {
        return res.status(400).json({ error: errorMessage });
      }
      
      await createAuditLog(req, {
        userId: (req.user as any)?.claims?.sub,
        actionType: 'export',
        tableName: req.params.tableName,
        success: false,
        errorMessage,
      });
      
      res.status(500).json({ error: "Failed to export table data", message: errorMessage });
    }
  });

  // POST /api/admin/database/tables/:tableName/import - Import data from CSV/JSON
  app.post('/api/admin/database/tables/:tableName/import', isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const { tableName } = req.params;
      const { format = 'json', data: importData, csvData } = req.body;

      if (!['json', 'csv'].includes(format)) {
        return res.status(400).json({ error: "Invalid format. Must be 'json' or 'csv'" });
      }

      let records: any[] = [];

      if (format === 'json') {
        if (!Array.isArray(importData)) {
          return res.status(400).json({ error: "Import data must be an array of records" });
        }
        records = importData;
      } else if (format === 'csv') {
        if (!csvData || typeof csvData !== 'string') {
          return res.status(400).json({ error: "CSV data must be provided as a string" });
        }

        const csvBuffer = Buffer.from(csvData, 'utf-8');
        records = await parseCSVStream(csvBuffer);
      }

      if (records.length === 0) {
        return res.status(400).json({ error: "No records to import" });
      }

      validateTableName(tableName);

      const results = {
        success: 0,
        failed: 0,
        errors: [] as Array<{ index: number; error: string }>,
      };

      for (let i = 0; i < records.length; i++) {
        try {
          await createTableRecord(tableName, records[i]);
          results.success++;
        } catch (error) {
          results.failed++;
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          results.errors.push({ index: i, error: errorMessage });
        }
      }

      await createAuditLog(req, {
        userId,
        actionType: 'import',
        tableName,
        metadata: { 
          action: 'import_table_data', 
          tableName, 
          format,
          totalRecords: records.length,
          successCount: results.success,
          failedCount: results.failed
        },
      });

      res.json({
        message: "Import completed",
        results,
      });
    } catch (error) {
      console.error("Error importing table data:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      if (errorMessage.includes('not allowed') || errorMessage.includes('Invalid table')) {
        return res.status(400).json({ error: errorMessage });
      }
      
      await createAuditLog(req, {
        userId: (req.user as any)?.claims?.sub,
        actionType: 'import',
        tableName: req.params.tableName,
        success: false,
        errorMessage,
      });
      
      res.status(500).json({ error: "Failed to import table data", message: errorMessage });
    }
  });

  // Integration Management Admin Routes
  app.get('/api/admin/integrations', isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { status } = req.query;
      const integrations = await integrationService.getAllIntegrations(status as any);

      await createAuditLog(req, {
        userId,
        actionType: 'feature',
        tableName: 'integration_configs',
        metadata: { action: 'list_integrations', status }
      });

      res.json(integrations);
    } catch (error) {
      console.error("Error fetching integrations:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to fetch integrations", message: errorMessage });
    }
  });

  app.get('/api/admin/integrations/:id', isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { id } = req.params;
      const integration = await integrationService.getIntegration(id);

      if (!integration) {
        return res.status(404).json({ error: "Integration not found" });
      }

      await createAuditLog(req, {
        userId,
        actionType: 'feature',
        tableName: 'integration_configs',
        recordId: id,
        metadata: { action: 'view_integration' }
      });

      res.json(integration);
    } catch (error) {
      console.error("Error fetching integration:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to fetch integration", message: errorMessage });
    }
  });

  app.post('/api/admin/integrations', isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const validatedData = insertIntegrationConfigSchema.parse(req.body);
      const integration = await integrationService.createIntegration(validatedData);

      await createAuditLog(req, {
        userId,
        actionType: 'create',
        tableName: 'integration_configs',
        recordId: integration.id,
        changes: { name: integration.name, displayName: integration.displayName },
        metadata: { action: 'create_integration' }
      });

      res.status(201).json(integration);
    } catch (error) {
      console.error("Error creating integration:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      await createAuditLog(req, {
        userId: (req.user as any)?.claims?.sub,
        actionType: 'create',
        tableName: 'integration_configs',
        success: false,
        errorMessage
      });

      res.status(500).json({ error: "Failed to create integration", message: errorMessage });
    }
  });

  app.patch('/api/admin/integrations/:id', isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { id } = req.params;
      const existingIntegration = await integrationService.getIntegration(id);

      if (!existingIntegration) {
        return res.status(404).json({ error: "Integration not found" });
      }

      const validatedData = insertIntegrationConfigSchema.partial().parse(req.body);
      const integration = await integrationService.updateIntegration(id, validatedData);

      await createAuditLog(req, {
        userId,
        actionType: 'update',
        tableName: 'integration_configs',
        recordId: id,
        changes: validatedData,
        metadata: { action: 'update_integration' }
      });

      res.json(integration);
    } catch (error) {
      console.error("Error updating integration:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      await createAuditLog(req, {
        userId: (req.user as any)?.claims?.sub,
        actionType: 'update',
        tableName: 'integration_configs',
        recordId: req.params.id,
        success: false,
        errorMessage
      });

      res.status(500).json({ error: "Failed to update integration", message: errorMessage });
    }
  });

  app.delete('/api/admin/integrations/:id', isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { id } = req.params;
      const existingIntegration = await integrationService.getIntegration(id);

      if (!existingIntegration) {
        return res.status(404).json({ error: "Integration not found" });
      }

      await integrationService.deleteIntegration(id);

      await createAuditLog(req, {
        userId,
        actionType: 'delete',
        tableName: 'integration_configs',
        recordId: id,
        metadata: { action: 'delete_integration', name: existingIntegration.name }
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting integration:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      await createAuditLog(req, {
        userId: (req.user as any)?.claims?.sub,
        actionType: 'delete',
        tableName: 'integration_configs',
        recordId: req.params.id,
        success: false,
        errorMessage
      });

      res.status(500).json({ error: "Failed to delete integration", message: errorMessage });
    }
  });

  app.post('/api/admin/integrations/:id/test', isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { id } = req.params;
      const testResult = await integrationService.testConnection(id);

      await createAuditLog(req, {
        userId,
        actionType: 'test_integration',
        tableName: 'integration_configs',
        recordId: id,
        metadata: { 
          action: 'test_connection',
          success: testResult.success,
          message: testResult.message,
          responseTime: testResult.responseTime
        }
      });

      res.json(testResult);
    } catch (error) {
      console.error("Error testing integration:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      await createAuditLog(req, {
        userId: (req.user as any)?.claims?.sub,
        actionType: 'test_integration',
        tableName: 'integration_configs',
        recordId: req.params.id,
        success: false,
        errorMessage
      });

      res.status(500).json({ error: "Failed to test integration", message: errorMessage });
    }
  });

  app.get('/api/admin/integrations/:id/health', isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { id } = req.params;
      const healthStatus = await integrationService.getHealthStatus(id);

      await createAuditLog(req, {
        userId,
        actionType: 'feature',
        tableName: 'integration_configs',
        recordId: id,
        metadata: { 
          action: 'check_health',
          healthy: healthStatus.healthy,
          responseTime: healthStatus.responseTime
        }
      });

      res.json(healthStatus);
    } catch (error) {
      console.error("Error checking integration health:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to check integration health", message: errorMessage });
    }
  });

  // AI Database Agent routes
  app.post('/api/admin/ai-agent/chat', isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { message, conversationId } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: "Message is required" });
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const sendEvent = (data: any) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      try {
        const response = await aiAgent.chat(
          userId,
          message,
          conversationId,
          (chunk) => {
            sendEvent(chunk);
          }
        );

        sendEvent({ type: 'final', response });
        res.end();

        await createAuditLog(req, {
          userId,
          actionType: 'feature',
          tableName: 'ai_agent_conversations',
          metadata: { 
            action: 'chat',
            conversationId: response.conversationId,
            toolCallsCount: response.toolCalls?.length || 0,
            messageLength: message.length
          }
        });
      } catch (error) {
        console.error("Error in AI agent chat:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        
        if (error instanceof InsufficientCreditsError) {
          sendEvent({ 
            type: 'error', 
            error: errorMessage,
            errorType: 'insufficient_credits'
          });
        } else {
          sendEvent({ type: 'error', error: errorMessage });
        }
        
        res.end();

        await createAuditLog(req, {
          userId,
          actionType: 'feature',
          tableName: 'ai_agent_conversations',
          success: false,
          errorMessage
        });
      }
    } catch (error) {
      console.error("Error setting up AI agent chat stream:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to initialize chat stream", message: errorMessage });
      }
    }
  });

  app.get('/api/admin/ai-agent/history/:conversationId', isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { conversationId } = req.params;
      
      if (!conversationId) {
        return res.status(400).json({ error: "Conversation ID is required" });
      }

      const history = aiAgent.getConversationHistory(conversationId);

      await createAuditLog(req, {
        userId,
        actionType: 'feature',
        tableName: 'ai_agent_conversations',
        recordId: conversationId,
        metadata: { 
          action: 'get_history',
          messageCount: history.length
        }
      });

      res.json({ 
        conversationId,
        messageCount: history.length,
        messages: history 
      });
    } catch (error) {
      console.error("Error fetching conversation history:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to fetch conversation history", message: errorMessage });
    }
  });

  app.delete('/api/admin/ai-agent/history/:conversationId', isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { conversationId } = req.params;
      
      if (!conversationId) {
        return res.status(400).json({ error: "Conversation ID is required" });
      }

      aiAgent.clearConversationHistory(conversationId);

      await createAuditLog(req, {
        userId,
        actionType: 'delete',
        tableName: 'ai_agent_conversations',
        recordId: conversationId,
        metadata: { 
          action: 'clear_history'
        }
      });

      res.json({ 
        success: true,
        message: `Conversation ${conversationId} history cleared`
      });
    } catch (error) {
      console.error("Error clearing conversation history:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to clear conversation history", message: errorMessage });
    }
  });

  app.get('/api/admin/ai-agent/tools', isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const tools = aiAgent.getAvailableTools();
      const toolStats = aiAgent.getToolStats();

      await createAuditLog(req, {
        userId,
        actionType: 'feature',
        tableName: 'agent_tools',
        metadata: { 
          action: 'list_tools',
          toolCount: tools.length
        }
      });

      res.json({ 
        toolCount: tools.length,
        tools: tools.map(tool => ({
          name: tool.function.name,
          description: tool.function.description,
          parameters: tool.function.parameters,
          stats: toolStats[tool.function.name] || { usageCount: 0, successCount: 0 }
        }))
      });
    } catch (error) {
      console.error("Error listing AI agent tools:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to list tools", message: errorMessage });
    }
  });

  // External API Integration routes
  app.use('/api/integrations', isAuthenticated, integrationRouters);

  // CSV Import routes
  app.use('/api/imports', isAuthenticated, importRouters);

  // Team invitation routes
  app.use('/api/enterprises', isAuthenticated, enterpriseTeamRouter);
  app.use('/api/team', isAuthenticated, teamInvitationRouter);

  const httpServer = createServer(app);
  return httpServer;
}
