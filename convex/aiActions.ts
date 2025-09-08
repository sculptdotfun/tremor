import { v } from 'convex/values';
import { internalAction, internalQuery, internalMutation } from './_generated/server';
import { internal } from './_generated/api';

// xAI Grok API configuration
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';
const GROK_MODEL = 'grok-4'; // Back to Grok 4

interface SearchParameters {
  mode: 'auto' | 'on' | 'off';
  sources?: Array<{
    type: 'web' | 'x' | 'news';
    excluded_websites?: string[];
    included_x_handles?: string[];
    post_favorite_count?: number;
  }>;
  from_date?: string;
  to_date?: string;
  max_search_results?: number;
  return_citations?: boolean;
}

interface GrokResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    num_sources_used?: number;
  };
  citations?: string[];
}

// Internal query to check for cached analysis
export const getCachedAnalysis = internalQuery({
  args: {
    movementId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const analysis = await ctx.db
      .query('aiAnalysis')
      .withIndex('by_movement', (q) => q.eq('movementId', args.movementId))
      .order('desc')
      .first();
    
    if (!analysis) return null;
    
    const isValid = analysis.expiresAt > now;
    return isValid ? analysis : null;
  },
});

// Internal action to generate AI analysis (can use fetch)
export const generateAnalysis: any = internalAction({
  args: {
    movementId: v.string(),
    eventId: v.string(),
    title: v.string(),
    category: v.optional(v.string()),
    currentValue: v.number(),
    previousValue: v.number(),
    seismoScore: v.number(),
    marketQuestion: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      console.error('XAI_API_KEY not configured');
      return { success: false, error: 'API key not configured' };
    }

    try {
      // Check if we already have a valid cached analysis
      const existingAnalysis = await ctx.runQuery(internal.aiActions.getCachedAnalysis, {
        movementId: args.movementId,
      });

      if (existingAnalysis) {
        console.log(`Using cached analysis for movement ${args.movementId}`);
        return { success: true, cached: true, analysis: existingAnalysis };
      }

      console.log(`Generating new AI analysis for movement ${args.movementId}`);

      // Prompt focused on what smart money is anticipating
      const analysisPrompt = `
        A prediction market just moved BEFORE mainstream news:
        
        Market: ${args.title}
        ${args.marketQuestion ? `Question: ${args.marketQuestion}` : ''}
        Category: ${args.category || 'general'}
        Movement: ${args.previousValue}% → ${args.currentValue}% (${Math.abs(args.currentValue - args.previousValue).toFixed(1)}% shift)
        Intensity Score: ${args.seismoScore.toFixed(1)}/10 (indicating ${args.seismoScore >= 7.5 ? 'extreme' : args.seismoScore >= 5 ? 'high' : 'moderate'} trading activity)
        
        Remember: Prediction markets move BEFORE news breaks. Smart money is betting on what WILL happen.
        
        Search for and analyze:
        1. What insider circles, whale wallets, or informed traders might be anticipating
        2. Early signals, rumors, or patterns that haven't hit mainstream media yet
        3. What event or announcement traders are positioning for AHEAD of time
        
        Provide a clear 2-3 sentence explanation of what traders appear to be anticipating:
        - Focus on what smart money might know that others don't yet
        - Use language like "traders appear to be positioning for", "market is pricing in", "anticipating", "ahead of expected"
        - Emphasize this is predictive/anticipatory movement, not reactive
        - Mention if this looks like insider positioning vs. sentiment shift
        
        Important: Frame this as markets moving AHEAD of news, not reacting to it. Traders are betting on future events.
        Complete all sentences - do not cut off mid-thought.
      `;

      const response = await makeGrokRequest(apiKey, analysisPrompt, {
        mode: 'on', // Always search for early signals on X
        sources: [
          {
            type: 'x',
            post_favorite_count: 10, // Very low threshold to catch earliest chatter
          },
        ],
        from_date: getDateDaysAgo(1), // Very recent - last 24 hours only
        max_search_results: 20, // More X posts to analyze
        return_citations: true,
      });

      // Check if we got a valid response
      if (!response.content || response.content.trim() === '') {
        console.error('Empty response from Grok API');
        throw new Error('AI service returned empty response');
      }

      // Calculate confidence based on single response
      const sourcesUsed = response.sourcesUsed || 0;

      const baseConfidence = Math.min(
        95,
        Math.max(
          40,
          args.seismoScore * 8 + Math.min(30, sourcesUsed * 3) // More weight per source since fewer total
        )
      );

      // Collect citations
      const allCitations = (response.citations || []).slice(0, 5);

      // Store the analysis in the database
      const now = Date.now();
      const ONE_HOUR = 60 * 60 * 1000;

      await ctx.runMutation(internal.aiService.storeAnalysis, {
        movementId: args.movementId,
        eventId: args.eventId,
        explanation: response.content,
        sources: allCitations,
        confidence: Math.round(baseConfidence),
        category: args.category,
        generatedAt: now,
        expiresAt: now + ONE_HOUR,
        sourcesUsed: sourcesUsed,
      });

      return {
        success: true,
        analysis: {
          explanation: response.content,
          sources: allCitations,
          confidence: Math.round(baseConfidence),
          isValid: true,
        },
      };
    } catch (error) {
      console.error('Failed to generate AI analysis:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

// Helper function to make Grok API requests
async function makeGrokRequest(
  apiKey: string,
  prompt: string,
  searchParams?: SearchParameters
): Promise<{
  content: string;
  citations?: string[];
  sourcesUsed?: number;
}> {
  const requestBody: Record<string, unknown> = {
    model: GROK_MODEL,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 10000, // Very generous token limit for complex analyses
  };

  if (searchParams) {
    requestBody.search_parameters = searchParams;
  }

  const response = await fetch(GROK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Grok API error: ${response.status} - ${errorText}`);
  }

  const data: GrokResponse = await response.json();

  // Debug logging
  console.log('Grok API response:', JSON.stringify(data, null, 2));

  const content = data.choices?.[0]?.message?.content || '';
  if (!content) {
    console.error('No content in Grok response:', data);
  }

  return {
    content,
    citations: data.citations,
    sourcesUsed: data.usage?.num_sources_used,
  };
}

// Helper to get ISO date string for N days ago
function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}
