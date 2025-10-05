import { Router, type Request, type Response, type NextFunction, type RequestHandler } from "express";
import { integrationManager } from "./manager";
import { storage } from "../storage";
import { z } from "zod";
import { nanoid } from "nanoid";

const router = Router();

const supportedProviders = ['apollo', 'google_maps', 'foursquare', 'pipedrive', 'twenty_crm'];

function requireSubscription(planType: 'crm_pro'): RequestHandler {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      const allowedPlans = ['crm_pro', 'build_pro_bundle'];
      if (!allowedPlans.includes(user.currentPlanType || 'free')) {
        return res.status(403).json({ 
          error: "Subscription required", 
          message: "This feature requires CRM Pro or Build Pro Bundle subscription",
          requiredPlan: planType
        });
      }

      next();
    } catch (error) {
      console.error("Error checking subscription:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

const validateProvider: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const { provider } = req.params;
  
  if (!supportedProviders.includes(provider)) {
    return res.status(400).json({ 
      error: "Invalid provider", 
      message: `Provider must be one of: ${supportedProviders.join(', ')}`,
      provider 
    });
  }

  next();
};

const checkProviderCredentials: RequestHandler = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { provider } = req.params;
    const userId = (req.user as any)?.claims?.sub;

    const isConfigured = await integrationManager.validateProviderCredentials(provider, userId);

    if (!isConfigured) {
      return res.status(400).json({ 
        error: "Provider not configured", 
        message: `No API credentials found for ${provider}. Please configure API keys or connect your account.`,
        provider 
      });
    }

    next();
  } catch (error) {
    console.error("Error checking provider credentials:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

router.use(requireSubscription('crm_pro'));

router.post('/:provider/search', validateProvider, async (req: any, res: Response) => {
  const { provider } = req.params;
  
  try {
    const userId = (req.user as any)?.claims?.sub;
    const { query, filters, location } = req.body;

    if (!query && !filters) {
      return res.status(400).json({ error: "Query or filters required" });
    }

    const canProceed = await integrationManager.checkRateLimit(provider, userId || 'anonymous');
    if (!canProceed) {
      return res.status(429).json({ 
        error: "Rate limit exceeded", 
        message: "Too many requests. Please try again later." 
      });
    }

    const queryKey = JSON.stringify({ provider, query, filters, location });
    const cachedResult = await storage.getCachedSearch(provider as any, queryKey);

    if (cachedResult) {
      console.log(`[Integration] Cache hit for ${provider}: ${queryKey.substring(0, 50)}...`);
      return res.json({
        success: true,
        data: cachedResult.resultData,
        source: provider,
        cached: true,
        timestamp: cachedResult.createdAt
      });
    }

    const hasCredentials = await integrationManager.validateProviderCredentials(provider, userId);
    let rawResults: any[] = [];
    
    try {
      const client = await integrationManager.getProviderClient(provider, userId);

      switch (provider) {
        case 'apollo':
          if (filters?.type === 'companies') {
            rawResults = await client.searchCompanies(query, filters);
          } else {
            rawResults = await client.searchContacts(query, filters);
          }
          break;

        case 'google_maps':
          if (location) {
            rawResults = await client.textSearch(query, location);
          } else {
            rawResults = await client.textSearch(query);
          }
          break;

        case 'foursquare':
          rawResults = await client.searchPlaces(query, location);
          break;

        case 'pipedrive':
          if (filters?.type === 'deals') {
            rawResults = await client.searchDeals(query);
          } else {
            rawResults = await client.searchPersons(query);
          }
          break;

        case 'twenty_crm':
          if (filters?.type === 'companies') {
            rawResults = await client.fetchCompanies(filters);
          } else {
            rawResults = await client.fetchPeople(filters);
          }
          break;
      }
    } catch (error: any) {
      await integrationManager.handleApiError(error, provider);
    }

    const normalizedResults = integrationManager.normalizeSearchResults(provider, rawResults);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    await storage.createSearchCache({
      provider: provider as any,
      queryKey,
      queryParams: { query, filters, location },
      resultData: normalizedResults as any,
      expiresAt
    });

    console.log(`[Integration] ${provider} search completed: ${normalizedResults.length} results`);

    res.json({
      success: true,
      data: normalizedResults,
      source: provider,
      cached: false,
      count: normalizedResults.length,
      usingMockData: !hasCredentials,
      message: !hasCredentials ? `Showing sample data. Configure ${provider} API credentials to see real results.` : undefined
    });
  } catch (error) {
    console.error(`Error in integration search:`, error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    const isAuthError = errorMessage.includes('Authentication failed') || errorMessage.includes('credentials');
    const isRateLimitError = errorMessage.includes('Rate limit');
    
    let statusCode = 424;
    let userMessage = errorMessage;
    
    if (isAuthError) {
      statusCode = 424;
      userMessage = `${provider} integration requires valid API credentials. Please configure your API keys in settings or contact support for assistance.`;
    } else if (isRateLimitError) {
      statusCode = 429;
      userMessage = errorMessage;
    }
    
    res.status(statusCode).json({ 
      success: false, 
      error: userMessage,
      provider,
      message: userMessage,
      data: []
    });
  }
});

router.get('/:provider/status', validateProvider, async (req: any, res: Response) => {
  try {
    const { provider } = req.params;
    const userId = (req.user as any)?.claims?.sub;

    const isConfigured = await integrationManager.validateProviderCredentials(provider, userId);

    const hasUserToken = userId ? 
      !!(await storage.getUserProviderToken(userId, provider as any)) : false;

    res.json({
      provider,
      configured: isConfigured,
      hasEnvironmentKey: await integrationManager.validateProviderCredentials(provider),
      hasUserToken,
      status: isConfigured ? 'active' : 'not_configured'
    });
  } catch (error) {
    console.error("Error checking provider status:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: errorMessage });
  }
});

router.post('/:provider/sync', validateProvider, checkProviderCredentials, requireSubscription('crm_pro'), async (req: any, res: Response) => {
  try {
    const { provider } = req.params;
    const userId = (req.user as any)?.claims?.sub;
    const { jobType = 'sync', filters } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const job = await storage.createExternalSyncJob({
      userId,
      provider: provider as any,
      jobType: jobType as any,
      status: 'queued',
      progress: 0,
      processedRecords: 0,
      totalRecords: null
    });

    setTimeout(async () => {
      try {
        await storage.updateJobStatus(job.id, 'running');

        const client = await integrationManager.getProviderClient(provider, userId);
        let results: any[] = [];

        switch (provider) {
          case 'apollo':
            results = await client.searchCompanies('', filters);
            break;
          case 'pipedrive':
            results = await client.searchDeals('');
            break;
          case 'twenty_crm':
            results = await client.fetchCompanies(filters);
            break;
          default:
            results = [];
        }

        await storage.updateExternalSyncJob(job.id, {
          totalRecords: results.length,
          processedRecords: results.length,
          progress: 100
        });

        await storage.updateJobStatus(job.id, 'completed');
        console.log(`[Integration] Sync job ${job.id} completed: ${results.length} records`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        await storage.updateJobStatus(job.id, 'failed', errorMessage);
        console.error(`[Integration] Sync job ${job.id} failed:`, error);
      }
    }, 1000);

    res.status(202).json({
      success: true,
      message: "Sync job queued",
      job: {
        id: job.id,
        provider,
        status: job.status,
        createdAt: job.createdAt
      }
    });
  } catch (error) {
    console.error("Error creating sync job:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: errorMessage });
  }
});

router.get('/sync-jobs', async (req: any, res: Response) => {
  try {
    const userId = (req.user as any)?.claims?.sub;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { provider, limit = 50, offset = 0 } = req.query;

    const jobs = await storage.getExternalSyncJobs(
      userId, 
      provider as any,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    res.json({
      success: true,
      jobs,
      count: jobs.length
    });
  } catch (error) {
    console.error("Error fetching sync jobs:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: errorMessage });
  }
});

router.get('/sync-jobs/:id', async (req: any, res: Response) => {
  try {
    const userId = (req.user as any)?.claims?.sub;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const job = await storage.getExternalSyncJob(id);

    if (!job) {
      return res.status(404).json({ error: "Sync job not found" });
    }

    if (job.userId !== userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    res.json({
      success: true,
      job
    });
  } catch (error) {
    console.error("Error fetching sync job:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
