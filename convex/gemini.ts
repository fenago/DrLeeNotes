import { v } from 'convex/values';
import { action, internalAction } from './_generated/server';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold, Part } from '@google/genai';

// Ensure GEMINI_API_KEY is set in your Convex environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

// Define a simple interface for the expected structure from Gemini
interface GeminiExtraction {
  title: string;
  summary: string;
  actionItems: string[];
}

export const listGeminiModels = action({
  args: {},
  handler: async () => {
    if (!GEMINI_API_KEY) {
      console.error('[GEMINI_LIST_MODELS] GEMINI_API_KEY is not set.');
      throw new Error('Gemini API key is not configured.');
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;

    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[GEMINI_LIST_MODELS] API error: ${response.status} ${response.statusText}, Body: ${errorBody}`);
        throw new Error(`Failed to fetch Gemini models: ${response.statusText}`);
      }
      const data = await response.json();
      const models = data.models;

      if (models && models.length > 0) {
        // The Gemini API returns models like { name: "models/gemini-1.0-pro", displayName: "Gemini 1.0 Pro", ... }
        // We want to return an array of { id: string, name: string } for consistency with other model lists
        return models
          .filter((model: any) => model.name && model.displayName && model.supportedGenerationMethods?.includes('generateContent')) // Ensure it's a model usable for generation
          .map((model: any) => ({ 
            id: model.name, // e.g., "models/gemini-1.0-pro"
            name: model.displayName, // e.g., "Gemini 1.0 Pro"
          }));
      } else {
        console.warn('[GEMINI_LIST_MODELS] No models found or unexpected response format:', data);
        return [];
      }
    } catch (error: any) {
      console.error('[GEMINI_LIST_MODELS] Error fetching models:', error.message);
      // Consider if you want to throw or return empty array / error indicator
      throw new Error('Error fetching Gemini models.'); 
    }
  },
});

export const extractWithGemini = internalAction({
  args: {
    contentToExtract: v.string(),
    modelId: v.string(), // Expects model ID like 'gemini-pro', not 'models/gemini-pro'
    safetySettings: v.optional(v.array(v.object({
      category: v.string(), // e.g., "HARM_CATEGORY_SEXUALLY_EXPLICIT"
      threshold: v.string(), // e.g., "BLOCK_MEDIUM_AND_ABOVE"
    }))),
  },
  handler: async (ctx, { contentToExtract, modelId, safetySettings: safetySettingsInput }) => {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error(
        "GEMINI_API_KEY environment variable not set. " +
        "Add your GEMINI_API_KEY to .env.local to use Gemini."
      );
    }

    const sdkModelId = modelId.startsWith('models/') ? modelId.substring('models/'.length) : modelId;

    console.log(`Attempting to extract with Gemini model: ${sdkModelId}`);
    if (safetySettingsInput) {
      console.log("Using safety settings (currently not passed to SDK v0.13.0 generateContent directly):", JSON.stringify(safetySettingsInput, null, 2));
    }

    const structuredPrompt = `
Given the following text, please extract:
1. A concise and descriptive title for the content.
2. A comprehensive summary that captures all key points, decisions, and main topics discussed.
3. A comprehensive list of ALL action items, tasks, responsibilities, commitments, and deadlines mentioned or implied in the text. This includes:
   - Newly assigned tasks or decisions made during the conversation.
   - Pre-existing tasks, commitments, or deadlines that are referenced or discussed. Consider any mentioned due date or obligation an action item (e.g., if the text says "we have a report due next week", list "Submit report next week" as an action item).
   - Explicit action items (e.g., "we need to...", "will do X", "TODO:").
   - Implicit action items (e.g., "someone should look into...", "the next step is to...").
   If absolutely no such items are found, return an array containing the single string "No Action Items found" for the "actionItems" field (e.g., ["No Action Items found"]).
Format your response ONLY as a valid JSON object with the following keys: "title" (string), "summary" (string), and "actionItems" (array of strings).
Do not include any other text, explanations, or conversational preamble or postamble outside of the JSON object.

Valid JSON Output Example:
{
  "title": "Example Meeting Recap & Project Update",
  "summary": "The meeting covered the project's current status, addressed recent challenges, and outlined next steps. Key decisions were made regarding resource allocation and timeline adjustments.",
  "actionItems": [
    "Draft the proposal by EOD Friday (new task).",
    "Ensure completion of the report due July 4th (existing deadline mentioned).",
    "Schedule a follow-up meeting with the design team (new task).",
    "Consider whether the new budget affects timeline (implicit follow-up).",
    "Investigate the feasibility of the alternative solution (new task)."
  ]
}

Text to process:
---
${contentToExtract}
---

Please provide the JSON output.
`;

    const parts = [{ text: structuredPrompt }];

    try {
      // Use genAI.models.generateContent and pass safetySettings directly for v0.13.0
      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const result = await genAI.models.generateContent({
        model: sdkModelId,
        contents: [{ role: "user", parts }],
        // Temporarily removing safetySettings due to v0.13.0 compatibility issues
        // safetySettings: safetySettingsInput, 
      });

      // Access response text using the .text getter from GenerateContentResponse
      const text = result.text;

      if (text === undefined || text.trim() === "") {
        console.error("Gemini API returned no text or empty text. Full response object:", JSON.stringify(result, null, 2));
        if (!result.candidates || result.candidates.length === 0) {
          if (result.promptFeedback) {
            console.error("Prompt Feedback:", JSON.stringify(result.promptFeedback, null, 2));
            if (result.promptFeedback.blockReason) {
              throw new Error(
                `Content generation blocked by Gemini. Reason: ${result.promptFeedback.blockReason}. ${result.promptFeedback.blockReasonMessage || ''}`
              );
            }
          }
        }
        throw new Error("Gemini API returned no text content or empty text.");
      }

      console.log("Successfully extracted content with Gemini.");
      return text; // Returns the raw string (expected to be JSON by the caller)
    } catch (error: any) {
      console.error("Error extracting with Gemini:", error.message);
      if (error.stack) {
        console.error(error.stack);
      }
      // Check for specific error properties if GoogleGenerativeAIError is not available
      // For instance, Google API errors often have a 'status' or specific message format
      if (error.message && error.message.toLowerCase().includes("api key not valid")) {
        throw new Error(`Gemini API Error: Invalid API Key. ${error.message}`);
      } else if (error.message && error.message.includes("fetch")) {
        throw new Error(`Network error calling Gemini API: ${error.message}`);
      } else if (error.response && error.response.data && error.response.data.error) {
        // Handling for generic HTTP error structures if the SDK wraps them
        const apiError = error.response.data.error;
        throw new Error(`Gemini API Error (${apiError.code || 'Unknown code'}): ${apiError.message}. Details: ${apiError.status || 'No status'}`);
      }
      throw new Error(`Failed to extract content with Gemini: ${error.message || 'Unknown error'}`);
    }
  },
});
