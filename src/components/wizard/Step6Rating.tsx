import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { AREA_ORDER, ITYPES, QMS_AREAS, RLABELS } from '@/lib/domain';
import { cn } from '@/lib/utils';
import type { QMSAreaKey, RatingValue, WizardStepProps } from '@/types/scenario';

const RATING_KEYS: readonly RatingValue[] = ['unknown', 'weak', 'partial', 'strong'];

const RATING_ACTIVE_CLASS: Record<RatingValue, string> = {
  unknown: cn(
    'border-brand-border bg-brand-card-alt text-brand-muted',
  ),
  weak: cn(
    'border-brand-warn-border bg-brand-warn-bg text-brand-warn-text',
  ),
  partial: cn(
    'border-brand-partial-border bg-brand-partial-bg text-brand-partial-text',
  ),
  strong: cn(
    'border-brand-good-border bg-brand-good-bg text-brand-good-text',
  ),
};

const textareaClassName = cn(
  'min-h-[44px] border border-brand-border bg-brand-card text-brand-text',
  'placeholder:text-brand-muted/70',
  'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
);

const areaByKey = Object.fromEntries(QMS_AREAS.map((a) => [a.key, a])) as Record<
  QMSAreaKey,
  (typeof QMS_AREAS)[number]
>;

export function Step6Rating({ scenario, onUpdate }: WizardStepProps) {
  const isM2 =
    scenario.inspType != null && ITYPES[scenario.inspType].model === 2;

  const ratedCount = AREA_ORDER.filter(
    (key) => scenario.ratings[key] !== 'unknown',
  ).length;

  return (
    <Card className="border-brand-border bg-brand-card">
      <CardHeader className="space-y-2 pb-2">
        <p
          className={cn(
            'text-xs text-brand-muted [font-variant:small-caps]',
            'tracking-wide',
          )}
        >
          Step 6 of 7 — QMS Self-Assessment
        </p>
        <h2 className="font-serif text-2xl font-normal leading-snug text-brand-text">
          Rate your readiness in each area
        </h2>
        <p className="text-sm leading-relaxed text-brand-muted">
          {isM2 ? (
            <>
              Model 2 inspection types require FDA to cover all six QMS areas at minimum depth.
              Your self-rating highlights where evidence and records may be stressed—be candid so
              the assessment matches your true posture.
            </>
          ) : (
            <>
              Honest ratings produce the most useful readiness picture. Use “Not rated” when you
              have not yet assessed an area; partial or weak ratings help the tool emphasize
              likely investigator focus.
            </>
          )}
        </p>

        {isM2 ? (
          <div
            className={cn(
              'rounded-lg border border-[#6366f1] bg-[#eef2ff] px-4 py-3 text-sm',
              'text-[#3730a3] dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-100',
            )}
            role="note"
          >
            <p className="font-semibold">Model 2 minimum depth</p>
            <p className="mt-1.5 leading-relaxed opacity-95">
              For Model 2, investigators still thread risk signals—but all six areas must receive
              at least baseline coverage. Your ratings below flag where depth may be thin relative
              to OAIs and signals from earlier steps.
            </p>
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-0 pt-2">
        {AREA_ORDER.map((areaKey) => {
          const area = areaByKey[areaKey];
          const current = scenario.ratings[areaKey];

          return (
            <div
              key={areaKey}
              className={cn(
                'mb-8 rounded-[10px] border bg-brand-card-alt p-12 last:mb-0',
                isM2
                  ? 'border-[#6366f1] dark:border-indigo-500'
                  : 'border-brand-border',
              )}
            >
              <div className="mb-4 flex flex-col gap-2">
                <h3 className="text-[13px] font-bold text-brand-text">{area.label}</h3>
                {isM2 ? (
                  <span
                    className={cn(
                      'inline-flex w-fit max-w-full rounded-md border border-[#6366f1]',
                      'bg-[#eef2ff] px-2 py-1 text-xs leading-snug text-[#3730a3]',
                      'dark:border-indigo-400 dark:bg-indigo-950/50 dark:text-indigo-200',
                    )}
                  >
                    {area.m2}
                  </span>
                ) : null}
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {RATING_KEYS.map((ratingKey) => {
                  const active = current === ratingKey;
                  return (
                    <button
                      key={ratingKey}
                      type="button"
                      onClick={() => {
                        onUpdate({
                          ratings: { ...scenario.ratings, [areaKey]: ratingKey },
                        });
                      }}
                      aria-pressed={active}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                        'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                        active
                          ? RATING_ACTIVE_CLASS[ratingKey]
                          : 'border-brand-border bg-brand-card text-brand-muted hover:bg-muted/50 dark:bg-brand-card',
                      )}
                    >
                      {RLABELS[ratingKey]}
                    </button>
                  );
                })}
              </div>

              <Textarea
                id={`wizard-area-note-${areaKey}`}
                name={`areaNote-${areaKey}`}
                value={scenario.areaNotes[areaKey]}
                onChange={(e) => {
                  onUpdate({
                    areaNotes: {
                      ...scenario.areaNotes,
                      [areaKey]: e.target.value,
                    },
                  });
                }}
                placeholder={`Optional note for ${area.label}…`}
                className={textareaClassName}
              />
            </div>
          );
        })}

        <p className="mt-8 text-sm text-brand-muted">
          <span className="font-medium text-brand-text">
            {ratedCount} of 6 areas rated.
          </span>{' '}
          Ratings are optional but improve the OAI assessment.
        </p>
      </CardContent>
    </Card>
  );
}
