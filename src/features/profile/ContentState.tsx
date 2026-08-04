import type { ReactNode } from 'react';

interface ContentStateProps {
  loading?: boolean;
  empty?: boolean;
  error?: string | null;
  /** Shown when not loading / not empty / not error. */
  children: ReactNode;
  /** Optional custom empty message. */
  emptyMessage?: string;
  /** Called when the user clicks the error retry action. */
  onRetry?: () => void;
}

/**
 * Renders the four required content states for any data-driven tab:
 * loading, empty, error, and the happy-path children.
 * Keeps every consuming surface consistent with the "every state, not just
 * happy path" contract.
 */
export function ContentState({
  loading,
  empty,
  error,
  children,
  emptyMessage = 'Nothing here yet.',
  onRetry,
}: ContentStateProps) {
  if (loading) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 py-16 text-center"
        role="status"
        aria-live="polite"
      >
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-mission-500 border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 py-16 text-center"
        role="alert"
      >
        <p className="text-sm text-destructive">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full bg-mission-600 px-4 py-2 text-sm font-medium text-white hover:bg-mission-700"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  if (empty) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return <>{children}</>;
}

export default ContentState;
