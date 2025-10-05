import { nanoid } from 'nanoid';
import { scrapeUrl, scrapeRegenerativeSources } from './scraperService';
import { storage } from './storage';

export interface SeedingJob {
  id: string;
  totalUrls: number;
  processedUrls: number;
  successCount: number;
  failureCount: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  errors: Array<{ url: string; error: string }>;
}

const jobsMap = new Map<string, SeedingJob>();

export async function startBulkSeeding(urls: string[], batchSize = 50): Promise<SeedingJob> {
  // Validate and deduplicate URLs
  const uniqueUrls = Array.from(new Set(urls.filter(url => url && url.trim().length > 0)));
  
  if (uniqueUrls.length === 0) {
    throw new Error('No valid URLs provided');
  }

  // Create job with unique ID
  const jobId = nanoid();
  const job: SeedingJob = {
    id: jobId,
    totalUrls: uniqueUrls.length,
    processedUrls: 0,
    successCount: 0,
    failureCount: 0,
    status: 'pending',
    errors: [],
  };

  // Store job in map
  jobsMap.set(jobId, job);

  // Start processing asynchronously (don't await)
  processSeeding(job, uniqueUrls, batchSize).catch(error => {
    console.error(`Fatal error in seeding job ${jobId}:`, error);
    job.status = 'failed';
    job.completedAt = new Date();
  });

  return job;
}

async function processSeeding(job: SeedingJob, urls: string[], batchSize: number): Promise<void> {
  job.status = 'running';
  job.startedAt = new Date();

  console.log(`Starting seeding job ${job.id} with ${urls.length} URLs`);

  // Process URLs in batches
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    
    // Use Promise.allSettled to handle failures gracefully
    const results = await Promise.allSettled(
      batch.map(url => scrapeUrl(url))
    );

    // Process results
    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      const url = batch[j];

      if (result.status === 'fulfilled') {
        const scrapingResult = result.value;
        
        if (scrapingResult.success && scrapingResult.enterprise) {
          try {
            // Import enterprise to database
            await storage.createEnterprise(scrapingResult.enterprise);
            job.successCount++;
          } catch (error) {
            job.failureCount++;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            job.errors.push({ url, error: `Import failed: ${errorMessage}` });
            console.error(`Failed to import enterprise from ${url}:`, errorMessage);
          }
        } else {
          job.failureCount++;
          job.errors.push({ url, error: scrapingResult.error || 'Scraping failed' });
        }
      } else {
        job.failureCount++;
        job.errors.push({ url, error: result.reason?.message || 'Unknown error' });
      }

      job.processedUrls++;
    }

    // Log progress after each batch
    console.log(
      `Processed ${job.processedUrls}/${job.totalUrls} URLs, ` +
      `Success: ${job.successCount}, Failures: ${job.failureCount}`
    );

    // Add delay between batches for rate limiting (unless it's the last batch)
    if (i + batchSize < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Update job status
  job.completedAt = new Date();
  
  if (job.successCount === 0) {
    job.status = 'failed';
  } else {
    job.status = 'completed';
  }

  console.log(
    `Seeding job ${job.id} ${job.status}. ` +
    `Total: ${job.totalUrls}, Success: ${job.successCount}, Failures: ${job.failureCount}`
  );
}

export function getJobStatus(jobId: string): SeedingJob | undefined {
  return jobsMap.get(jobId);
}

export async function discoverEnterprises(): Promise<string[]> {
  console.log('Discovering enterprises from regenerative sources...');
  
  // Call scrapeRegenerativeSources to get all URLs
  const urls = await scrapeRegenerativeSources();
  
  // Deduplicate by domain (same domain = same organization)
  const urlsByDomain = new Map<string, string>();
  
  for (const url of urls) {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      const domain = urlObj.hostname;
      
      // Keep the first URL for each domain
      if (!urlsByDomain.has(domain)) {
        urlsByDomain.set(domain, url);
      }
    } catch (error) {
      console.error(`Invalid URL: ${url}`, error);
    }
  }
  
  const uniqueUrls = Array.from(urlsByDomain.values());
  console.log(`Discovered ${uniqueUrls.length} unique enterprise URLs from ${urls.length} total URLs`);
  
  return uniqueUrls;
}
