import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { RecallListProps } from '@/types/signals';

const MAX_REASON = 110;
const MAX_ROWS = 5;

function parseRecallDateMs(raw: string): number {
  const t = raw.trim();
  if (/^\d{8}$/.test(t)) {
    const y = Number(t.slice(0, 4));
    const m = Number(t.slice(4, 6)) - 1;
    const d = Number(t.slice(6, 8));
    return new Date(y, m, d).getTime();
  }
  const ms = Date.parse(t);
  return Number.isNaN(ms) ? 0 : ms;
}

function excerptReason(reason: string): string {
  const t = reason.trim();
  if (t.length <= MAX_REASON) return t;
  return `${t.slice(0, MAX_REASON)}…`;
}

function classificationBadgeClass(classification: string): string {
  const up = classification.toUpperCase();
  if (up.includes('CLASS III') || up.includes('CLASS 3')) {
    return 'border-brand-border bg-brand-card text-brand-text';
  }
  if (up.includes('CLASS II') || up.includes('CLASS 2')) {
    return 'border-brand-partial-border bg-brand-partial-bg text-brand-partial-text';
  }
  if (up.includes('CLASS I') || up.includes('CLASS 1')) {
    return 'border-brand-warn-border bg-brand-warn-bg text-brand-warn-text';
  }
  return 'border-brand-border bg-brand-card text-brand-text';
}

function isTerminatedOrCompleted(status: string): boolean {
  const s = status.toLowerCase();
  return (
    /\bterminated\b/.test(s) ||
    /\bcompleted\b/.test(s) ||
    /\bcomplete\b/.test(s) ||
    /\bclosed\b/.test(s)
  );
}

export function RecallList({ recalls }: RecallListProps) {
  const sorted = [...recalls].sort(
    (a, b) => parseRecallDateMs(b.initiated) - parseRecallDateMs(a.initiated),
  );
  const top = sorted.slice(0, MAX_ROWS);

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
        Recall / correction history
      </p>
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">Device recalls</CardTitle>
          <CardDescription className="text-brand-muted">
            Up to five most recent recalls from openFDA for this search (newest first).
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {top.length === 0 ? (
            <p className="text-sm text-brand-muted">
              No recall records returned for this search (or recalls require a firm name or FEI).
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {top.map((r, idx) => {
                const status = r.status.trim() || 'Unknown';
                const settled = isTerminatedOrCompleted(status);
                const badgeClass = classificationBadgeClass(r.classification);

                return (
                  <li
                    key={r.recallNumber ?? `recall-${idx}`}
                    className="rounded-lg border border-brand-border bg-brand-card/60 px-4 py-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={cn('border', badgeClass)}>
                        {r.classification.trim() || 'Unclassified'}
                      </Badge>
                      {r.initiated.trim() ? (
                        <span className="text-xs text-brand-muted">{r.initiated.trim()}</span>
                      ) : null}
                    </div>
                    {r.reason.trim() ? (
                      <p className="mt-2 leading-relaxed text-brand-text">
                        {excerptReason(r.reason)}
                      </p>
                    ) : null}
                    {settled ? (
                      <p className="mt-2 text-xs text-brand-muted">Open/closed: {status}</p>
                    ) : (
                      <p className="mt-2 text-xs text-brand-warn-text">
                        Status: {status} — may still be open
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
