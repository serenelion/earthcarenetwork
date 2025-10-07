import OpenAI from "openai";
import { db } from "./db";
import { users, aiUsageLogs, subscriptions } from "@shared/schema";
import { eq } from "drizzle-orm";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface BillingResult {
  response: OpenAI.Chat.Completions.ChatCompletion;
  cost: number;
  tokensUsed: {
    prompt: number;
    completion: number;
  };
}

export class InsufficientCreditsError extends Error {
  constructor(message: string = "Insufficient AI credits. Please top up your account.") {
    super(message);
    this.name = "InsufficientCreditsError";
  }
}

export async function checkUserCredits(userId: string, estimatedCost: number = 0): Promise<boolean> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Admins have unlimited credits
    if (user.role === 'admin') {
      return true;
    }

    const currentBalance = user.creditBalance || 0;
    const overageAllowed = user.overageAllowed || false;

    if (currentBalance <= 0 && !overageAllowed) {
      return false;
    }

    if (estimatedCost > 0 && currentBalance < estimatedCost && !overageAllowed) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error checking user credits:", error);
    throw error;
  }
}

export async function deductCreditsAndLog(
  userId: string,
  cost: number,
  model: string,
  tokensPrompt: number,
  tokensCompletion: number,
  operationType: string,
  entityType?: string,
  entityId?: string,
  metadata?: any
): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      const user = await tx.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Admins don't get charged but we still log their usage
      if (user.role === 'admin') {
        const userSubscription = await tx.query.subscriptions.findFirst({
          where: eq(subscriptions.userId, userId),
        });

        await tx.insert(aiUsageLogs).values({
          userId,
          subscriptionId: userSubscription?.id || null,
          operationType,
          modelUsed: model,
          tokensPrompt,
          tokensCompletion,
          providerCost: cost,
          cost,
          entityType: entityType || null,
          entityId: entityId || null,
          metadata: metadata || null,
        });

        return;
      }

      const currentBalance = user.creditBalance || 0;
      const newBalance = currentBalance - cost;

      await tx
        .update(users)
        .set({
          creditBalance: newBalance,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      const userSubscription = await tx.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, userId),
      });

      await tx.insert(aiUsageLogs).values({
        userId,
        subscriptionId: userSubscription?.id || null,
        operationType,
        modelUsed: model,
        tokensPrompt,
        tokensCompletion,
        providerCost: cost,
        cost,
        entityType: entityType || null,
        entityId: entityId || null,
        metadata: metadata || null,
      });
    });

    console.log(`[AI Billing] Deducted ${cost} cents from user ${userId}. Operation: ${operationType}, Model: ${model}`);
  } catch (error) {
    console.error("Error deducting credits and logging usage:", error);
    throw error;
  }
}

export async function callAIWithBilling(
  userId: string,
  model: string,
  messages: any[],
  operationType: string,
  options: {
    entityType?: string;
    entityId?: string;
    responseFormat?: { type: "json_object" | "text" };
    tools?: any[];
    toolChoice?: string | { type: string; function?: { name: string } };
    maxCompletionTokens?: number;
    temperature?: number;
  } = {}
): Promise<BillingResult> {
  const hasCredits = await checkUserCredits(userId);
  if (!hasCredits) {
    throw new InsufficientCreditsError();
  }

  try {
    console.log(`[AI Billing] Making OpenAI API call for user ${userId}, operation: ${operationType}, model: ${model}`);

    const requestParams: any = {
      model,
      messages,
    };

    if (options.responseFormat) {
      requestParams.response_format = options.responseFormat;
    }

    if (options.tools) {
      requestParams.tools = options.tools;
      if (options.toolChoice) {
        requestParams.tool_choice = options.toolChoice;
      }
    }

    if (options.maxCompletionTokens) {
      requestParams.max_completion_tokens = options.maxCompletionTokens;
    }

    if (options.temperature !== undefined) {
      requestParams.temperature = options.temperature;
    }

    const response = await openai.chat.completions.create(requestParams);

    const usage = response.usage;
    if (!usage) {
      console.warn("[AI Billing] No usage data in response. Using fallback estimation.");
      const estimatedPromptTokens = Math.ceil(JSON.stringify(messages).length / 4);
      const estimatedCompletionTokens = Math.ceil((response.choices[0]?.message?.content?.length || 0) / 4);
      const estimatedCost = calculateEstimatedCost(model, estimatedPromptTokens, estimatedCompletionTokens);

      await deductCreditsAndLog(
        userId,
        estimatedCost,
        model,
        estimatedPromptTokens,
        estimatedCompletionTokens,
        operationType,
        options.entityType,
        options.entityId,
        { estimated: true, response_id: response.id }
      );

      return {
        response,
        cost: estimatedCost,
        tokensUsed: {
          prompt: estimatedPromptTokens,
          completion: estimatedCompletionTokens,
        },
      };
    }

    const promptTokens = usage.prompt_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;
    const totalTokens = usage.total_tokens || promptTokens + completionTokens;

    const actualCost = calculateActualCost(model, promptTokens, completionTokens);

    await deductCreditsAndLog(
      userId,
      actualCost,
      model,
      promptTokens,
      completionTokens,
      operationType,
      options.entityType,
      options.entityId,
      {
        total_tokens: totalTokens,
        response_id: response.id,
        model: response.model,
      }
    );

    return {
      response,
      cost: actualCost,
      tokensUsed: {
        prompt: promptTokens,
        completion: completionTokens,
      },
    };
  } catch (error) {
    console.error(`[AI Billing] Error in callAIWithBilling for user ${userId}:`, error);

    if (error instanceof InsufficientCreditsError) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    await db.insert(aiUsageLogs).values({
      userId,
      subscriptionId: null,
      operationType,
      modelUsed: model,
      tokensPrompt: 0,
      tokensCompletion: 0,
      providerCost: 0,
      cost: 0,
      entityType: options.entityType || null,
      entityId: options.entityId || null,
      metadata: {
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
    });

    throw new Error(`AI request failed: ${errorMessage}`);
  }
}

function calculateActualCost(model: string, promptTokens: number, completionTokens: number): number {
  const pricingPerMillionTokens: Record<string, { prompt: number; completion: number }> = {
    "gpt-5": { prompt: 1000, completion: 3000 },
    "gpt-4o": { prompt: 250, completion: 1000 },
    "gpt-4o-mini": { prompt: 15, completion: 60 },
    "gpt-4-turbo": { prompt: 1000, completion: 3000 },
    "gpt-4": { prompt: 3000, completion: 6000 },
    "gpt-3.5-turbo": { prompt: 50, completion: 150 },
  };

  const modelPricing = pricingPerMillionTokens[model] || pricingPerMillionTokens["gpt-4o"];

  const promptCost = (promptTokens / 1_000_000) * modelPricing.prompt;
  const completionCost = (completionTokens / 1_000_000) * modelPricing.completion;

  return Math.ceil(promptCost + completionCost);
}

function calculateEstimatedCost(model: string, promptTokens: number, completionTokens: number): number {
  return calculateActualCost(model, promptTokens, completionTokens);
}

export async function callAIWithBillingStreaming(
  userId: string,
  model: string,
  messages: any[],
  operationType: string,
  options: {
    entityType?: string;
    entityId?: string;
    onChunk?: (chunk: string) => void;
    tools?: any[];
    toolChoice?: string | { type: string; function?: { name: string } };
  } = {}
): Promise<BillingResult> {
  const hasCredits = await checkUserCredits(userId);
  if (!hasCredits) {
    throw new InsufficientCreditsError();
  }

  try {
    console.log(`[AI Billing] Making streaming OpenAI API call for user ${userId}, operation: ${operationType}`);

    const requestParams: any = {
      model,
      messages,
      stream: true,
    };

    if (options.tools) {
      requestParams.tools = options.tools;
      if (options.toolChoice) {
        requestParams.tool_choice = options.toolChoice;
      }
    }

    const stream = await openai.chat.completions.create(requestParams) as any;

    let fullContent = "";
    let functionCall: any = null;
    const chunks: any[] = [];

    for await (const chunk of stream) {
      chunks.push(chunk);
      const delta = chunk.choices[0]?.delta;
      
      if (delta?.content) {
        fullContent += delta.content;
        if (options.onChunk) {
          options.onChunk(delta.content);
        }
      }

      if (delta?.tool_calls) {
        if (!functionCall) {
          functionCall = { name: "", arguments: "" };
        }
        const toolCall = delta.tool_calls[0];
        if (toolCall?.function?.name) {
          functionCall.name = toolCall.function.name;
        }
        if (toolCall?.function?.arguments) {
          functionCall.arguments += toolCall.function.arguments;
        }
      }
    }

    const estimatedPromptTokens = Math.ceil(JSON.stringify(messages).length / 4);
    const estimatedCompletionTokens = Math.ceil(fullContent.length / 4);
    const estimatedCost = calculateEstimatedCost(model, estimatedPromptTokens, estimatedCompletionTokens);

    await deductCreditsAndLog(
      userId,
      estimatedCost,
      model,
      estimatedPromptTokens,
      estimatedCompletionTokens,
      operationType,
      options.entityType,
      options.entityId,
      {
        streaming: true,
        chunks_received: chunks.length,
      }
    );

    const mockResponse: any = {
      id: chunks[0]?.id || "streaming-response",
      object: "chat.completion",
      created: Date.now(),
      model,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: fullContent,
            ...(functionCall && {
              tool_calls: [
                {
                  id: "call_streaming",
                  type: "function",
                  function: functionCall,
                },
              ],
            }),
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: estimatedPromptTokens,
        completion_tokens: estimatedCompletionTokens,
        total_tokens: estimatedPromptTokens + estimatedCompletionTokens,
      },
    };

    return {
      response: mockResponse,
      cost: estimatedCost,
      tokensUsed: {
        prompt: estimatedPromptTokens,
        completion: estimatedCompletionTokens,
      },
    };
  } catch (error) {
    console.error(`[AI Billing] Error in streaming call for user ${userId}:`, error);

    if (error instanceof InsufficientCreditsError) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    await db.insert(aiUsageLogs).values({
      userId,
      subscriptionId: null,
      operationType,
      modelUsed: model,
      tokensPrompt: 0,
      tokensCompletion: 0,
      providerCost: 0,
      cost: 0,
      entityType: options.entityType || null,
      entityId: options.entityId || null,
      metadata: {
        error: errorMessage,
        streaming: true,
        timestamp: new Date().toISOString(),
      },
    });

    throw new Error(`Streaming AI request failed: ${errorMessage}`);
  }
}
