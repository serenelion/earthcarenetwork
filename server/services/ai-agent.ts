import OpenAI from "openai";
import { callAIWithBillingStreaming, InsufficientCreditsError } from "../ai-billing";
import { db } from "../db";
import { storage } from "../storage";
import { 
  listTables, 
  getTableSchema, 
  getTableData,
  createTableRecord,
  updateTableRecord,
  deleteTableRecord,
  validateTableName 
} from "./database-introspection";
import { integrationService } from "./integrations";
import { ApolloConnector } from "./connectors/apollo";
import { GoogleMapsConnector } from "./connectors/google-maps";
import { FoursquareConnector } from "./connectors/foursquare";
import { decryptApiKey } from "../utils/encryption";
import type { ChatMessage } from "@shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface AgentToolCall {
  name: string;
  arguments: any;
  result?: any;
  error?: string;
}

export interface AgentResponse {
  content: string;
  toolCalls?: AgentToolCall[];
  conversationId?: string;
}

export interface StreamChunk {
  type: 'content' | 'tool_call' | 'tool_result' | 'error' | 'done';
  content?: string;
  toolCall?: AgentToolCall;
  error?: string;
}

const TOOL_DEFINITIONS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "list_database_tables",
      description: "List all available database tables with their row counts and metadata. Use this to discover what data is available.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_table_schema",
      description: "Get the complete schema definition for a specific database table, including columns, types, constraints, and relationships.",
      parameters: {
        type: "object",
        properties: {
          tableName: {
            type: "string",
            description: "The name of the table to get schema for"
          }
        },
        required: ["tableName"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_table_data",
      description: "Query data from a specific table with optional filtering and pagination. Returns rows of data from the table.",
      parameters: {
        type: "object",
        properties: {
          tableName: {
            type: "string",
            description: "The name of the table to query"
          },
          limit: {
            type: "number",
            description: "Maximum number of rows to return (default 50, max 500)"
          },
          offset: {
            type: "number",
            description: "Number of rows to skip for pagination (default 0)"
          }
        },
        required: ["tableName"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "insert_table_record",
      description: "Insert a new record into a database table. You must provide all required fields according to the table schema.",
      parameters: {
        type: "object",
        properties: {
          tableName: {
            type: "string",
            description: "The name of the table to insert into"
          },
          data: {
            type: "object",
            description: "The record data to insert as a JSON object"
          }
        },
        required: ["tableName", "data"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_table_record",
      description: "Update an existing record in a database table by its ID. Only provide the fields you want to update.",
      parameters: {
        type: "object",
        properties: {
          tableName: {
            type: "string",
            description: "The name of the table to update"
          },
          recordId: {
            type: "string",
            description: "The ID of the record to update"
          },
          data: {
            type: "object",
            description: "The fields to update as a JSON object"
          }
        },
        required: ["tableName", "recordId", "data"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_table_record",
      description: "Delete a record from a database table by its ID. Use with caution - this is permanent.",
      parameters: {
        type: "object",
        properties: {
          tableName: {
            type: "string",
            description: "The name of the table to delete from"
          },
          recordId: {
            type: "string",
            description: "The ID of the record to delete"
          }
        },
        required: ["tableName", "recordId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "enrich_with_apollo",
      description: "Search for companies or contacts using Apollo.io. Useful for finding detailed business information and contact data.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query (company name, person name, or keyword)"
          },
          type: {
            type: "string",
            enum: ["companies", "contacts"],
            description: "Type of search - companies or contacts"
          }
        },
        required: ["query", "type"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "geocode_address",
      description: "Convert an address into geographic coordinates (latitude/longitude) using Google Maps. Useful for location-based operations.",
      parameters: {
        type: "object",
        properties: {
          address: {
            type: "string",
            description: "The address to geocode"
          }
        },
        required: ["address"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_places",
      description: "Search for places, venues, or local businesses using Foursquare. Great for finding locations by category or name.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query (venue name, business type, etc.)"
          },
          location: {
            type: "string",
            description: "Location to search near (city, address, or coordinates)"
          }
        },
        required: ["query", "location"]
      }
    }
  }
];

const RESTRICTED_OPERATIONS = [
  'DROP',
  'TRUNCATE',
  'ALTER',
  'CREATE',
  'GRANT',
  'REVOKE'
];

function validateSafeOperation(tableName: string, operation: string, data?: any): void {
  validateTableName(tableName);

  const operationUpper = operation.toUpperCase();
  for (const restricted of RESTRICTED_OPERATIONS) {
    if (operationUpper.includes(restricted)) {
      throw new Error(`Restricted operation detected: ${restricted}. AI agent cannot perform destructive schema changes.`);
    }
  }

  if (data && typeof data === 'object') {
    const dataStr = JSON.stringify(data).toUpperCase();
    for (const restricted of RESTRICTED_OPERATIONS) {
      if (dataStr.includes(restricted)) {
        throw new Error(`Restricted operation detected in data: ${restricted}`);
      }
    }
  }
}

async function executeTool(
  toolName: string,
  args: any,
  userId: string
): Promise<any> {
  console.log(`[AI Agent] Executing tool: ${toolName}`, args);

  try {
    switch (toolName) {
      case "list_database_tables":
        return await listTables();

      case "get_table_schema":
        validateSafeOperation(args.tableName, 'READ');
        return await getTableSchema(args.tableName);

      case "query_table_data":
        validateSafeOperation(args.tableName, 'READ');
        const limit = Math.min(args.limit || 50, 500);
        const offset = args.offset || 0;
        return await getTableData(args.tableName, { limit, offset });

      case "insert_table_record":
        validateSafeOperation(args.tableName, 'INSERT', args.data);
        const insertedRecord = await createTableRecord(args.tableName, args.data);
        
        await storage.createAuditLog({
          userId,
          actionType: 'create',
          tableName: args.tableName,
          recordId: insertedRecord.id,
          changes: args.data,
          metadata: { source: 'ai_agent', toolName },
          ipAddress: 'ai_agent',
          userAgent: 'AI Database Agent',
          success: true
        });
        
        return insertedRecord;

      case "update_table_record":
        validateSafeOperation(args.tableName, 'UPDATE', args.data);
        const updatedRecord = await updateTableRecord(args.tableName, args.recordId, args.data);
        
        await storage.createAuditLog({
          userId,
          actionType: 'update',
          tableName: args.tableName,
          recordId: args.recordId,
          changes: args.data,
          metadata: { source: 'ai_agent', toolName },
          ipAddress: 'ai_agent',
          userAgent: 'AI Database Agent',
          success: true
        });
        
        return updatedRecord;

      case "delete_table_record":
        validateSafeOperation(args.tableName, 'DELETE');
        await deleteTableRecord(args.tableName, args.recordId);
        
        await storage.createAuditLog({
          userId,
          actionType: 'delete',
          tableName: args.tableName,
          recordId: args.recordId,
          metadata: { source: 'ai_agent', toolName },
          ipAddress: 'ai_agent',
          userAgent: 'AI Database Agent',
          success: true
        });
        
        return { success: true, message: `Record ${args.recordId} deleted from ${args.tableName}` };

      case "enrich_with_apollo":
        const apolloConfig = await integrationService.getIntegrationByName('apollo');
        if (!apolloConfig || apolloConfig.status !== 'active') {
          throw new Error('Apollo integration is not configured or active');
        }
        
        const apolloApiKey = apolloConfig.apiKey ? await decryptApiKey(apolloConfig.apiKey) : undefined;
        const apolloConnector = new ApolloConnector({ apiKey: apolloApiKey, config: apolloConfig.config });
        
        if (args.type === 'companies') {
          return await apolloConnector.searchOrganizations(args.query);
        } else {
          return await apolloConnector.searchPeople(args.query);
        }

      case "geocode_address":
        const mapsConfig = await integrationService.getIntegrationByName('google_maps');
        if (!mapsConfig || mapsConfig.status !== 'active') {
          throw new Error('Google Maps integration is not configured or active');
        }
        
        const mapsApiKey = mapsConfig.apiKey ? await decryptApiKey(mapsConfig.apiKey) : undefined;
        const mapsConnector = new GoogleMapsConnector({ apiKey: mapsApiKey, config: mapsConfig.config });
        
        return await mapsConnector.geocode(args.address);

      case "search_places":
        const foursquareConfig = await integrationService.getIntegrationByName('foursquare');
        if (!foursquareConfig || foursquareConfig.status !== 'active') {
          throw new Error('Foursquare integration is not configured or active');
        }
        
        const foursquareApiKey = foursquareConfig.apiKey ? await decryptApiKey(foursquareConfig.apiKey) : undefined;
        const foursquareConnector = new FoursquareConnector({ apiKey: foursquareApiKey, config: foursquareConfig.config });
        
        return await foursquareConnector.searchPlaces(args.query, args.location);

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error) {
    console.error(`[AI Agent] Error executing tool ${toolName}:`, error);
    throw error;
  }
}

export class AIAgent {
  private conversationHistory: Map<string, ChatMessage[]> = new Map();
  private maxHistoryLength = 20;

  async chat(
    userId: string,
    message: string,
    conversationId?: string,
    onStream?: (chunk: StreamChunk) => void
  ): Promise<AgentResponse> {
    const history = conversationId ? this.conversationHistory.get(conversationId) || [] : [];
    
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are an AI Database Agent with access to a CRM database and external data enrichment tools.

Your capabilities:
- Query and analyze database tables (enterprises, people, opportunities, tasks, etc.)
- Create, update, and delete records with proper validation
- Enrich data using Apollo.io for company and contact information
- Geocode addresses using Google Maps
- Search for venues and places using Foursquare

Safety rules:
- Never perform destructive schema operations (DROP, ALTER, TRUNCATE)
- Always validate data before modifications
- Provide clear explanations of what you're doing
- Ask for confirmation before deleting data
- Log all modifications for audit trail

Guidelines:
- Use database introspection tools first to understand the schema
- Be efficient - query only the data you need
- Provide actionable insights and recommendations
- Format responses clearly with relevant details
- Handle errors gracefully and explain what went wrong`
      }
    ];

    history.slice(-10).forEach(msg => {
      messages.push({
        role: msg.role as "user" | "assistant",
        content: msg.content
      });
    });

    messages.push({
      role: "user",
      content: message
    });

    let fullResponse = "";
    let toolCalls: AgentToolCall[] = [];
    let iterationCount = 0;
    const maxIterations = 10;

    while (iterationCount < maxIterations) {
      iterationCount++;
      
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages,
          tools: TOOL_DEFINITIONS,
          tool_choice: "auto",
          temperature: 0.7,
          max_tokens: 2000
        });

        const assistantMessage = completion.choices[0].message;

        if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
          messages.push(assistantMessage as any);

          for (const toolCall of assistantMessage.tool_calls) {
            if (toolCall.type === 'function') {
              const toolName = toolCall.function.name;
              const toolArgs = JSON.parse(toolCall.function.arguments);

              if (onStream) {
                onStream({
                  type: 'tool_call',
                  toolCall: { name: toolName, arguments: toolArgs }
                });
              }

              try {
                const result = await executeTool(toolName, toolArgs, userId);

                if (onStream) {
                  onStream({
                    type: 'tool_result',
                    toolCall: { name: toolName, arguments: toolArgs, result }
                  });
                }

                toolCalls.push({ name: toolName, arguments: toolArgs, result });

                messages.push({
                  role: "tool",
                  content: JSON.stringify(result),
                  tool_call_id: toolCall.id
                });
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                
                if (onStream) {
                  onStream({
                    type: 'tool_result',
                    toolCall: { name: toolName, arguments: toolArgs, error: errorMessage }
                  });
                }

                toolCalls.push({ name: toolName, arguments: toolArgs, error: errorMessage });

                messages.push({
                  role: "tool",
                  content: JSON.stringify({ error: errorMessage }),
                  tool_call_id: toolCall.id
                });
              }
            }
          }
        } else if (assistantMessage.content) {
          fullResponse = assistantMessage.content;
          
          if (onStream) {
            onStream({
              type: 'content',
              content: fullResponse
            });
          }
          
          break;
        } else {
          fullResponse = "I apologize, but I encountered an issue processing your request.";
          break;
        }
      } catch (error) {
        console.error("[AI Agent] Error in chat loop:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        
        if (onStream) {
          onStream({
            type: 'error',
            error: errorMessage
          });
        }
        
        throw error;
      }
    }

    if (iterationCount >= maxIterations) {
      fullResponse = "I've reached the maximum number of tool calls for this request. Please try breaking down your request into smaller parts.";
    }

    if (onStream) {
      onStream({ type: 'done' });
    }

    if (conversationId) {
      const updatedHistory = [
        ...history,
        { role: 'user', content: message } as ChatMessage,
        { role: 'assistant', content: fullResponse } as ChatMessage
      ].slice(-this.maxHistoryLength);
      
      this.conversationHistory.set(conversationId, updatedHistory);
    }

    return {
      content: fullResponse,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      conversationId
    };
  }

  getConversationHistory(conversationId: string): ChatMessage[] {
    return this.conversationHistory.get(conversationId) || [];
  }

  clearConversationHistory(conversationId: string): void {
    this.conversationHistory.delete(conversationId);
  }

  clearAllConversations(): void {
    this.conversationHistory.clear();
  }

  getAvailableTools(): typeof TOOL_DEFINITIONS {
    return TOOL_DEFINITIONS;
  }

  getToolStats(): Record<string, { usageCount: number; successCount: number }> {
    return {};
  }
}

export const aiAgent = new AIAgent();
