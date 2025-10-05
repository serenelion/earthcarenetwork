import OpenAI from "openai";
import { callAIWithBilling, InsufficientCreditsError } from "./ai-billing";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface LeadScoringResult {
  score: number;
  confidence: number;
  factors: string[];
  insights: string;
}

export interface CopilotSuggestion {
  type: 'lead_scoring' | 'outreach' | 'partnership' | 'task_automation';
  title: string;
  description: string;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high';
  relatedEntityId?: string;
  relatedEntityType?: 'enterprise' | 'person' | 'opportunity';
}

export async function generateLeadScore(
  userId: string,
  enterpriseData: any,
  personData?: any,
  context?: any
): Promise<LeadScoringResult> {
  try {
    const prompt = `
You are an expert CRM analyst specializing in regenerative enterprises and sustainability projects. 
Analyze the following data and provide a lead score from 0-100 along with insights.

Enterprise Data: ${JSON.stringify(enterpriseData)}
${personData ? `Person Data: ${JSON.stringify(personData)}` : ''}
${context ? `Scoring Context: ${JSON.stringify(context)}` : ''}

Consider factors like:
- Enterprise category alignment with regenerative goals
- Geographic location and market potential  
- Verification status and credibility
- Engagement metrics (followers, activity)
- Contact information availability
- Website quality and online presence
- Funding status and investment readiness

Respond with JSON in this exact format:
{
  "score": number (0-100),
  "confidence": number (0-1),
  "factors": ["factor1", "factor2", ...],
  "insights": "detailed analysis and recommendations"
}
`;

    const billingResult = await callAIWithBilling(
      userId,
      "gpt-5",
      [
        {
          role: "system",
          content: "You are an expert CRM analyst for regenerative enterprises. Provide accurate lead scoring with actionable insights."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      "lead_score",
      {
        entityType: "enterprise",
        entityId: enterpriseData?.id,
        responseFormat: { type: "json_object" },
      }
    );

    const content = billingResult.response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }
    const result = JSON.parse(content);
    
    return {
      score: Math.max(0, Math.min(100, Math.round(result.score))),
      confidence: Math.max(0, Math.min(1, result.confidence)),
      factors: result.factors || [],
      insights: result.insights || "No specific insights generated."
    };
  } catch (error) {
    console.error("Error generating lead score:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error("Failed to generate lead score: " + errorMessage);
  }
}

export async function generateCopilotSuggestions(
  userId: string,
  recentActivity: any[],
  stats: any,
  context?: any
): Promise<CopilotSuggestion[]> {
  try {
    const prompt = `
You are an AI copilot for Earth Network CRM, specialized in regenerative enterprise management.
Generate 3-5 actionable suggestions based on the following data:

Recent Activity: ${JSON.stringify(recentActivity)}
Current Stats: ${JSON.stringify(stats)}
${context ? `User Context: ${JSON.stringify(context)}` : ''}

Focus on:
- High-value opportunities requiring immediate attention
- Partnership opportunities between similar enterprises
- Lead scoring alerts for promising contacts
- Task automation suggestions
- Outreach recommendations based on activity patterns

Respond with JSON array in this exact format:
[
  {
    "type": "lead_scoring|outreach|partnership|task_automation",
    "title": "Brief title",
    "description": "Detailed actionable description",
    "actionable": true/false,
    "priority": "low|medium|high",
    "relatedEntityId": "optional-id",
    "relatedEntityType": "enterprise|person|opportunity"
  }
]
`;

    const billingResult = await callAIWithBilling(
      userId,
      "gpt-5",
      [
        {
          role: "system",
          content: "You are an AI copilot for regenerative enterprise CRM. Generate practical, actionable suggestions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      "copilot_suggestions",
      {
        responseFormat: { type: "json_object" },
      }
    );

    const content = billingResult.response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }
    const result = JSON.parse(content);
    return result.suggestions || result || [];
  } catch (error) {
    console.error("Error generating copilot suggestions:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error("Failed to generate suggestions: " + errorMessage);
  }
}

export async function extractEnterpriseData(
  html: string,
  sourceUrl: string
): Promise<any> {
  try {
    const prompt = `
Extract enterprise information from this HTML content. The source URL is: ${sourceUrl}

HTML Content: ${html.substring(0, 8000)}...

Extract and structure the following information:
- Company/Enterprise name
- Description/mission
- Location/address
- Website URL
- Contact email if available
- Category (land_projects, capital_sources, open_source_tools, network_organizers)
- Any relevant tags or keywords
- Social media links

Respond with JSON in this exact format:
{
  "name": "enterprise name",
  "description": "mission/description",
  "location": "location",
  "website": "website URL",
  "contactEmail": "email or null",
  "category": "category from enum",
  "tags": ["tag1", "tag2"],
  "sourceUrl": "${sourceUrl}"
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert at extracting structured enterprise data from web content. Focus on regenerative and sustainability organizations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }
    return JSON.parse(content);
  } catch (error) {
    console.error("Error extracting enterprise data:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error("Failed to extract enterprise data: " + errorMessage);
  }
}

export async function generateCopilotResponse(
  userId: string,
  userMessage: string,
  conversationHistory: any[],
  businessContext?: any,
  copilotContext?: any
): Promise<{ content?: string; functionCall?: { name: string; arguments: any } }> {
  try {
    // Define available functions for the AI
    const tools = [
      {
        type: "function",
        function: {
          name: "add_enterprise",
          description: "Add a new enterprise to the directory when the user wants to create or add an organization",
          parameters: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "The name of the enterprise or organization"
              },
              description: {
                type: "string",
                description: "A brief description of what the enterprise does"
              },
              category: {
                type: "string",
                enum: ["land_projects", "capital_sources", "open_source_tools", "network_organizers"],
                description: "The category of the enterprise"
              },
              location: {
                type: "string",
                description: "The location or address of the enterprise"
              },
              website: {
                type: "string",
                description: "The website URL of the enterprise"
              },
              contactEmail: {
                type: "string",
                description: "The contact email for the enterprise"
              }
            },
            required: ["name", "category"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "send_invitation",
          description: "Send a profile claim invitation to someone to claim ownership of an enterprise",
          parameters: {
            type: "object",
            properties: {
              enterpriseId: {
                type: "string",
                description: "The ID of the enterprise to invite someone to claim"
              },
              email: {
                type: "string",
                description: "The email address to send the invitation to"
              },
              name: {
                type: "string",
                description: "The name of the person being invited (optional)"
              }
            },
            required: ["enterpriseId", "email"]
          }
        }
      }
    ];

    // Build conversation history for AI context
    const messages: any[] = [
      {
        role: "system",
        content: `You are EarthCare Copilot, an AI assistant for regenerative enterprise management.

${businessContext ? `Business: ${businessContext.companyName || 'N/A'} | Goal: ${businessContext.outreachGoal || 'N/A'}` : ''}
${copilotContext ? `Focus: ${copilotContext.focusAreas?.join(', ') || 'N/A'}` : ''}

Expertise: Regenerative agriculture, carbon solutions, sustainable business, partnerships, CRM management.

You can help users:
- Add new enterprises to the directory using the add_enterprise function
- Send profile claim invitations using the send_invitation function
- Provide advice and insights about regenerative enterprises

When users want to add an enterprise or send invitations, use the appropriate function. Otherwise, provide helpful conversation and advice.`
      }
    ];

    // Add conversation history (limit to last 6 messages for context)
    const recentHistory = conversationHistory.slice(-6);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    }

    // Add current user message
    messages.push({
      role: "user",
      content: userMessage
    });

    console.log("Sending OpenAI request with messages:", messages.length);
    const billingResult = await callAIWithBilling(
      userId,
      "gpt-5",
      messages,
      "copilot_chat",
      {
        tools,
        toolChoice: "auto",
        maxCompletionTokens: 3000,
      }
    );

    console.log("OpenAI response received:", {
      id: billingResult.response.id,
      choices: billingResult.response.choices?.length,
      firstChoice: billingResult.response.choices?.[0] || "No choices",
    });

    const message = billingResult.response.choices[0].message;

    // Check if AI wants to call a function
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      if (toolCall.type === 'function' && toolCall.function) {
        console.log("Function call detected:", toolCall.function.name);
        return {
          functionCall: {
            name: toolCall.function.name,
            arguments: JSON.parse(toolCall.function.arguments)
          }
        };
      }
    }

    // Regular text response
    const content = message.content;
    if (!content) {
      console.error("OpenAI returned empty content. Full response:", JSON.stringify(billingResult.response, null, 2));
      throw new Error("No content received from OpenAI");
    }

    return { content };
  } catch (error) {
    console.error("Error generating copilot response:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error("Failed to generate copilot response: " + errorMessage);
  }
}
