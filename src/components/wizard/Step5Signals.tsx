import { useCallback, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SIGNALS } from '@/lib/domain';
import { wizardPillToggleClass } from '@/lib/wizardToggleStyles';
import { cn } from '@/lib/utils';
import type { WizardStepProps } from '@/types/scenario';

const inputClassName = cn(
  'border border-brand-border bg-brand-card text-brand-text',
  'placeholder:text-brand-muted/70',
  'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
);

const CANONICAL_SIGNAL_SET = new Set(SIGNALS);

export function Step5Signals({ scenario, onUpdate, fieldIdPrefix = '' }: WizardStepProps) {
  const fid = (suffix: string): string => `${fieldIdPrefix}${suffix}`;
  const [customInput, setCustomInput] = useState('');

  const customSignals = useMemo(
    () => scenario.signals.filter((s) => !CANONICAL_SIGNAL_SET.has(s)),
    [scenario.signals],
  );

  const toggleSignal = useCallback(
    (signal: string) => {
      const has = scenario.signals.includes(signal);
      const next = has
        ? scenario.signals.filter((s) => s !== signal)
        : [...scenario.signals, signal];
      onUpdate({ signals: next });
    },
    [onUpdate, scenario.signals],
  );

  const addCustom = useCallback(() => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    const exists = scenario.signals.some(
      (s) => s.toLowerCase() === trimmed.toLowerCase(),
    );
    if (exists) {
      setCustomInput('');
      return;
    }
    onUpdate({ signals: [...scenario.signals, trimmed] });
    setCustomInput('');
  }, [customInput, onUpdate, scenario.signals]);

  const removeSignal = useCallback(
    (signal: string) => {
      onUpdate({
        signals: scenario.signals.filter((s) => s !== signal),
      });
    },
    [onUpdate, scenario.signals],
  );

  const count = scenario.signals.length;

  return (
    <Card className="border-brand-border bg-brand-card">
      <CardHeader className="space-y-2 pb-2">
        <p
          className={cn(
            'text-xs text-brand-muted [font-variant:small-caps]',
            'tracking-wide',
          )}
        >
          Step 5 of 7 — Risk Signals
        </p>
        <h2 className="font-serif text-2xl font-normal leading-snug text-brand-text">
          Which signals are present?
        </h2>
        <p className="text-sm leading-relaxed text-brand-muted">
          Signals are the pre-inspection clues FDA may already be tracking—complaints, MDRs,
          recalls, supplier issues, and similar threads. Selecting them shapes how strongly the
          framework emphasizes measurement, CAPA, and design linkage.
        </p>
      </CardHeader>
      <CardContent className="space-y-6 pt-2">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {SIGNALS.map((signal) => {
            const on = scenario.signals.includes(signal);
            return (
              <button
                key={signal}
                type="button"
                onClick={() => {
                  toggleSignal(signal);
                }}
                aria-pressed={on}
                className={wizardPillToggleClass(on, 'comfortable')}
              >
                {signal}
              </button>
            );
          })}
        </div>

        {customSignals.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {customSignals.map((signal) => (
              <span
                key={signal}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border border-brand-accent',
                  'bg-brand-accent-bg px-2.5 py-1 text-sm font-medium text-brand-text',
                )}
              >
                {signal}
                <button
                  type="button"
                  onClick={() => {
                    removeSignal(signal);
                  }}
                  className={cn(
                    'ml-0.5 inline-flex size-6 items-center justify-center rounded-full',
                    'text-brand-accent hover:bg-brand-accent/10',
                  )}
                  aria-label={`Remove ${signal}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            id={fid('wizard-custom-signal')}
            name="customSignal"
            value={customInput}
            onChange={(e) => {
              setCustomInput(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustom();
              }
            }}
            placeholder="Add a custom signal…"
            className={cn(inputClassName, 'sm:min-w-0 sm:flex-1')}
            aria-label="Custom signal"
          />
          <Button
            type="button"
            disabled={customInput.trim().length === 0}
            onClick={() => {
              addCustom();
            }}
            className="min-h-9 min-w-[5rem] shrink-0 sm:min-w-[5.5rem]"
          >
            Add
          </Button>
        </div>

        <div
          className={cn(
            'rounded-lg border border-brand-accent-border bg-brand-accent-bg px-4 py-3',
            'text-sm leading-relaxed text-brand-text',
          )}
          role="status"
        >
          {count === 0 ? (
            <p className="text-brand-muted">
              No signals is valid for a first inspection or a neutral baseline when you do not yet
              have postmarket threads to highlight.
            </p>
          ) : (
            <p className="text-brand-muted">
              <span className="font-semibold text-brand-text">
                {count} signal{count === 1 ? '' : 's'} selected.
              </span>{' '}
              These are reflected in the OAI risk assessment and help weight how the framework
              stresses measurement, CAPA, and design linkage.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
