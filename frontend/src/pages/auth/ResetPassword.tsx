import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import AuthLayout, { AuthAlert } from '../../components/auth/AuthLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authService } from '../../services/authService';
import { extractErrorMessage } from '../../utils/helpers';

export default function ResetPassword() {
  const { uid, token } = useParams<{ uid: string; token: string }>();

  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; password2?: string }>({});
  const [formError, setFormError] = useState<string | null>(
    !uid || !token ? 'This reset link is invalid. Please request a new one.' : null
  );
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const linkInvalid = !uid || !token;

  const validate = (): boolean => {
    const errors: { password?: string; password2?: string } = {};
    if (!password) errors.password = 'New password is required.';
    else if (password.length < 8) errors.password = 'Password must be at least 8 characters.';
    if (!password2) errors.password2 = 'Please confirm your new password.';
    else if (password !== password2) errors.password2 = 'Passwords do not match.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    if (!uid || !token) {
      setFormError('This reset link is invalid. Please request a new one.');
      return;
    }
    if (!validate()) return;
    setSubmitting(true);
    try {
      await authService.resetPassword(uid, token, password);
      toast.success('Password updated. You can sign in now.');
      setDone(true);
    } catch (err) {
      const message = extractErrorMessage(err);
      setFormError(message || 'This reset link is invalid or has expired.');
      toast.error('Could not reset password. The link may be invalid or expired.');
    } finally {
      setSubmitting(false);
    }
  };

  const passwordToggle = (
    <button
      type="button"
      onClick={() => setShowPassword((v) => !v)}
      className="text-muted hover:text-ink transition-colors"
      aria-label={showPassword ? 'Hide passwords' : 'Show passwords'}
      tabIndex={-1}
    >
      {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
    </button>
  );

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="Make it strong — at least 8 characters with a mix of letters and numbers."
    >
      <AnimatePresence mode="wait">
        {done ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
            className="card p-6 text-center sm:p-7"
          >
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-md border border-pine-500/20 bg-sage-200/60 dark:border-pine-600/40 dark:bg-pine-800/40">
              <CheckCircleIcon className="h-6 w-6 text-pine-600 dark:text-pine-300" />
            </div>
            <h2 className="mt-5 font-display text-lg font-bold text-ink">Password updated</h2>
            <p className="mt-3 text-muted leading-relaxed">
              Your password has been reset successfully. Sign in with your new password to pick up
              right where you left off.
            </p>
            <Link to="/login" className="mt-6 block">
              <Button size="lg" className="w-full" rightIcon={<ArrowRightIcon className="h-4 w-4" />}>
                Sign in
              </Button>
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

            {formError && (
              <p className="mb-5 text-sm">
                <Link
                  to="/forgot-password"
                  className="font-semibold text-pine-600 transition-colors hover:text-pine-700 dark:text-pine-300 dark:hover:text-pine-200"
                >
                  Request a new reset link
                </Link>
              </p>
            )}

            <div className="card p-6 sm:p-7">
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <Input
                  label="New password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={fieldErrors.password}
                  leftIcon={<LockClosedIcon className="h-5 w-5" />}
                  rightIcon={passwordToggle}
                  disabled={submitting || linkInvalid}
                />
                <Input
                  label="Confirm new password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Re-enter your new password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  error={fieldErrors.password2}
                  leftIcon={<LockClosedIcon className="h-5 w-5" />}
                  disabled={submitting || linkInvalid}
                />
                <Button
                  type="submit"
                  size="lg"
                  isLoading={submitting}
                  disabled={linkInvalid}
                  className="w-full"
                >
                  Reset password
                </Button>
              </form>
            </div>

            <p className="mt-6 text-center text-sm text-muted">
              Remembered it after all?{' '}
              <Link to="/login" className="font-semibold text-pine-600 transition-colors hover:text-pine-700 dark:text-pine-300 dark:hover:text-pine-200">
                Sign in
              </Link>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}