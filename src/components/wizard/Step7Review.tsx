import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  AREA_ORDER,
  CLASS_LABELS,
  ITYPES,
  QMS_AREAS,
  RLABELS,
  SIGNALS,
  isPremarket,
} from '@/lib/domain';
import { cn } from '@/lib/utils';
import { validateScenario } from '@/lib/validation';
import type { QMSAreaKey, RatingValue, Scenario, WizardLayoutMode } from '@/types/scenario';

const CANONICAL_SIGNAL_SET = new Set(SIGNALS);

const RATING_STYLES: Record<RatingValue, string> = {
  unknown: 'border border-brand-border bg-brand-card text-brand-muted',
  weak: 'border border-brand-warn-border bg-brand-warn-bg text-brand-warn-text',
  partial: 'border border-brand-partial-border bg-brand-partial-bg text-brand-partial-text',
  strong: 'border border-brand-good-border bg-brand-good-bg text-brand-good-text',
} as const;

const areaByKey = Object.fromEntries(QMS_AREAS.map((a) => [a.key, a])) as Record<
  QMSAreaKey,
  (typeof QMS_AREAS)[number]
>;

export interface Step7ReviewProps {
  scenario: Scenario;
  onComplete: (scenario: Scenario) => void;
  isLaunchPending?: boolean;
  wizardLayout?: WizardLayoutMode;
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  const empty = value.trim().length === 0;
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
      <div className="min-w-[120px] shrink-0 text-sm text-brand-muted">{label}</div>
      <div className="min-w-0 flex-1 text-right text-sm text-brand-text">
        {empty ? (
          <span className="italic text-brand-accent">Not entered</span>
        ) : (
          value
        )}
      </div>
    </div>
  );
}

function technologyLabels(scenario: Scenario): string[] {
  const out: string[] = [];
  if (scenario.aiEnabled) out.push('AI-enabled');
  if (scenario.swEnabled) out.push('Software-enabled');
  if (scenario.cyberEnabled) out.push('Cyber / 524B');
  if (scenario.pccpPlanned) out.push('PCCP planned');
  return out;
}

export function Step7Review({
  scenario,
  onComplete,
  isLaunchPending = false,
  wizardLayout = 'guided',
}: Step7ReviewProps) {
  const inspType = scenario.inspType;
  const inspDef = inspType != null ? ITYPES[inspType] : undefined;
  const isM2 = inspDef?.model === 2;
  const riskEmpty = scenario.risk.trim().length === 0;
  const noInspType = scenario.inspType == null;

  const validation = validateScenario(scenario);
  const hasErrors = validation.errors.length > 0;

  const weakAreas = AREA_ORDER.filter((k) => scenario.ratings[k] === 'weak').map(
    (k) => areaByKey[k].label,
  );

  const marketedLine = (() => {
    if (scenario.marketedUS) return 'Yes';
    if (inspType != null && isPremarket(inspType, scenario.marketedUS)) {
      return 'No — premarket mode active';
    }
    return 'No';
  })();

  const modelLine = inspDef
    ? `Model ${inspDef.model} — ${
        inspDef.model === 2 ? 'comprehensive minimum' : 'risk-based'
      }`
    : null;

  const pathwayLabel =
    scenario.pathway === 'denovo'
      ? 'De Novo'
      : 'Standard — 510(k) / PMA / HDE';

  const signalCount = scenario.signals.length;
  const tech = technologyLabels(scenario);

  return (
    <div className="space-y-4">
      {hasErrors ? (
        <div
          data-testid="launch-errors"
          className={cn(
            'rounded-lg border border-red-300 bg-red-50 px-4 py-3',
            'text-sm text-red-800 dark:border-red-700 dark:bg-red-950/30 dark:text-red-300',
          )}
          role="alert"
        >
          <p className="font-semibold">Cannot launch framework</p>
          <ul className="mt-1.5 list-inside list-disc space-y-0.5">
            {validation.errors.map((e) => (
              <li key={e.code}>{e.message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {validation.warnings.length > 0 ? (
        <div
          data-testid="launch-warnings"
          className={cn(
            'rounded-lg border border-brand-warn-border bg-brand-warn-bg px-4 py-3',
            'text-sm text-brand-warn-text',
          )}
          role="status"
        >
          <ul className="list-inside list-disc space-y-0.5">
            {validation.warnings.map((w) => (
              <li key={w.code}>{w.message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {noInspType && !hasErrors ? (
        <div
          className={cn(
            'rounded-lg border border-brand-warn-border bg-brand-warn-bg px-4 py-3',
            'text-sm text-brand-warn-text',
          )}
          role="alert"
        >
          {wizardLayout === 'freeform'
            ? 'No inspection type selected. Choose one in the Inspection section above.'
            : 'No inspection type selected. Return to Step 2.'}
        </div>
      ) : null}

      {riskEmpty && !hasErrors ? (
        <div
          className={cn(
            'rounded-lg border border-brand-warn-border bg-brand-warn-bg px-4 py-3',
            'text-sm text-brand-warn-text',
          )}
          role="alert"
        >
          No risk entered. The risk thread and narrative will not generate.
        </div>
      ) : null}

      <Card className="border-brand-border bg-brand-card">
        <CardHeader className="space-y-1 pb-2">
          <h2 className="font-serif text-xl font-medium text-brand-text">
            Review your inputs
          </h2>
          <p className="text-sm text-brand-muted">
            {wizardLayout === 'freeform'
              ? 'Edit any section above, then launch the framework when ready.'
              : 'Click Back to make changes. When ready, launch the framework.'}
          </p>
        </CardHeader>
      </Card>

      <Card className="border-brand-border bg-brand-card">
        <CardHeader className="pb-2">
          <h3 className="font-serif text-lg font-medium text-brand-text">
            Facility &amp; Device
          </h3>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <ReviewRow label="Company" value={scenario.companyName} />
          <ReviewRow label="Product" value={scenario.productName} />
          <ReviewRow label="FEI number" value={scenario.feiNumber} />
        </CardContent>
      </Card>

      <Card className="border-brand-border bg-brand-card">
        <CardHeader className="pb-2">
          <h3 className="font-serif text-lg font-medium text-brand-text">
            Inspection Context
          </h3>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 text-sm">
          <div>
            <div className="text-brand-muted">Inspection type</div>
            <div className="mt-1 text-brand-text">
              {inspDef ? (
                inspDef.label
              ) : (
                <span className="italic text-brand-accent">Not selected</span>
              )}
            </div>
          </div>
          {modelLine ? (
            <div>
              <div className="text-brand-muted">Model</div>
              <div className="mt-1 text-brand-text">{modelLine}</div>
            </div>
          ) : null}
          <div>
            <div className="text-brand-muted">Marketed in US</div>
            <div className="mt-1 text-brand-text">{marketedLine}</div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-brand-border bg-brand-card">
        <CardHeader className="pb-2">
          <h3 className="font-serif text-lg font-medium text-brand-text">Classification</h3>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 text-sm">
          <ReviewRow label="Pathway" value={pathwayLabel} />
          <ReviewRow
            label="Device class"
            value={CLASS_LABELS[scenario.manualClass] ?? scenario.manualClass}
          />
          <ReviewRow label="Product code" value={scenario.productCode} />
        </CardContent>
      </Card>

      <Card className="border-brand-border bg-brand-card">
        <CardHeader className="pb-2">
          <h3 className="font-serif text-lg font-medium text-brand-text">Risk Profile</h3>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div>
            <div className="mb-1 text-xs font-semibold text-brand-muted">Primary risk</div>
            {riskEmpty ? (
              <p className="text-left text-[12px] italic leading-[1.6] text-brand-accent">
                No risk entered — narrative and risk thread will not generate
              </p>
            ) : (
              <p className="text-left text-[12px] leading-[1.6] text-brand-text">
                {scenario.risk}
              </p>
            )}
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-brand-muted">Technology</div>
            <p className="text-sm text-brand-text">
              {tech.length > 0 ? tech.join(', ') : 'None flagged'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-brand-border bg-brand-card">
        <CardHeader className="pb-2">
          <h3 className="font-serif text-lg font-medium text-brand-text">Signals</h3>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="mb-2 text-sm text-brand-muted">
            {signalCount} signal{signalCount === 1 ? '' : 's'} selected
          </p>
          {scenario.signals.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {scenario.signals.map((s) => {
                const on = CANONICAL_SIGNAL_SET.has(s);
                return (
                  <span
                    key={s}
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-xs font-medium',
                      on
                        ? 'border-brand-accent bg-brand-accent-bg text-brand-text'
                        : 'border-brand-border bg-brand-accent-bg/50 text-brand-text',
                    )}
                  >
                    {s}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-sm italic text-brand-muted">None selected</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-brand-border bg-brand-card">
        <CardHeader className="pb-2">
          <h3 className="font-serif text-lg font-medium text-brand-text">
            QMS Self-Assessment
          </h3>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {AREA_ORDER.map((key) => {
            const area = areaByKey[key];
            const rating = scenario.ratings[key];
            return (
              <div
                key={key}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-border pb-3 last:border-b-0 last:pb-0"
              >
                <span className="text-sm font-medium text-brand-text">{area.label}</span>
                <span
                  className={cn(
                    'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                    RATING_STYLES[rating],
                  )}
                >
                  {RLABELS[rating]}
                </span>
              </div>
            );
          })}

          {weakAreas.length > 0 ? (
            <div
              className={cn(
                'mt-4 rounded-lg border border-brand-warn-border bg-brand-warn-bg px-4 py-3',
                'text-sm text-brand-warn-text',
              )}
              role="status"
            >
              <p className="font-semibold">Weak areas</p>
              <p className="mt-1.5">
                {weakAreas.join(', ')}
                {isM2 && weakAreas.length > 0
                  ? ' — critical in Model 2: these areas have no compensating coverage'
                  : ''}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-col items-center pt-[18px]">
        <Button
          type="button"
          size="lg"
          data-testid="launch-btn"
          disabled={isLaunchPending || hasErrors}
          className={cn(
            'h-11 min-w-[min(100%,280px)] px-8 text-base font-semibold',
            'bg-brand-accent text-white hover:bg-brand-accent/90',
            'border border-brand-accent-border',
          )}
          onClick={() => {
            onComplete(scenario);
          }}
        >
          {isLaunchPending ? (
            <>
              <Loader2 className="mr-2 size-5 animate-spin" aria-hidden />
              Saving…
            </>
          ) : (
            'Launch Framework →'
          )}
        </Button>
        <p className="mt-4 max-w-md text-center text-xs text-brand-muted">
          Educational tool — generic and non-tailored by design. Not a substitute for professional
          regulatory consulting. Does not create a consulting relationship with Respress
          Solutions LLC.
        </p>
      </div>
    </div>
  );
}
