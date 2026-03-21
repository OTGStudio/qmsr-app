import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { OAFRDef } from '@/lib/domain';

export interface OAFRListProps {
  premarket: boolean;
  oafrs: readonly OAFRDef[];
}

export function OAFRList({ premarket, oafrs }: OAFRListProps) {
  return (
    <Card className="border-brand-accent-border bg-brand-accent-bg/60">
      <CardHeader className="pb-2">
        <CardTitle className="font-serif text-base text-brand-text">
          Other Applicable FDA Requirements (OAFRs)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {premarket ? (
          <p className="text-sm leading-relaxed text-brand-text">
            OAFRs excluded — premarket inspection, device not yet marketed in
            U.S.
          </p>
        ) : (
          <ul className="space-y-2 text-sm text-brand-text">
            {oafrs.map((o) => (
              <li key={o.key} className="flex gap-2">
                <span className="text-brand-accent" aria-hidden>
                  •
                </span>
                <span>{o.label}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
