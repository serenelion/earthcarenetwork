import express, { type Express, type RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
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
import { 
  insertEnterpriseSchema,
  editorEnterpriseUpdateSchema,
  adminEnterpriseUpdateSchema,
  ownerEnterpriseUpdateSchema,
  insertPersonSchema,
  insertOpportunitySchema,
  insertTaskSchema,
  insertCopilotContextSchema,
  insertBusinessContextSchema,
  insertConversationSchema,
  insertChatMessageSchema,
  insertCustomFieldSchema,
  insertPartnerApplicationSchema,
  insertOpportunityTransferSchema,
  insertSubscriptionPlanSchema,
  insertSubscriptionSchema,
  insertAiUsageLogSchema,
  insertUserFavoriteSchema,
  insertProfileClaimSchema,
  insertEarthCarePledgeSchema,
  opportunities,
  enterprises,
  people,
  enterpriseOwners,
  users
} from "@shared/schema";
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
function requireRole(roles: Array<'visitor' | 'member' | 'enterprise_owner' | 'admin'>): RequestHandler {
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

// Middleware for person/opportunity editing: allows admin OR team member with appropriate role
const requireAdminOrEnterpriseAccess = (minRole: TeamMemberRole = 'editor'): RequestHandler => {
  return async (req: any, res, next) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Admins can access anything
      if (user.role === 'admin') {
        return next();
      }

      // For non-admins, check enterprise membership
      // Get the enterprise ID from the related entity (person or opportunity)
      const entityId = req.params.id;
      if (!entityId) {
        return res.status(400).json({ message: "Entity ID is required" });
      }

      let enterpriseId: string | null = null;

      // Determine if this is a person or opportunity based on the route
      if (req.path.includes('/people/')) {
        const person = await storage.getPerson(entityId);
        if (!person) {
          return res.status(404).json({ message: "Person not found" });
        }
        enterpriseId = person.enterpriseId;
      } else if (req.path.includes('/opportunities/')) {
        const opportunity = await storage.getOpportunity(entityId);
        if (!opportunity) {
          return res.status(404).json({ message: "Opportunity not found" });
        }
        enterpriseId = opportunity.enterpriseId;
      }

      if (!enterpriseId) {
        return res.status(403).json({ 
          message: "Forbidden - no enterprise association found" 
        });
      }

      // Check if user has appropriate role in the enterprise
      const roleHierarchy: Record<TeamMemberRole, number> = {
        'viewer': 1,
        'editor': 2,
        'admin': 3,
        'owner': 4
      };

      const userRole = await getUserEnterpriseRole(userId, enterpriseId);
      
      if (!userRole) {
        return res.status(403).json({ 
          message: "Forbidden - not a member of the associated enterprise" 
        });
      }

      const userRoleLevel = roleHierarchy[userRole];
      const requiredRoleLevel = roleHierarchy[minRole];

      if (userRoleLevel < requiredRoleLevel) {
        return res.status(403).json({ 
          message: "Forbidden - insufficient permissions on the associated enterprise",
          requiredRole: minRole,
          currentRole: userRole
        });
      }

      next();
    } catch (error) {
      console.error("Error checking admin or enterprise access:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
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

  // Get contacts for a specific enterprise (needed for claiming system)
  app.get('/api/enterprises/:id/contacts', async (req, res) => {
    try {
      const contacts = await storage.getPeopleByEnterpriseId(req.params.id);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching enterprise contacts:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch enterprise contacts", error: errorMessage });
    }
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

      // Update user's role to enterprise_owner and increment claimed profiles count
      await db.update(users)
        .set({ 
          role: 'enterprise_owner',
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

  // Global search route
  app.get('/api/search', async (req, res) => {
    try {
      const { q: query, type: entityTypes, limit = 20, offset = 0 } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }

      if (query.trim().length < 2) {
        return res.status(400).json({ message: "Query must be at least 2 characters long" });
      }

      // Parse entity types filter
      let entityTypesArray: string[] | undefined;
      if (entityTypes) {
        if (typeof entityTypes === 'string') {
          entityTypesArray = entityTypes.split(',').map(t => t.trim()).filter(Boolean);
        } else if (Array.isArray(entityTypes)) {
          entityTypesArray = entityTypes as string[];
        }
      }

      const searchResults = await storage.globalSearch(
        query.trim(),
        entityTypesArray,
        parseInt(limit as string) || 20,
        parseInt(offset as string) || 0
      );

      res.json(searchResults);
    } catch (error) {
      console.error("Error performing global search:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Search failed", error: errorMessage });
    }
  });

  // Protected CRM Routes
  app.get('/api/crm/:enterpriseId/stats', isAuthenticated, requireEnterpriseRole('viewer'), async (req: any, res) => {
    try {
      const { enterpriseId } = req.params;
      const [enterpriseStats, peopleStats, opportunityStats, taskStats] = await Promise.all([
        storage.getEnterpriseStats(),
        storage.getPeopleStats(enterpriseId),
        storage.getOpportunityStats(enterpriseId),
        storage.getTaskStats(enterpriseId),
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
      const people = await storage.getPeople(
        enterpriseId,
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

  app.post('/api/crm/:enterpriseId/people', isAuthenticated, requireEnterpriseRole('editor'), async (req: any, res) => {
    try {
      const { enterpriseId } = req.params;
      const validatedData = insertPersonSchema.parse(req.body);
      const person = await storage.createPerson(validatedData, enterpriseId);
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
      const person = await storage.updatePerson(id, req.body, enterpriseId);
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
      await storage.deletePerson(id, enterpriseId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting person:", error);
      res.status(500).json({ message: "Failed to delete person" });
    }
  });

  // Opportunities management
  app.get('/api/crm/:enterpriseId/opportunities', isAuthenticated, requireEnterpriseRole('viewer'), async (req: any, res) => {
    try {
      const { enterpriseId } = req.params;
      const { search, limit = 50, offset = 0 } = req.query;
      const opportunities = await storage.getOpportunities(
        enterpriseId,
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

  app.post('/api/crm/:enterpriseId/opportunities', isAuthenticated, requireEnterpriseRole('editor'), async (req: any, res) => {
    try {
      const { enterpriseId } = req.params;
      // Transform date string to Date object if present
      const body = { ...req.body };
      if (body.expectedCloseDate && typeof body.expectedCloseDate === 'string') {
        body.expectedCloseDate = new Date(body.expectedCloseDate);
      }
      
      const validatedData = insertOpportunitySchema.parse(body);
      const opportunity = await storage.createOpportunity(validatedData, enterpriseId);
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
      
      const opportunity = await storage.updateOpportunity(id, body, enterpriseId);
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
      await storage.deleteOpportunity(id, enterpriseId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting opportunity:", error);
      res.status(500).json({ message: "Failed to delete opportunity" });
    }
  });

  // Export opportunities as CSV
  app.get('/api/crm/:enterpriseId/opportunities/export', isAuthenticated, requireEnterpriseRole('viewer'), async (req: any, res) => {
    try {
      const { enterpriseId } = req.params;
      // Query opportunities with related enterprises and people using left joins
      const opportunitiesData = await db
        .select({
          id: opportunities.id,
          title: opportunities.title,
          status: opportunities.status,
          value: opportunities.value,
          probability: opportunities.probability,
          expectedCloseDate: opportunities.expectedCloseDate,
          description: opportunities.description,
          notes: opportunities.notes,
          enterpriseName: enterprises.name,
          enterpriseCategory: enterprises.category,
          primaryContactFirstName: people.firstName,
          primaryContactLastName: people.lastName,
          primaryContactEmail: people.email,
        })
        .from(opportunities)
        .leftJoin(enterprises, eq(opportunities.enterpriseId, enterprises.id))
        .leftJoin(people, eq(opportunities.primaryContactId, people.id))
        .where(eq(opportunities.enterpriseId, enterpriseId))
        .orderBy(desc(opportunities.createdAt));

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
      const { search, limit = 50, offset = 0 } = req.query;
      const tasks = await storage.getTasks(
        enterpriseId,
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

  app.post('/api/crm/:enterpriseId/tasks', isAuthenticated, requireEnterpriseRole('editor'), async (req: any, res) => {
    try {
      const { enterpriseId } = req.params;
      const validatedData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(validatedData, enterpriseId);
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
      const task = await storage.updateTask(id, req.body, enterpriseId);
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
      await storage.deleteTask(id, enterpriseId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // AI Copilot routes
  app.post('/api/crm/:enterpriseId/ai/lead-score', isAuthenticated, requireEnterpriseRole('viewer'), async (req: any, res) => {
    try {
      const { enterpriseId } = req.params;
      const { personId } = req.body;
      
      const enterprise = await storage.getEnterprise(enterpriseId);
      const person = personId ? await storage.getPerson(personId, enterpriseId) : null;
      
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
        await storage.updateOpportunity(req.body.opportunityId, {
          aiScore: leadScore.score,
          aiInsights: leadScore.insights,
        }, enterpriseId);
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
        storage.getOpportunities(enterpriseId, undefined, 10, 0),
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
            responseMessage = `✅ Successfully added enterprise "${enterprise.name}" to the directory!\n\nID: ${enterprise.id}\nCategory: ${enterprise.category}\nLocation: ${enterprise.location || 'Not specified'}\n\nYou can view it at: /enterprises/${enterprise.id}`;
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
            responseMessage = `✅ Profile claim invitation created successfully!\n\nInvitation Link: ${claimUrl}\n\nSent to: ${args.email}${args.name ? ` (${args.name})` : ''}\nExpires: ${expiresAt.toLocaleDateString()}\n\n📧 Note: Email sending is not yet implemented. Please share this link manually with the recipient.`;
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
              responseMessage = `🔍 Found ${searchData.data.length} result(s) from Apollo.io:\n\n${resultList}\n\n${searchData.usingMockData ? '⚠️ Using sample data. Configure Apollo API credentials for real results.\n\n' : ''}Would you like me to import any of these into your CRM?`;
            } else {
              responseMessage = `No results found from Apollo.io for "${args.query}".${searchData.usingMockData ? ' (Using sample data - configure API credentials for real results)' : ''}`;
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
              responseMessage = `📍 Found ${searchData.data.length} place(s) from Google Maps:\n\n${resultList}\n\n${searchData.usingMockData ? '⚠️ Using sample data. Configure Google Maps API credentials for real results.\n\n' : ''}Would you like me to import any of these into your CRM?`;
            } else {
              responseMessage = `No places found from Google Maps for "${args.query}".${searchData.usingMockData ? ' (Using sample data - configure API credentials for real results)' : ''}`;
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
              responseMessage = `🏢 Found ${searchData.data.length} venue(s) from Foursquare:\n\n${resultList}\n\n${searchData.usingMockData ? '⚠️ Using sample data. Configure Foursquare API credentials for real results.\n\n' : ''}Would you like me to import any of these into your CRM?`;
            } else {
              responseMessage = `No venues found from Foursquare for "${args.query}".${searchData.usingMockData ? ' (Using sample data - configure API credentials for real results)' : ''}`;
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
              responseMessage = `✅ Successfully imported ${entityType} "${entityName}" from ${args.entity.source}!\n\nID: ${entity.id}\n${entity.location ? `Location: ${entity.location}\n` : ''}${entity.email ? `Email: ${entity.email}\n` : ''}${entity.website ? `Website: ${entity.website}\n` : ''}\nYou can view it at: /${args.entityType === 'enterprise' ? 'enterprises' : 'crm/people'}/${entity.id}`;
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

  // Enterprise claiming and invitation routes (Admin only)
  app.get('/api/admin/enterprises/claiming', isAuthenticated, async (req: any, res) => {
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

      const { search, claimStatus, limit = 50, offset = 0 } = req.query;
      const enterprises = await storage.getEnterprisesWithClaimInfo(
        search as string,
        claimStatus as 'unclaimed' | 'claimed' | 'verified',
        parseInt(limit as string),
        parseInt(offset as string)
      );
      res.json(enterprises);
    } catch (error) {
      console.error("Error fetching enterprises for claiming:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch enterprises", error: errorMessage });
    }
  });

  app.get('/api/admin/claim-stats', isAuthenticated, async (req: any, res) => {
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

      const stats = await storage.getEnterpriseClaimStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching claim stats:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch claim stats", error: errorMessage });
    }
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

  app.post('/api/admin/invitations', isAuthenticated, async (req: any, res) => {
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

      const { personId, enterpriseId } = req.body;
      if (!personId || !enterpriseId) {
        return res.status(400).json({ message: "Person ID and Enterprise ID are required" });
      }

      const updatedPerson = await storage.sendInvitation(personId, enterpriseId);
      
      // Here you would typically send an email invitation
      // For now, we'll just log it
      console.log(`Invitation sent to ${updatedPerson.email} for enterprise ${enterpriseId}`);
      
      res.status(201).json({
        message: "Invitation sent successfully",
        person: updatedPerson
      });
    } catch (error) {
      console.error("Error sending invitation:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to send invitation", error: errorMessage });
    }
  });

  app.get('/api/admin/invitations', isAuthenticated, async (req: any, res) => {
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

      const { limit = 50, offset = 0 } = req.query;
      const invitations = await storage.getInvitationHistory(
        parseInt(limit as string),
        parseInt(offset as string)
      );
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch invitations", error: errorMessage });
    }
  });

  app.patch('/api/admin/invitations/:id', isAuthenticated, async (req: any, res) => {
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

      const { invitationStatus, claimStatus } = req.body;
      const personId = req.params.id;

      let updatedPerson;
      if (invitationStatus) {
        updatedPerson = await storage.updateInvitationStatus(personId, invitationStatus);
      } else if (claimStatus) {
        updatedPerson = await storage.updateClaimStatus(personId, claimStatus);
      } else {
        return res.status(400).json({ message: "Either invitationStatus or claimStatus must be provided" });
      }

      res.json(updatedPerson);
    } catch (error) {
      console.error("Error updating invitation:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to update invitation", error: errorMessage });
    }
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
  app.post('/api/crm/enterprises/:id/invite', isAuthenticated, requireRole(['admin', 'enterprise_owner']), async (req: any, res) => {
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

  // Admin Opportunity Transfer Routes
  app.post('/api/admin/opportunity-transfers', isAuthenticated, async (req: any, res) => {
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

      const validatedData = insertOpportunityTransferSchema.parse({
        ...req.body,
        transferredBy: userId
      });
      
      const transfer = await storage.createOpportunityTransfer(validatedData);
      res.status(201).json(transfer);
    } catch (error) {
      console.error("Error creating opportunity transfer:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ message: "Failed to create opportunity transfer", error: errorMessage });
    }
  });

  app.get('/api/admin/opportunity-transfers', isAuthenticated, async (req: any, res) => {
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

      const { search, status, limit = 50, offset = 0 } = req.query;
      const transfers = await storage.getOpportunityTransfers(
        search as string,
        status as 'pending' | 'accepted' | 'declined' | 'completed',
        parseInt(limit as string),
        parseInt(offset as string)
      );
      res.json(transfers);
    } catch (error) {
      console.error("Error fetching opportunity transfers:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch opportunity transfers", error: errorMessage });
    }
  });

  app.get('/api/admin/transfer-stats', isAuthenticated, async (req: any, res) => {
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

      const stats = await storage.getTransferStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching transfer stats:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch transfer stats", error: errorMessage });
    }
  });

  // Enterprise Owner Transfer Routes
  app.get('/api/my-transferred-opportunities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Check if user is enterprise owner or admin
      const user = await storage.getUser(userId);
      if (!user || !user.role || !['enterprise_owner', 'admin'].includes(user.role)) {
        return res.status(403).json({ message: "Enterprise owner or admin access required" });
      }

      const { limit = 50, offset = 0 } = req.query;
      const transfers = await storage.getTransfersByUserId(
        userId,
        parseInt(limit as string),
        parseInt(offset as string)
      );
      res.json(transfers);
    } catch (error) {
      console.error("Error fetching user transfers:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch transferred opportunities", error: errorMessage });
    }
  });

  app.patch('/api/opportunity-transfers/:id/accept', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const transferId = req.params.id;
      const transfer = await storage.acceptOpportunityTransfer(transferId, userId);
      res.json(transfer);
    } catch (error) {
      console.error("Error accepting transfer:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ message: "Failed to accept transfer", error: errorMessage });
    }
  });

  app.patch('/api/opportunity-transfers/:id/decline', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const transferId = req.params.id;
      const { reason } = req.body;
      const transfer = await storage.declineOpportunityTransfer(transferId, userId, reason);
      res.json(transfer);
    } catch (error) {
      console.error("Error declining transfer:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ message: "Failed to decline transfer", error: errorMessage });
    }
  });

  app.get('/api/opportunity-transfers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const transferId = req.params.id;
      const transfer = await storage.getOpportunityTransfer(transferId);
      
      if (!transfer) {
        return res.status(404).json({ message: "Transfer not found" });
      }

      // Check if user has access to this transfer (admin, transferredBy, or transferredTo)
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'admin' && transfer.transferredBy !== userId && transfer.transferredTo !== userId)) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(transfer);
    } catch (error) {
      console.error("Error fetching transfer:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch transfer", error: errorMessage });
    }
  });

  // Public claiming routes
  app.get('/api/enterprises/:id/contacts', async (req, res) => {
    try {
      const enterpriseId = req.params.id;
      const contacts = await storage.getPeopleByEnterpriseId(enterpriseId);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching enterprise contacts:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch contacts", error: errorMessage });
    }
  });

  app.post('/api/claim-enterprise', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { personId, enterpriseId } = req.body;
      if (!personId || !enterpriseId) {
        return res.status(400).json({ message: "Person ID and Enterprise ID are required" });
      }

      // Verify the person is associated with this enterprise
      const person = await storage.getPerson(personId, enterpriseId);
      if (!person || person.enterpriseId !== enterpriseId) {
        return res.status(400).json({ message: "Invalid person or enterprise association" });
      }

      // Update claim status to claimed
      const updatedPerson = await storage.updateClaimStatus(personId, 'claimed');
      
      // Update user role to enterprise_owner if not already
      const user = await storage.getUser(userId);
      if (user && (user.role === 'visitor' || user.role === 'member')) {
        await storage.upsertUser({ 
          ...user, 
          role: 'enterprise_owner' 
        });
      }

      res.json({
        message: "Enterprise claimed successfully",
        person: updatedPerson
      });
    } catch (error) {
      console.error("Error claiming enterprise:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to claim enterprise", error: errorMessage });
    }
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
            console.log('Subscription created for user:', userId);
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
            console.log('Subscription canceled for user:', user.id);
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
