'use node';

import { internalAction } from './_generated/server';
import { v } from 'convex/values';
import Replicate from 'replicate';
import { internal } from './_generated/api';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY, // Ensure REPLICATE_API_KEY is set in your Convex dashboard
});

// Interface based on the provided output for vaibhavs10/incredibly-fast-whisper
interface IncrediblyFastWhisperOutput {
  text: string;
  chunks: Array<{
    text: string;
    timestamp: [number, number];
  }>;
  // Potentially other fields if the model outputs more, but 'text' is key for transcription
}

export const generateTranscriptFast = internalAction({
  args: {
    fileUrl: v.string(),
    id: v.id('notes'),
  },
  handler: async (ctx, args) => {
    try {
      console.log(`[FAST_WHISPER] Starting FAST transcription for note ${args.id} with URL ${args.fileUrl}`);
      
      const replicateOutput = (await replicate.run(
        'vaibhavs10/incredibly-fast-whisper:3ab86df6c8f54c11309d4d1f930ac292bad43ace52d10c80d87eb258b3c9f79c',
        {
          input: {
            audio: args.fileUrl,
            task: 'transcribe',
            language: 'None', // Auto-detect language
            timestamp: 'chunk', // 'chunk' or 'word'
            batch_size: 64,
            diarise_audio: false,
          },
        },
      )) as IncrediblyFastWhisperOutput;
      
      console.log(`[FAST_WHISPER] FAST transcription completed for note ${args.id}, transcript length: ${replicateOutput?.text?.length || 0} chars`);

      const transcript = replicateOutput.text || 'Error: Empty transcript from Incredibly Fast Whisper.';

      console.log(`[FAST_WHISPER] Saving FAST transcript for note ${args.id}, transcript: "${transcript.substring(0, 100)}..."`);
      
      // Call the existing saveTranscript mutation, but pass the correct model name
      await ctx.runMutation(internal.whisper.saveTranscript, {
        id: args.id,
        transcript,
        transcriptionModelName: "Incredibly Fast Whisper (Replicate)", // Pass correct model name
      });

      // After saving, the saveTranscript mutation in whisper.ts should handle
      // updating generatingTranscript to false and scheduling LLM processing.

    } catch (error) {
      console.error(`[FAST_WHISPER_ERROR] Failed to transcribe audio with Incredibly Fast Whisper for note ${args.id}:`, error);
      let errorMessage = "Error transcribing audio with Incredibly Fast Whisper.";
      if (error instanceof Error) {
        errorMessage += ` Details: ${error.message}`;
      }
      // Attempt to get more details if it's a Replicate-specific error structure
      // This is a guess; adjust based on actual error objects from Replicate
      if (typeof error === 'object' && error !== null && 'detail' in error) {
        errorMessage += ` Replicate detail: ${error.detail}`;
      }
      console.error(`Full error details: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`);
      
      await ctx.runMutation(internal.whisper.saveTranscript, {
        id: args.id,
        transcript: errorMessage,
        transcriptionModelName: "Error Incredibly Fast Whisper", // Pass specific error model name
      });
    }
  },
});
