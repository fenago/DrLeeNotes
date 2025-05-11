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
      transcriptionModelName: "Whisper large-v3 (Replicate)",
    });
    } catch (error) {
      // Detailed error logging
      console.error(`[ERROR] Failed to transcribe audio for note ${args.id}:`, error);
      console.error(`Error details: ${JSON.stringify(error, null, 2)}`);
      
      // Still mark transcription as complete to prevent UI from getting stuck
      await ctx.runMutation(internal.whisper.saveTranscript, {
        id: args.id,
        transcript: "Error transcribing audio. Please check the logs for details.",
        transcriptionModelName: "Error",
      });
    }
  },
});

export const saveTranscript = internalMutation({
  args: {
    id: v.id('notes'),
    transcript: v.string(),
    transcriptionModelName: v.string(),
  },
  handler: async (ctx, args) => {
    console.log(`[WHISPER_SAVE] saveTranscript started for note ${args.id} with model ${args.transcriptionModelName}`);
    await ctx.db.patch(args.id, {
      transcription: args.transcript,
      generatingTranscript: false,
      generatingTitle: true, // Set to true, will be set to false by LLM processing
      generatingActionItems: true, // Set to true, will be set to false by LLM processing
      generatingEmbedding: true, // Set to true, will be set to false by embedding process
      transcriptionModel: args.transcriptionModelName,
    });
    console.log(`[WHISPER_SAVE] Patched note ${args.id} with transcript and set generating flags using model ${args.transcriptionModelName}.`);

    // Fetch the note to get the userId
    const note = await ctx.db.get(args.id);
    if (!note) {
      console.error(`[WHISPER_SAVE] Note ${args.id} not found after patching transcript.`);
      // Optionally, throw an error or handle this case if critical
      return; 
    }

    if (!note.userId) {
      console.error(`[WHISPER_SAVE] userId not found on note ${args.id}. Cannot schedule LLM processing.`);
      // Fallback: mark as not generating to prevent UI hang, though this indicates a data integrity issue.
      await ctx.db.patch(args.id, {
        generatingTitle: false,
        generatingActionItems: false,
      });
      return;
    }

    console.log(`[WHISPER_SAVE] Scheduling LLM processing for note ${args.id}, user ${note.userId}`);
    await ctx.scheduler.runAfter(0, internal.llm.processNoteWithLLM, {
      noteId: args.id, // Pass noteId explicitly
      transcript: args.transcript,
      userId: note.userId,
    });

    console.log(`[WHISPER_SAVE] Scheduling embedding generation for note ${args.id}`);
    await ctx.scheduler.runAfter(0, internal.together.embed, { id: args.id });
    console.log(`[WHISPER_SAVE] saveTranscript completed for note ${args.id}`);
  },
});
