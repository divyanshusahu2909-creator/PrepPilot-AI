import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ArrowPathIcon,
  ArrowRightOnRectangleIcon,
  CalendarDaysIcon,
  CameraIcon,
  CheckBadgeIcon,
  ClockIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  IdentificationIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';
import { profileService } from '../services/profileService';
import { authService } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import { ProfileResponse } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input, Select, Textarea } from '../components/ui/Input';
import { PageHeader } from '../components/ui/PageHeader';
import { PageLoader } from '../components/ui/Spinner';
import { EXPERIENCE_LEVELS, ROLE_SUGGESTIONS } from '../utils/constants';
import { extractErrorMessage, formatDate, formatDateTime } from '../utils/helpers';

interface ProfileForm {
  first_name: string;
  last_name: string;
  bio: string;
  phone: string;
  target_role: string;
  experience_level: string;
  skills: string;
  linkedin_url: string;
  github_url: string;
  portfolio_url: string;
  location: string;
  college: string;
  graduation_year: string;
}

const emptyForm: ProfileForm = {
  first_name: '',
  last_name: '',
  bio: '',
  phone: '',
  target_role: '',
  experience_level: 'fresher',
  skills: '',
  linkedin_url: '',
  github_url: '',
  portfolio_url: '',
  location: '',
  college: '',
  graduation_year: '',
};

function formFromResponse(response: ProfileResponse): ProfileForm {
  const { user, profile } = response;
  return {
    first_name: user.first_name ?? '',
    last_name: user.last_name ?? '',
    bio: profile.bio ?? '',
    phone: profile.phone ?? '',
    target_role: profile.target_role ?? '',
    experience_level: profile.experience_level ?? 'fresher',
    skills: profile.skills ?? '',
    linkedin_url: profile.linkedin_url ?? '',
    github_url: profile.github_url ?? '',
    portfolio_url: profile.portfolio_url ?? '',
    location: profile.location ?? '',
    college: profile.college ?? '',
    graduation_year: profile.graduation_year !== null ? String(profile.graduation_year) : '',
  };
}

function SectionLabel({ index, children }: { index: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className="font-display text-[11px] font-bold tracking-[0.18em] text-clay-500">{index}</span>
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{children}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

function PanelHeading({
  index,
  icon: Icon,
  title,
  description,
}: {
  index: string;
  icon: typeof KeyIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-line px-5 py-4 sm:px-6">
      <span className="mt-0.5 font-display text-[11px] font-bold tracking-[0.18em] text-clay-500">{index}</span>
      <div className="flex min-w-0 flex-1 items-start gap-2.5">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-pine-500 dark:text-pine-300" />
        <div>
          <h2 className="font-display text-base font-bold text-ink">{title}</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const { updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await profileService.getProfile();
      setData(response);
      setForm(formFromResponse(response));
    } catch (err) {
      const message = extractErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Revoke object URLs so repeated avatar picks never leak memory.
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const setField =
    (key: keyof ProfileForm) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { value } = event.target;
      setForm((prev) => ({ ...prev, [key]: value }));
    };

  const handleAvatarPick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file (JPG or PNG).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5 MB.');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.first_name.trim()) {
      toast.error('First name is required.');
      return;
    }
    setSaving(true);
    try {
      const payload = new FormData();
      payload.append('first_name', form.first_name.trim());
      payload.append('last_name', form.last_name.trim());
      payload.append('bio', form.bio);
      payload.append('phone', form.phone);
      payload.append('target_role', form.target_role);
      payload.append('experience_level', form.experience_level);
      payload.append('skills', form.skills);
      payload.append('linkedin_url', form.linkedin_url);
      payload.append('github_url', form.github_url);
      payload.append('portfolio_url', form.portfolio_url);
      payload.append('location', form.location);
      payload.append('college', form.college);
      if (form.graduation_year.trim() !== '') {
        payload.append('graduation_year', form.graduation_year.trim());
      }
      if (avatarFile) payload.append('avatar', avatarFile);

      const response = await profileService.updateProfile(payload);
      setData(response);
      setForm(formFromResponse(response));
      updateUser(response.user);
      setAvatarFile(null);
      setAvatarPreview(null);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError(null);
    if (!oldPassword) {
      setPasswordError('Enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    setChangingPassword(true);
    try {
      await authService.changePassword(oldPassword, newPassword);
      toast.success('Password changed successfully');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const message = extractErrorMessage(err);
      setPasswordError(message);
      toast.error(message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await logout();
      navigate('/');
    } finally {
      setSigningOut(false);
    }
  };

  if (loading) return <PageLoader label="Loading your profile..." />;

  if (error && !data) {
    return (
      <Card className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-md border border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400">
          <ExclamationTriangleIcon className="h-6 w-6" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-ink">Could not load your profile</h2>
          <p className="mt-1 max-w-sm text-sm text-muted">{error}</p>
        </div>
        <Button onClick={load} leftIcon={<ArrowPathIcon className="h-4 w-4" />}>
          Try again
        </Button>
      </Card>
    );
  }

  if (!data) return null;

  const { user, profile } = data;
  const initials =
    `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`.toUpperCase() ||
    user.email[0]?.toUpperCase() ||
    '?';
  const avatarSrc = avatarPreview ?? profile.avatar_url;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Your profile"
        subtitle="Manage your personal information, security, and account settings."
      />

      {/* Identity cover */}
      <Card padding="none" className="overflow-hidden">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={`${user.full_name} avatar`}
              className="h-20 w-20 shrink-0 rounded-md border border-line object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-pine-500 font-display text-2xl font-bold text-paper">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Profile</p>
            <h2 className="mt-1 truncate font-display text-2xl font-bold text-ink">
              {user.full_name || user.email}
            </h2>
            <p className="mt-0.5 truncate text-sm text-muted">{user.email}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant={user.role === 'admin' ? 'accent' : 'blue'}>
                {user.role === 'admin' ? 'Administrator' : 'Member'}
              </Badge>
              {user.email_verified ? (
                <Badge variant="green">
                  <CheckBadgeIcon className="h-3.5 w-3.5" />
                  Email verified
                </Badge>
              ) : (
                <Badge variant="yellow">Email unverified</Badge>
              )}
            </div>
          </div>
          <div className="hidden shrink-0 border-l border-line pl-6 text-right sm:block">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Member since</p>
            <p className="mt-1 font-display text-lg font-bold text-ink">{formatDate(user.date_joined)}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Edit form */}
        <div className="lg:col-span-2">
          <Card padding="none" className="overflow-hidden">
            <PanelHeading
              index="01"
              icon={IdentificationIcon}
              title="Personal information"
              description="This helps the AI tailor questions to your background."
            />

            <form onSubmit={handleSave}>
              <div className="space-y-7 p-5 sm:p-6">
                {/* Avatar picker */}
                <div className="flex flex-col gap-4 rounded-md border border-line bg-surface-2/50 p-4 sm:flex-row sm:items-center">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt="Avatar preview"
                      className="h-14 w-14 shrink-0 rounded-md border border-line object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-pine-500 text-sm font-bold text-paper">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarPick}
                      aria-label="Choose avatar image"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      leftIcon={<CameraIcon className="h-4 w-4" />}
                    >
                      Upload new photo
                    </Button>
                    <p className="mt-1.5 text-xs text-muted">
                      {avatarFile ? avatarFile.name : 'JPG or PNG, up to 5 MB. Saved with your profile.'}
                    </p>
                  </div>
                </div>

                <section>
                  <SectionLabel index="01.1">Basics</SectionLabel>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      label="First name"
                      value={form.first_name}
                      onChange={setField('first_name')}
                      placeholder="Jane"
                      required
                      autoComplete="given-name"
                    />
                    <Input
                      label="Last name"
                      value={form.last_name}
                      onChange={setField('last_name')}
                      placeholder="Doe"
                      autoComplete="family-name"
                    />
                    <div className="sm:col-span-2">
                      <Textarea
                        label="Bio"
                        value={form.bio}
                        onChange={setField('bio')}
                        rows={3}
                        placeholder="A short summary about you, your goals, and what you are preparing for..."
                        hint="Used to personalize your interview questions."
                      />
                    </div>
                    <Input
                      label="Phone"
                      type="tel"
                      value={form.phone}
                      onChange={setField('phone')}
                      placeholder="+1 555 000 1234"
                      autoComplete="tel"
                    />
                  </div>
                </section>

                <section className="border-t border-line pt-7">
                  <SectionLabel index="01.2">Professional context</SectionLabel>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Input
                        label="Target role"
                        value={form.target_role}
                        onChange={setField('target_role')}
                        placeholder="e.g. Frontend Developer"
                        list="profile-role-suggestions"
                      />
                      <datalist id="profile-role-suggestions">
                        {ROLE_SUGGESTIONS.map((role) => (
                          <option key={role} value={role} />
                        ))}
                      </datalist>
                    </div>
                    <Select
                      label="Experience level"
                      value={form.experience_level}
                      onChange={setField('experience_level')}
                      options={EXPERIENCE_LEVELS.map((level) => ({ value: level.value, label: level.label }))}
                    />
                    <Input
                      label="Location"
                      value={form.location}
                      onChange={setField('location')}
                      placeholder="City, Country"
                      autoComplete="address-level2"
                    />
                    <div className="sm:col-span-2">
                      <Input
                        label="Skills"
                        value={form.skills}
                        onChange={setField('skills')}
                        placeholder="React, TypeScript, Python, SQL"
                        hint="Separate skills with commas."
                      />
                      {profile.skills_list.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {profile.skills_list.map((skill) => (
                            <Badge key={skill} variant="accent">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <Input
                      label="College"
                      value={form.college}
                      onChange={setField('college')}
                      placeholder="Your university or college"
                    />
                    <Input
                      label="Graduation year"
                      type="number"
                      min={1950}
                      max={2100}
                      value={form.graduation_year}
                      onChange={setField('graduation_year')}
                      placeholder="2025"
                    />
                  </div>
                </section>

                <section className="border-t border-line pt-7">
                  <SectionLabel index="01.3">Links</SectionLabel>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      label="LinkedIn URL"
                      type="url"
                      value={form.linkedin_url}
                      onChange={setField('linkedin_url')}
                      placeholder="https://linkedin.com/in/you"
                    />
                    <Input
                      label="GitHub URL"
                      type="url"
                      value={form.github_url}
                      onChange={setField('github_url')}
                      placeholder="https://github.com/you"
                    />
                    <div className="sm:col-span-2">
                      <Input
                        label="Portfolio URL"
                        type="url"
                        value={form.portfolio_url}
                        onChange={setField('portfolio_url')}
                        placeholder="https://your-site.dev"
                      />
                    </div>
                  </div>
                </section>
              </div>

              <div className="flex flex-col gap-3 border-t border-line bg-surface-2/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="text-xs text-muted">Your details are only used to personalize your prep.</p>
                <Button type="submit" isLoading={saving}>
                  Save changes
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Security + account */}
        <div className="space-y-6">
          <Card padding="none" className="overflow-hidden">
            <PanelHeading
              index="02"
              icon={KeyIcon}
              title="Security"
              description="Change your account password."
            />
            <form onSubmit={handleChangePassword} className="space-y-4 p-5 sm:p-6">
              <Input
                label="Current password"
                type="password"
                value={oldPassword}
                onChange={(event) => setOldPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="Enter current password"
              />
              <Input
                label="New password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                hint="Minimum 8 characters."
              />
              <Input
                label="Confirm new password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="Repeat new password"
                error={passwordError ?? undefined}
              />
              <Button type="submit" variant="secondary" className="w-full" isLoading={changingPassword}>
                Update password
              </Button>
            </form>
          </Card>

          <Card padding="none" className="overflow-hidden">
            <div className="flex items-start gap-3 border-b border-line px-5 py-4">
              <span className="mt-0.5 font-display text-[11px] font-bold tracking-[0.18em] text-clay-500">03</span>
              <h2 className="font-display text-base font-bold text-ink">Account</h2>
            </div>
            <dl className="divide-y divide-line">
              <div className="flex items-start gap-3 px-5 py-3.5">
                <EnvelopeIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                <div className="min-w-0">
                  <dt className="text-[11px] uppercase tracking-[0.12em] text-muted">Email</dt>
                  <dd className="truncate text-sm font-medium text-ink">{user.email}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3 px-5 py-3.5">
                <CalendarDaysIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.12em] text-muted">Date joined</dt>
                  <dd className="text-sm font-medium text-ink">{formatDate(user.date_joined)}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3 px-5 py-3.5">
                <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.12em] text-muted">Last login</dt>
                  <dd className="text-sm font-medium text-ink">
                    {user.last_login ? formatDateTime(user.last_login) : 'This is your first session'}
                  </dd>
                </div>
              </div>
            </dl>
            <div className="border-t border-line p-4">
              <Button
                variant="danger"
                className="w-full"
                isLoading={signingOut}
                onClick={handleSignOut}
                leftIcon={<ArrowRightOnRectangleIcon className="h-4 w-4" />}
              >
                Sign out
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
