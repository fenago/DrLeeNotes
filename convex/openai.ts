import OpenAI from 'openai';
import { action, internalAction } from './_generated/server';
import { v } from 'convex/values';
import { z } from 'zod';

const openaiApiKey = process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
  // Log a warning if the API key is not set, but don't throw an error here
  // to allow the application to load. Functions using the API will check and throw.
  console.warn(
    'OPENAI_API_KEY is not set in environment variables. OpenAI features will not work until it is configured in the Convex dashboard.',
  );
}

// OpenAI client - initialize even if key is missing, functions will guard usage
const openai = new OpenAI({
  apiKey: openaiApiKey, // apiKey can be undefined if not set, SDK handles it gracefully until a call is made
});

// Schema for the output of the LLM (similar to the one in together.ts)
export const OpenAINoteSchema = z.object({
  title: z
    .string()
    .describe('Short descriptive title of what the voice message is about'),
  summary: z
    .string()
    .describe(
      'A short summary in the first person point of view of the person recording the voice message',
    )
    .max(1000), // Allow slightly longer summary for potentially more capable models
  actionItems: z
    .array(z.string())
    .describe(
      'A list of action items from the voice note, short and to the point. Make sure all action item lists are fully resolved if they are nested',
    ),
});

// Action to list available OpenAI models
export const listModels = action({
  handler: async () => {
    if (!openaiApiKey) {
      throw new Error(
        'OpenAI API key is not configured. Please set OPENAI_API_KEY in your Convex environment variables.',
      );
    }
    try {
      const list = await openai.models.list();
      // Filter for GPT models and sort, ensuring 'gpt-4o' is prioritized
      const gptModels = list.data
        .filter((model) => model.id.toLowerCase().includes('gpt'))
        .sort((a, b) => {
          if (a.id === 'gpt-4o') return -1; // gpt-4o comes first
          if (b.id === 'gpt-4o') return 1;
          if (a.id === 'gpt-4-turbo') return -1; // then gpt-4-turbo
          if (b.id === 'gpt-4-turbo') return 1;
          if (a.id.includes('vision')) return 1; // push vision models lower
          if (b.id.includes('vision')) return -1;
          return b.created - a.created; // Sort by creation date for others
        })
        .map((model) => model.id);

      // Ensure gpt-4o is at the top if it exists, otherwise add it
      let finalModels = [...gptModels];
      if (!finalModels.includes('gpt-4o')) {
        finalModels.unshift('gpt-4o');
      } else {
        finalModels = [
          'gpt-4o',
          ...finalModels.filter((id) => id !== 'gpt-4o'),
        ];
      }
      // Remove potential duplicates that might arise from manual unshifting
      return [...new Set(finalModels)];
    } catch (error) {
      console.error('Error listing OpenAI models:', error);
      throw new Error('Failed to list OpenAI models.');
    }
  },
});

// Internal action to extract title, summary, and action items using OpenAI
export const extractWithOpenAI = internalAction({
  args: {
    transcription: v.string(),
    model: v.optional(v.string()), // Allow model selection
  },
  handler: async (_, { transcription, model }) => {
    if (!openaiApiKey) {
      throw new Error(
        'OpenAI API key is not configured. Please set OPENAI_API_KEY in your Convex environment variables.',
      );
    }

    const selectedModel = model || 'gpt-4o'; // Default to gpt-4o

    try {
      const extraction = await openai.chat.completions.create({
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: `You are an expert AI assistant. Given the following voice note transcription, please extract a concise title, a short summary (max 1000 characters) from the first-person perspective of the recorder, and a list of actionable items. Action items should be specific tasks, commitments, or important reminders mentioned or clearly implied by the speaker. For example, if the speaker says 'The report is due Friday', an action item could be 'Complete report by Friday'. If there are no clear action items, return an empty array for actionItems. Format your response as a valid JSON object with the keys "title", "summary", and "actionItems". Adhere strictly to this JSON format: ${JSON.stringify({ title: 'string', summary: 'string', actionItems: ['string'] })}`,
          },
          {
            role: 'user',
            content: transcription,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3, // Slightly higher than 0.2 for a bit more creativity if needed, but still aiming for factual extraction
      });

      const result = extraction.choices[0].message?.content;
      if (!result) {
        throw new Error('OpenAI returned no content');
      }

      // Attempt to parse the JSON. If it's malformed, this will throw.
      const parsedResult = JSON.parse(result);
      // Validate with Zod schema. This will throw an error if validation fails.
      const validatedResult = OpenAINoteSchema.parse(parsedResult);
      return validatedResult;
    } catch (error: any) {
      console.error(
        `Error extracting with OpenAI model ${selectedModel}:`, 
        error.message,
        error.stack
      );
      if (error.response && error.response.data) {
        console.error('OpenAI API Error details:', error.response.data);
      }
      throw new Error(
        `Failed to extract details using OpenAI model ${selectedModel}. Error: ${error.message}`,
      );
    }
  },
});
