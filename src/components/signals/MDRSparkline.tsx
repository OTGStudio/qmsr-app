import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { MDRSparklineProps } from '@/types/signals';

function computeWindowStats(byYear: Record<string, number>, years: string[]) {
  const sorted = [...years].sort((a, b) => Number(a) - Number(b));
  const total = sorted.reduce((s, y) => s + (byYear[y] ?? 0), 0);
  const last3 = sorted.slice(-3);
  const prev3 = sorted.slice(-6, -3);
  const recent3yr = last3.reduce((s, y) => s + (byYear[y] ?? 0), 0);
  const older3yr = prev3.reduce((s, y) => s + (byYear[y] ?? 0), 0);
  let trendPercent: number | null = null;
  if (older3yr > 0) {
    trendPercent = ((recent3yr - older3yr) / older3yr) * 100;
  } else if (older3yr === 0 && recent3yr > 0) {
    trendPercent = 100;
  }
  return { total, recent3yr, trendPercent };
}

function labelIndicesFor(count: number): Set<number> {
  const s = new Set<number>();
  if (count <= 0) return s;
  s.add(0);
  if (count > 1) s.add(count - 1);
  if (count > 2) s.add(Math.floor((count - 1) / 2));
  return s;
}

export function MDRSparkline({ byYear, years }: MDRSparklineProps) {
  const sortedYears = [...years].sort((a, b) => Number(a) - Number(b));
  const max = Math.max(1, ...sortedYears.map((y) => byYear[y] ?? 0));
  const { total, recent3yr, trendPercent } = computeWindowStats(byYear, sortedYears);
  const labels = labelIndicesFor(sortedYears.length);

  if (sortedYears.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">MDR adverse events by year</CardTitle>
          <CardDescription className="text-brand-muted">
            Device adverse event reports from openFDA (search requires firm name and product code).
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-brand-muted">
            No MDR time series returned — add both company name and product code, then pull again.
          </p>
        </CardContent>
      </Card>
    );
  }

  const trendTone =
    trendPercent === null
      ? 'text-brand-muted'
      : trendPercent > 25
        ? 'text-brand-warn-text'
        : trendPercent < -10
          ? 'text-brand-good-text'
          : 'text-brand-text';

  const trendSuffix = trendPercent !== null && trendPercent > 25 ? ' ⚠ Rising' : '';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-lg">MDR adverse events by year</CardTitle>
        <CardDescription className="text-brand-muted">
          Last six calendar years from openFDA for the current search.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-6">
          <div className="flex min-w-0 flex-1 items-end gap-2">
            {sortedYears.map((y, i) => {
              const n = byYear[y] ?? 0;
              const barH = max > 0 ? (n / max) * 64 : 0;
              const h = Math.max(barH, n > 0 ? 2 : 0);
              const showLabel = labels.has(i);
              return (
                <div
                  key={y}
                  className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
                >
                  <svg
                    className="h-16 w-full text-brand-accent"
                    viewBox="0 0 20 64"
                    preserveAspectRatio="none"
                    aria-hidden
                  >
                    <rect
                      x="2"
                      y={64 - h}
                      width="16"
                      height={h}
                      className="fill-current opacity-70"
                      rx="2"
                    />
                  </svg>
                  <span
                    className={cn(
                      'text-center text-xs leading-none',
                      showLabel ? 'text-brand-muted' : 'text-transparent',
                    )}
                  >
                    {showLabel ? y : '·'}
                  </span>
                </div>
              );
            })}
          </div>

          <dl className="grid shrink-0 gap-2 text-sm md:w-56">
            <div className="flex justify-between gap-4 border-b border-brand-border pb-2">
              <dt className="text-brand-muted">Total MDR</dt>
              <dd className="font-medium tabular-nums text-brand-text">{total}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-brand-border pb-2">
              <dt className="text-brand-muted">Recent 3 yr</dt>
              <dd className="font-medium tabular-nums text-brand-text">{recent3yr}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-brand-muted">Trend vs prior 3 yr</dt>
              <dd className={cn('font-medium tabular-nums', trendTone)}>
                {trendPercent === null ? '—' : `${trendPercent >= 0 ? '+' : ''}${Math.round(trendPercent)}%`}
                {trendSuffix}
              </dd>
            </div>
          </dl>
        </div>
      </CardContent>
    </Card>
  );
}
