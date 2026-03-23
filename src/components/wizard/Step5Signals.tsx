import { useCallback, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SIGNAL_KEYS_ORDER, normalizeSignal, signalLabel } from '@/lib/signalRegistry';
import { wizardPillToggleClass } from '@/lib/wizardToggleStyles';
import { cn } from '@/lib/utils';
import type { WizardStepProps } from '@/types/scenario';

const inputClassName = cn(
  'border border-brand-border bg-brand-card text-brand-text',
  'placeholder:text-brand-muted/70',
  'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
);

export function Step5Signals({ scenario, onUpdate, fieldIdPrefix = '' }: WizardStepProps) {
  const fid = (suffix: string): string => `${fieldIdPrefix}${suffix}`;
  const [customInput, setCustomInput] = useState('');

  const toggleSignal = useCallback(
    (key: (typeof SIGNAL_KEYS_ORDER)[number]) => {
      const has = scenario.signals.includes(key);
      const next = has
        ? scenario.signals.filter((s) => s !== key)
        : [...scenario.signals, key];
      onUpdate({ signals: next });
    },
    [onUpdate, scenario.signals],
  );

  const addCustom = useCallback(() => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    const n = normalizeSignal(trimmed);
    if (n.matched && n.key) {
      const exists = scenario.signals.includes(n.key);
      if (!exists) {
        onUpdate({ signals: [...scenario.signals, n.key] });
      }
      setCustomInput('');
      return;
    }
    const dup = scenario.unsupportedSignals.some(
      (s) => s.toLowerCase() === trimmed.toLowerCase(),
    );
    if (dup) {
      setCustomInput('');
      return;
    }
    onUpdate({ unsupportedSignals: [...scenario.unsupportedSignals, trimmed] });
    setCustomInput('');
  }, [customInput, onUpdate, scenario.signals, scenario.unsupportedSignals]);

  const removeUnsupported = useCallback(
    (note: string) => {
      onUpdate({
        unsupportedSignals: scenario.unsupportedSignals.filter((s) => s !== note),
      });
    },
    [onUpdate, scenario.unsupportedSignals],
  );

  const engineCount = scenario.signals.length;
  const contextCount = scenario.unsupportedSignals.length;

  const statusLine = useMemo(() => {
    if (engineCount === 0 && contextCount === 0) {
      return 'No canonical signals selected. Context notes are optional.';
    }
    return `${engineCount} canonical signal${engineCount === 1 ? '' : 's'} drive analysis; ${contextCount} context note${contextCount === 1 ? '' : 's'} (reviewer only).`;
  }, [engineCount, contextCount]);

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
          Canonical signals below feed the deterministic engine. Custom text is saved as
          reviewer-only context if it cannot be matched to a known signal — it does not silently
          change core analysis.
        </p>
      </CardHeader>
      <CardContent className="space-y-6 pt-2">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {SIGNAL_KEYS_ORDER.map((key) => {
            const label = signalLabel(key);
            const on = scenario.signals.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  toggleSignal(key);
                }}
                aria-pressed={on}
                className={wizardPillToggleClass(on, 'comfortable')}
              >
                {label}
              </button>
            );
          })}
        </div>

        {scenario.unsupportedSignals.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-brand-muted">Context-only notes (not engine-driving)</p>
            <div className="flex flex-wrap gap-2">
              {scenario.unsupportedSignals.map((note) => (
                <span
                  key={note}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border border-brand-border',
                    'bg-brand-card-alt px-2.5 py-1 text-sm font-medium text-brand-muted',
                  )}
                >
                  {note}
                  <button
                    type="button"
                    onClick={() => {
                      removeUnsupported(note);
                    }}
                    className={cn(
                      'ml-0.5 inline-flex size-6 items-center justify-center rounded-full',
                      'text-brand-muted hover:bg-brand-border/30',
                    )}
                    aria-label={`Remove ${note}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
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
            placeholder="Match an alias or add a context-only note…"
            className={cn(inputClassName, 'sm:min-w-0 sm:flex-1')}
            aria-label="Custom signal or note"
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
        <p className="text-xs text-brand-muted">
          Recognized aliases map to canonical signals. Unrecognized text is stored as context for
          reviewers and excluded from deterministic engine inputs.
        </p>

        <div
          className={cn(
            'rounded-lg border border-brand-accent-border bg-brand-accent-bg px-4 py-3',
            'text-sm leading-relaxed text-brand-text',
          )}
          role="status"
        >
          <p className="text-brand-muted">
            <span className="font-semibold text-brand-text">{statusLine}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
