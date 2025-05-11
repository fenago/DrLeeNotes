'use client';

import RecordedfileItemCard from '@/components/pages/dashboard/RecordedfileItemCard';
import { api } from '@/convex/_generated/api';
import { usePreloadedQueryWithAuth } from '@/lib/hooks';
import { Preloaded, useAction } from 'convex/react';
import { FunctionReturnType } from 'convex/server';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from 'convex/react';
import { Input } from "@/components/ui/input"; 
import { Button } from "@/components/ui/button"; 
import { Search } from 'lucide-react'; 

const DEFAULT_OPENAI_MODEL = 'gpt-4o'; 
const DEFAULT_TOGETHER_MODEL = 'mistralai/Mixtral-8x7B-Instruct-v0.1';
const DEFAULT_GEMINI_MODEL = 'models/gemini-1.5-pro';

export default function DashboardHomePage() {
  const allNotes = useQuery(api.notes.getNotes) || [];
  const llmSettings = useQuery(api.notes.getUserSettings);
  const [searchQuery, setSearchQuery] = useState('');
  const [relevantNotes, setRelevantNotes] =
    useState<FunctionReturnType<typeof api.notes.getNotes>>();

  const performMyAction = useAction(api.together.similarNotes);

  const handleSearch = async (e: any) => {
    e.preventDefault();

    if (searchQuery === '') {
      setRelevantNotes(undefined);
    } else {
      const scores = await performMyAction({ searchQuery: searchQuery });
      const scoreMap: Map<string, number> = new Map();
      for (const s of scores) {
        scoreMap.set(s.id, s.score);
      }
      const filteredResults = allNotes.filter(
        (note) => (scoreMap.get(note._id) ?? 0) > 0.6,
      );
      setRelevantNotes(filteredResults);
    }
  };

  const finalNotes = relevantNotes ?? allNotes;

  return (
    <div suppressHydrationWarning={true} className="min-h-screen w-full bg-background px-4 py-8 md:px-8 md:py-12">
      <div className="mb-8 w-full text-center">
        <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
          Your Voice Notes
        </h1>
        <div className="mt-2 text-sm text-muted-foreground">
          <p>Transcription: Whisper (via Replicate)</p>
          {!llmSettings ? (
            <p>LLM: Loading settings...</p>
          ) : (
            <p>
              LLM: 
              {llmSettings.llmProvider === 'openai' && `OpenAI${llmSettings.openaiModel ? ` (${llmSettings.openaiModel})` : ` (${DEFAULT_OPENAI_MODEL})`}`}
              {llmSettings.llmProvider === 'together' && `Together AI${llmSettings.togetherModel ? ` (${llmSettings.togetherModel})` : ` (${DEFAULT_TOGETHER_MODEL})`}`}
              {llmSettings.llmProvider === 'gemini' && `Gemini${llmSettings.geminiModel ? ` (${llmSettings.geminiModel})` : ` (${DEFAULT_GEMINI_MODEL})`}`}
              {!['openai', 'together', 'gemini'].includes(llmSettings.llmProvider ?? '') && (llmSettings.llmProvider ?? 'N/A')}
            </p>
          )}
        </div>
      </div>
      
      <form onSubmit={handleSearch} className="mx-auto mb-10 flex max-w-xl items-center gap-2 md:mb-12">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search your notes..."
            onChange={(e) => setSearchQuery(e.target.value)}
            value={searchQuery}
            className="w-full pl-10 pr-4 py-3 text-base" 
          />
        </div>
      </form>

      <div className="mx-auto h-fit w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {finalNotes &&
          finalNotes.map((item, index) => (
            <RecordedfileItemCard {...item} key={index} />
          ))}
        {finalNotes.length === 0 && (
          <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex h-[50vh] w-full items-center justify-center">
            <p className="text-center text-2xl text-foreground/80">
              You currently have no <br /> recordings.
            </p>
          </div>
        )}
      </div>
      
      <div className="mx-auto mt-12 flex h-fit w-full flex-col items-center px-5 pb-10 md:mt-16">
        <div className="mt-10 flex flex-col gap-6 md:flex-row">
          <Button asChild size="lg">
            <Link
              href="/record"
            >
              Record a New Voice Note
            </Link>
          </Button>
          {allNotes && allNotes.length > 0 && (
            <Button asChild variant="outline" size="lg">
              <Link
                href="/dashboard/action-items"
              >
                View Action Items
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
