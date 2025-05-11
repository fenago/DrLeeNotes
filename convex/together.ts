import OpenAI from 'openai';
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
} from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import { z } from 'zod';
import { actionWithUser } from './utils';
const togetherApiKey = process.env.TOGETHER_API_KEY ?? 'undefined';

// Together client for LLM extraction
const togetherai = new OpenAI({
  apiKey: togetherApiKey,
  baseURL: 'https://api.together.xyz/v1',
});

const NoteSchema = z.object({
  title: z
    .string()
    .describe('Short descriptive title of what the voice message is about'),
  summary: z
    .string()
    .describe(
      'A short summary in the first person point of view of the person recording the voice message',
    )
    .max(500),
  actionItems: z
    .array(z.string())
    .describe(
      'A list of action items from the voice note, short and to the point. Make sure all action item lists are fully resolved if they are nested',
    ),
});

// Renamed from 'chat' to 'extractWithTogether'
// This action now only extracts data and returns it, does not save.
export const extractWithTogether = internalAction({
  args: {
    id: v.optional(v.id('notes')), // id is not strictly needed for extraction if we just pass transcript
    transcript: v.string(),
    model: v.optional(v.string()), // Added model parameter
  },
  handler: async (ctx, args) => {
    const { transcript } = args;
    const noteId = args.id || 'unknown'; // For logging purposes if id is passed
    const selectedModel = args.model || 'mistralai/Mixtral-8x7B-Instruct-v0.1'; // Updated default, and uses args.model

    console.log(`[TOGETHER_EXTRACT] Extraction started for note ${noteId} with transcript length: ${transcript.length} using model ${selectedModel}`);

    if (!togetherApiKey || togetherApiKey === 'undefined') {
      console.error('[TOGETHER_EXTRACT] TOGETHER_API_KEY is not set or is invalid.');
      throw new Error('Together API key is not configured.');
    }

    try {
      console.log(`[TOGETHER_EXTRACT] Making Together API call for note ${noteId} using model: ${selectedModel}`);
      
      const response = await togetherai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You analyze voice message transcripts and extract key information. Your task is to extract a title, summary (max 500 chars) in first-person perspective, and action items. Respond ONLY with a valid JSON object in this format: {"title": "Short Title", "summary": "Summary text", "actionItems": ["Item 1", "Item 2"]}. Nothing else.',
          },
          { role: 'user', content: transcript },
        ],
        model: selectedModel,
        max_tokens: 1000,
        temperature: 0.6
      });
      
      const responseContent = response.choices[0]?.message?.content?.trim() || '';
      console.log(`[TOGETHER_EXTRACT] Raw response: ${responseContent.substring(0, Math.min(100, responseContent.length))}...`);
      
      interface ExtractedData {
        title?: string;
        summary?: string;
        actionItems?: string[];
      }
      
      let jsonData: ExtractedData = {};
      try {
        jsonData = JSON.parse(responseContent) as ExtractedData;
      } catch (parseError) {
        console.error(`[TOGETHER_EXTRACT] JSON parsing failed: ${parseError}`);
        const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Could not find JSON in response');
        jsonData = JSON.parse(jsonMatch[0]) as ExtractedData;
      }
      
      const title = typeof jsonData.title === 'string' ? jsonData.title : 'Untitled';
      const summary = typeof jsonData.summary === 'string' ? jsonData.summary : 'No summary available';
      const actionItems = Array.isArray(jsonData.actionItems) ? jsonData.actionItems : [];
      
      console.log(`[TOGETHER_EXTRACT] API call successful for note ${noteId}`);
      console.log(`[TOGETHER_EXTRACT] Extracted title: ${title}, summary length: ${summary.length}, actionItems count: ${actionItems.length}`);

      // Return the extracted data instead of calling saveSummary
      return {
        title,
        summary,
        actionItems,
      };

    } catch (e: any) {
      console.error(`[TOGETHER_EXTRACT] Error extracting from voice message for note ${noteId}:`, e.message, e.stack);
      if (e.response && e.response.data) {
        console.error('[TOGETHER_EXTRACT] API Error details:', e.response.data);
      }
      // Return error structure or throw, depending on how llm.ts should handle it.
      // For now, let's return fallback values so llm.ts can save them.
      return {
        title: 'Error Processing Note (Together)',
        summary: 'Summary failed to generate via Together AI. Please check logs.',
        actionItems: ['Check application logs for Together AI errors'],
      };
    }
  },
});

export const getTranscript = internalQuery({
  args: {
    id: v.id('notes'),
  },
  handler: async (ctx, args) => {
    const { id } = args;
    const note = await ctx.db.get(id);
    return note?.transcription;
  },
});

// The saveSummary mutation is now handled by convex/llm.ts:saveProcessedNoteDetails
// export const saveSummary = internalMutation({ ... }); // Keeping it commented out for now, can be deleted fully later.

export type SearchResult = {
  id: string;
  score: number;
};

export const similarNotes = actionWithUser({
  args: {
    searchQuery: v.string(),
  },
  handler: async (ctx, args): Promise<SearchResult[]> => {
    const getEmbedding = await togetherai.embeddings.create({
      input: [args.searchQuery.replace('/n', ' ')],
      model: 'togethercomputer/m2-bert-80M-8k-retrieval', // Changed to match embed action
    });
    const embedding = getEmbedding.data[0].embedding;

    // 2. Then search for similar notes
    const results = await ctx.vectorSearch('notes', 'by_embedding', {
      vector: embedding,
      limit: 16,
      filter: (q) => q.eq('userId', ctx.userId), // Only search my notes.
    });

    console.log({ results });

    return results.map((r) => ({
      id: r._id,
      score: r._score,
    }));
  },
});

export const embed = internalAction({
  args: { id: v.id('notes') }, // Only id is needed now
  handler: async (ctx, args) => {
    const { id } = args;
    console.log(`[TOGETHER_EMBED] Embedding generation started for note ${id}`);

    const transcript = await ctx.runQuery(internal.together.getTranscript, { id });

    if (!transcript) {
      console.log(`[TOGETHER_EMBED] No transcript found for note ${id}, skipping embedding.`);
      await ctx.runMutation(internal.together.saveEmbedding, {
        id,
        embedding: [], // or some indicator of failure/skip
        error: 'Transcript not found for embedding',
      });
      return;
    }

    const MIN_TRANSCRIPT_LENGTH_FOR_EMBEDDING = 25;
    if (transcript.length < MIN_TRANSCRIPT_LENGTH_FOR_EMBEDDING) {
      console.log(`[TOGETHER_EMBED] Transcript for note ${id} is too short (length: ${transcript.length}), skipping embedding.`);
      await ctx.runMutation(internal.together.saveEmbedding, {
        id,
        embedding: [],
        error: 'Transcript too short to generate a useful embedding.',
      });
      return; // Exit early
    }

    console.log(`[TOGETHER_EMBED] Transcript retrieved for note ${id}, length: ${transcript.length}. Now generating embedding.`);
    
    try {
      const embeddingResponse = await togetherai.embeddings.create({
        model: 'togethercomputer/m2-bert-80M-8k-retrieval',
        input: transcript,
      });
      
      const embedding = embeddingResponse.data[0]?.embedding;
      if (!embedding || embedding.length === 0) {
        console.error(`[TOGETHER_EMBED] Failed to generate embedding for note ${id}. Response data was empty or invalid.`);
        await ctx.runMutation(internal.together.saveEmbedding, {
          id,
          embedding: [],
          error: 'Embedding generation returned empty or invalid data.',
        });
        return;
      }

      console.log(`[TOGETHER_EMBED] Embedding generated successfully for note ${id}, dimensions: ${embedding.length}`);
      await ctx.runMutation(internal.together.saveEmbedding, { id, embedding });
    } catch (error: any) {
      console.error(`[TOGETHER_EMBED] Error generating embedding for note ${id}:`, error.message, error.stack);
      // Save a state indicating error
      await ctx.runMutation(internal.together.saveEmbedding, {
        id,
        embedding: [],
        error: `Embedding generation failed: ${error.message}`,
      });
    }
  },
});

export const saveEmbedding = internalMutation({
  args: {
    id: v.id('notes'),
    embedding: v.array(v.float64()),
    error: v.optional(v.string()), // This line is critical and was missing/incorrectly diffed previously
  },
  handler: async (ctx, args) => {
    console.log(`[TOGETHER_EMBED_SAVE] Saving embedding for note ${args.id}. Error: ${args.error || 'None'}`);
    await ctx.db.patch(args.id, {
      embedding: args.embedding,
      generatingEmbedding: false, // Mark as complete
    });
    if (args.error) {
        console.error(`[TOGETHER_EMBED_SAVE] Embedding generation for note ${args.id} had an error: ${args.error}`);
    }
    console.log(`[TOGETHER_EMBED_SAVE] Embedding saved and generatingEmbedding set to false for note ${args.id}`);
  },
});

// New action to list Together AI models
export const listTogetherModels = action({
  args: {},
  handler: async () => {
    const url = 'https://api.together.xyz/v1/models';
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${togetherApiKey}`,
      },
    };

    if (!togetherApiKey || togetherApiKey === 'undefined') {
      console.error('[TOGETHER_LIST_MODELS] TOGETHER_API_KEY is not set.');
      throw new Error('Together API key is not configured.');
    }

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[TOGETHER_LIST_MODELS] API error: ${response.status} ${response.statusText}, Body: ${errorBody}`);
        throw new Error(`Failed to fetch Together AI models: ${response.statusText}`);
      }
      const models = await response.json();
      // Filter for models that are good for chat/instruction following if possible, or return all.
      // The API response is an array of model objects. Each object has an 'id' field.
      // Example: { id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', ... }
      // We should return an array of { id: string, name: string } or similar for the frontend.
      // For now, returning a simplified list, assuming 'id' is the display name too.
      if (Array.isArray(models)) {
        return models.map(model => ({ id: model.id, name: model.display_name || model.id, type: model.type }));
      }
      console.warn('[TOGETHER_LIST_MODELS] Unexpected response format:', models);
      return [];
    } catch (error: any) {
      console.error('[TOGETHER_LIST_MODELS] Error fetching models:', error.message);
      throw new Error('Error fetching Together AI models.');
    }
  },
});
