import { cn } from '@/lib/utils';
import type { NarrativeWarning } from '@/lib/narrativeValidator';

interface ValidationWarningsProps {
  warnings: NarrativeWarning[];
}

const TYPE_ICON: Record<NarrativeWarning['type'], string> = {
  missing_authority: '\u26A0',   // ⚠
  softening_language: '\u25B2',  // ▲
  missing_risk_level: '\u2022',  // •
};

export function ValidationWarnings({ warnings }: ValidationWarningsProps) {
  if (warnings.length === 0) return null;

  return (
    <div
      className={cn(
        'rounded-xl border border-brand-partial-border bg-brand-partial-bg/40 px-4 py-3',
        'text-sm leading-relaxed text-brand-partial-text',
      )}
      role="alert"
    >
      <p className="font-semibold">
        Narrative validation ({warnings.length} {warnings.length === 1 ? 'issue' : 'issues'})
      </p>
      <p className="mt-1 text-xs text-brand-partial-text/80">
        The generated narrative may not fully reflect the locked adjudication findings.
      </p>
      <ul className="mt-2 space-y-1">
        {warnings.map((w, i) => (
          <li key={i} className="flex items-start gap-2 text-xs">
            <span className="mt-0.5 shrink-0" aria-hidden>
              {TYPE_ICON[w.type]}
            </span>
            <span>{w.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
