import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  notes: defineTable({
    userId: v.string(),
    audioFileId: v.id('_storage'),
    audioFileUrl: v.string(),
    title: v.optional(v.string()),
    transcription: v.optional(v.string()),
    summary: v.optional(v.string()),
    embedding: v.optional(v.array(v.float64())),
    generatingTranscript: v.boolean(),
    generatingTitle: v.boolean(),
    generatingSummary: v.optional(v.boolean()), 
    generatingActionItems: v.boolean(),
    generatingEmbedding: v.optional(v.boolean()), // Changed to optional

    // LLM settings used for this note - denormalized for historical accuracy
    llmProvider: v.optional(v.string()), // e.g., 'openai', 'together', 'gemini'
    openaiModel: v.optional(v.string()), // e.g., 'gpt-3.5-turbo'
    togetherModel: v.optional(v.string()), // e.g., 'mistralai/Mixtral-8x7B-Instruct-v0.1'
    geminiModel: v.optional(v.string()), // e.g., 'gemini-pro'
    transcriptionModel: v.optional(v.string()), // Added: e.g., 'Whisper large-v3 (Replicate)'
  })
    .index('by_userId', ['userId'])
    .index('by_userId_transcription', ['userId', 'transcription'])
    .vectorIndex('by_embedding', {
      vectorField: 'embedding',
      dimensions: 768, // Dimensions for m2-bert-80M-8k-retrieval
      filterFields: ['userId'],
    })
    .index('by_userId_embedding', ['userId', 'embedding']), // If you need to query by userId and existence of embedding
  actionItems: defineTable({
    noteId: v.id('notes'),
    userId: v.string(),
    task: v.string(),
  })
    .index('by_noteId', ['noteId'])
    .index('by_userId', ['userId']),
  userSettings: defineTable({
    userId: v.string(),
    llmProvider: v.optional(v.string()), // e.g., "openai", "together", "gemini"
    openaiModel: v.optional(v.string()),    // Renamed from llmModel: e.g., for OpenAI: "gpt-4o", "gpt-3.5-turbo"
    togetherModel: v.optional(v.string()), // e.g., for Together AI: "mistralai/Mixtral-8x7B-Instruct-v0.1"
    geminiModel: v.optional(v.string()),   // e.g., for Gemini: "models/gemini-1.5-pro"
    transcriptionModelIdentifier: v.optional(v.string()), // Added: e.g., "default_whisper", "fast_whisper"
  }).index('by_userId', ['userId']),
});
