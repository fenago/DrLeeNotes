import OpenAI from 'openai';
import {
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

export const chat = internalAction({
  args: {
    id: v.id('notes'),
    transcript: v.string(),
  },
  handler: async (ctx, args) => {
    const { transcript } = args;
    console.log(`[DEBUG] Together chat started for note ${args.id} with transcript length: ${transcript.length}`);

    try {
      console.log(`[DEBUG] Making Together API call for note ${args.id} using model: meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo`);
      console.log(`[DEBUG] Together API Key present: ${!!togetherApiKey}`);
      console.log(`[DEBUG] API Key starts with: ${togetherApiKey.substring(0, 5)}...`);
      
      // Using direct API call with the Llama model and manual JSON parsing
      const response = await togetherai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You analyze voice message transcripts and extract key information. Your task is to extract a title, summary (max 500 chars) in first-person perspective, and action items. Respond ONLY with a valid JSON object in this format: {"title": "Short Title", "summary": "Summary text", "actionItems": ["Item 1", "Item 2"]}. Nothing else.',
          },
          { role: 'user', content: transcript },
        ],
        model: 'meta-llama/Llama-4-Scout-17B-16E-Instruct',
        max_tokens: 1000,
        temperature: 0.6
      });
      
      // Parse the JSON response manually
      const responseContent = response.choices[0]?.message?.content?.trim() || '';
      console.log(`[DEBUG] Raw response: ${responseContent.substring(0, Math.min(100, responseContent.length))}...`);
      
      interface ExtractedData {
        title?: string;
        summary?: string;
        actionItems?: string[];
      }
      
      let jsonData: ExtractedData = {};
      try {
        jsonData = JSON.parse(responseContent) as ExtractedData;
      } catch (parseError) {
        console.error(`[ERROR] JSON parsing failed: ${parseError}`);
        // Try to extract JSON portion from response (in case model adds any text)
        const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Could not find JSON in response');
        jsonData = JSON.parse(jsonMatch[0]) as ExtractedData;
      }
      
      // Extract the needed properties with proper type checking
      const title = typeof jsonData.title === 'string' ? jsonData.title : 'Untitled';
      const summary = typeof jsonData.summary === 'string' ? jsonData.summary : 'No summary available';
      const actionItems = Array.isArray(jsonData.actionItems) ? jsonData.actionItems : [];
      
      console.log(`[DEBUG] Together API call successful for note ${args.id}`);
      console.log(`[DEBUG] Extracted title: ${title}, summary length: ${summary.length}, actionItems count: ${actionItems.length}`);

      console.log(`[DEBUG] Calling saveSummary for note ${args.id}`);
      await ctx.runMutation(internal.together.saveSummary, {
        id: args.id,
        summary,
        actionItems,
        title,
      });
      console.log(`[DEBUG] saveSummary mutation called successfully for note ${args.id}`);
    } catch (e) {
      console.error(`[ERROR] Error extracting from voice message for note ${args.id}:`, e);
      console.error(`[ERROR] Detailed error: ${JSON.stringify(e, null, 2)}`);
      
      // Provide fallback values to prevent UI from getting stuck
      console.log(`[DEBUG] Calling saveSummary with fallback values for note ${args.id}`);
      await ctx.runMutation(internal.together.saveSummary, {
        id: args.id,
        summary: 'Summary failed to generate. Please try again or check logs.',
        actionItems: ['Check application logs for errors'],
        title: 'Error Processing Note',
      });
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

export const saveSummary = internalMutation({
  args: {
    id: v.id('notes'),
    summary: v.string(),
    title: v.string(),
    actionItems: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const { id, summary, actionItems, title } = args;
      console.log(`[DEBUG] saveSummary started for note ${id} with title: ${title}`);
      
      console.log(`[DEBUG] Updating note with summary and title, marking generatingTitle as false`);
      await ctx.db.patch(id, {
        summary: summary,
        title: title,
        generatingTitle: false,
      });
      console.log(`[DEBUG] Successfully updated note with summary and title`);

      console.log(`[DEBUG] Retrieving note data for ${id}`);
      let note = await ctx.db.get(id);

      if (!note) {
        console.error(`[ERROR] Couldn't find note ${id}`);
        return;
      }
      console.log(`[DEBUG] Found note data: ${JSON.stringify(note, null, 2)}`);
      
      console.log(`[DEBUG] Creating ${actionItems.length} action items for note ${id}`);
      for (let actionItem of actionItems) {
        console.log(`[DEBUG] Creating action item: ${actionItem}`);
        await ctx.db.insert('actionItems', {
          task: actionItem,
          noteId: id,
          userId: note.userId,
        });
      }
      console.log(`[DEBUG] Successfully created all action items for note ${id}`);

      console.log(`[DEBUG] Marking generatingActionItems as false for note ${id}`);
      await ctx.db.patch(id, {
        generatingActionItems: false,
      });
      console.log(`[DEBUG] saveSummary completed successfully for note ${id}`);
    } catch (error) {
      console.error(`[ERROR] saveSummary failed for note ${args.id}:`, error);
      console.error(`[ERROR] Detailed error: ${JSON.stringify(error, null, 2)}`);
      
      // Mark everything as complete to prevent UI from getting stuck
      try {
        console.log(`[DEBUG] Attempting to recover from error for note ${args.id}`);
        await ctx.db.patch(args.id, {
          generatingTitle: false,
          generatingActionItems: false,
          title: args.title || "Error Processing Note",
          summary: args.summary || "An error occurred during processing."
        });
        console.log(`[DEBUG] Recovery completed for note ${args.id}`);
      } catch (recoveryError) {
        console.error(`[ERROR] Recovery also failed for note ${args.id}:`, recoveryError);
      }
    }
  },
});

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
      model: 'togethercomputer/m2-bert-80M-32k-retrieval',
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
  args: {
    id: v.id('notes'),
    transcript: v.string(),
  },
  handler: async (ctx, args) => {
    const getEmbedding = await togetherai.embeddings.create({
      input: [args.transcript.replace('/n', ' ')],
      model: 'togethercomputer/m2-bert-80M-32k-retrieval',
    });
    const embedding = getEmbedding.data[0].embedding;

    await ctx.runMutation(internal.together.saveEmbedding, {
      id: args.id,
      embedding,
    });
  },
});

export const saveEmbedding = internalMutation({
  args: {
    id: v.id('notes'),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    const { id, embedding } = args;
    await ctx.db.patch(id, {
      embedding: embedding,
    });
  },
});
