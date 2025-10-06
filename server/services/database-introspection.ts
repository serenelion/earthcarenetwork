import { db } from "../db";
import { sql } from "drizzle-orm";
import * as schema from "@shared/schema";

export interface TableInfo {
  tableName: string;
  rowCount: number;
  sizeBytes: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ColumnInfo {
  columnName: string;
  dataType: string;
  isNullable: boolean;
  columnDefault: string | null;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  foreignKeyTable?: string;
  foreignKeyColumn?: string;
  maxLength?: number;
}

export interface TableSchema {
  tableName: string;
  columns: ColumnInfo[];
  primaryKeys: string[];
  foreignKeys: Array<{
    columnName: string;
    referencedTable: string;
    referencedColumn: string;
  }>;
  indexes: Array<{
    indexName: string;
    columns: string[];
    isUnique: boolean;
  }>;
}

const ALLOWED_TABLES = [
  'users',
  'member_profiles',
  'enterprises',
  'user_favorites',
  'people',
  'opportunities',
  'tasks',
  'copilot_context',
  'business_context',
  'conversations',
  'chat_messages',
  'custom_fields',
  'partner_applications',
  'opportunity_transfers',
  'subscription_plans',
  'subscriptions',
  'ai_usage_logs',
  'credit_purchases',
  'profile_claims',
  'earth_care_pledges',
  'external_api_tokens',
  'external_search_cache',
  'external_entities',
  'external_sync_jobs',
  'import_jobs',
  'import_job_errors',
  'enterprise_team_members',
  'enterprise_invitations',
  'audit_logs',
  'enterprise_owners'
];

export function isTableAllowed(tableName: string): boolean {
  return ALLOWED_TABLES.includes(tableName);
}

export function validateTableName(tableName: string): void {
  if (!isTableAllowed(tableName)) {
    throw new Error(`Table '${tableName}' is not allowed or does not exist`);
  }
  
  if (!/^[a-z_][a-z0-9_]*$/.test(tableName)) {
    throw new Error(`Invalid table name format: ${tableName}`);
  }
}

export async function listTables(): Promise<TableInfo[]> {
  const result = await db.execute<{
    table_name: string;
    simple_name: string;
    row_count: number;
    total_bytes: number;
  }>(sql`
    SELECT 
      schemaname || '.' || tablename as table_name,
      tablename as simple_name,
      n_live_tup as row_count,
      pg_total_relation_size(schemaname || '.' || tablename) as total_bytes
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);

  const tables: TableInfo[] = [];
  
  for (const row of result.rows) {
    const tableName = row.simple_name;
    
    if (!isTableAllowed(tableName)) {
      continue;
    }

    tables.push({
      tableName: tableName,
      rowCount: Number(row.row_count) || 0,
      sizeBytes: Number(row.total_bytes) || 0,
    });
  }

  return tables;
}

export async function getTableSchema(tableName: string): Promise<TableSchema> {
  validateTableName(tableName);

  const columnsResult = await db.execute<{
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
    character_maximum_length: number | null;
  }>(sql`
    SELECT 
      column_name,
      data_type,
      is_nullable,
      column_default,
      character_maximum_length
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = ${tableName}
    ORDER BY ordinal_position
  `);

  const primaryKeysResult = await db.execute<{
    column_name: string;
  }>(sql`
    SELECT a.attname as column_name
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = ${tableName}::regclass
      AND i.indisprimary
  `);

  const foreignKeysResult = await db.execute<{
    column_name: string;
    foreign_table_name: string;
    foreign_column_name: string;
  }>(sql`
    SELECT
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = ${tableName}
      AND tc.table_schema = 'public'
  `);

  const indexesResult = await db.execute<{
    index_name: string;
    column_name: string;
    is_unique: boolean;
  }>(sql`
    SELECT
      i.relname as index_name,
      a.attname as column_name,
      ix.indisunique as is_unique
    FROM pg_class t
    JOIN pg_index ix ON t.oid = ix.indrelid
    JOIN pg_class i ON i.oid = ix.indexrelid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
    WHERE t.relname = ${tableName}
      AND t.relkind = 'r'
      AND i.relname NOT LIKE '%_pkey'
    ORDER BY i.relname, a.attnum
  `);

  const primaryKeys = primaryKeysResult.rows.map(row => row.column_name);
  const foreignKeysMap = new Map<string, { referencedTable: string; referencedColumn: string }>();
  
  foreignKeysResult.rows.forEach(row => {
    foreignKeysMap.set(row.column_name, {
      referencedTable: row.foreign_table_name,
      referencedColumn: row.foreign_column_name,
    });
  });

  const indexesMap = new Map<string, { columns: string[]; isUnique: boolean }>();
  indexesResult.rows.forEach(row => {
    if (!indexesMap.has(row.index_name)) {
      indexesMap.set(row.index_name, {
        columns: [],
        isUnique: row.is_unique,
      });
    }
    indexesMap.get(row.index_name)!.columns.push(row.column_name);
  });

  const columns: ColumnInfo[] = columnsResult.rows.map(row => {
    const isPrimaryKey = primaryKeys.includes(row.column_name);
    const foreignKey = foreignKeysMap.get(row.column_name);
    
    return {
      columnName: row.column_name,
      dataType: row.data_type,
      isNullable: row.is_nullable === 'YES',
      columnDefault: row.column_default,
      isPrimaryKey,
      isForeignKey: !!foreignKey,
      foreignKeyTable: foreignKey?.referencedTable,
      foreignKeyColumn: foreignKey?.referencedColumn,
      maxLength: row.character_maximum_length || undefined,
    };
  });

  const foreignKeys = Array.from(foreignKeysMap.entries()).map(([columnName, fk]) => ({
    columnName,
    referencedTable: fk.referencedTable,
    referencedColumn: fk.referencedColumn,
  }));

  const indexes = Array.from(indexesMap.entries()).map(([indexName, index]) => ({
    indexName,
    columns: index.columns,
    isUnique: index.isUnique,
  }));

  return {
    tableName,
    columns,
    primaryKeys,
    foreignKeys,
    indexes,
  };
}

export async function getTableRowCount(tableName: string): Promise<number> {
  validateTableName(tableName);
  
  const result = await db.execute<{ count: number }>(
    sql`SELECT COUNT(*) as count FROM ${sql.identifier(tableName)}`
  );
  
  return Number(result.rows[0]?.count) || 0;
}

export async function getTableData(
  tableName: string,
  options: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDir?: 'asc' | 'desc';
    filters?: Record<string, any>;
  } = {}
): Promise<{ data: any[]; total: number }> {
  validateTableName(tableName);

  const {
    limit = 50,
    offset = 0,
    orderBy,
    orderDir = 'desc',
    filters = {},
  } = options;

  let whereClause = sql``;
  const filterConditions: any[] = [];

  Object.entries(filters).forEach(([column, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (typeof value === 'string') {
        filterConditions.push(sql`${sql.identifier(column)} ILIKE ${`%${value}%`}`);
      } else {
        filterConditions.push(sql`${sql.identifier(column)} = ${value}`);
      }
    }
  });

  if (filterConditions.length > 0) {
    whereClause = sql`WHERE ${sql.join(filterConditions, sql` AND `)}`;
  }

  const orderClause = orderBy
    ? sql`ORDER BY ${sql.identifier(orderBy)} ${orderDir === 'asc' ? sql`ASC` : sql`DESC`}`
    : sql`ORDER BY 1 DESC`;

  const dataQuery = sql`
    SELECT * FROM ${sql.identifier(tableName)}
    ${whereClause}
    ${orderClause}
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  const countQuery = sql`
    SELECT COUNT(*) as total FROM ${sql.identifier(tableName)}
    ${whereClause}
  `;

  const [dataResult, countResult] = await Promise.all([
    db.execute(dataQuery),
    db.execute<{ total: number }>(countQuery),
  ]);

  return {
    data: dataResult.rows as any[],
    total: Number(countResult.rows[0]?.total) || 0,
  };
}

export function sanitizeRecordData(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (!/^[a-z_][a-z0-9_]*$/i.test(key)) {
      continue;
    }
    
    if (value === undefined) {
      continue;
    }
    
    sanitized[key] = value;
  }
  
  return sanitized;
}

export async function createTableRecord(
  tableName: string,
  data: Record<string, any>
): Promise<any> {
  validateTableName(tableName);
  
  const sanitizedData = sanitizeRecordData(data);
  const columns = Object.keys(sanitizedData);
  const values = Object.values(sanitizedData);

  if (columns.length === 0) {
    throw new Error('No valid data provided');
  }

  const insertQuery = sql`
    INSERT INTO ${sql.identifier(tableName)} 
    (${sql.join(columns.map(c => sql.identifier(c)), sql`, `)})
    VALUES (${sql.join(values.map(v => sql`${v}`), sql`, `)})
    RETURNING *
  `;

  const result = await db.execute(insertQuery);
  return result.rows[0];
}

export async function updateTableRecord(
  tableName: string,
  id: string,
  data: Record<string, any>
): Promise<any> {
  validateTableName(tableName);
  
  const sanitizedData = sanitizeRecordData(data);
  const updates = Object.entries(sanitizedData);

  if (updates.length === 0) {
    throw new Error('No valid data provided for update');
  }

  const setClause = sql.join(
    updates.map(([key, value]) => sql`${sql.identifier(key)} = ${value}`),
    sql`, `
  );

  const updateQuery = sql`
    UPDATE ${sql.identifier(tableName)}
    SET ${setClause}
    WHERE id = ${id}
    RETURNING *
  `;

  const result = await db.execute(updateQuery);
  
  if (result.rows.length === 0) {
    throw new Error('Record not found');
  }

  return result.rows[0];
}

export async function deleteTableRecord(
  tableName: string,
  id: string
): Promise<void> {
  validateTableName(tableName);

  const deleteQuery = sql`
    DELETE FROM ${sql.identifier(tableName)}
    WHERE id = ${id}
  `;

  const result = await db.execute(deleteQuery);
  
  if ((result as any).rowCount === 0) {
    throw new Error('Record not found');
  }
}

export async function bulkDeleteTableRecords(
  tableName: string,
  ids: string[]
): Promise<number> {
  validateTableName(tableName);

  if (ids.length === 0) {
    return 0;
  }

  const deleteQuery = sql`
    DELETE FROM ${sql.identifier(tableName)}
    WHERE id = ANY(${ids})
  `;

  const result = await db.execute(deleteQuery);
  return (result as any).rowCount || 0;
}
