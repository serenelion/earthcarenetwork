import * as cheerio from "cheerio";
import { extractEnterpriseData } from "./openai";
import { storage } from "./storage";
import type { InsertEnterprise } from "@shared/schema";

export interface ScrapingResult {
  success: boolean;
  url: string;
  enterprise?: InsertEnterprise;
  error?: string;
}

export async function scrapeUrl(url: string): Promise<ScrapingResult> {
  try {
    // Normalize URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EarthNetwork/1.0; +https://earthnetwork.org/bot)'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove script and style tags for cleaner processing
    $('script, style, nav, footer').remove();

    // Extract key content
    const title = $('title').text().trim();
    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') || '';
    
    // Get main content
    const mainContent = $('main, .main, #main, .content, #content, .container').first().text() ||
                       $('body').text();

    // Build simplified HTML for AI processing
    const simplifiedHtml = `
      <title>${title}</title>
      <meta name="description" content="${description}">
      <body>${mainContent.substring(0, 5000)}</body>
    `;

    // Use AI to extract structured data
    const enterpriseData = await extractEnterpriseData(simplifiedHtml, url);

    // Validate and clean the data
    const cleanedData: InsertEnterprise = {
      name: enterpriseData.name?.trim() || title.split('|')[0].trim() || 'Unknown Enterprise',
      description: enterpriseData.description?.trim() || description.trim() || 'No description available',
      category: enterpriseData.category || 'land_projects',
      location: enterpriseData.location?.trim() || null,
      website: enterpriseData.website || url,
      contactEmail: enterpriseData.contactEmail || null,
      tags: Array.isArray(enterpriseData.tags) ? enterpriseData.tags : [],
      sourceUrl: url,
      isVerified: false,
      followerCount: 0,
    };

    return {
      success: true,
      url,
      enterprise: cleanedData,
    };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return {
      success: false,
      url,
      error: error.message,
    };
  }
}

export async function bulkScrapeUrls(urls: string[]): Promise<ScrapingResult[]> {
  const results: ScrapingResult[] = [];
  
  // Process URLs in batches to avoid overwhelming servers
  const batchSize = 3;
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    
    const batchPromises = batch.map(url => scrapeUrl(url));
    const batchResults = await Promise.all(batchPromises);
    
    results.push(...batchResults);
    
    // Add delay between batches to be respectful
    if (i + batchSize < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return results;
}

export async function importScrapedEnterprises(results: ScrapingResult[]): Promise<{
  imported: number;
  failed: number;
  errors: string[];
}> {
  let imported = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const result of results) {
    if (result.success && result.enterprise) {
      try {
        await storage.createEnterprise(result.enterprise);
        imported++;
      } catch (error) {
        failed++;
        errors.push(`Failed to import ${result.url}: ${error.message}`);
      }
    } else {
      failed++;
      errors.push(`Failed to scrape ${result.url}: ${result.error}`);
    }
  }

  return { imported, failed, errors };
}

// Predefined source URLs for regenerative enterprise data
export const REGENERATIVE_SOURCES = [
  'https://permacultureglobal.org/projects',
  'https://opensustain.tech/projects',
  'https://regenerationinternational.org/farmers',
  'https://collective.earthcare.network/organizations',
];

export async function scrapeRegenerativeSources(): Promise<string[]> {
  const enterpriseUrls: string[] = [];
  
  for (const sourceUrl of REGENERATIVE_SOURCES) {
    try {
      const response = await fetch(sourceUrl);
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Extract links that might be enterprise profiles
      $('a[href]').each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          let fullUrl = href;
          if (href.startsWith('/')) {
            const baseUrl = new URL(sourceUrl);
            fullUrl = `${baseUrl.protocol}//${baseUrl.host}${href}`;
          }
          
          // Filter for profile-like URLs
          if (fullUrl.includes('/project') || 
              fullUrl.includes('/organization') || 
              fullUrl.includes('/farm') ||
              fullUrl.includes('/profile')) {
            enterpriseUrls.push(fullUrl);
          }
        }
      });
    } catch (error) {
      console.error(`Error scraping source ${sourceUrl}:`, error);
    }
  }
  
  // Remove duplicates
  return [...new Set(enterpriseUrls)];
}
