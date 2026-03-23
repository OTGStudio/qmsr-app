import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { verifyFeiEstablishment } from '@/lib/api/verifyFei';
import { summarizeFeiVerificationForUi } from '@/lib/feiVerification';
import { cn } from '@/lib/utils';
import { validateFEI } from '@/lib/validation';
import type { WizardStepProps } from '@/types/scenario';

const fieldLabelClass =
  'mb-1.5 block text-xs font-semibold text-brand-muted';

const inputClassName = cn(
  'border border-brand-border bg-brand-card text-brand-text',
  'placeholder:text-brand-muted/70',
  'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
);

export function Step1Facility({
  scenario,
  onUpdate,
  fieldIdPrefix = '',
  wizardLayout = 'guided',
}: WizardStepProps) {
  const fid = (suffix: string): string => `${fieldIdPrefix}${suffix}`;
  const [feiError, setFeiError] = useState<string | null>(null);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const formatInvalid = scenario.feiNumber.trim().length > 0 && validateFEI(scenario.feiNumber) !== null;
  const summaryLine = summarizeFeiVerificationForUi(
    scenario.feiNumber,
    scenario.feiVerification,
    formatInvalid,
  );

  return (
    <Card className="border-brand-border bg-brand-card">
      <CardHeader className="space-y-2 pb-2">
        <p
          className={cn(
            'text-xs text-brand-muted [font-variant:small-caps]',
            'tracking-wide',
          )}
        >
          Step 1 of 7 — Facility & Device
        </p>
        <h2 className="font-serif text-2xl font-normal leading-snug text-brand-text">
          Who is this assessment for?
        </h2>
        {wizardLayout === 'guided' ? (
          <p className="text-sm leading-relaxed text-brand-muted">
            These fields are optional. Leave them blank for a generic inspection-readiness
            framework, or add company and device details to tailor outputs to your context.
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-6 pt-2">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className={fieldLabelClass} htmlFor={fid('wizard-company-name')}>
              Company name
            </label>
            <Input
              id={fid('wizard-company-name')}
              name="companyName"
              autoComplete="organization"
              value={scenario.companyName}
              onChange={(e) => {
                onUpdate({ companyName: e.target.value });
              }}
              placeholder="e.g., Acme Medical Devices, Inc."
              className={inputClassName}
            />
          </div>
          <div>
            <label className={fieldLabelClass} htmlFor={fid('wizard-product-name')}>
              Product / device name
            </label>
            <Input
              id={fid('wizard-product-name')}
              name="productName"
              autoComplete="off"
              value={scenario.productName}
              onChange={(e) => {
                onUpdate({ productName: e.target.value });
              }}
              placeholder="e.g., Model X infusion pump"
              className={inputClassName}
            />
          </div>
        </div>

        <div className="max-w-md">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
            <label className={fieldLabelClass} htmlFor={fid('wizard-fei-number')}>
              FEI number
            </label>
            <span className="text-xs font-normal text-brand-muted">(optional)</span>
          </div>
          <Input
            id={fid('wizard-fei-number')}
            data-testid="fei-input"
            name="feiNumber"
            inputMode="numeric"
            autoComplete="off"
            value={scenario.feiNumber}
            onChange={(e) => {
              onUpdate({ feiNumber: e.target.value, feiVerification: null });
              setVerifyError(null);
              if (feiError) {
                const err = validateFEI(e.target.value);
                setFeiError(err?.message ?? null);
              }
            }}
            onBlur={(e) => {
              const err = validateFEI(e.target.value);
              setFeiError(err?.message ?? null);
            }}
            aria-invalid={feiError != null}
            aria-describedby={feiError ? fid('fei-error') : undefined}
            placeholder="10 digits"
            className={cn(
              inputClassName,
              feiError && 'border-brand-warn-border',
            )}
          />
          {feiError ? (
            <p
              id={fid('fei-error')}
              data-testid="fei-error"
              className="mt-1.5 text-xs text-brand-warn-text"
              role="alert"
            >
              {feiError}
            </p>
          ) : null}

          {scenario.feiNumber.trim().length > 0 && !feiError ? (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-semibold text-brand-text">FEI establishment check</p>
              <p className="text-xs leading-relaxed text-brand-muted">
                FEI format valid means the value matches the syntax rule — it is not the same as
                confirming an establishment in FDA systems. Use Verify to run the configured
                lookup (may be unavailable until an authoritative source is wired).
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={verifyBusy || formatInvalid}
                  onClick={() => {
                    void (async () => {
                      setVerifyError(null);
                      setVerifyBusy(true);
                      try {
                        const result = await verifyFeiEstablishment({
                          fei: scenario.feiNumber,
                          companyName: scenario.companyName,
                        });
                        onUpdate({ feiVerification: result });
                      } catch (err) {
                        setVerifyError(err instanceof Error ? err.message : 'Verification request failed.');
                      } finally {
                        setVerifyBusy(false);
                      }
                    })();
                  }}
                >
                  {verifyBusy ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                      Checking…
                    </>
                  ) : (
                    'Verify establishment'
                  )}
                </Button>
              </div>
              {verifyError ? (
                <p className="text-xs text-brand-warn-text" role="alert">
                  {verifyError}
                </p>
              ) : null}
              <p
                className="rounded-md border border-brand-border bg-brand-card-alt px-3 py-2 text-xs leading-relaxed text-brand-muted"
                role="status"
              >
                {summaryLine}
              </p>
              {scenario.feiVerification?.matchedFacilityName ? (
                <div className="text-xs text-brand-muted">
                  <span className="font-medium text-brand-text">Lookup result: </span>
                  {scenario.feiVerification.matchedFacilityName}
                  {scenario.feiVerification.matchedCity || scenario.feiVerification.matchedState
                    ? ` — ${[scenario.feiVerification.matchedCity, scenario.feiVerification.matchedState]
                        .filter(Boolean)
                        .join(', ')}`
                    : ''}
                </div>
              ) : null}
              {scenario.feiVerification?.notes && scenario.feiVerification.notes.length > 0 ? (
                <ul className="list-inside list-disc text-xs text-brand-muted">
                  {scenario.feiVerification.notes.slice(0, 6).map((n, i) => (
                    <li key={`${i}-${n.slice(0, 24)}`}>{n}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>

        <div
          className={cn(
            'rounded-lg border border-brand-accent-border bg-brand-accent-bg px-4 py-3',
            'text-sm leading-relaxed text-brand-text',
          )}
          role="note"
        >
          <p className="font-semibold text-brand-text">What is an FEI number?</p>
          <p className="mt-1.5 text-brand-muted">
            The{' '}
            <span className="font-medium text-brand-text">
              FDA Establishment Identifier (FEI)
            </span>{' '}
            is a unique number assigned to establishments in FDA&apos;s registration and
            listing system. When you provide it here, public FDA datasets (for example
            recalls and adverse events) can be matched more reliably to your firm—improving
            the quality of signal triangulation in later steps.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
