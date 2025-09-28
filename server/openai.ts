import OpenAI from "openai";

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

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert CRM analyst for regenerative enterprises. Provide accurate lead scoring with actionable insights."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    return {
      score: Math.max(0, Math.min(100, Math.round(result.score))),
      confidence: Math.max(0, Math.min(1, result.confidence)),
      factors: result.factors || [],
      insights: result.insights || "No specific insights generated."
    };
  } catch (error) {
    console.error("Error generating lead score:", error);
    throw new Error("Failed to generate lead score: " + error.message);
  }
}

export async function generateCopilotSuggestions(
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

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an AI copilot for regenerative enterprise CRM. Generate practical, actionable suggestions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result.suggestions || result || [];
  } catch (error) {
    console.error("Error generating copilot suggestions:", error);
    throw new Error("Failed to generate suggestions: " + error.message);
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

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error extracting enterprise data:", error);
    throw new Error("Failed to extract enterprise data: " + error.message);
  }
}
