import { db } from '../db';
import { enterprises, crmWorkspacePeople, crmWorkspaceOpportunities } from '@shared/schema';
import { eq, and, or, sql, like } from 'drizzle-orm';

function normalizeString(str: string | null | undefined): string {
  if (!str) return '';
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

export async function findDuplicateEnterprise(
  data: any, 
  strategy: string
): Promise<any | null> {
  if (strategy === 'create_new') {
    return null;
  }

  const normalizedName = normalizeString(data.name);
  const normalizedWebsite = normalizeString(data.website);

  if (!normalizedName) {
    return null;
  }

  const conditions = [];
  
  if (normalizedName) {
    conditions.push(sql`LOWER(TRIM(${enterprises.name})) = ${normalizedName}`);
  }
  
  if (normalizedWebsite) {
    conditions.push(sql`LOWER(TRIM(${enterprises.website})) = ${normalizedWebsite}`);
  }

  if (conditions.length === 0) {
    return null;
  }

  const [existing] = await db
    .select()
    .from(enterprises)
    .where(or(...conditions))
    .limit(1);

  return existing || null;
}

export async function findDuplicatePerson(
  data: any, 
  strategy: string,
  workspaceId: string
): Promise<any | null> {
  if (strategy === 'create_new') {
    return null;
  }

  const normalizedEmail = normalizeString(data.email);
  const normalizedFirstName = normalizeString(data.firstName);
  const normalizedLastName = normalizeString(data.lastName);
  
  if (normalizedEmail) {
    const [existingByEmail] = await db
      .select()
      .from(crmWorkspacePeople)
      .where(and(
        eq(crmWorkspacePeople.workspaceId, workspaceId),
        sql`LOWER(TRIM(${crmWorkspacePeople.email})) = ${normalizedEmail}`
      ))
      .limit(1);
    
    if (existingByEmail) {
      return existingByEmail;
    }
  }

  if ((normalizedFirstName || normalizedLastName) && data.workspaceEnterpriseId) {
    const conditions = [
      eq(crmWorkspacePeople.workspaceId, workspaceId),
      eq(crmWorkspacePeople.workspaceEnterpriseId, data.workspaceEnterpriseId)
    ];
    
    if (normalizedFirstName) {
      conditions.push(sql`LOWER(TRIM(${crmWorkspacePeople.firstName})) = ${normalizedFirstName}`);
    }
    
    if (normalizedLastName) {
      conditions.push(sql`LOWER(TRIM(${crmWorkspacePeople.lastName})) = ${normalizedLastName}`);
    }
    
    const [existingByNameAndEnterprise] = await db
      .select()
      .from(crmWorkspacePeople)
      .where(and(...conditions))
      .limit(1);
    
    if (existingByNameAndEnterprise) {
      return existingByNameAndEnterprise;
    }
  }

  return null;
}

export async function findDuplicateOpportunity(
  data: any, 
  strategy: string,
  workspaceId: string
): Promise<any | null> {
  if (strategy === 'create_new') {
    return null;
  }

  const normalizedTitle = normalizeString(data.title);
  
  if (!normalizedTitle) {
    return null;
  }

  const conditions = [
    eq(crmWorkspaceOpportunities.workspaceId, workspaceId),
    sql`LOWER(TRIM(${crmWorkspaceOpportunities.title})) = ${normalizedTitle}`
  ];

  if (data.workspaceEnterpriseId) {
    conditions.push(eq(crmWorkspaceOpportunities.workspaceEnterpriseId, data.workspaceEnterpriseId));
  }

  const [existing] = await db
    .select()
    .from(crmWorkspaceOpportunities)
    .where(and(...conditions))
    .limit(1);

  return existing || null;
}
