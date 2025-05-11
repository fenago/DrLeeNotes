import { ConvexError, v } from 'convex/values';
import { internal } from '../convex/_generated/api';
import { mutationWithUser, queryWithUser } from './utils';
import { internalMutation, internalQuery } from './_generated/server';

export const generateUploadUrl = mutationWithUser({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const createNote = mutationWithUser({
  args: {
    storageId: v.id('_storage'),
  },
  handler: async (ctx, { storageId }) => {
    const userId = ctx.userId;
    const fileUrl = (await ctx.storage.getUrl(storageId))!;

    // Get user settings to determine which transcription model to use
    const userSettings = await ctx.runQuery(internal.notes.internalGetUserSettings, { userId });
    const transcriptionChoice = userSettings?.transcriptionModelIdentifier || 'default_whisper';

    // The note's transcriptionModel field will be set by the saveTranscript mutation
    // based on the model that actually runs.
    const noteId = await ctx.db.insert('notes', {
      userId,
      audioFileId: storageId,
      audioFileUrl: fileUrl,
      generatingTranscript: true,
      generatingTitle: true,
      generatingSummary: true,
      generatingActionItems: true,
      generatingEmbedding: true,
      // llmProvider and other llm model fields will be set when LLM processing happens
      // transcriptionModel will be set by saveTranscript mutation
    });

    if (transcriptionChoice === 'fast_whisper') {
      console.log(`[CREATE_NOTE] Scheduling Incredibly Fast Whisper for note ${noteId}`);
      await ctx.scheduler.runAfter(0, internal.incredibly_fast_whisper.generateTranscriptFast, {
        fileUrl,
        id: noteId,
      });
    } else { // 'default_whisper' or any other/unset value
      console.log(`[CREATE_NOTE] Scheduling Default Whisper for note ${noteId}`);
      await ctx.scheduler.runAfter(0, internal.whisper.chat, {
        fileUrl,
        id: noteId,
      });
    }

    return noteId;
  },
});

export const getNote = queryWithUser({
  args: {
    id: v.optional(v.id('notes')),
  },
  handler: async (ctx, args) => {
    const { id } = args;
    if (ctx.userId === undefined) {
      return null;
    }
    if (id === undefined) {
      return { note: null };
    }
    const note = await ctx.db.get(id);
    if (note?.userId !== ctx.userId) {
      throw new ConvexError('Not your note.');
    }

    const actionItems = await ctx.db
      .query('actionItems')
      .withIndex('by_noteId', (q) => q.eq('noteId', note._id))
      .collect();

    return { note, actionItems };
  },
});

export const getActionItems = queryWithUser({
  args: {},
  handler: async (ctx) => {
    const userId = ctx.userId;
    if (userId === undefined) {
      return null;
    }

    const actionItems = await ctx.db
      .query('actionItems')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .collect();

    let fullActionItems = [];

    for (let item of actionItems) {
      const note = await ctx.db.get(item.noteId);
      if (!note) continue;
      fullActionItems.push({
        ...item,
        title: note.title,
      });
    }

    return fullActionItems;
  },
});

export const getNotes = queryWithUser({
  args: {},
  handler: async (ctx, args) => {
    const userId = ctx.userId;
    if (userId === undefined) {
      return null;
    }
    const notes = await ctx.db
      .query('notes')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .order('desc')
      .collect();

    const results = Promise.all(
      notes.map(async (note) => {
        const count = (
          await ctx.db
            .query('actionItems')
            .withIndex('by_noteId', (q) => q.eq('noteId', note._id))
            .collect()
        ).length;
        return {
          count,
          ...note,
        };
      }),
    );

    return results;
  },
});

export const removeActionItem = mutationWithUser({
  args: {
    id: v.id('actionItems'),
  },
  handler: async (ctx, args) => {
    const { id } = args;
    const existing = await ctx.db.get(id);
    if (existing) {
      if (existing.userId !== ctx.userId) {
        throw new ConvexError('Not your action item');
      }
      await ctx.db.delete(id);
    }
  },
});

export const removeNote = mutationWithUser({
  args: {
    id: v.id('notes'),
  },
  handler: async (ctx, args) => {
    const { id } = args;
    const existing = await ctx.db.get(id);
    if (existing) {
      if (existing.userId !== ctx.userId) {
        throw new ConvexError('Not your note');
      }
      await ctx.db.delete(id);
      // NB: Removing note does *not* remove action items.
    }
  },
});

export const actionItemCountForNote = queryWithUser({
  args: {
    noteId: v.id('notes'),
  },
  handler: async (ctx, args) => {
    const { noteId } = args;
    const actionItems = await ctx.db
      .query('actionItems')
      .withIndex('by_noteId', (q) => q.eq('noteId', noteId))
      .collect();
    for (const ai of actionItems) {
      if (ai.userId !== ctx.userId) {
        throw new ConvexError('Not your action items');
      }
    }
    return actionItems.length;
  },
});

// --- User Settings --- 

export const getUserSettings = queryWithUser({
  args: {},
  handler: async (ctx) => {
    if (!ctx.userId) return null;
    const currentUserId = ctx.userId; 
    const settings = await ctx.db
      .query('userSettings')
      .withIndex('by_userId', (q) => q.eq('userId', currentUserId))
      .unique();
    
    if (settings) {
      return {
        ...settings,
        // Ensure a default transcription model if it's somehow not set
        transcriptionModelIdentifier: settings.transcriptionModelIdentifier || 'default_whisper',
      };
    }
    // Default settings if none exist for the user
    return {
      userId: currentUserId,
      llmProvider: 'together', // Default provider
      openaiModel: undefined, 
      togetherModel: 'mistralai/Mixtral-8x7B-Instruct-v0.1', // Default Together model
      geminiModel: undefined, // Default Gemini model
      transcriptionModelIdentifier: 'default_whisper', // Default transcription model
    };
  },
});

export const setUserSettings = mutationWithUser({
  args: {
    llmProvider: v.string(), 
    llmModel: v.optional(v.string()), // Keep for backward compatibility or specific use if any
    openaiModel: v.optional(v.string()), 
    togetherModel: v.optional(v.string()),
    geminiModel: v.optional(v.string()),
    transcriptionModelIdentifier: v.optional(v.string()), // Added
  },
  handler: async (ctx, { llmProvider, llmModel, openaiModel, togetherModel, geminiModel, transcriptionModelIdentifier }) => {
    const userId = ctx.userId;
    const existingSettings = await ctx.db
      .query('userSettings')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .unique();

    if (existingSettings) {
      await ctx.db.patch(existingSettings._id, {
        llmProvider,
        openaiModel: openaiModel === undefined ? existingSettings.openaiModel : openaiModel,
        togetherModel: togetherModel === undefined ? existingSettings.togetherModel : togetherModel,
        geminiModel: geminiModel === undefined ? existingSettings.geminiModel : geminiModel,
        transcriptionModelIdentifier: transcriptionModelIdentifier === undefined ? existingSettings.transcriptionModelIdentifier : transcriptionModelIdentifier,
      });
    } else {
      await ctx.db.insert('userSettings', {
        userId,
        llmProvider,
        openaiModel,
        togetherModel,
        geminiModel,
        transcriptionModelIdentifier: transcriptionModelIdentifier || 'default_whisper',
      });
    }
  },
});

// Internal query to get effective LLM settings for a user, used by llm.ts
export const internalGetUserSettings = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const settings = await ctx.db
      .query('userSettings')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .unique();

    if (settings) {
      return {
        ...settings,
        llmProvider: settings.llmProvider || 'together',
        togetherModel: settings.togetherModel || 'mistralai/Mixtral-8x7B-Instruct-v0.1',
        transcriptionModelIdentifier: settings.transcriptionModelIdentifier || 'default_whisper',
      };
    }
    // Default settings if none exist for the user or specific fields are missing
    return {
      userId,
      llmProvider: 'together',
      openaiModel: undefined,
      togetherModel: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
      geminiModel: undefined,
      transcriptionModelIdentifier: 'default_whisper',
    };
  },
});

// --- End User Settings ---

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const deleteOldFiles = internalMutation({
  args: { maxAgeDays: v.number() },
  handler: async (ctx, args) => {
    const { maxAgeDays } = args;
    const before = Date.now() - maxAgeDays * DAY;
    const files = await ctx.db.system
      .query('_storage')
      .withIndex('by_creation_time', (q) => q.lte('_creationTime', before))
      .order('desc')
      .take(100);
    for (const file of files) {
      await ctx.storage.delete(file._id);
    }
    if (files.length === 100) {
      await ctx.scheduler.runAfter(0, internal.notes.deleteOldFiles, {
        maxAgeDays: (Date.now() - files[files.length - 1]._creationTime) / DAY,
      });
    }
  },
});
