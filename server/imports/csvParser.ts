import { parse } from 'csv-parse';
import { Readable } from 'stream';
import { z } from 'zod';
import { 
  insertEnterpriseSchema,
  insertCrmWorkspacePersonSchema,
  insertCrmWorkspaceOpportunitySchema,
} from '@shared/schema';

export async function parseCSVStream(fileBuffer: Buffer): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    const stream = Readable.from(fileBuffer);

    stream
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
        cast: true,
        relax_quotes: true,
        relax_column_count: true,
      }))
      .on('data', (row) => {
        results.push(row);
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

export function inferHeaders(rows: any[]): string[] {
  if (!rows || rows.length === 0) {
    return [];
  }

  return Object.keys(rows[0]);
}

export function validateRow(
  row: any, 
  entityType: string, 
  mapping: Record<string, string>
): { valid: boolean; data?: any; errors?: string[] } {
  try {
    const mappedData: Record<string, any> = {};
    
    for (const [csvColumn, schemaField] of Object.entries(mapping)) {
      if (row[csvColumn] !== undefined && row[csvColumn] !== null && row[csvColumn] !== '') {
        mappedData[schemaField] = row[csvColumn];
      }
    }

    let schema: z.ZodSchema;
    switch (entityType) {
      case 'enterprise':
        schema = insertEnterpriseSchema.partial();
        break;
      case 'person':
        schema = insertCrmWorkspacePersonSchema.partial();
        break;
      case 'opportunity':
        schema = insertCrmWorkspaceOpportunitySchema.partial();
        break;
      default:
        return { valid: false, errors: [`Unknown entity type: ${entityType}`] };
    }

    const result = schema.safeParse(mappedData);
    
    if (result.success) {
      return { valid: true, data: result.data };
    } else {
      const errors = result.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      return { valid: false, errors };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
    return { valid: false, errors: [errorMessage] };
  }
}
