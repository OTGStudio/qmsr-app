import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type {
  AdjudicationFinding,
  AdjudicationResult,
  GuardrailCitation,
  RiskLevel,
} from '@/types/analysis';
import type { QMSAreaKey } from '@/types/scenario';

/* ------------------------------------------------------------------ */
/*  Risk level → theme color mapping                                   */
/* ------------------------------------------------------------------ */

const RISK_BADGE: Record<RiskLevel, string> = {
  HIGH: 'border-brand-warn-border bg-brand-warn-bg text-brand-warn-text',
  'MEDIUM-HIGH': 'border-brand-warn-border bg-brand-warn-bg/60 text-brand-warn-text',
  MEDIUM: 'border-brand-partial-border bg-brand-partial-bg text-brand-partial-text',
  LOW: 'border-brand-good-border bg-brand-good-bg text-brand-good-text',
};

const RISK_CARD_BORDER: Record<RiskLevel, string> = {
  HIGH: 'border-brand-warn-border',
  'MEDIUM-HIGH': 'border-brand-warn-border/60',
  MEDIUM: 'border-brand-partial-border',
  LOW: 'border-brand-good-border',
};

const AREA_LABEL: Record<QMSAreaKey, string> = {
  mgmt: 'Management',
  dd: 'Design & Dev',
  prod: 'Production',
  change: 'Change Control',
  out: 'Outsourcing',
  meas: 'Measurement',
};

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <Badge variant="outline" className={cn('text-[10px] font-bold', RISK_BADGE[level])}>
      {level}
    </Badge>
  );
}

function CitationLink({ citation }: { citation: GuardrailCitation }) {
  return (
    <a
      href={citation.url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-brand-accent underline decoration-brand-accent/40 underline-offset-2 hover:decoration-brand-accent"
    >
      {citation.shortLabel}
    </a>
  );
}

function FindingBlock({ finding }: { finding: AdjudicationFinding }) {
  return (
    <div className="rounded-r-lg border-l-[3px] border-l-brand-accent bg-brand-bg py-3 pl-4 pr-3 ring-1 ring-brand-border/60">
      <div className="flex flex-wrap items-center gap-2">
        <RiskBadge level={finding.riskLevel} />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">
          {finding.ruleId}
        </span>
      </div>

      <p className="mt-2 text-sm font-semibold leading-relaxed text-brand-text">
        {finding.finding}
      </p>

      <details className="mt-3 text-xs leading-relaxed text-brand-text">
        <summary className="cursor-pointer font-semibold text-brand-muted hover:text-brand-text">
          Evidence, authorities &amp; actions
        </summary>

        <div className="mt-3 space-y-3">
          {finding.supportingEvidence.length > 0 ? (
            <div>
              <p className="font-semibold uppercase tracking-wider text-brand-muted">
                Supporting evidence
              </p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-brand-text">
                {finding.supportingEvidence.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {finding.authorities.length > 0 ? (
            <div>
              <p className="font-semibold uppercase tracking-wider text-brand-muted">
                Authorities
              </p>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                {finding.authorities.map((a) => (
                  <CitationLink key={a.key} citation={a} />
                ))}
              </div>
            </div>
          ) : null}

          {finding.inspectionRelevance.length > 0 ? (
            <div>
              <p className="font-semibold uppercase tracking-wider text-brand-muted">
                Inspection relevance
              </p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-brand-text">
                {finding.inspectionRelevance.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {finding.recommendedActions.length > 0 ? (
            <div>
              <p className="font-semibold uppercase tracking-wider text-brand-muted">
                Recommended actions
              </p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-brand-text">
                {finding.recommendedActions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {finding.qmsAreas.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">
                QMS areas:
              </span>
              {finding.qmsAreas.map((area) => (
                <Badge key={area} variant="outline" className="text-[10px]">
                  {AREA_LABEL[area]}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </details>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

interface AdjudicationCardProps {
  adjudication: AdjudicationResult;
}

export function AdjudicationCard({ adjudication }: AdjudicationCardProps) {
  if (!adjudication.triggered) return null;

  return (
    <Card className={cn('bg-brand-card', RISK_CARD_BORDER[adjudication.overallRiskLevel])}>
      <CardHeader className="space-y-2 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="font-serif text-lg text-brand-text">
            Deterministic Assessment
          </CardTitle>
          <RiskBadge level={adjudication.overallRiskLevel} />
          <Badge variant="outline" className="text-[10px] text-brand-muted">
            Confidence: {adjudication.confidenceLevel}
          </Badge>
        </div>
        <CardDescription className="text-brand-muted">
          Locked compliance findings from scenario facts — not LLM-generated.
          These findings are deterministic and cannot be softened by the narrative engine.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {adjudication.findings.map((finding) => (
          <FindingBlock key={finding.ruleId} finding={finding} />
        ))}

        {/* Regulatory basis footer */}
        <div className="mt-4 rounded-lg border border-brand-border bg-brand-bg/50 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">
            Regulatory basis
          </p>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {adjudication.bindingBasis.map((c) => (
              <CitationLink key={c.key} citation={c} />
            ))}
            {adjudication.inspectionLens.map((c) => (
              <CitationLink key={c.key} citation={c} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
