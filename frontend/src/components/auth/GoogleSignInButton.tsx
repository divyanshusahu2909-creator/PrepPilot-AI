import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useServiceConfig } from '../../context/ConfigContext';
import { extractErrorMessage } from '../../utils/helpers';
import { Spinner } from '../ui/Spinner';

// ------------------------------------------------------------
// Minimal Google Identity Services typings (declared locally).
// ------------------------------------------------------------
interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleIdApi {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: { theme: 'outline' | 'filled_blue' | 'filled_black'; size: 'large' | 'medium' | 'small'; width: number }
  ) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleIdApi;
      };
    };
  }
}

// Load the GSI script exactly once per session (promise-cached).
let gsiScriptPromise: Promise<void> | null = null;

function loadGsiScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (gsiScriptPromise) return gsiScriptPromise;

  gsiScriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      gsiScriptPromise = null;
      script.remove();
      reject(new Error('Could not load Google Sign-In. Check your connection and try again.'));
    };
    document.head.appendChild(script);
  });
  return gsiScriptPromise;
}

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => void;
}

export default function GoogleSignInButton({ onCredential }: GoogleSignInButtonProps) {
  const config = useServiceConfig();
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  // Keep the latest callback without re-initializing GSI on every render.
  const callbackRef = useRef(onCredential);
  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  const enabled = Boolean(config?.google_oauth_configured && config.google_client_id);
  const clientId = config?.google_client_id;

  useEffect(() => {
    if (!enabled || !clientId) return;
    let cancelled = false;

    loadGsiScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: GoogleCredentialResponse) => callbackRef.current(response.credential),
        });
        // Clear any button rendered by a previous mount (e.g. StrictMode double-effect).
        containerRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          width: 320,
        });
        setStatus('ready');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus('error');
        toast.error(extractErrorMessage(err));
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, clientId]);

  // Not configured — render nothing (see README for Google OAuth setup).
  if (!enabled) return null;

  return (
    <div className="w-full flex flex-col items-center">
      {status === 'loading' && (
        <button
          type="button"
          disabled
          className="w-full max-w-[320px] flex items-center justify-center gap-2 rounded-xl border border-line bg-surface-2 px-4 py-2.5 text-sm font-medium text-muted cursor-wait"
        >
          <Spinner className="h-4 w-4" />
          Connecting to Google...
        </button>
      )}
      {status === 'error' && (
        <button
          type="button"
          disabled
          className="w-full max-w-[320px] rounded-xl border border-line bg-surface-2 px-4 py-2.5 text-sm font-medium text-muted opacity-60 cursor-not-allowed"
        >
          Google sign-in unavailable
        </button>
      )}
      <div
        ref={containerRef}
        className={status === 'ready' ? 'flex justify-center min-h-[40px]' : 'hidden'}
      />
    </div>
  );
}