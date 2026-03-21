import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { OAIFactors as OAIFactorsData, OAILevel } from '@/types/analysis';

const LEVEL_BADGE: Record<OAILevel, string> = {
  high: 'border-brand-warn-border bg-brand-warn-bg text-brand-warn-text',
  medium:
    'border-brand-partial-border bg-brand-partial-bg text-brand-partial-text',
  low: 'border-brand-good-border bg-brand-good-bg text-brand-good-text',
};

const LEVEL_LABEL: Record<OAILevel, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const PATTERN_CARD: Record<
  'warn' | 'partial' | 'good',
  string
> = {
  warn: 'border-brand-warn-border bg-brand-warn-bg text-brand-warn-text',
  partial:
    'border-brand-partial-border bg-brand-partial-bg text-brand-partial-text',
  good: 'border-brand-good-border bg-brand-good-bg text-brand-good-text',
};

const FACTOR_ROWS: readonly {
  key: keyof Pick<OAIFactorsData, 'systemic' | 'impact' | 'detect'>;
  title: string;
  question: string;
}[] = [
  {
    key: 'systemic',
    title: 'Systemic failure',
    question:
      'How do weak self-ratings and FDA signal flags compound across the quality system?',
  },
  {
    key: 'impact',
    title: 'Patient impact',
    question:
      'Given device class, risk language, and technology profile, what is the potential patient or public health impact if quality gaps materialize?',
  },
  {
    key: 'detect',
    title: 'Detectability',
    question:
      'How reliably could issues be detected, measured, and corrected through complaints, MDRs, audits, and improvement processes?',
  },
];

export interface OAIFactorsProps {
  factors: OAIFactorsData;
}

export function OAIFactors({ factors }: OAIFactorsProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {FACTOR_ROWS.map(({ key, title, question }) => {
          const factor = factors[key];
          return (
            <Card key={key} className="h-full gap-0 py-0">
              <CardHeader className="border-b border-brand-border px-4 py-3">
                <CardTitle className="font-serif text-base text-brand-text">
                  {title}
                </CardTitle>
                <Badge
                  className={cn(
                    'mt-2 w-fit border text-xs font-medium',
                    LEVEL_BADGE[factor.level]
                  )}
                >
                  {LEVEL_LABEL[factor.level]}
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 px-4 pb-4 pt-3">
                <p className="text-sm font-medium text-brand-text">
                  {question}
                </p>
                <p className="text-sm leading-relaxed text-brand-muted">
                  {factor.reason}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card
        className={cn(
          'gap-0 border-2 py-0',
          PATTERN_CARD[factors.patternTone]
        )}
      >
        <CardHeader className="px-4 py-3">
          <CardTitle className="font-serif text-base">Pattern assessment</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <p className="text-sm leading-relaxed">{factors.pattern}</p>
        </CardContent>
      </Card>

      <p className="text-xs leading-relaxed text-brand-muted">
        Educational synthesis only. OAI-style factors are heuristic indicators
        for inspection preparation and do not predict FDA findings or
        enforcement. Not a substitute for professional regulatory consulting.
      </p>
    </div>
  );
}
