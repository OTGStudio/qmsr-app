import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { WizardStepProps } from '@/types/scenario';

const fieldLabelClass =
  'mb-1.5 block text-xs font-semibold text-brand-muted';

const inputClassName = cn(
  'border border-brand-border bg-brand-card text-brand-text',
  'placeholder:text-brand-muted/70',
  'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
);

export function Step1Facility({ scenario, onUpdate }: WizardStepProps) {
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
        <p className="text-sm leading-relaxed text-brand-muted">
          These fields are optional. Leave them blank for a generic inspection-readiness
          framework, or add company and device details to tailor outputs to your context.
        </p>
      </CardHeader>
      <CardContent className="space-y-6 pt-2">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className={fieldLabelClass} htmlFor="wizard-company-name">
              Company name
            </label>
            <Input
              id="wizard-company-name"
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
            <label className={fieldLabelClass} htmlFor="wizard-product-name">
              Product / device name
            </label>
            <Input
              id="wizard-product-name"
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

        <div className="max-w-[220px]">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
            <label className={fieldLabelClass} htmlFor="wizard-fei-number">
              FEI number
            </label>
            <span className="text-xs font-normal text-brand-muted">(optional)</span>
          </div>
          <Input
            id="wizard-fei-number"
            name="feiNumber"
            inputMode="numeric"
            autoComplete="off"
            value={scenario.feiNumber}
            onChange={(e) => {
              onUpdate({ feiNumber: e.target.value });
            }}
            placeholder="10 digits"
            className={inputClassName}
          />
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
