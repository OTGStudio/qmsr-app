import type { QMSAreaDef } from '@/lib/domain';
import { RLABELS } from '@/lib/domain';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { RatingValue } from '@/types/scenario';

const RATING_STYLES = {
  unknown: 'bg-brand-card border-brand-border text-brand-muted',
  weak: 'bg-brand-warn-bg border-brand-warn-border text-brand-warn-text',
  partial: 'bg-brand-partial-bg border-brand-partial-border text-brand-partial-text',
  strong: 'bg-brand-good-bg border-brand-good-border text-brand-good-text',
} as const satisfies Record<RatingValue, string>;

export interface AreaCardProps {
  area: QMSAreaDef;
  rating: RatingValue;
  bullets: string[];
  isFlagged: boolean;
  isM2: boolean;
}

export function AreaCard({
  area,
  rating,
  bullets,
  isFlagged,
  isM2,
}: AreaCardProps) {
  return (
    <Card
      className={cn(
        'h-full gap-0 py-0',
        isFlagged && 'border border-dashed border-brand-warn-border bg-brand-warn-bg/30'
      )}
    >
      <CardHeader className="gap-2 border-b border-brand-border/80 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="font-serif text-base font-semibold text-brand-text">
                {area.label}
              </h3>
              {isFlagged ? (
                <span className="text-brand-warn-text" aria-hidden>
                  ⚠
                </span>
              ) : null}
            </div>
          </div>
          {isM2 ? (
            <Badge
              className={cn(
                'shrink-0 border border-indigo-300 bg-indigo-100 text-indigo-950',
                'dark:border-indigo-500/50 dark:bg-indigo-950/50 dark:text-indigo-100'
              )}
            >
              REQUIRED
            </Badge>
          ) : (
            <Badge className={cn('shrink-0 border', RATING_STYLES[rating])}>
              {RLABELS[rating]}
            </Badge>
          )}
        </div>
        {isM2 ? (
          <p className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs leading-snug text-indigo-950 dark:border-indigo-500/40 dark:bg-indigo-950/40 dark:text-indigo-100">
            <span className="font-medium">Required elements: </span>
            {area.m2}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-3">
        <div className="space-y-2">
          {bullets.map((line, i) => (
            <p
              key={`${area.key}-${i}`}
              className="text-[11px] leading-[1.55] text-brand-text"
            >
              <span className="text-brand-muted">• </span>
              {line}
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
