import { internalAction, internalMutation, internalQuery } from './_generated/server';
import { v } from 'convex/values';
import { api, internal } from './_generated/api';

// Default LLM settings if user hasn't specified any
const DEFAULT_LLM_PROVIDER = 'together';
const DEFAULT_TOGETHER_MODEL = 'meta-llama/Llama-3-8b-chat-hf'; // Default if no user setting
const DEFAULT_OPENAI_MODEL = 'gpt-4o'; // Default if no user setting for OpenAI model
const DEFAULT_GEMINI_MODEL = 'gemini-1.5-flash-latest'; // Changed to SDK-friendly name

// Define a more flexible interface for LLM results
interface LlmExtractionResult {
  title: string;
  summary: string;
  actionItems: string[];
  error?: boolean; // Optional error flag
}

export const processNoteWithLLM = internalAction({
  args: {
    noteId: v.id('notes'),
    transcript: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, { noteId, transcript, userId }) => {
    console.log(`[LLM] Starting LLM processing for note ${noteId}, user ${userId}`);
    let llmResults: LlmExtractionResult; // Use the new interface
    let provider = DEFAULT_LLM_PROVIDER; // Initialize with default
    let model: string | undefined; // Initialize model
    let llmDetailsToSave: {
      llmProvider?: string;
      usedOpenaiModel?: string;
      usedTogetherModel?: string;
      usedGeminiModel?: string;
    } = {};

    // Check for short or common empty transcripts
    const MIN_TRANSCRIPT_LENGTH = 15; // Adjusted from 25
    const commonEmptyPhrases = ["thank you.", "thanks."]; // Lowercase for case-insensitive check

    if (transcript.length < MIN_TRANSCRIPT_LENGTH || commonEmptyPhrases.includes(transcript.toLowerCase().trim())) {
      console.log(`[LLM] Transcript for note ${noteId} is too short or empty. Skipping LLM processing.`);
      await ctx.runMutation(internal.llm.saveProcessedNoteDetails, {
        noteId,
        title: 'Audio Capture Issue',
        summary: 'No significant audio was detected. Please ensure your microphone is enabled and try recording again.',
        actionItems: [],
        userId,
        isError: true, // Mark as an error/issue for potential UI differentiation
        // LLM details will be undefined here, which is fine
      });
      return; // Exit early
    }

    try {
      const userSettings = await ctx.runQuery(internal.notes.internalGetUserSettings, { userId });
      
      provider = userSettings?.llmProvider || DEFAULT_LLM_PROVIDER;
      // model will be assigned in the if/else block

      console.log(`[LLM] User ${userId} settings: Provider=${provider}, OpenAI=${userSettings?.openaiModel}, Together=${userSettings?.togetherModel}, Gemini=${userSettings?.geminiModel}`);

      llmDetailsToSave.llmProvider = provider;

      if (provider === 'openai') {
        model = userSettings?.openaiModel || DEFAULT_OPENAI_MODEL;
        llmDetailsToSave.usedOpenaiModel = model;
        console.log(`[LLM] Calling OpenAI extract for note ${noteId} with model ${model}`);
        llmResults = await ctx.runAction(internal.openai.extractWithOpenAI, {
          transcription: transcript,
          model: model,
        }) as LlmExtractionResult; // Assert type
      } else if (provider === 'together') { // Explicitly check for 'together'
        model = userSettings?.togetherModel || DEFAULT_TOGETHER_MODEL;
        llmDetailsToSave.usedTogetherModel = model;
        console.log(`[LLM] Calling Together AI extract for note ${noteId} with model ${model}`);
        llmResults = await ctx.runAction(internal.together.extractWithTogether, { 
          transcript: transcript,
          model: model 
        }) as LlmExtractionResult; // Assert type
      } else if (provider === 'gemini') {
        // Ensure we use the model name directly, without 'models/' prefix for the SDK
        model = userSettings?.geminiModel ? (userSettings.geminiModel.startsWith('models/') ? userSettings.geminiModel.substring('models/'.length) : userSettings.geminiModel) : DEFAULT_GEMINI_MODEL;
        llmDetailsToSave.usedGeminiModel = model;
        console.log(`[LLM] Calling Gemini extract for note ${noteId} with model ${model}`);
        
        try {
          const extractedJsonString = await ctx.runAction(internal.gemini.extractWithGemini, {
            contentToExtract: transcript, // Changed argument name
            modelId: model, // Pass the potentially stripped modelId
            safetySettings: undefined, // Pass undefined as userSettings doesn't have this field yet
          });
          
          // Parse the JSON string returned by extractWithGemini
          let jsonStringToParse = extractedJsonString.trim();
          
          // Check for and remove Markdown JSON block wrappers
          if (jsonStringToParse.startsWith("```json")) {
            jsonStringToParse = jsonStringToParse.substring("```json".length).trimStart(); // Remove "```json" and leading newline/whitespace
            if (jsonStringToParse.endsWith("```")) {
              jsonStringToParse = jsonStringToParse.substring(0, jsonStringToParse.length - "```".length).trimEnd();
            }
          } else if (jsonStringToParse.startsWith("```")) { // Fallback for just ``` ``` without 'json'
             jsonStringToParse = jsonStringToParse.substring("```".length).trimStart();
             if (jsonStringToParse.endsWith("```")) {
              jsonStringToParse = jsonStringToParse.substring(0, jsonStringToParse.length - "```".length).trimEnd();
            }
          }

          jsonStringToParse = jsonStringToParse.trim(); // Final trim for safety

          const parsedData = JSON.parse(jsonStringToParse);

          // Validate structure and create LlmExtractionResult
          if (parsedData && typeof parsedData.title === 'string' && typeof parsedData.summary === 'string' && Array.isArray(parsedData.actionItems)) {
            llmResults = {
              title: parsedData.title,
              summary: parsedData.summary,
              actionItems: parsedData.actionItems.map(String), // Ensure action items are strings
              error: false,
            };
          } else {
            console.error(`[LLM] Gemini response for note ${noteId} had unexpected structure after parsing. Parsed:`, parsedData);
            llmResults = {
              title: `Error: Gemini response for ${model} had unexpected structure.`,
              summary: `Received: ${JSON.stringify(parsedData).substring(0,100)}...`, // Added ellipsis
              actionItems: [],
              error: true,
            };
          }
        } catch (e: any) {
          console.error(`[LLM] Error processing Gemini response for note ${noteId} (model ${model}):`, e.message);
          if (e.stack) console.error(e.stack);
          llmResults = {
            title: `Error processing Gemini response for ${model}`, // Corrected to use model variable
            summary: `Details: ${e.message}`.substring(0, 150),
            actionItems: [],
            error: true,
          };
        }
      } else {
        // Fallback to default Together AI if provider is somehow unknown
        console.warn(`[LLM] Unknown provider '${provider}' from user settings. Falling back to default Together AI.`);
        model = DEFAULT_TOGETHER_MODEL;
        provider = DEFAULT_LLM_PROVIDER; // Explicitly set provider for saving
        llmDetailsToSave.llmProvider = provider;
        llmDetailsToSave.usedTogetherModel = model;
        console.log(`[LLM] Calling Together AI extract for note ${noteId} with model ${model} (fallback)`);
        llmResults = await ctx.runAction(internal.together.extractWithTogether, { 
          transcript: transcript,
          model: model
        }) as LlmExtractionResult; // Assert type
      }

      // Check if the extraction result indicates an error
      if (llmResults && llmResults.error === true) {
        console.error(`[LLM] Extraction failed for note ${noteId} using ${provider} (model: ${model}). Error details: Title='${llmResults.title}', Summary='${llmResults.summary}'`);
      } else if (llmResults) { // Ensure llmResults is defined before accessing title
        console.log(`[LLM] Extraction successful for note ${noteId}. Title: ${llmResults.title}`);
      } else {
        // This case should ideally not be reached if actions always return a conformant object or throw
        console.error(`[LLM] llmResults is undefined after extraction attempt for note ${noteId}. This is unexpected.`);
        // Provide a default error structure for llmResults to prevent crashes downstream
        llmResults = { 
            title: 'Critical Error: LLM Result Undefined',
            summary: 'The LLM extraction process returned an undefined result. Check provider-specific extraction functions.',
            actionItems: ['Investigate llm.ts for undefined llmResults, and check specific extraction function logs (e.g., gemini.extractWithGemini).'],
            error: true,
        };
      }

      await ctx.runMutation(internal.llm.saveProcessedNoteDetails, {
        noteId,
        title: llmResults.title, // llmResults will be defined here
        summary: llmResults.summary,
        actionItems: llmResults.actionItems,
        userId, // Pass userId for creating action items
        isError: llmResults.error === true, // Pass the error status
        ...llmDetailsToSave,
      });

      console.log(`[LLM] Successfully saved processed details for note ${noteId}`);

    } catch (error: any) {
      console.error(`[LLM] Error processing note ${noteId} with LLM:`, error.message, error.stack);
      // Fallback saving to prevent UI issues
      // llmDetailsToSave might contain the provider/model if error occurred after their determination
      await ctx.runMutation(internal.llm.saveProcessedNoteDetails, {
        noteId,
        title: 'Error Processing Note',
        summary: 'LLM processing failed. Please check logs.',
        actionItems: ['Check application logs for LLM errors'],
        userId,
        isError: true,
        ...llmDetailsToSave, // Save whatever LLM details were determined, if any
      });
    }
  },
});

export const saveProcessedNoteDetails = internalMutation({
  args: {
    noteId: v.id('notes'),
    title: v.string(),
    summary: v.string(),
    actionItems: v.array(v.string()),
    userId: v.string(),
    isError: v.optional(v.boolean()), // To know if we are saving fallback data
    llmProvider: v.optional(v.string()),
    usedOpenaiModel: v.optional(v.string()),
    usedTogetherModel: v.optional(v.string()),
    usedGeminiModel: v.optional(v.string()),
  },
  handler: async (ctx, { noteId, title, summary, actionItems, userId, isError, llmProvider, usedOpenaiModel, usedTogetherModel, usedGeminiModel }) => {
    console.log(`[LLM_SAVE] Saving details for note ${noteId}. Title: ${title}. Provider: ${llmProvider}. IsError: ${isError}`);
    try {
      await ctx.db.patch(noteId, {
        title: title,
        summary: summary,
        generatingTitle: false, 
        generatingSummary: false, 
        generatingActionItems: false,
        llmProvider: llmProvider,
        openaiModel: usedOpenaiModel,
        togetherModel: usedTogetherModel,
        geminiModel: usedGeminiModel,
      });
      console.log(`[LLM_SAVE] Patched note ${noteId} with title, summary, and LLM details.`);

      // Only create action items if it's not an error fallback for them
      if (!(isError && actionItems.length > 0 && actionItems[0].startsWith('Check application logs'))) {
         // Clear existing action items for this note to prevent duplicates if re-processing
        const existingActionItems = await ctx.db
          .query('actionItems')
          .withIndex('by_noteId', (q) => q.eq('noteId', noteId))
          .collect();
        for (const item of existingActionItems) {
          await ctx.db.delete(item._id);
        }
        console.log(`[LLM_SAVE] Cleared ${existingActionItems.length} existing action items for note ${noteId}`);
        
        for (let actionItem of actionItems) {
          await ctx.db.insert('actionItems', {
            task: actionItem,
            noteId: noteId,
            userId: userId, 
            // Add isCompleted and dueDate if your schema supports them and you want defaults
            // isCompleted: false, 
            // dueDate: undefined 
          });
        }
        console.log(`[LLM_SAVE] Inserted ${actionItems.length} new action items for note ${noteId}`);
      }

    } catch (error: any) {
      console.error(`[LLM_SAVE] Failed to save processed details for note ${noteId}:`, error.message, error.stack);
      // If saving details fails, we can't do much more here but log it.
      // The generating flags should ideally be set to false to prevent UI hangs.
       await ctx.db.patch(noteId, {
        generatingTitle: false,
        generatingSummary: false,
        generatingActionItems: false,
        // Potentially set error state on the note itself if schema allows
      });
    }
  },
});
