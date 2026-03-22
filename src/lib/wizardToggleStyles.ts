import { cn } from '@/lib/utils';

const focusRing = cn(
  'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
);

/**
 * Wizard chip toggles — always use brand surfaces + `text-brand-*` so we never mix shadcn
 * `muted` / `foreground` with brand cards (which caused washed-out or illegible text in dark UI).
 */
export function wizardPillToggleClass(
  on: boolean,
  density: 'comfortable' | 'compact' = 'comfortable',
): string {
  return cn(
    'rounded-full border transition-colors',
    focusRing,
    density === 'comfortable'
      ? 'px-3 py-2 text-left text-sm leading-snug'
      : 'px-4 py-2 text-sm font-medium',
    on
      ? 'border-2 border-brand-accent-border bg-brand-accent-bg font-semibold text-brand-text'
      : 'border border-brand-border bg-transparent text-brand-text shadow-sm hover:border-brand-muted hover:bg-brand-card-alt',
  );
}
