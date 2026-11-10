import { Card } from './Card';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card
      variant="bordered"
      className="flex flex-col items-center justify-center border-dashed bg-surface/40 py-14 text-center"
    >
      {icon && (
        <div className="mb-4 grid h-11 w-11 place-items-center rounded-md border border-line bg-surface text-accent-500">
          {icon}
        </div>
      )}
      <h3 className="font-display text-base font-bold text-ink">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}
