import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Enterprise } from "@shared/schema";

export function useFeaturedEnterprises() {
  return useQuery<Enterprise[]>({
    queryKey: ["/api/admin/featured-enterprises"],
  });
}

export function useFeatureEnterprise() {
  return useMutation({
    mutationFn: async (enterpriseId: string) => {
      return await apiRequest(
        "POST",
        `/api/admin/featured-enterprises/${enterpriseId}/feature`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/featured-enterprises"] });
      queryClient.invalidateQueries({ queryKey: ["/api/enterprises"] });
    },
  });
}

export function useUnfeatureEnterprise() {
  return useMutation({
    mutationFn: async (enterpriseId: string) => {
      return await apiRequest(
        "DELETE",
        `/api/admin/featured-enterprises/${enterpriseId}/unfeature`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/featured-enterprises"] });
      queryClient.invalidateQueries({ queryKey: ["/api/enterprises"] });
    },
  });
}

export function useReorderFeaturedEnterprises() {
  return useMutation({
    mutationFn: async (items: { id: string; featuredOrder: number }[]) => {
      return await apiRequest(
        "PATCH",
        "/api/admin/featured-enterprises/reorder",
        { items }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/featured-enterprises"] });
      queryClient.invalidateQueries({ queryKey: ["/api/enterprises"] });
    },
  });
}

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
}

export interface TableDataResponse {
  rows: any[];
  total: number;
  limit: number;
  offset: number;
}

export function useTables() {
  return useQuery<{ tables: TableInfo[] }>({
    queryKey: ["/api/admin/database/tables"],
  });
}

export function useTableSchema(tableName: string | null) {
  return useQuery<TableSchema>({
    queryKey: ["/api/admin/database/tables", tableName, "schema"],
    enabled: !!tableName,
  });
}

export function useTableData(
  tableName: string | null,
  options: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDir?: "asc" | "desc";
    filters?: Record<string, any>;
  } = {}
) {
  const params = new URLSearchParams();
  if (options.limit) params.set("limit", options.limit.toString());
  if (options.offset) params.set("offset", options.offset.toString());
  if (options.orderBy) params.set("orderBy", options.orderBy);
  if (options.orderDir) params.set("orderDir", options.orderDir);
  if (options.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, value.toString());
      }
    });
  }

  return useQuery<TableDataResponse>({
    queryKey: ["/api/admin/database/tables", tableName, "data", options],
    queryFn: async () => {
      const response = await fetch(
        `/api/admin/database/tables/${tableName}/data?${params.toString()}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch table data");
      }
      return response.json();
    },
    enabled: !!tableName,
  });
}

export function useCreateRecord(tableName: string) {
  return useMutation({
    mutationFn: async (data: Record<string, any>) => {
      return await apiRequest(
        "POST",
        `/api/admin/database/tables/${tableName}/data`,
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/database/tables", tableName, "data"],
      });
    },
  });
}

export function useUpdateRecord(tableName: string) {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      return await apiRequest(
        "PATCH",
        `/api/admin/database/tables/${tableName}/data/${id}`,
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/database/tables", tableName, "data"],
      });
    },
  });
}

export function useDeleteRecord(tableName: string) {
  return useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(
        "DELETE",
        `/api/admin/database/tables/${tableName}/data/${id}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/database/tables", tableName, "data"],
      });
    },
  });
}

export function useBulkDelete(tableName: string) {
  return useMutation({
    mutationFn: async (ids: string[]) => {
      return await apiRequest(
        "POST",
        `/api/admin/database/tables/${tableName}/bulk-delete`,
        { ids }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/database/tables", tableName, "data"],
      });
    },
  });
}

export function useExportTable(tableName: string) {
  return useMutation({
    mutationFn: async (format: "json" | "csv") => {
      const response = await fetch(
        `/api/admin/database/tables/${tableName}/export?format=${format}`
      );
      if (!response.ok) {
        throw new Error("Export failed");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tableName}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
      return { success: true };
    },
  });
}

export function useImportTable(tableName: string) {
  return useMutation({
    mutationFn: async ({ format, data }: { format: "json" | "csv"; data: string }) => {
      return await apiRequest(
        "POST",
        `/api/admin/database/tables/${tableName}/import`,
        { format, data }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/database/tables", tableName, "data"],
      });
    },
  });
}

export interface AITool {
  name: string;
  description: string;
  parameters: any;
  stats?: {
    usageCount: number;
    successCount: number;
  };
}

export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
  toolCalls?: Array<{
    name: string;
    arguments: any;
    result?: any;
    error?: string;
  }>;
}

export interface ChatHistoryResponse {
  conversationId: string;
  messageCount: number;
  messages: AIMessage[];
}

export function useAIChat() {
  return useMutation({
    mutationFn: async ({ message, conversationId }: { message: string; conversationId?: string }) => {
      return await apiRequest("POST", "/api/admin/ai-agent/chat", {
        message,
        conversationId,
      });
    },
  });
}

export function useAIChatHistory(conversationId: string | null) {
  return useQuery<ChatHistoryResponse>({
    queryKey: ["/api/admin/ai-agent/history", conversationId],
    enabled: !!conversationId,
  });
}

export function useClearHistory() {
  return useMutation({
    mutationFn: async (conversationId: string) => {
      return await apiRequest("DELETE", `/api/admin/ai-agent/history/${conversationId}`);
    },
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/ai-agent/history", conversationId],
      });
    },
  });
}

export function useAITools() {
  return useQuery<{ toolCount: number; tools: AITool[] }>({
    queryKey: ["/api/admin/ai-agent/tools"],
  });
}

export interface IntegrationConfig {
  id: string;
  name: string;
  displayName: string;
  provider: string;
  apiKey?: string;
  apiSecret?: string;
  isActive: boolean;
  status: "active" | "inactive" | "error";
  config?: Record<string, any>;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationHealthResponse {
  healthy: boolean;
  message?: string;
  responseTime?: number;
  lastChecked: string;
}

export interface IntegrationTestResult {
  success: boolean;
  message: string;
  details?: any;
  responseTime?: number;
}

export function useIntegrations(status?: "active" | "inactive" | "error") {
  const params = status ? `?status=${status}` : "";
  return useQuery<IntegrationConfig[]>({
    queryKey: ["/api/admin/integrations", status],
    queryFn: async () => {
      const response = await fetch(`/api/admin/integrations${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch integrations");
      }
      return response.json();
    },
  });
}

export function useIntegration(id: string | null) {
  return useQuery<IntegrationConfig>({
    queryKey: ["/api/admin/integrations", id],
    enabled: !!id,
  });
}

export function useCreateIntegration() {
  return useMutation({
    mutationFn: async (data: Partial<IntegrationConfig>) => {
      return await apiRequest("POST", "/api/admin/integrations", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/integrations"] });
    },
  });
}

export function useUpdateIntegration() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<IntegrationConfig> }) => {
      return await apiRequest("PATCH", `/api/admin/integrations/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/integrations"] });
    },
  });
}

export function useDeleteIntegration() {
  return useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/integrations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/integrations"] });
    },
  });
}

export function useTestIntegration() {
  return useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest<IntegrationTestResult>("POST", `/api/admin/integrations/${id}/test`);
    },
  });
}

export function useIntegrationHealth(id: string | null, enabled: boolean = true) {
  return useQuery<IntegrationHealthResponse>({
    queryKey: ["/api/admin/integrations", id, "health"],
    queryFn: async () => {
      const response = await fetch(`/api/admin/integrations/${id}/health`);
      if (!response.ok) {
        throw new Error("Failed to check health");
      }
      return response.json();
    },
    enabled: !!id && enabled,
    refetchInterval: 30000,
  });
}
