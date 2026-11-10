import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ChatBubbleLeftRightIcon,
  LanguageIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  BoltIcon,
  MicrophoneIcon,
  StopIcon,
  PaperAirplaneIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ClockIcon,
  LightBulbIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  PlayIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { PageLoader, Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { ChatBubble } from '../components/voice/ChatBubble';
import { VoiceReportView } from '../components/voice/VoiceReportView';
import { voiceService } from '../services/voiceService';
import { useSpeech } from '../hooks/useSpeech';
import { VOICE_MODES, VOICE_MODE_LABELS } from '../utils/constants';
import {
  clsx,
  extractErrorMessage,
  formatDuration,
  scoreBadgeVariant,
  timeAgo,
  truncate,
} from '../utils/helpers';
import {
  CommunicationReport,
  VoiceExercises,
  VoiceMode,
  VoiceSession,
  VoiceSessionListItem,
} from '../types';

type View = 'home' | 'active' | 'report';

const MODE_ICONS: Record<VoiceMode, typeof ChatBubbleLeftRightIcon> = {
  conversation: ChatBubbleLeftRightIcon,
  english_practice: LanguageIcon,
  interview_simulation: BriefcaseIcon,
  daily_exercise: CalendarDaysIcon,
  topic_challenge: BoltIcon,
};

const viewMotion = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -14 },
  transition: { duration: 0.28, ease: 'easeOut' as const },
};

export default function VoiceCoach() {
  const [searchParams, setSearchParams] = useSearchParams();
  const speech = useSpeech();
  const {
    isListening,
    transcript,
    interimTranscript,
    isSpeechSupported,
    isSpeaking,
    error: speechError,
    lastConfidence,
    lastDurationSeconds,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    resetTranscript,
  } = speech;

  const [view, setView] = useState<View>('home');
  const [session, setSession] = useState<VoiceSession | null>(null);
  const [report, setReport] = useState<CommunicationReport | null>(null);
  const [booting, setBooting] = useState(false);

  // Home state
  const [mode, setMode] = useState<VoiceMode>('conversation');
  const [topic, setTopic] = useState('');
  const [exercises, setExercises] = useState<VoiceExercises | null>(null);
  const [exercisesLoading, setExercisesLoading] = useState(true);
  const [exerciseError, setExerciseError] = useState<string | null>(null);
  const [recent, setRecent] = useState<VoiceSessionListItem[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [recentError, setRecentError] = useState<string | null>(null);
  const [startingKey, setStartingKey] = useState<string | null>(null);
  const [loadingSessionId, setLoadingSessionId] = useState<number | null>(null);

  // Active state
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [muted, setMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showEndModal, setShowEndModal] = useState(false);
  const [ending, setEnding] = useState(false);
  const [abandoning, setAbandoning] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);
  const paramHandledRef = useRef(false);

  // ---------------------------------------------------------- home data
  const refreshHome = useCallback(() => {
    setExercisesLoading(true);
    setExerciseError(null);
    voiceService
      .getExercises()
      .then(setExercises)
      .catch((err) => setExerciseError(extractErrorMessage(err)))
      .finally(() => setExercisesLoading(false));
    setRecentLoading(true);
    setRecentError(null);
    voiceService
      .getSessions()
      .then((data) => setRecent(data.results.slice(0, 5)))
      .catch((err) => setRecentError(extractErrorMessage(err)))
      .finally(() => setRecentLoading(false));
  }, []);

  useEffect(() => {
    refreshHome();
  }, [refreshHome]);

  // ---------------------------------------------------------- session loading
  const applyLoadedSession = useCallback(
    (s: VoiceSession) => {
      setSession(s);
      setDraft('');
      resetTranscript();
      if (s.status === 'completed' && s.report) {
        setReport(s.report);
        setView('report');
      } else if (s.status === 'active') {
        setReport(null);
        setElapsed(Math.max(0, Math.floor((Date.now() - new Date(s.started_at).getTime()) / 1000)));
        setView('active');
      } else {
        toast('That session was abandoned. Start a new one below.');
        setView('home');
      }
    },
    [resetTranscript]
  );

  const openExistingSession = useCallback(
    async (id: number, fromList = false) => {
      if (fromList) setLoadingSessionId(id);
      else setBooting(true);
      try {
        const s = await voiceService.getSession(id);
        applyLoadedSession(s);
      } catch (err) {
        toast.error(extractErrorMessage(err));
      } finally {
        setLoadingSessionId(null);
        setBooting(false);
      }
    },
    [applyLoadedSession]
  );

  // Deep link: /voice?session=<id>
  useEffect(() => {
    if (paramHandledRef.current) return;
    paramHandledRef.current = true;
    const sid = searchParams.get('session');
    if (sid && /^\d+$/.test(sid)) {
      setSearchParams({}, { replace: true });
      void openExistingSession(Number(sid));
    }
  }, [searchParams, setSearchParams, openExistingSession]);

  // ---------------------------------------------------------- live plumbing
  // Mirror the speech transcript into the editable textarea.
  useEffect(() => {
    if (view !== 'active') return;
    setDraft((transcript + (isListening ? interimTranscript : '')).trim());
  }, [transcript, interimTranscript, isListening, view]);

  // Session timer
  const activeSessionId = view === 'active' ? session?.id : undefined;
  useEffect(() => {
    if (activeSessionId == null) return;
    const timer = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, [activeSessionId]);

  // Auto-scroll transcript
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [session?.messages.length, sending, view]);

  // ---------------------------------------------------------- actions
  const startNewSession = async (m: VoiceMode, t?: string, key = 'main') => {
    if (startingKey) return;
    setStartingKey(key);
    try {
      const s = await voiceService.startSession(m, t?.trim() || undefined);
      setSession(s);
      setReport(null);
      setDraft('');
      resetTranscript();
      setElapsed(0);
      setView('active');
      toast.success('Session started — your coach is ready');
      const opening = s.messages.find((msg) => msg.speaker === 'ai');
      if (opening && !muted) speak(opening.text).catch(() => undefined);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setStartingKey(null);
    }
  };

  const toggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      stopSpeaking();
      void startListening();
    }
  };

  const toggleMute = () => {
    setMuted((m) => {
      if (!m) stopSpeaking();
      return !m;
    });
  };

  const handleSend = async () => {
    const text = draft.trim();
    if (!session || !text || sendingRef.current) return;
    if (isListening) stopListening();
    stopSpeaking();
    sendingRef.current = true;
    setSending(true);
    try {
      const res = await voiceService.sendMessage(session.id, text, {
        duration_seconds: lastDurationSeconds || undefined,
        stt_confidence: lastConfidence,
      });
      setSession((prev) =>
        prev ? { ...prev, messages: [...prev.messages, res.user_message, res.ai_message] } : prev
      );
      setDraft('');
      resetTranscript();
      if (!muted) speak(res.ai_message.text).catch(() => undefined);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  const goHome = () => {
    stopSpeaking();
    if (isListening) stopListening();
    setSession(null);
    setReport(null);
    setDraft('');
    resetTranscript();
    setShowEndModal(false);
    setView('home');
    refreshHome();
  };

  const handleEndSession = async () => {
    if (!session || ending) return;
    setEnding(true);
    try {
      const res = await voiceService.completeSession(session.id);
      stopSpeaking();
      if (isListening) stopListening();
      setSession(res.session);
      setReport(res.report);
      setShowEndModal(false);
      setView('report');
      toast.success('Your communication report is ready');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setEnding(false);
    }
  };

  const handleAbandon = async () => {
    if (!session || abandoning) return;
    setAbandoning(true);
    try {
      await voiceService.abandonSession(session.id);
      toast.success('Session abandoned');
      goHome();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setAbandoning(false);
    }
  };

  if (booting) return <PageLoader label="Loading your voice session…" />;

  const userMessageCount = session?.messages.filter((m) => m.speaker === 'user').length ?? 0;
  const dailyExercise = exercises?.daily_exercise;

  return (
    <AnimatePresence mode="wait">
      {/* ============================================================ HOME */}
      {view === 'home' && (
        <motion.div key="home" {...viewMotion} className="space-y-6">
          <PageHeader
            eyebrow="Voice room"
            title="Voice & confidence coach"
            subtitle="Speak out loud with a coach that listens, scores, and gives you the next correction."
          />

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            {/* Mode picker + start */}
            <div className="space-y-6">
              <Card padding="none" className="overflow-hidden">
                <div className="flex items-baseline justify-between gap-2 border-b border-line px-5 py-3.5">
                  <h2 className="font-display text-base font-semibold text-ink">Choose a mode</h2>
                  <span className="text-xs text-muted">5 formats</span>
                </div>
                {VOICE_MODES.map((m) => {
                  const Icon = MODE_ICONS[m.value];
                  const selected = mode === m.value;
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setMode(m.value)}
                      aria-pressed={selected}
                      className={clsx(
                        'flex w-full items-start gap-3 border-b border-line px-5 py-3.5 text-left transition-colors last:border-b-0 focus:outline-none focus-visible:bg-surface-2',
                        selected ? 'bg-sage-200/40 dark:bg-pine-800/25' : 'hover:bg-surface-2/50'
                      )}
                    >
                      <span
                        className={clsx(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded transition-colors',
                          selected
                            ? 'bg-pine-500 text-paper dark:bg-pine-400 dark:text-graphite-950'
                            : 'bg-surface-2 text-muted'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-ink">{m.label}</span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-muted">{m.description}</span>
                      </span>
                      <span
                        className={clsx(
                          'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                          selected
                            ? 'border-pine-500 bg-pine-500 text-paper dark:border-pine-400 dark:bg-pine-400 dark:text-graphite-950'
                            : 'border-line'
                        )}
                      >
                        {selected && <CheckIcon className="h-2.5 w-2.5" strokeWidth={3} />}
                      </span>
                    </button>
                  );
                })}
              </Card>

              <Card className="space-y-4">
                <Input
                  label="Topic (optional)"
                  placeholder="e.g., Tell me about yourself"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={mode === 'daily_exercise'}
                  hint={
                    mode === 'daily_exercise'
                      ? "Daily Exercise mode uses today's guided prompt."
                      : 'Give your coach a focus, or leave blank and let it lead.'
                  }
                />
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() =>
                    startNewSession(mode, mode === 'daily_exercise' ? dailyExercise?.title : topic)
                  }
                  isLoading={startingKey === 'main'}
                  disabled={startingKey !== null && startingKey !== 'main'}
                  leftIcon={<PlayIcon className="h-5 w-5" />}
                >
                  {startingKey === 'main' ? 'Starting session…' : 'Start session'}
                </Button>
              </Card>
            </div>

            {/* Daily exercise, topics, recent */}
            <div className="space-y-6">
              <Card className="border-pine-500/20 bg-sage-200/30 dark:bg-pine-800/15">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge variant="accent" size="md">
                    <CalendarDaysIcon className="h-4 w-4" /> Daily exercise
                  </Badge>
                  {dailyExercise && <Badge variant="blue">{dailyExercise.duration_minutes} min</Badge>}
                </div>
                {exercisesLoading ? (
                  <div className="flex items-center justify-center py-8"><Spinner /></div>
                ) : exerciseError ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
                    <p className="text-sm text-red-600 dark:text-red-400">{exerciseError}</p>
                    <Button variant="secondary" size="sm" onClick={refreshHome} leftIcon={<ArrowPathIcon className="h-4 w-4" />}>
                      Retry
                    </Button>
                  </div>
                ) : dailyExercise ? (
                  <div>
                    <h3 className="font-display text-lg font-semibold tracking-tight text-ink">{dailyExercise.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{dailyExercise.prompt}</p>
                    <div className="mt-4 flex items-start gap-2 border-t border-pine-500/15 pt-3 text-xs leading-relaxed text-muted">
                      <LightBulbIcon className="mt-0.5 h-4 w-4 shrink-0 text-clay-500" />
                      <span><span className="font-semibold text-ink">Coach's tip:</span> {dailyExercise.tip}</span>
                    </div>
                    <Button
                      className="mt-4 w-full"
                      onClick={() => startNewSession('daily_exercise', dailyExercise.title, 'exercise')}
                      isLoading={startingKey === 'exercise'}
                      disabled={startingKey !== null && startingKey !== 'exercise'}
                      leftIcon={<MicrophoneIcon className="h-4 w-4" />}
                    >
                      {startingKey === 'exercise' ? 'Starting…' : 'Start exercise'}
                    </Button>
                  </div>
                ) : null}
              </Card>

              {exercises && exercises.topics.length > 0 && (
                <Card>
                  <div className="mb-3 flex items-center gap-2 border-b border-line pb-3">
                    <BoltIcon className="h-4 w-4 text-clay-500" />
                    <h3 className="font-display text-sm font-semibold text-ink">Impromptu topics</h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {exercises.topics.map((t) => (
                      <button
                        key={t}
                        type="button"
                        disabled={startingKey !== null}
                        onClick={() => startNewSession('topic_challenge', t, `topic:${t}`)}
                        className="rounded border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-ink transition-colors hover:border-pine-500/50 hover:bg-sage-200/40 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-pine-800/30"
                      >
                        {startingKey === `topic:${t}` ? 'Starting…' : t}
                      </button>
                    ))}
                  </div>
                </Card>
              )}

              <Card padding="none">
                <div className="flex items-center justify-between px-5 pb-2 pt-4">
                  <h3 className="font-display text-sm font-semibold text-ink">Recent sessions</h3>
                  <button
                    type="button"
                    onClick={refreshHome}
                    className="rounded p-1 text-muted transition-colors hover:text-pine-600 dark:hover:text-pine-300"
                    title="Refresh"
                    aria-label="Refresh recent sessions"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                  </button>
                </div>
                {recentLoading ? (
                  <div className="flex items-center justify-center py-8"><Spinner /></div>
                ) : recentError ? (
                  <div className="px-5 pb-5 text-sm text-red-600 dark:text-red-400">
                    {recentError}{' '}
                    <button type="button" onClick={refreshHome} className="underline underline-offset-2">Retry</button>
                  </div>
                ) : recent.length === 0 ? (
                  <div className="px-4 pb-4">
                    <EmptyState
                      icon={<MicrophoneIcon className="h-8 w-8" />}
                      title="No sessions yet"
                      description="Pick a mode and start speaking — your history will appear here."
                    />
                  </div>
                ) : (
                  <ul className="divide-y divide-line">
                    {recent.map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => openExistingSession(s.id, true)}
                          disabled={loadingSessionId !== null || s.status === 'abandoned'}
                          className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-surface-2/50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-ink">
                              {VOICE_MODE_LABELS[s.mode] ?? s.mode}
                              {s.topic && <span className="font-normal text-muted"> · {truncate(s.topic, 30)}</span>}
                            </p>
                            <p className="mt-0.5 text-xs text-muted">{timeAgo(s.started_at)} · {s.message_count} messages</p>
                          </div>
                          {s.overall_score != null && (
                            <Badge variant={scoreBadgeVariant(s.overall_score)}>{Math.round(s.overall_score)}</Badge>
                          )}
                          <Badge variant={s.status === 'completed' ? 'green' : s.status === 'active' ? 'blue' : 'gray'}>
                            {s.status === 'active' ? 'In progress' : s.status === 'completed' ? 'Completed' : 'Abandoned'}
                          </Badge>
                          {loadingSessionId === s.id ? (
                            <Spinner className="h-4 w-4 shrink-0" />
                          ) : (
                            <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted" />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </div>
        </motion.div>
      )}

      {/* ============================================================ ACTIVE */}
      {view === 'active' && session && (
        <motion.div key="active" {...viewMotion} className="mx-auto max-w-3xl space-y-4">
          {/* Session console */}
          <div className="overflow-hidden rounded-lg bg-pine-900 text-paper shadow-soft">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
              <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-pine-200/90">
                <span className="h-1.5 w-1.5 rounded-full bg-clay-400" />
                Voice session
              </span>
              <span className="hidden text-paper/20 sm:inline">/</span>
              <span className="text-xs font-medium text-paper/90">{VOICE_MODE_LABELS[session.mode] ?? session.mode}</span>
              {session.topic && (
                <span className="max-w-[12rem] truncate rounded border border-paper/15 px-2 py-0.5 text-[11px] text-pine-100/90">
                  {session.topic}
                </span>
              )}
              {session.demo && (
                <span className="rounded border border-paper/15 px-2 py-0.5 text-[11px] text-pine-100/90">Demo AI</span>
              )}
              <div className="ml-auto flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-sm font-semibold tabular-nums text-paper">
                  <ClockIcon className="h-4 w-4 text-pine-200/80" />
                  {formatDuration(elapsed)}
                </span>
                <button
                  type="button"
                  onClick={toggleMute}
                  title={muted ? 'Unmute coach voice' : 'Mute coach voice'}
                  aria-pressed={muted}
                  className={clsx(
                    'rounded border p-1.5 transition-colors',
                    muted
                      ? 'border-clay-300/40 bg-clay-500/20 text-clay-200'
                      : 'border-paper/15 text-pine-200/80 hover:border-paper/30 hover:text-paper'
                  )}
                >
                  {muted ? <SpeakerXMarkIcon className="h-4 w-4" /> : <SpeakerWaveIcon className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEndModal(true)}
                  className="rounded border border-paper/15 px-2.5 py-1 text-[11px] font-semibold text-pine-100/80 transition-colors hover:border-red-300/40 hover:text-red-200"
                >
                  End session
                </button>
              </div>
            </div>
          </div>

          {!isSpeechSupported && (
            <div className="flex items-start gap-2 rounded-md border border-clay-500/30 bg-clay-500/5 px-4 py-3">
              <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-clay-600 dark:text-clay-300" />
              <p className="text-sm leading-relaxed text-clay-700 dark:text-clay-200">
                Voice input isn't supported in this browser (use Chrome or Edge) — you can type your answers below and still get full feedback.
              </p>
            </div>
          )}

          {/* Transcript */}
          <Card padding="none" className="overflow-hidden">
            <div className="h-[380px] space-y-4 overflow-y-auto px-4 py-5 sm:h-[440px]">
              {session.messages.map((m) => (
                <ChatBubble key={m.id} message={m} />
              ))}
              {sending && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-pine-500 text-paper dark:bg-pine-400 dark:text-graphite-950">
                    <SparklesIcon className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-2 rounded-md rounded-tl-sm border border-line bg-surface-2 px-4 py-3">
                    <span className="text-xs text-muted">Coach is thinking</span>
                    <span className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="h-1.5 w-1.5 rounded-full bg-pine-500"
                          animate={{ opacity: [0.2, 1, 0.2] }}
                          transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                        />
                      ))}
                    </span>
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Speaking / listening strip */}
            <AnimatePresence initial={false}>
              {(isSpeaking || isListening) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t border-line"
                >
                  <div className="flex items-center gap-3 bg-surface-2/60 px-4 py-2.5">
                    {isListening ? (
                      <>
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clay-500/50" />
                          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-clay-500" />
                        </span>
                        <span className="text-xs font-medium text-clay-700 dark:text-clay-200">Listening — speak now, tap the mic again to stop</span>
                      </>
                    ) : (
                      <>
                        <span className="flex h-4 items-end gap-0.5">
                          {[0, 1, 2, 3].map((i) => (
                            <motion.span
                              key={i}
                              className="w-1 rounded-full bg-pine-500 dark:bg-pine-300"
                              animate={{ height: ['35%', '100%', '35%'] }}
                              transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.12 }}
                            />
                          ))}
                        </span>
                        <span className="text-xs font-medium text-pine-700 dark:text-pine-200">Coach is speaking…</span>
                        <Button variant="ghost" size="sm" onClick={stopSpeaking} className="ml-auto text-xs">
                          <StopIcon className="h-3.5 w-3.5" /> Stop
                        </Button>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          {/* Input */}
          <Card className="space-y-3">
            <Textarea
              rows={3}
              placeholder={
                isListening
                  ? 'Listening — your words appear here as you speak…'
                  : isSpeechSupported
                    ? 'Tap the mic and speak, or type your answer here…'
                    : 'Type your answer here…'
              }
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={sending}
            />
            {speechError && (
              <p className="flex items-start gap-1.5 text-sm text-red-600 dark:text-red-400">
                <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" /> {speechError}
              </p>
            )}
            <div className="flex items-center gap-4 border-t border-line pt-3">
              {isSpeechSupported && (
                <div className="relative shrink-0">
                  {isListening && (
                    <span className="absolute inset-0 animate-ping rounded-full bg-clay-500/25" />
                  )}
                  <button
                    type="button"
                    onClick={toggleMic}
                    disabled={sending}
                    title={isListening ? 'Stop recording' : 'Start recording'}
                    aria-pressed={isListening}
                    className={clsx(
                      'relative flex h-14 w-14 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pine-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-50',
                      isListening
                        ? 'bg-clay-500 text-paper ring-4 ring-clay-500/20'
                        : 'bg-pine-500 text-paper hover:bg-pine-600 dark:bg-pine-400 dark:text-graphite-950 dark:hover:bg-pine-300'
                    )}
                  >
                    {isListening ? <StopIcon className="h-6 w-6" /> : <MicrophoneIcon className="h-6 w-6" />}
                  </button>
                </div>
              )}
              <p className="min-w-0 flex-1 text-xs leading-relaxed text-muted">
                {isListening
                  ? 'Recording your answer. Stop the mic, review the text, then send.'
                  : 'Your coach scores fluency, grammar and confidence on every reply.'}
                {draft.trim() && (
                  <span className="mt-0.5 block tabular-nums">
                    {draft.trim().split(/\s+/).length} words ready to send
                  </span>
                )}
              </p>
              <Button
                onClick={handleSend}
                disabled={!draft.trim()}
                isLoading={sending}
                leftIcon={<PaperAirplaneIcon className="h-4 w-4" />}
                className="shrink-0"
              >
                {sending ? 'Sending…' : 'Send'}
              </Button>
            </div>
          </Card>

          {/* End session modal */}
          <Modal
            open={showEndModal}
            onClose={() => !ending && !abandoning && setShowEndModal(false)}
            title={userMessageCount === 0 ? 'No answers yet' : 'End this session?'}
          >
            {userMessageCount === 0 ? (
              <>
                <p className="text-sm leading-relaxed text-muted">
                  Your report needs at least one spoken or typed answer. Keep talking to get feedback, or abandon this session.
                </p>
                <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
                  <Button variant="danger" onClick={handleAbandon} isLoading={abandoning} disabled={ending}>
                    {abandoning ? 'Abandoning…' : 'Abandon session'}
                  </Button>
                  <Button onClick={() => setShowEndModal(false)} disabled={abandoning}>Keep talking</Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm leading-relaxed text-muted">
                  Your coach will analyze {userMessageCount} {userMessageCount === 1 ? 'answer' : 'answers'} and generate your
                  communication report. You can also abandon the session without a report.
                </p>
                <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
                  <Button variant="ghost" onClick={handleAbandon} isLoading={abandoning} disabled={ending} className="text-red-600 hover:bg-red-500/10 hover:text-red-500 dark:text-red-400">
                    {abandoning ? 'Abandoning…' : 'Abandon'}
                  </Button>
                  <Button variant="secondary" onClick={() => setShowEndModal(false)} disabled={ending || abandoning}>
                    Keep talking
                  </Button>
                  <Button onClick={handleEndSession} isLoading={ending} disabled={abandoning}>
                    {ending ? 'Generating report…' : 'End and get report'}
                  </Button>
                </div>
              </>
            )}
          </Modal>
        </motion.div>
      )}

      {/* ============================================================ REPORT */}
      {view === 'report' && session && report && (
        <motion.div key="report" {...viewMotion}>
          <VoiceReportView session={session} report={report} onNewSession={goHome} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
