import { useOutletContext } from 'react-router-dom';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ITYPES, QMS_AREAS } from '@/lib/domain';
import type { InspectionType, QMSAreaKey } from '@/types/scenario';
import type { ScenarioDetailOutletContext } from '@/types/scenarioDetail';
import type { ThreadViewProps } from '@/types/thread';

import { OAIFactors } from './OAIFactors';

function entryPointCopy(
  inspType: InspectionType,
  entryKey: QMSAreaKey
): string {
  const it = ITYPES[inspType];
  const entryLabel =
    QMS_AREAS.find((a) => a.key === entryKey)?.label ?? entryKey;
  return `For ${it.label}, the risk thread begins in ${entryLabel} under CP 7382.850. The ${it.modelLabel} model directs investigators to follow the ordered sequence below.`;
}

function ThreadViewInner({
  scenario,
  riskThread,
  recordsList,
  oaiFactors,
  isM2,
  premarket,
}: ThreadViewProps) {
  const inspType = scenario.inspType ?? 'baseline';
  const it = ITYPES[inspType];
  const hasRiskText = Boolean(scenario.risk?.trim());

  return (
    <div className="flex flex-col gap-6">
      {isM2 ? (
        <div
          className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm leading-relaxed text-indigo-950 dark:border-indigo-500/40 dark:bg-indigo-950/35 dark:text-indigo-100"
          role="note"
        >
          Model 2 comprehensive minimum — investigator covers all six areas in
          sequence.
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">
            Inspection risk thread — how investigators follow this risk
          </CardTitle>
          <CardDescription className="text-brand-muted">
            Investigators connect product risk, signals, and records to specific
            QMS areas. The thread below is an educational map of likely
            interview flow under QMSR; actual FDA activity follows the evidence
            at your firm.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 pt-0">
          {!hasRiskText ? (
            <div
              className="rounded-lg border border-brand-warn-border bg-brand-warn-bg px-4 py-3 text-sm text-brand-warn-text"
              role="alert"
            >
              Enter a primary product risk in the scenario to generate the risk
              thread.
            </div>
          ) : null}

          {premarket ? (
            <p className="text-sm leading-relaxed text-brand-muted">
              Premarket mode: thread language emphasizes design, validation, and
              readiness; postmarket surveillance prompts are reduced where the
              device is not yet marketed in the United States.
            </p>
          ) : null}

          <div className="space-y-2">
            <p className="text-sm font-medium text-brand-text">
              Entry point for this inspection type
            </p>
            <p className="text-sm leading-relaxed text-brand-text">
              {entryPointCopy(inspType, riskThread.entry)}
            </p>
            <p className="text-sm leading-relaxed text-brand-muted">
              {it.summary}
            </p>
          </div>

          <div className="flex flex-col gap-5">
            {riskThread.sequence.map((areaKey) => {
              const block = riskThread.threads[areaKey];
              if (!block) return null;
              return (
                <div
                  key={areaKey}
                  className="rounded-r-lg border-l-[3px] border-solid border-l-brand-accent bg-brand-bg py-3 pl-4 pr-3 ring-1 ring-brand-border/60"
                >
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-accent">
                    {block.label}
                  </p>
                  <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-brand-text">
                    {block.questions.map((q, qi) => (
                      <li key={qi}>{q}</li>
                    ))}
                  </ol>
                </div>
              );
            })}
          </div>

          <div className="rounded-lg bg-brand-accent-bg px-4 py-3 text-sm italic leading-relaxed text-brand-text">
            <p>
              <span className="font-semibold not-italic text-brand-accent">
                Investigator question that determines the outcome:{' '}
              </span>
              {riskThread.investigatorQuestion}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">
            Key records investigators will request first
          </CardTitle>
          <CardDescription className="text-brand-muted">
            Generated from your inspection type, device profile, risk statement,
            signals, and technology flags (software, AI, cybersecurity, PCCP).
            Typical requests under QMSR CP 7382.850 — not an exhaustive subpoena
            list.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="space-y-2 text-sm leading-relaxed text-brand-text">
            {recordsList.map((line, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-brand-accent" aria-hidden>
                  •
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">
            OAI factors (heuristic)
          </CardTitle>
          <CardDescription className="text-brand-muted">
            Systemic, patient impact, and detectability — plus pattern
            synthesis for inspection preparation.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <OAIFactors factors={oaiFactors} />
        </CardContent>
      </Card>
    </div>
  );
}

export function ThreadView() {
  const ctx = useOutletContext<ScenarioDetailOutletContext>();
  const props: ThreadViewProps = {
    scenario: ctx.scenario,
    riskThread: ctx.riskThread,
    recordsList: ctx.recordsList,
    oaiFactors: ctx.oaiFactors,
    isM2: ctx.isM2,
    premarket: ctx.premarket,
  };
  return <ThreadViewInner {...props} />;
}
