import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { EnvelopeIcon, EyeIcon, EyeSlashIcon, LockClosedIcon, UserIcon } from '@heroicons/react/24/outline';
import AuthLayout, { AuthAlert } from '../../components/auth/AuthLayout';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import { useAuth } from '../../hooks/useAuth';
import { useServiceConfig } from '../../context/ConfigContext';
import { extractErrorMessage } from '../../utils/helpers';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RegisterForm {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password2: string;
}

type FieldErrors = Partial<Record<keyof RegisterForm, string>>;

const INITIAL_FORM: RegisterForm = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  password2: '',
};

export default function Register() {
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();
  const config = useServiceConfig();
  const googleEnabled = Boolean(config?.google_oauth_configured && config.google_client_id);

  const [form, setForm] = useState<RegisterForm>(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const setField = (field: keyof RegisterForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const errors: FieldErrors = {};
    if (!form.first_name.trim()) errors.first_name = 'First name is required.';
    if (!form.last_name.trim()) errors.last_name = 'Last name is required.';
    if (!form.email.trim()) errors.email = 'Email is required.';
    else if (!EMAIL_RE.test(form.email.trim())) errors.email = 'Enter a valid email address.';
    if (!form.password) errors.password = 'Password is required.';
    else if (form.password.length < 8) errors.password = 'Password must be at least 8 characters.';
    if (!form.password2) errors.password2 = 'Please confirm your password.';
    else if (form.password !== form.password2) errors.password2 = 'Passwords do not match.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      await register({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        password: form.password,
        password2: form.password2,
      });
      toast.success('Account created! Welcome to PrepPilot AI.');
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
      toast.success('Signed up with Google. Welcome aboard!');
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
      title="Create your free account"
      subtitle="Start practicing in minutes — no credit card required."
    >
      <AuthAlert message={formError} />

      <div className="card p-6 sm:p-7">
        <GoogleSignInButton onCredential={handleGoogleCredential} />

        {googleLoading && (
          <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted">
            <Spinner className="h-4 w-4" />
            Creating your account with Google...
          </div>
        )}

        {googleEnabled && (
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-line" />
            <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              or sign up with email
            </span>
            <div className="h-px flex-1 bg-line" />
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="First name"
              autoComplete="given-name"
              placeholder="Aarav"
              value={form.first_name}
              onChange={(e) => setField('first_name', e.target.value)}
              error={fieldErrors.first_name}
              leftIcon={<UserIcon className="h-5 w-5" />}
              disabled={busy}
            />
            <Input
              label="Last name"
              autoComplete="family-name"
              placeholder="Mehta"
              value={form.last_name}
              onChange={(e) => setField('last_name', e.target.value)}
              error={fieldErrors.last_name}
              disabled={busy}
            />
          </div>

          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
            error={fieldErrors.email}
            leftIcon={<EnvelopeIcon className="h-5 w-5" />}
            disabled={busy}
          />

          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={form.password}
            onChange={(e) => setField('password', e.target.value)}
            error={fieldErrors.password}
            hint="Use 8 or more characters with a mix of letters and numbers."
            leftIcon={<LockClosedIcon className="h-5 w-5" />}
            rightIcon={passwordToggle}
            disabled={busy}
          />

          <Input
            label="Confirm password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={form.password2}
            onChange={(e) => setField('password2', e.target.value)}
            error={fieldErrors.password2}
            leftIcon={<LockClosedIcon className="h-5 w-5" />}
            disabled={busy}
          />

          <Button type="submit" size="lg" isLoading={submitting} disabled={googleLoading} className="w-full">
            Create free account
          </Button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-pine-600 transition-colors hover:text-pine-700 dark:text-pine-300 dark:hover:text-pine-200">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}