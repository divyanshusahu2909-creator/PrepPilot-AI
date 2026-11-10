import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SparklesIcon, ChevronDownIcon, ArrowRightIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Badge } from '../ui/Badge';
import { clsx } from '../../utils/helpers';
import { VoiceMessage } from '../../types';

interface ChatBubbleProps {
  message: VoiceMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const [showCorrections, setShowCorrections] = useState(false);
  const isAi = message.speaker === 'ai';
  const corrections = message.feedback?.grammar_corrections ?? [];
  const fluencyNote = message.feedback?.fluency_note;
  const wpm = message.metrics?.wpm;
  const wordCount = message.metrics?.word_count;
  const fillerCount = message.metrics?.filler_count;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={clsx('flex w-full gap-2.5', isAi ? 'justify-start' : 'justify-end')}
    >
      {isAi && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded bg-pine-500 text-paper dark:bg-pine-400 dark:text-graphite-950">
          <SparklesIcon className="h-4 w-4" />
        </div>
      )}
      <div className={clsx('min-w-0 max-w-[85%] space-y-1.5 sm:max-w-[75%]', !isAi && 'flex flex-col items-end')}>
        <div
          className={clsx(
            'whitespace-pre-line break-words rounded-md px-4 py-3 text-sm leading-relaxed',
            isAi
              ? 'rounded-tl-sm border border-line bg-surface-2 text-ink'
              : 'rounded-tr-sm bg-pine-600 text-paper dark:bg-pine-500 dark:text-graphite-950'
          )}
        >
          {message.text}
        </div>

        {!isAi && (wpm != null || wordCount != null || (fillerCount ?? 0) > 0) && (
          <p className="px-1 text-[11px] tabular-nums text-muted">
            {wordCount != null && `${wordCount} words`}
            {wpm != null && ` · ${Math.round(wpm)} wpm`}
            {(fillerCount ?? 0) > 0 && ` · ${fillerCount} filler words`}
          </p>
        )}

        {!isAi && (corrections.length > 0 || fluencyNote) && (
          <div className="w-full space-y-1.5">
            {fluencyNote && (
              <p className="px-1 text-xs italic text-muted">{fluencyNote}</p>
            )}
            {corrections.length > 0 && (
              <div className="overflow-hidden rounded-md border border-clay-500/25 bg-clay-500/5">
                <button
                  type="button"
                  onClick={() => setShowCorrections((v) => !v)}
                  aria-expanded={showCorrections}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 transition-colors hover:bg-clay-500/10"
                >
                  <Badge variant="yellow">
                    <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                    {corrections.length} grammar {corrections.length === 1 ? 'fix' : 'fixes'}
                  </Badge>
                  <ChevronDownIcon
                    className={clsx('h-4 w-4 text-muted transition-transform duration-300', showCorrections && 'rotate-180')}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {showCorrections && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-2.5 border-t border-clay-500/20 px-3 pb-3 pt-2.5">
                        {corrections.map((c, i) => (
                          <div key={i} className="space-y-1 text-xs">
                            <p className="flex flex-wrap items-center gap-1.5">
                              <span className="text-red-600 line-through dark:text-red-400">{c.original}</span>
                              <ArrowRightIcon className="h-3 w-3 shrink-0 text-muted" />
                              <span className="font-medium text-pine-700 dark:text-pine-300">{c.corrected}</span>
                            </p>
                            <p className="text-muted">{c.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
