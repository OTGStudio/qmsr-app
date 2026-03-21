import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { INSPECTION_TYPE_ORDER, ITYPES } from '@/lib/domain';
import type { InspectionType, WizardStepProps } from '@/types/scenario';

const fieldLabelClass =
  'mb-1.5 block text-xs font-semibold text-brand-muted';

const MODEL_2_BADGE_CLASS =
  'inline-flex shrink-0 rounded-md border border-[#6366f1] bg-[#eef2ff] px-2 py-0.5 text-xs font-semibold text-[#3730a3] dark:border-indigo-400 dark:bg-indigo-950/50 dark:text-indigo-200';

const MODEL_1_BADGE_CLASS =
  'inline-flex shrink-0 rounded-md border border-brand-border bg-brand-card-alt px-2 py-0.5 text-xs font-semibold text-brand-muted';

const MODEL_2_CALLOUT_BODIES: Record<
  'baseline' | 'pmaPre' | 'premarketReview',
  string
> = {
  baseline:
    'This is the first FDA inspection of this establishment’s quality management system under QMSR (CP 7382.850). Model 2 requires all six QMS areas at minimum depth, with emphasis on management oversight and traceability across the product lifecycle.',
  premarketReview:
    'Premarket review support inspections apply Model 2 when FDA must assess readiness across all six QMS areas during premarket review (for example Q-Sub, De Novo, IDE, or PMA-related review).',
  pmaPre:
    'This is a PMA preapproval inspection. Model 2 applies with intensive review of design verification and validation, manufacturing controls, and supplier oversight across all six QMS areas.',
};

function isModel2Type(
  t: InspectionType | undefined,
): t is 'baseline' | 'pmaPre' | 'premarketReview' {
  return t === 'baseline' || t === 'pmaPre' || t === 'premarketReview';
}

export function Step2Inspection({ scenario, onUpdate }: WizardStepProps) {
  const selected = scenario.inspType;
  const selectedDef = selected != null ? ITYPES[selected] : undefined;
  const showModel2Callout =
    selectedDef != null && selectedDef.model === 2 && isModel2Type(selected);

  return (
    <div className="space-y-6">
      <Card className="border-brand-border bg-brand-card">
        <CardHeader className="space-y-2 pb-2">
          <p
            className={cn(
              'text-xs text-brand-muted [font-variant:small-caps]',
              'tracking-wide',
            )}
          >
            Step 2 of 7 — Inspection Context
          </p>
          <h2 className="font-serif text-2xl font-normal leading-snug text-brand-text">
            What type of inspection is this?
          </h2>
          <p className="text-sm leading-relaxed text-brand-muted">
            <span className="font-medium text-brand-text">Model 1</span> uses risk-based navigation
            across QMS areas (not all areas are required at minimum depth).{' '}
            <span className="font-medium text-brand-text">Model 2</span> requires coverage of all
            six QMS areas at minimum depth. Choose the inspection type that best matches FDA’s
            stated purpose for the inspection.
          </p>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          {scenario.inspType == null ? (
            <div
              className={cn(
                'rounded-lg border border-brand-warn-border bg-brand-warn-bg px-4 py-3',
                'text-sm text-brand-warn-text',
              )}
              role="alert"
            >
              Select an inspection type to continue.
            </div>
          ) : null}

          <div
            className="grid grid-cols-1 gap-3 md:grid-cols-2"
            role="group"
            aria-label="Inspection type"
          >
            {INSPECTION_TYPE_ORDER.map((key) => {
              const def = ITYPES[key];
              const isSelected = selected === key;
              const isM2 = def.model === 2;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    onUpdate({ inspType: key });
                  }}
                  aria-pressed={isSelected}
                  className={cn(
                    'flex w-full flex-col gap-2 rounded-lg border p-4 text-left transition-colors',
                    'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                    isSelected
                      ? 'border-brand-accent bg-brand-accent-bg shadow-sm'
                      : 'border-brand-border bg-brand-card hover:border-brand-muted',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={isM2 ? MODEL_2_BADGE_CLASS : MODEL_1_BADGE_CLASS}>
                      {def.modelLabel}
                    </span>
                  </div>
                  <span className="font-medium leading-snug text-brand-text">{def.label}</span>
                  <p className="text-xs leading-relaxed text-brand-muted">
                    <span className="font-medium text-brand-muted">Typical path: </span>
                    {def.path}
                  </p>
                </button>
              );
            })}
          </div>

          {showModel2Callout && selectedDef != null ? (
            <div
              className={cn(
                'rounded-lg border border-[#6366f1] bg-[#eef2ff] p-4',
                'dark:border-indigo-500 dark:bg-indigo-950/40',
              )}
              role="region"
              aria-label="Model 2 inspection"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'inline-flex rounded-md border border-[#6366f1] bg-white/80 px-2 py-0.5 text-[0.65rem] font-bold tracking-widest text-[#3730a3]',
                    'dark:border-indigo-400 dark:bg-indigo-950/80 dark:text-indigo-200',
                  )}
                >
                  INSPECTION MODEL 2
                </span>
              </div>
              <h3 className="font-serif text-lg font-medium text-[#3730a3] dark:text-indigo-100">
                {selectedDef.label}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#3730a3] dark:text-indigo-100/90">
                {MODEL_2_CALLOUT_BODIES[selected]}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-brand-border bg-brand-card">
        <CardHeader className="space-y-1 pb-2">
          <span className={fieldLabelClass}>
            Is the subject device currently marketed in the United States?
          </span>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                onUpdate({ marketedUS: true });
              }}
              aria-pressed={scenario.marketedUS === true}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                scenario.marketedUS
                  ? 'border-brand-accent bg-brand-accent-bg text-brand-text'
                  : 'border-brand-border bg-brand-card text-brand-muted hover:border-brand-muted',
              )}
            >
              Yes — currently marketed
            </button>
            <button
              type="button"
              onClick={() => {
                onUpdate({ marketedUS: false });
              }}
              aria-pressed={scenario.marketedUS === false}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                !scenario.marketedUS
                  ? 'border-brand-accent bg-brand-accent-bg text-brand-text'
                  : 'border-brand-border bg-brand-card text-brand-muted hover:border-brand-muted',
              )}
            >
              No — not yet marketed
            </button>
          </div>

          {!scenario.marketedUS ? (
            <div
              className={cn(
                'rounded-lg border border-brand-border bg-brand-card-alt px-4 py-3',
                'text-sm leading-relaxed text-brand-text',
              )}
              role="note"
            >
              <p className="font-semibold text-brand-text">Premarket mode</p>
              <p className="mt-2 text-brand-muted">
                When the device is not yet marketed in the United States and the inspection type
                is a PMA preapproval inspection or a premarket review support inspection, the app
                applies premarket framing: it narrows postmarket-oriented language (for example MDR
                and recall emphasis) that assumes a US-marketed device. For other inspection
                types, postmarket obligations may still appear where applicable to the scenario.
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
