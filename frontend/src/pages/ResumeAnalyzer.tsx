import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ArrowPathIcon,
  ArrowRightIcon,
  ArrowTopRightOnSquareIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentArrowUpIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Spinner } from '../components/ui/Spinner';
import { AnalysisView } from '../components/resume/AnalysisView';
import { useServiceConfig } from '../context/ConfigContext';
import { resumeService } from '../services/resumeService';
import { clsx, extractErrorMessage, formatDate } from '../utils/helpers';
import type { Resume, ResumeAnalysis, ResumeQuestion } from '../types';

type Tab = 'resumes' | 'history';

function Pager({
  page,
  hasPrev,
  hasNext,
  disabled,
  onPrev,
  onNext,
}: {
  page: number;
  hasPrev: boolean;
  hasNext: boolean;
  disabled?: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (!hasPrev && !hasNext) return null;
  return (
    <div className="flex items-center justify-between gap-2 pt-3">
      <Button
        variant="secondary"
        size="sm"
        disabled={!hasPrev || disabled}
        onClick={onPrev}
        leftIcon={<ChevronLeftIcon className="h-4 w-4" />}
      >
        Prev
      </Button>
      <span className="text-xs font-medium tabular-nums text-muted">Page {page}</span>
      <Button
        variant="secondary"
        size="sm"
        disabled={!hasNext || disabled}
        onClick={onNext}
        rightIcon={<ChevronRightIcon className="h-4 w-4" />}
      >
        Next
      </Button>
    </div>
  );
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-red-500/25 bg-red-500/5 px-4 py-3">
      <p className="flex min-w-0 items-center gap-2 text-sm text-red-600 dark:text-red-400">
        <ExclamationTriangleIcon className="h-4 w-4 shrink-0" />
        <span>{message}</span>
      </p>
      <Button variant="secondary" size="sm" leftIcon={<ArrowPathIcon className="h-4 w-4" />} onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

export default function ResumeAnalyzer() {
  const navigate = useNavigate();
  const config = useServiceConfig();
  const maxMb = config?.max_upload_size_mb ?? 5;

  // Resume list
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [resumesLoading, setResumesLoading] = useState(true);
  const [resumesError, setResumesError] = useState<string | null>(null);
  const [resumePage, setResumePage] = useState(1);
  const [resumesCount, setResumesCount] = useState(0);
  const [resumesHasNext, setResumesHasNext] = useState(false);
  const [resumesHasPrev, setResumesHasPrev] = useState(false);

  // Selection + analysis
  const selectedIdRef = useRef<number | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);
  const [analyzeError, setAnalyzeError] = useState<{ resumeId: number; message: string } | null>(null);
  const [targetRole, setTargetRole] = useState('');

  // Questions
  const [questions, setQuestions] = useState<ResumeQuestion[] | null>(null);
  const [questionsDemo, setQuestionsDemo] = useState(false);
  const [questionsFor, setQuestionsFor] = useState<{ id: number; filename: string } | null>(null);
  const [questionsLoadingId, setQuestionsLoadingId] = useState<number | null>(null);
  const [questionsError, setQuestionsError] = useState<{ resumeId: number; message: string } | null>(null);

  // Upload
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [failedFile, setFailedFile] = useState<File | null>(null);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Resume | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Tabs + history
  const [tab, setTab] = useState<Tab>('resumes');
  const [history, setHistory] = useState<ResumeAnalysis[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyHasNext, setHistoryHasNext] = useState(false);
  const [historyHasPrev, setHistoryHasPrev] = useState(false);

  const selectResume = useCallback((resume: Resume | null) => {
    selectedIdRef.current = resume?.id ?? null;
    setSelectedResumeId(resume?.id ?? null);
    setAnalysis(resume?.latest_analysis ?? null);
    setQuestions(null);
    setQuestionsFor(null);
    setQuestionsError(null);
    setAnalyzeError(null);
  }, []);

  const loadResumes = useCallback(
    async (page: number, selectId?: number) => {
      setResumesLoading(true);
      setResumesError(null);
      try {
        const data = await resumeService.getResumes(page);
        setResumes(data.results);
        setResumePage(page);
        setResumesCount(data.count);
        setResumesHasNext(data.next !== null);
        setResumesHasPrev(data.previous !== null);
        if (selectId !== undefined) {
          const target = data.results.find((r) => r.id === selectId);
          if (target) selectResume(target);
        } else if (!data.results.some((r) => r.id === selectedIdRef.current)) {
          selectResume(data.results[0] ?? null);
        }
      } catch (err) {
        setResumesError(extractErrorMessage(err));
      } finally {
        setResumesLoading(false);
      }
    },
    [selectResume]
  );

  useEffect(() => {
    void loadResumes(1);
  }, [loadResumes]);

  const loadHistory = useCallback(async (page: number) => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const data = await resumeService.getAnalysisHistory(page);
      setHistory(data.results);
      setHistoryPage(page);
      setHistoryHasNext(data.next !== null);
      setHistoryHasPrev(data.previous !== null);
    } catch (err) {
      setHistoryError(extractErrorMessage(err));
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'history') void loadHistory(historyPage);
  }, [tab, historyPage, loadHistory]);

  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      setUploadProgress(0);
      setFailedFile(null);
      try {
        const result = await resumeService.uploadResume(file, setUploadProgress);
        toast.success(result.message || 'Resume uploaded successfully');
        if (!result.text_extracted) {
          toast('Text extraction was limited for this PDF — analysis may be less accurate.', { duration: 5000 });
        }
        await loadResumes(1, result.resume.id);
        if (selectedIdRef.current !== result.resume.id) {
          setResumes((prev) =>
            prev.some((r) => r.id === result.resume.id) ? prev : [result.resume, ...prev]
          );
          selectResume(result.resume);
        }
      } catch (err) {
        toast.error(extractErrorMessage(err));
        setFailedFile(file);
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    },
    [loadResumes, selectResume]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: maxMb * 1024 * 1024,
    multiple: false,
    disabled: uploading,
    onDrop: (accepted) => {
      if (accepted[0]) void handleUpload(accepted[0]);
    },
    onDropRejected: (rejections) => {
      const reason = rejections[0]?.errors[0];
      if (reason?.code === 'file-too-large') {
        toast.error(`File is larger than the ${maxMb} MB limit.`);
      } else if (reason?.code === 'file-invalid-type') {
        toast.error('Only PDF files are accepted.');
      } else {
        toast.error(reason?.message ?? 'This file could not be uploaded.');
      }
    },
  });

  const handleAnalyze = useCallback(
    async (resume: Resume) => {
      setAnalyzingId(resume.id);
      setAnalyzeError(null);
      selectedIdRef.current = resume.id;
      setSelectedResumeId(resume.id);
      try {
        const { analysis: result } = await resumeService.analyzeResume(
          resume.id,
          targetRole.trim() || undefined
        );
        setAnalysis(result);
        setResumes((prev) =>
          prev.map((r) =>
            r.id === resume.id ? { ...r, has_analysis: true, latest_analysis: result } : r
          )
        );
        toast.success('Resume analysis complete');
      } catch (err) {
        const message = extractErrorMessage(err);
        setAnalyzeError({ resumeId: resume.id, message });
        toast.error(message);
      } finally {
        setAnalyzingId(null);
      }
    },
    [targetRole]
  );

  const handleQuestions = useCallback(async (resumeId: number, filename: string) => {
    setQuestionsLoadingId(resumeId);
    setQuestionsError(null);
    try {
      const data = await resumeService.getQuestions(resumeId, 6);
      setQuestions(data.questions);
      setQuestionsDemo(data.demo);
      setQuestionsFor({ id: resumeId, filename });
      toast.success('Tailored interview questions ready');
    } catch (err) {
      const message = extractErrorMessage(err);
      setQuestionsError({ resumeId, message });
      toast.error(message);
    } finally {
      setQuestionsLoadingId(null);
    }
  }, []);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await resumeService.deleteResume(deleteTarget.id);
      toast.success('Resume deleted');
      if (selectedIdRef.current === deleteTarget.id) selectResume(null);
      setDeleteTarget(null);
      const remaining = resumes.filter((r) => r.id !== deleteTarget.id);
      await loadResumes(remaining.length === 0 && resumePage > 1 ? resumePage - 1 : resumePage);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const openHistoryAnalysis = (item: ResumeAnalysis) => {
    selectedIdRef.current = item.resume_id;
    setSelectedResumeId(item.resume_id);
    setAnalysis(item);
    setAnalyzeError(null);
    setQuestions(null);
    setQuestionsFor(null);
    setQuestionsError(null);
  };

  const selectedResume = resumes.find((r) => r.id === selectedResumeId) ?? null;
  const isAnalyzing = analyzingId !== null;

  return (
    <div>
      <PageHeader
        eyebrow="Resume lab"
        title="Resume analyzer"
        subtitle="Upload a resume for an ATS read, a skill-gap check, and a concrete rewrite plan."
        actions={
          resumesCount > 0 ? (
            <Badge variant="blue" size="md">
              {resumesCount} resume{resumesCount === 1 ? '' : 's'}
            </Badge>
          ) : undefined
        }
      />

      {/* Upload */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <Card padding="none" className="overflow-hidden">
          <div
            {...getRootProps()}
            className={clsx('cursor-pointer p-2 transition-colors', uploading && 'cursor-wait')}
          >
            <div
              className={clsx(
                'rounded border border-dashed px-6 py-8 text-center transition-colors sm:py-9',
                isDragActive
                  ? 'border-pine-500 bg-sage-200/50 dark:bg-pine-800/30'
                  : 'border-line bg-surface hover:border-graphite-400/60 dark:hover:border-graphite-500'
              )}
            >
              <input {...getInputProps()} aria-label="Upload resume PDF" />
              {uploading ? (
                <div className="mx-auto max-w-sm">
                  <Spinner className="mx-auto mb-3 h-7 w-7" />
                  <p className="mb-2 text-sm font-medium text-ink">Uploading your resume… {uploadProgress}%</p>
                  <ProgressBar value={uploadProgress} />
                </div>
              ) : (
                <>
                  <div
                    className={clsx(
                      'mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-md border transition-colors',
                      isDragActive
                        ? 'border-pine-500 bg-pine-500 text-paper'
                        : 'border-line bg-surface-2 text-pine-600 dark:text-pine-300'
                    )}
                  >
                    <DocumentArrowUpIcon className="h-5 w-5" />
                  </div>
                  <p className="font-display text-[15px] font-semibold text-ink">
                    {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume, or click to browse'}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    PDF only, up to {maxMb} MB. Text is extracted and scored in seconds.
                  </p>
                </>
              )}
            </div>
          </div>
          {failedFile && !uploading && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-red-500/25 bg-red-500/5 px-4 py-2.5">
              <p className="flex min-w-0 items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <ExclamationTriangleIcon className="h-4 w-4 shrink-0" />
                <span className="truncate">Upload failed for {failedFile.name}</span>
              </p>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<ArrowPathIcon className="h-4 w-4" />}
                onClick={() => void handleUpload(failedFile)}
              >
                Retry upload
              </Button>
            </div>
          )}
        </Card>
      </motion.div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        {/* Left panel: list / history */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="space-y-4"
        >
          <Input
            label="Target role (optional)"
            placeholder="e.g. Frontend Developer"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            hint="Used to tailor skill-gap feedback when analyzing."
          />

          <div className="flex rounded-md border border-line bg-surface-2/70 p-0.5">
            {(['resumes', 'history'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={clsx(
                  'flex-1 rounded px-3 py-1.5 text-[13px] font-semibold transition-colors',
                  tab === t
                    ? 'bg-pine-500 text-paper dark:bg-pine-400 dark:text-graphite-950'
                    : 'text-muted hover:text-ink'
                )}
              >
                {t === 'resumes' ? 'My resumes' : 'Analysis history'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === 'resumes' ? (
              <motion.div
                key="resumes"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                {resumesLoading ? (
                  <Card className="flex items-center justify-center gap-3 py-10">
                    <Spinner />
                    <span className="text-sm text-muted">Loading resumes…</span>
                  </Card>
                ) : resumesError ? (
                  <Card className="py-8 text-center">
                    <ExclamationTriangleIcon className="mx-auto mb-2 h-7 w-7 text-red-600 dark:text-red-400" />
                    <p className="mb-3 text-sm text-muted">{resumesError}</p>
                    <Button variant="secondary" size="sm" leftIcon={<ArrowPathIcon className="h-4 w-4" />} onClick={() => void loadResumes(resumePage)}>
                      Retry
                    </Button>
                  </Card>
                ) : resumes.length === 0 ? (
                  <EmptyState
                    icon={<DocumentArrowUpIcon className="h-9 w-9" />}
                    title="No resumes yet"
                    description="Your prep starts here. Upload a PDF above and get a full breakdown in under a minute."
                    action={
                      <Button leftIcon={<DocumentArrowUpIcon className="h-4 w-4" />} onClick={open}>
                        Upload your first resume
                      </Button>
                    }
                  />
                ) : (
                  <div>
                    <Card padding="none" className="overflow-hidden">
                      {resumes.map((resume) => (
                        <div
                          key={resume.id}
                          onClick={() => selectResume(resume)}
                          className={clsx(
                            'relative cursor-pointer border-b border-line p-4 transition-colors last:border-b-0',
                            selectedResumeId === resume.id
                              ? 'bg-sage-200/40 dark:bg-pine-800/25'
                              : 'hover:bg-surface-2/50'
                          )}
                        >
                          {selectedResumeId === resume.id && (
                            <span className="absolute inset-y-0 left-0 w-0.5 bg-pine-500" aria-hidden="true" />
                          )}
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-line bg-surface text-graphite-500 dark:bg-surface-2">
                              <DocumentTextIcon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-ink" title={resume.filename}>{resume.filename}</p>
                              <p className="mt-0.5 text-xs text-muted">
                                {resume.file_size_mb} MB · {formatDate(resume.uploaded_at)}
                              </p>
                            </div>
                            {resume.has_analysis && <Badge variant="green">Analyzed</Badge>}
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              variant={resume.has_analysis ? 'secondary' : 'primary'}
                              isLoading={analyzingId === resume.id}
                              leftIcon={<SparklesIcon className="h-4 w-4" />}
                              onClick={() => void handleAnalyze(resume)}
                            >
                              {resume.has_analysis ? 'Re-analyze' : 'Analyze'}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              isLoading={questionsLoadingId === resume.id}
                              leftIcon={<QuestionMarkCircleIcon className="h-4 w-4" />}
                              onClick={() => void handleQuestions(resume.id, resume.filename)}
                            >
                              Questions
                            </Button>
                            {resume.file_url && (
                              <a
                                href={resume.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded px-2 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                              >
                                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                                PDF
                              </a>
                            )}
                            <button
                              onClick={() => setDeleteTarget(resume)}
                              className="ml-auto rounded p-1.5 text-muted transition-colors hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                              aria-label={`Delete ${resume.filename}`}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </Card>
                    <Pager
                      page={resumePage}
                      hasPrev={resumesHasPrev}
                      hasNext={resumesHasNext}
                      onPrev={() => void loadResumes(resumePage - 1)}
                      onNext={() => void loadResumes(resumePage + 1)}
                    />
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="history"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                {historyLoading ? (
                  <Card className="flex items-center justify-center gap-3 py-10">
                    <Spinner />
                    <span className="text-sm text-muted">Loading history…</span>
                  </Card>
                ) : historyError ? (
                  <Card className="py-8 text-center">
                    <ExclamationTriangleIcon className="mx-auto mb-2 h-7 w-7 text-red-600 dark:text-red-400" />
                    <p className="mb-3 text-sm text-muted">{historyError}</p>
                    <Button variant="secondary" size="sm" leftIcon={<ArrowPathIcon className="h-4 w-4" />} onClick={() => void loadHistory(historyPage)}>
                      Retry
                    </Button>
                  </Card>
                ) : history.length === 0 ? (
                  <EmptyState
                    icon={<SparklesIcon className="h-9 w-9" />}
                    title="No analyses yet"
                    description="Run your first analysis from the My Resumes tab and it will show up here."
                    action={
                      <Button variant="secondary" onClick={() => setTab('resumes')}>
                        Go to My Resumes
                      </Button>
                    }
                  />
                ) : (
                  <div>
                    <Card padding="none" className="overflow-hidden">
                      {history.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => openHistoryAnalysis(item)}
                          className={clsx(
                            'relative block w-full border-b border-line p-4 text-left transition-colors last:border-b-0',
                            analysis?.id === item.id
                              ? 'bg-sage-200/40 dark:bg-pine-800/25'
                              : 'hover:bg-surface-2/50'
                          )}
                        >
                          {analysis?.id === item.id && (
                            <span className="absolute inset-y-0 left-0 w-0.5 bg-pine-500" aria-hidden="true" />
                          )}
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-ink">{item.resume_filename}</p>
                            {item.demo && <Badge variant="yellow">Demo</Badge>}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge variant={item.overall_score >= 75 ? 'green' : item.overall_score >= 50 ? 'yellow' : 'red'}>
                              Overall {Math.round(item.overall_score)}
                            </Badge>
                            <Badge variant={item.ats_score >= 75 ? 'green' : item.ats_score >= 50 ? 'yellow' : 'red'}>
                              ATS {Math.round(item.ats_score)}
                            </Badge>
                            <span className="ml-auto text-xs text-muted">{formatDate(item.analyzed_at)}</span>
                          </div>
                        </button>
                      ))}
                    </Card>
                    <Pager
                      page={historyPage}
                      hasPrev={historyHasPrev}
                      hasNext={historyHasNext}
                      onPrev={() => setHistoryPage((p) => p - 1)}
                      onNext={() => setHistoryPage((p) => p + 1)}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Main panel: analysis */}
        <div className="min-w-0 space-y-4">
          <AnimatePresence mode="wait">
            {isAnalyzing ? (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md border border-line bg-surface-2 text-pine-600 dark:text-pine-300">
                    <SparklesIcon className="h-6 w-6" />
                  </div>
                  <Spinner className="mb-3 h-6 w-6" />
                  <p className="font-display text-base font-semibold text-ink">Reading your resume…</p>
                  <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted">
                    Scoring ATS compatibility, detecting skills and writing your personalised action plan.
                  </p>
                </Card>
              </motion.div>
            ) : analysis ? (
              <motion.div
                key={`analysis-${analysis.id}`}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {analyzeError && analyzeError.resumeId === selectedResumeId && selectedResume && (
                  <ErrorBanner message={analyzeError.message} onRetry={() => void handleAnalyze(selectedResume)} />
                )}

                <AnalysisView analysis={analysis} />

                {/* Questions */}
                {questionsError && questionsError.resumeId === analysis.resume_id && (
                  <ErrorBanner
                    message={questionsError.message}
                    onRetry={() => void handleQuestions(analysis.resume_id, analysis.resume_filename)}
                  />
                )}

                {questions && questionsFor && questionsFor.id === analysis.resume_id ? (
                  <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <Card>
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
                        <div className="flex items-center gap-2">
                          <QuestionMarkCircleIcon className="h-5 w-5 text-pine-600 dark:text-pine-300" />
                          <h3 className="font-display text-base font-semibold text-ink">Questions this resume invites</h3>
                        </div>
                        {questionsDemo && <Badge variant="yellow">Demo</Badge>}
                      </div>
                      <ul className="divide-y divide-line border-y border-line">
                        {questions.map((q, i) => (
                          <li key={i} className="flex items-start justify-between gap-3 py-3">
                            <p className="text-sm leading-relaxed text-ink">{q.question}</p>
                            <Badge variant="accent" className="shrink-0">{q.focus_area}</Badge>
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="mt-5 w-full sm:w-auto"
                        rightIcon={<ArrowRightIcon className="h-4 w-4" />}
                        onClick={() => navigate(`/interview?resume=${analysis.resume_id}`)}
                      >
                        Practice these in a mock interview
                      </Button>
                    </Card>
                  </motion.div>
                ) : (
                  <Card variant="flat" className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted">Want to prep for the questions this resume will trigger?</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      isLoading={questionsLoadingId === analysis.resume_id}
                      leftIcon={<QuestionMarkCircleIcon className="h-4 w-4" />}
                      onClick={() => void handleQuestions(analysis.resume_id, analysis.resume_filename)}
                    >
                      Generate tailored questions
                    </Button>
                  </Card>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {analyzeError && analyzeError.resumeId === selectedResumeId && selectedResume && (
                  <ErrorBanner message={analyzeError.message} onRetry={() => void handleAnalyze(selectedResume)} />
                )}
                {resumes.length === 0 && !resumesLoading && !resumesError ? (
                  <Card className="px-6 py-14 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md border border-line bg-surface-2 text-pine-600 dark:text-pine-300">
                      <DocumentTextIcon className="h-6 w-6" />
                    </div>
                    <h3 className="font-display text-xl font-semibold tracking-tight text-ink">
                      Your resume, interview-ready
                    </h3>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
                      Upload a PDF to get an overall score, ATS compatibility check, skill-gap detection,
                      grammar and formatting feedback, plus a rewritten professional summary.
                    </p>
                    <Button className="mt-5" leftIcon={<DocumentArrowUpIcon className="h-4 w-4" />} onClick={open}>
                      Upload a resume to begin
                    </Button>
                  </Card>
                ) : (
                  <Card className="flex flex-col items-center justify-center py-16 text-center">
                    <DocumentTextIcon className="mb-3 h-9 w-9 text-muted" />
                    <p className="text-sm font-medium text-ink">Select a resume to see its analysis</p>
                    <p className="mt-1 max-w-xs text-sm text-muted">
                      Pick a resume on the left and hit Analyze — or revisit a past result from Analysis History.
                    </p>
                  </Card>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Delete confirmation */}
      <Modal open={deleteTarget !== null} onClose={() => !deleting && setDeleteTarget(null)} title="Delete resume?">
        <p className="text-sm leading-relaxed text-muted">
          <span className="font-semibold text-ink">{deleteTarget?.filename}</span> and its analysis history entry
          will be permanently removed. This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" isLoading={deleting} leftIcon={<TrashIcon className="h-4 w-4" />} onClick={() => void confirmDelete()}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
