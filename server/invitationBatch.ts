import { nanoid } from 'nanoid';
import { storage } from './storage';
import { enterprises, profileClaims } from '@shared/schema';
import { db } from './db';
import { eq, isNull, and, notExists, sql } from 'drizzle-orm';

export interface BatchInvitationJob {
  id: string;
  totalEnterprises: number;
  processedEnterprises: number;
  successCount: number;
  failureCount: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  errors: Array<{ enterpriseId: string; error: string }>;
}

const jobs = new Map<string, BatchInvitationJob>();

export function getInvitationJobStatus(jobId: string): BatchInvitationJob | undefined {
  return jobs.get(jobId);
}

export async function startBatchInvitations(
  adminUserId: string,
  enterpriseIds?: string[]
): Promise<BatchInvitationJob> {
  const jobId = nanoid();
  
  const job: BatchInvitationJob = {
    id: jobId,
    totalEnterprises: 0,
    processedEnterprises: 0,
    successCount: 0,
    failureCount: 0,
    status: 'pending',
    errors: [],
  };

  jobs.set(jobId, job);

  setImmediate(async () => {
    try {
      job.status = 'running';
      job.startedAt = new Date();

      let targetEnterprises;

      if (enterpriseIds && enterpriseIds.length > 0) {
        targetEnterprises = await db
          .select()
          .from(enterprises)
          .where(
            and(
              sql`${enterprises.id} = ANY(${enterpriseIds})`,
              sql`${enterprises.contactEmail} IS NOT NULL`
            )
          );
      } else {
        targetEnterprises = await db
          .select({
            id: enterprises.id,
            name: enterprises.name,
            contactEmail: enterprises.contactEmail,
            category: enterprises.category,
            description: enterprises.description,
            location: enterprises.location,
            website: enterprises.website,
            imageUrl: enterprises.imageUrl,
            isVerified: enterprises.isVerified,
            followerCount: enterprises.followerCount,
            tags: enterprises.tags,
            sourceUrl: enterprises.sourceUrl,
            createdAt: enterprises.createdAt,
            updatedAt: enterprises.updatedAt,
          })
          .from(enterprises)
          .leftJoin(profileClaims, eq(profileClaims.enterpriseId, enterprises.id))
          .where(
            and(
              isNull(profileClaims.id),
              sql`${enterprises.contactEmail} IS NOT NULL`
            )
          );
      }

      job.totalEnterprises = targetEnterprises.length;

      const BATCH_SIZE = 100;
      const DELAY_MS = 1000;

      for (let i = 0; i < targetEnterprises.length; i += BATCH_SIZE) {
        const batch = targetEnterprises.slice(i, i + BATCH_SIZE);

        for (const enterprise of batch) {
          try {
            if (!enterprise.contactEmail) {
              job.failureCount++;
              job.errors.push({
                enterpriseId: enterprise.id,
                error: 'No contact email available',
              });
              continue;
            }

            const claimToken = nanoid(32);
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30);

            await db.insert(profileClaims).values({
              enterpriseId: enterprise.id,
              claimToken,
              invitedEmail: enterprise.contactEmail,
              invitedName: enterprise.name,
              invitedBy: adminUserId,
              status: 'pending',
              expiresAt,
            });

            job.successCount++;
          } catch (error) {
            console.error(`Error inviting enterprise ${enterprise.id}:`, error);
            job.failureCount++;
            job.errors.push({
              enterpriseId: enterprise.id,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          } finally {
            job.processedEnterprises++;
          }
        }

        if (i + BATCH_SIZE < targetEnterprises.length) {
          await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        }
      }

      job.completedAt = new Date();
      
      if (job.successCount > 0) {
        job.status = 'completed';
      } else {
        job.status = 'failed';
      }
    } catch (error) {
      console.error('Batch invitation job failed:', error);
      job.status = 'failed';
      job.completedAt = new Date();
      job.errors.push({
        enterpriseId: 'N/A',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return job;
}
