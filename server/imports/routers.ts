import express, { type RequestHandler } from 'express';
import multer from 'multer';
import { storage } from '../storage';
import { parseCSVStream, inferHeaders } from './csvParser';
import { processImportJob } from './jobProcessor';
import { 
  generateEnterpriseTemplate, 
  generatePersonTemplate, 
  generateOpportunityTemplate 
} from './templates';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['text/csv', 'application/csv', 'text/plain'];
    if (allowedMimeTypes.includes(file.mimetype) || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV files are allowed.'));
    }
  }
});

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

router.post(
  '/upload',
  requireSubscription('crm_pro'),
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ error: 'File too large', message: 'Maximum file size is 10MB' });
        }
        return res.status(400).json({ error: 'Upload error', message: err.message });
      } else if (err) {
        return res.status(415).json({ error: 'Invalid file type', message: err.message });
      }
      next();
    });
  },
  async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { entityType } = req.body;
      if (!entityType || !['enterprise', 'person', 'opportunity'].includes(entityType)) {
        return res.status(400).json({ 
          error: 'Invalid entity type', 
          message: 'Entity type must be one of: enterprise, person, opportunity' 
        });
      }

      const rows = await parseCSVStream(req.file.buffer);
      
      if (rows.length === 0) {
        return res.status(400).json({ error: 'Empty CSV file' });
      }

      const headers = inferHeaders(rows);

      const job = await storage.createImportJob({
        userId,
        entityType: entityType as 'enterprise' | 'person' | 'opportunity',
        fileName: req.file.originalname,
        fileSize: req.file.size,
        totalRows: rows.length,
        fileBuffer: req.file.buffer,
        status: 'uploaded',
        duplicateStrategy: 'skip',
        processedRows: 0,
        successfulRows: 0,
        failedRows: 0
      });

      res.status(201).json({
        message: 'File uploaded successfully',
        jobId: job.id,
        headers,
        totalRows: rows.length,
        entityType
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Upload failed', message: errorMessage });
    }
  }
);

router.get('/templates', requireSubscription('crm_pro'), (req, res) => {
  try {
    const { entity } = req.query;

    if (!entity || !['enterprise', 'person', 'opportunity'].includes(entity as string)) {
      return res.status(400).json({ 
        error: 'Invalid entity type', 
        message: 'Entity must be one of: enterprise, person, opportunity' 
      });
    }

    let template: string;
    let filename: string;

    switch (entity) {
      case 'enterprise':
        template = generateEnterpriseTemplate();
        filename = 'enterprise_import_template.csv';
        break;
      case 'person':
        template = generatePersonTemplate();
        filename = 'person_import_template.csv';
        break;
      case 'opportunity':
        template = generateOpportunityTemplate();
        filename = 'opportunity_import_template.csv';
        break;
      default:
        return res.status(400).json({ error: 'Invalid entity type' });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(template);
  } catch (error) {
    console.error('Error generating template:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Template generation failed', message: errorMessage });
  }
});

router.post(
  '/:uploadId/configure',
  requireSubscription('crm_pro'),
  async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { uploadId } = req.params;
      const { mappingConfig, duplicateStrategy } = req.body;

      if (!mappingConfig || typeof mappingConfig !== 'object') {
        return res.status(400).json({ error: 'Invalid mapping configuration' });
      }

      if (!['skip', 'update', 'create_new'].includes(duplicateStrategy)) {
        return res.status(400).json({ 
          error: 'Invalid duplicate strategy', 
          message: 'Strategy must be one of: skip, update, create_new' 
        });
      }

      const job = await storage.getImportJob(uploadId);
      
      if (!job) {
        return res.status(404).json({ error: 'Import job not found' });
      }

      if (job.userId !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      if (job.status !== 'uploaded') {
        return res.status(400).json({ 
          error: 'Invalid job status', 
          message: `Job is already in ${job.status} status` 
        });
      }

      await storage.updateImportJob(uploadId, {
        mappingConfig,
        duplicateStrategy: duplicateStrategy as 'skip' | 'update' | 'create_new',
        status: 'mapping'
      });

      processImportJob(uploadId).catch(error => {
        console.error(`Background job processing failed for ${uploadId}:`, error);
      });

      res.json({ 
        message: 'Import job configured and started',
        jobId: uploadId 
      });
    } catch (error) {
      console.error('Error configuring import:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Configuration failed', message: errorMessage });
    }
  }
);

router.get(
  '/:jobId/status',
  requireSubscription('crm_pro'),
  async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { jobId } = req.params;
      const job = await storage.getImportJob(jobId);

      if (!job) {
        return res.status(404).json({ error: 'Import job not found' });
      }

      if (job.userId !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const errors = job.status === 'failed' || job.failedRows > 0
        ? await storage.getJobErrors(jobId, 100)
        : [];

      res.json({
        id: job.id,
        entityType: job.entityType,
        status: job.status,
        fileName: job.fileName,
        totalRows: job.totalRows,
        processedRows: job.processedRows,
        successfulRows: job.successfulRows,
        failedRows: job.failedRows,
        errorSummary: job.errorSummary,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        createdAt: job.createdAt,
        errors: errors.slice(0, 10),
        hasMoreErrors: errors.length > 10
      });
    } catch (error) {
      console.error('Error fetching job status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Status fetch failed', message: errorMessage });
    }
  }
);

router.post(
  '/:jobId/cancel',
  requireSubscription('crm_pro'),
  async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { jobId } = req.params;
      const job = await storage.getImportJob(jobId);

      if (!job) {
        return res.status(404).json({ error: 'Import job not found' });
      }

      if (job.userId !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      if (['completed', 'failed', 'cancelled'].includes(job.status)) {
        return res.status(400).json({ 
          error: 'Cannot cancel job', 
          message: `Job is already ${job.status}` 
        });
      }

      await storage.updateImportJobStatus(jobId, 'cancelled');

      res.json({ message: 'Import job cancelled', jobId });
    } catch (error) {
      console.error('Error cancelling job:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Cancellation failed', message: errorMessage });
    }
  }
);

router.get(
  '/history',
  requireSubscription('crm_pro'),
  async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { limit = 50, offset = 0 } = req.query;
      const jobs = await storage.getUserImportJobs(
        userId,
        parseInt(limit as string),
        parseInt(offset as string)
      );

      res.json({ jobs });
    } catch (error) {
      console.error('Error fetching import history:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'History fetch failed', message: errorMessage });
    }
  }
);

export default router;
