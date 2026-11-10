import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { EnvelopeIcon, EyeIcon, EyeSlashIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import AuthLayout, { AuthAlert } from '../../components/auth/AuthLayout';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import { useAuth } from '../../hooks/useAuth';
import { useServiceConfig } from '../../context/ConfigContext';
import { extractErrorMessage } from '../../utils/helpers';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const config = useServiceConfig();
  const googleEnabled = Boolean(config?.google_oauth_configured && config.google_client_id);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) errors.email = 'Email is required.';
    else if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address.';
    if (!password) errors.password = 'Password is required.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      toast.success('Welcome back! Let\'s get you interview-ready.');
      navigate('/dashboard');
    } catch (err) {
      const message = extractErrorMessage(err);
      setFormError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleCredential = async (credential: string) => {
    setGoogleLoading(true);
    setFormError(null);
    try {
      await googleLogin(credential);
      toast.success('Signed in with Google. Welcome aboard!');
      navigate('/dashboard');
    } catch (err) {
      const message = extractErrorMessage(err);
      setFormError(message);
      toast.error(message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const busy = submitting || googleLoading;

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue your interview preparation.">
      <AuthAlert message={formError} />

      <div className="card p-6 sm:p-7">
        <GoogleSignInButton onCredential={handleGoogleCredential} />

        {googleLoading && (
          <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted">
            <Spinner className="h-4 w-4" />
            Signing you in with Google...
          </div>
        )}

        {googleEnabled && (
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-line" />
            <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              or continue with email
            </span>
            <div className="h-px flex-1 bg-line" />
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            leftIcon={<EnvelopeIcon className="h-5 w-5" />}
            disabled={busy}
          />

          <div>
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
              leftIcon={<LockClosedIcon className="h-5 w-5" />}
              disabled={busy}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-muted hover:text-ink transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              }
            />
            <div className="mt-2 flex justify-end">
              <Link
                to="/forgot-password"
                className="text-[13px] font-semibold text-pine-600 transition-colors hover:text-pine-700 dark:text-pine-300 dark:hover:text-pine-200"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <Button type="submit" size="lg" isLoading={submitting} disabled={googleLoading} className="w-full">
            Sign in
          </Button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        New to PrepPilot?{' '}
        <Link to="/register" className="font-semibold text-pine-600 transition-colors hover:text-pine-700 dark:text-pine-300 dark:hover:text-pine-200">
          Create account
        </Link>
      </p>
    </AuthLayout>
  );
}