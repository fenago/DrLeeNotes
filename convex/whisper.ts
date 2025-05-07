('use node');

import { internalAction, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import Replicate from 'replicate';
import { api, internal } from './_generated/api';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY,
});

interface whisperOutput {
  detected_language: string;
  segments: any;
  transcription: string;
  translation: string | null;
}

export const chat = internalAction({
  args: {
    fileUrl: v.string(),
    id: v.id('notes'),
  },
  handler: async (ctx, args) => {
    try {
      // Debug log - Starting transcription
      console.log(`[DEBUG] Starting transcription for note ${args.id} with URL ${args.fileUrl}`);
      
      const replicateOutput = (await replicate.run(
        'openai/whisper:4d50797290df275329f202e48c76360b3f22b08d28c196cbc54600319435f8d2',
        {
          input: {
            audio: args.fileUrl,
            model: 'large-v3',
            translate: false,
            temperature: 0,
            transcription: 'plain text',
            suppress_tokens: '-1',
            logprob_threshold: -1,
            no_speech_threshold: 0.6,
            condition_on_previous_text: true,
            compression_ratio_threshold: 2.4,
            temperature_increment_on_fallback: 0.2,
          },
        },
      )) as whisperOutput;
      
      // Debug log - Transcription completed
      console.log(`[DEBUG] Transcription completed for note ${args.id}, transcript length: ${replicateOutput?.transcription?.length || 0} chars`);

    const transcript = replicateOutput.transcription || 'error';

    // Debug log - Saving transcript
    console.log(`[DEBUG] Saving transcript for note ${args.id}, transcript: "${transcript.substring(0, 50)}..."`);
    
    await ctx.runMutation(internal.whisper.saveTranscript, {
      id: args.id,
      transcript,
    });
    } catch (error) {
      // Detailed error logging
      console.error(`[ERROR] Failed to transcribe audio for note ${args.id}:`, error);
      console.error(`Error details: ${JSON.stringify(error, null, 2)}`);
      
      // Still mark transcription as complete to prevent UI from getting stuck
      await ctx.runMutation(internal.whisper.saveTranscript, {
        id: args.id,
        transcript: "Error transcribing audio. Please check the logs for details.",
      });
    }
  },
});

export const saveTranscript = internalMutation({
  args: {
    id: v.id('notes'),
    transcript: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const { id, transcript } = args;
      console.log(`[DEBUG] saveTranscript started for note ${id}`);

      await ctx.db.patch(id, {
        transcription: transcript,
        generatingTranscript: false,
      });
      console.log(`[DEBUG] Updated note ${id} with transcript and marked generatingTranscript as false`);

      const note = (await ctx.db.get(id))!;
      console.log(`[DEBUG] Retrieved note data: ${JSON.stringify(note, null, 2)}`);
      
      if (note.audioFileId) {
        await ctx.storage.delete(note.audioFileId);
        console.log(`[DEBUG] Deleted audio file ${note.audioFileId}`);
      } else {
        console.log(`[WARNING] No audioFileId found for note ${id}`);
      }

      // Schedule LLM processing
      console.log(`[DEBUG] Scheduling Together.ai chat processing for note ${id}`);
      await ctx.scheduler.runAfter(0, internal.together.chat, {
        id: args.id,
        transcript,
      });

      console.log(`[DEBUG] Scheduling Together.ai embedding for note ${id}`);
      await ctx.scheduler.runAfter(0, internal.together.embed, {
        id: args.id,
        transcript: transcript,
      });
      
      console.log(`[DEBUG] saveTranscript completed successfully for note ${id}`);
    } catch (error) {
      console.error(`[ERROR] saveTranscript failed for note ${args.id}:`, error);
      console.error(`Error details: ${JSON.stringify(error, null, 2)}`);
      
      // Mark everything as complete to prevent UI from getting stuck
      await ctx.db.patch(args.id, {
        generatingTranscript: false,
        generatingTitle: false,
        generatingActionItems: false,
        transcription: args.transcript,
        title: "Error processing note",
        summary: "An error occurred during processing. Please try again."
      });
    }
  },
});
