import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { EnvelopeIcon, ArrowLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import AuthLayout, { AuthAlert } from '../../components/auth/AuthLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authService } from '../../services/authService';
import { extractErrorMessage } from '../../utils/helpers';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setFieldError('Email is required.');
      return;
    }
    if (!EMAIL_RE.test(trimmed)) {
      setFieldError('Enter a valid email address.');
      return;
    }
    setFieldError(undefined);
    setSubmitting(true);
    try {
      await authService.forgotPassword(trimmed);
      toast.success('Reset request sent. Check your inbox.');
      setSent(true);
    } catch (err) {
      const message = extractErrorMessage(err);
      setFormError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter the email you signed up with and we'll send you a reset link."
    >
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
            className="card p-6 text-center sm:p-7"
          >
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-md border border-pine-500/20 bg-sage-200/60 dark:border-pine-600/40 dark:bg-pine-800/40">
              <PaperAirplaneIcon className="h-6 w-6 text-pine-600 dark:text-pine-300" />
            </div>
            <h2 className="mt-5 font-display text-lg font-bold text-ink">Check your email</h2>
            <p className="mt-3 text-muted leading-relaxed">
              If an account exists for{' '}
              <span className="font-semibold text-ink break-all">{email.trim()}</span>, a password
              reset link is on its way. It may take a minute to arrive — check your spam folder too.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex items-center gap-2 text-[13px] font-semibold text-pine-600 transition-colors hover:text-pine-700 dark:text-pine-300 dark:hover:text-pine-200"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to sign in
            </Link>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
          >
            <AuthAlert message={formError} />
            <div className="card p-6 sm:p-7">
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <Input
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldError(undefined);
                  }}
                  error={fieldError}
                  leftIcon={<EnvelopeIcon className="h-5 w-5" />}
                  disabled={submitting}
                />
                <Button type="submit" size="lg" isLoading={submitting} className="w-full">
                  Send reset link
                </Button>
              </form>
            </div>
            <p className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-[13px] font-semibold text-pine-600 transition-colors hover:text-pine-700 dark:text-pine-300 dark:hover:text-pine-200"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Back to sign in
              </Link>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}