import { useServiceConfig } from '../../context/ConfigContext';
import { BeakerIcon } from '@heroicons/react/24/outline';

export function DemoBanner() {
  const config = useServiceConfig();
  if (!config?.demo_mode) return null;
  return (
    <div className="border-b border-clay-500/20 bg-clay-500/[0.06] px-4 py-2">
      <p className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs text-ink/70">
        <BeakerIcon className="h-3.5 w-3.5 shrink-0 text-clay-500" />
        <span>
          <span className="font-semibold text-ink">Demo mode</span> — coaching uses local heuristics. Add
          GEMINI_API_KEY to backend/.env for live AI feedback.
        </span>
      </p>
    </div>
  );
}
