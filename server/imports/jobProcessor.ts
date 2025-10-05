import { storage } from '../storage';
import { parseCSVStream, validateRow } from './csvParser';
import { 
  findDuplicateEnterprise, 
  findDuplicatePerson, 
  findDuplicateOpportunity 
} from './duplicateDetector';

const activeJobs = new Set<string>();

export async function processImportJob(jobId: string): Promise<void> {
  if (activeJobs.has(jobId)) {
    console.log(`Job ${jobId} is already processing`);
    return;
  }

  activeJobs.add(jobId);

  try {
    const job = await storage.getImportJob(jobId);
    
    if (!job) {
      throw new Error(`Import job ${jobId} not found`);
    }

    if (job.status !== 'mapping') {
      console.log(`Job ${jobId} is not in mapping status, skipping processing`);
      return;
    }

    console.log(`[Import Job ${jobId}] Starting processing for ${job.entityType}`);
    
    await storage.updateImportJobStatus(jobId, 'processing');

    if (!job.fileBuffer) {
      throw new Error('File buffer not found in job');
    }

    const rows = await parseCSVStream(job.fileBuffer as Buffer);
    
    await storage.updateImportJob(jobId, { totalRows: rows.length });

    let processedRows = 0;
    let successfulRows = 0;
    let failedRows = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 1;

      try {
        const validationResult = validateRow(
          row, 
          job.entityType, 
          job.mappingConfig as Record<string, string>
        );

        if (!validationResult.valid) {
          await storage.createImportError({
            jobId,
            rowNumber,
            rowData: row,
            errorMessage: validationResult.errors?.join('; ') || 'Validation failed',
            errorType: 'validation'
          });
          failedRows++;
          processedRows++;
          continue;
        }

        const data = validationResult.data!;
        let duplicate = null;

        switch (job.entityType) {
          case 'enterprise':
            duplicate = await findDuplicateEnterprise(data, job.duplicateStrategy);
            break;
          case 'person':
            duplicate = await findDuplicatePerson(data, job.duplicateStrategy);
            break;
          case 'opportunity':
            duplicate = await findDuplicateOpportunity(data, job.duplicateStrategy);
            break;
        }

        if (duplicate) {
          if (job.duplicateStrategy === 'skip') {
            await storage.createImportError({
              jobId,
              rowNumber,
              rowData: row,
              errorMessage: `Duplicate found, skipping. ID: ${duplicate.id}`,
              errorType: 'duplicate'
            });
            failedRows++;
            processedRows++;
            continue;
          } else if (job.duplicateStrategy === 'update') {
            switch (job.entityType) {
              case 'enterprise':
                await storage.updateEnterprise(duplicate.id, data);
                break;
              case 'person':
                await storage.updatePerson(duplicate.id, data);
                break;
              case 'opportunity':
                await storage.updateOpportunity(duplicate.id, data);
                break;
            }
            successfulRows++;
            processedRows++;
            continue;
          }
        }

        switch (job.entityType) {
          case 'enterprise':
            await storage.createEnterprise(data);
            break;
          case 'person':
            await storage.createPerson(data);
            break;
          case 'opportunity':
            await storage.createOpportunity(data);
            break;
        }

        successfulRows++;
        processedRows++;

        if (processedRows % 10 === 0) {
          await storage.updateImportJobProgress(jobId, processedRows, successfulRows, failedRows);
          console.log(`[Import Job ${jobId}] Progress: ${processedRows}/${rows.length} rows processed`);
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Import Job ${jobId}] Error processing row ${rowNumber}:`, errorMessage);
        
        await storage.createImportError({
          jobId,
          rowNumber,
          rowData: row,
          errorMessage,
          errorType: 'system'
        });
        
        failedRows++;
        processedRows++;
      }
    }

    await storage.updateImportJobProgress(jobId, processedRows, successfulRows, failedRows);

    if (failedRows === 0) {
      await storage.updateImportJobStatus(jobId, 'completed');
      console.log(`[Import Job ${jobId}] Completed successfully. ${successfulRows} rows imported.`);
    } else if (successfulRows === 0) {
      await storage.updateImportJobStatus(
        jobId, 
        'failed', 
        `All ${failedRows} rows failed validation or import`
      );
      console.log(`[Import Job ${jobId}] Failed. All rows had errors.`);
    } else {
      await storage.updateImportJobStatus(
        jobId, 
        'completed', 
        `Completed with ${failedRows} errors out of ${processedRows} total rows`
      );
      console.log(`[Import Job ${jobId}] Completed with errors. ${successfulRows} successful, ${failedRows} failed.`);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Import Job ${jobId}] Fatal error:`, errorMessage);
    
    await storage.updateImportJobStatus(jobId, 'failed', errorMessage);
  } finally {
    activeJobs.delete(jobId);
  }
}
