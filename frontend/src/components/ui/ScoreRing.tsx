import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

interface ScoreRingProps {
  score: number | null | undefined;
  size?: number;
  label?: string;
}

function colorFor(score: number): string {
  if (score >= 75) return '#2f6f68';
  if (score >= 50) return '#d97757';
  return '#b42318';
}

export function ScoreRing({ score, size = 120, label }: ScoreRingProps) {
  const value = score ?? 0;
  return (
    <div className="flex flex-col items-center gap-2">
      <div style={{ width: size, height: size }}>
        <CircularProgressbar
          value={value}
          text={score != null ? `${Math.round(value)}` : '—'}
          styles={buildStyles({
            textSize: `${Math.max(18, Math.round(size * 0.2))}px`,
            pathColor: colorFor(value),
            textColor: 'rgb(var(--c-text))',
            trailColor: 'rgb(var(--c-border))',
            pathTransitionDuration: 0.8,
          })}
        />
      </div>
      {label && <p className="eyebrow">{label}</p>}
    </div>
  );
}
