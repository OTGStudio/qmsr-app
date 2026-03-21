import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { QMS_AREAS } from '@/lib/domain';
import { cn } from '@/lib/utils';
import type { FlagCardProps } from '@/types/signals';

const severityClass = {
  high: 'border-brand-warn-border bg-brand-warn-bg text-brand-warn-text',
  medium: 'border-brand-partial-border bg-brand-partial-bg text-brand-partial-text',
  low: 'border-brand-border bg-brand-card text-brand-text',
} as const;

const severityIcon = {
  high: '⚠',
  medium: '▲',
  low: '•',
} as const;

export function FlagCard({ flag }: FlagCardProps) {
  const areaLabel =
    QMS_AREAS.find((a) => a.key === flag.area)?.label ?? flag.area;

  return (
    <Card className={cn('border', severityClass[flag.severity])}>
      <CardHeader className="pb-2">
        <p className="font-serif text-base font-bold leading-snug">
          <span aria-hidden className="mr-1">
            {severityIcon[flag.severity]}
          </span>
          {flag.label} → {areaLabel}
        </p>
      </CardHeader>
      <CardContent className="pt-0 text-sm leading-relaxed">{flag.detail}</CardContent>
    </Card>
  );
}
