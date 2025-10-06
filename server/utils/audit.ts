import { type Request } from "express";
import { storage } from "../storage";
import { type InsertAuditLog } from "@shared/schema";

export interface AuditLogData {
  userId: string;
  actionType: 'create' | 'update' | 'delete' | 'feature' | 'unfeature' | 'export' | 'import' | 'configure_tool' | 'test_integration' | 'bulk_operation';
  tableName?: string;
  recordId?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  enterpriseId?: string;
  success?: boolean;
  errorMessage?: string;
}

export async function createAuditLog(
  req: Request,
  data: AuditLogData
): Promise<void> {
  try {
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() 
      || req.socket.remoteAddress 
      || 'unknown';
    
    const userAgent = req.headers['user-agent'] || 'unknown';

    const auditLog: InsertAuditLog = {
      userId: data.userId,
      enterpriseId: data.enterpriseId,
      actionType: data.actionType,
      tableName: data.tableName,
      recordId: data.recordId,
      changes: data.changes,
      metadata: data.metadata,
      ipAddress,
      userAgent,
      success: data.success ?? true,
      errorMessage: data.errorMessage,
    };

    await storage.createAuditLog(auditLog);
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}

export function getClientIp(req: Request): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() 
    || req.socket.remoteAddress 
    || 'unknown';
}

export function getUserAgent(req: Request): string {
  return req.headers['user-agent'] || 'unknown';
}
