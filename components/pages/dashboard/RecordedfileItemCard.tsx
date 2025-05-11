import { api } from '@/convex/_generated/api';
import { useMutation } from 'convex/react';
import { useRouter } from 'next/navigation';
import { Trash2, FileText, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button"; 
import { 
  Card,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"; 
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"; 
import { useState } from 'react';

const RecordedfileItemCard = ({
  title,
  count,
  _creationTime,
  _id,
  llmProvider,
  openaiModel,
  togetherModel,
  transcriptionModel,
  geminiModel,
  isError,
  summary,
}: {
  title?: string;
  count: number;
  _creationTime: number;
  _id: any;
  llmProvider?: string;
  openaiModel?: string;
  togetherModel?: string;
  transcriptionModel?: string;
  geminiModel?: string;
  isError?: boolean;
  summary?: string;
}) => {
  const deleteNote = useMutation(api.notes.removeNote);
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const formattedDate = new Date(_creationTime).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const handleCardClick = () => {
    router.push(`/recording/${_id}`);
  };

  const handleCardKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      router.push(`/recording/${_id}`);
    }
  };

  const isAudioIssue = title === 'Audio Capture Issue';

  return (
    <Card 
      className={`transition-shadow duration-300 ease-in-out group hover:shadow-xl flex flex-col h-full ${isAudioIssue ? 'border-yellow-500 dark:border-yellow-400' : 'cursor-pointer'}`}
      onClick={isAudioIssue ? undefined : handleCardClick}
      onKeyDown={isAudioIssue ? undefined : handleCardKeyDown}
      role={isAudioIssue ? "alert" : "link"}
      tabIndex={0}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 p-2 rounded-full mt-0.5 ${isAudioIssue ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
            {isAudioIssue ? (
              <AlertTriangle size={20} className="text-yellow-600 dark:text-yellow-400" />
            ) : (
              <FileText size={20} className="text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <CardTitle className={`text-base font-medium leading-snug mt-1 ${isAudioIssue ? 'text-yellow-700 dark:text-yellow-300' : 'text-gray-800 dark:text-gray-100'}`}>
            {title || 'Untitled Note'}
          </CardTitle>
        </div>
        {isAudioIssue && summary && (
          <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">{summary}</p>
        )}
        {!isAudioIssue && (
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
            {transcriptionModel && <p>Transcription: {transcriptionModel}</p>}
            {llmProvider && (
              <p>
                LLM: 
                {llmProvider === 'openai' && `OpenAI${openaiModel ? ` (${openaiModel})` : ''}`}
                {llmProvider === 'together' && `Together AI${togetherModel ? ` (${togetherModel})` : ''}`}
                {llmProvider === 'gemini' && `Gemini${geminiModel ? ` (${geminiModel})` : ''}`}
                {!['openai', 'together', 'gemini'].includes(llmProvider) && llmProvider}
              </p>
            )}
          </div>
        )}
      </CardHeader>

      <div className="mt-auto"></div> 

      <CardFooter className="flex items-center justify-between p-4 border-t dark:border-gray-700">
        <div className="flex items-center gap-x-2">
          <p className="text-sm text-muted-foreground">{formattedDate}</p>
          {!isAudioIssue && (
            <>
              <span className="text-sm text-muted-foreground">&bull;</span>
              <p className="text-sm text-muted-foreground">{count} tasks</p>
            </>
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger 
            asChild 
            onClick={(e) => {
              e.stopPropagation();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
              }
            }}
          >
            <Button 
              variant="destructive" 
              size="icon" 
              title="Delete note"
              onClick={(e) => {
                e.stopPropagation();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                }
              }}
            >
              <Trash2 size={18} />
            </Button>
          </DialogTrigger>
          <DialogContent 
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>Are you absolutely sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the
                note titled "<strong>{title || 'Untitled Note'}</strong>" and all its associated data.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-end">
              <Button 
                type="button" 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNote({ id: _id });
                  setIsDialogOpen(false);
                  router.push('/dashboard');
                }}
              >
                Confirm Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </CardFooter>
    </Card>
  );
};

export default RecordedfileItemCard;
