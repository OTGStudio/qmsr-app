import { Loader2 } from 'lucide-react';
import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CLASS_LABELS } from '@/lib/domain';
import {
  buildClassificationSearchQuery,
  fetchClassification,
  mapClassificationDeviceClassToManual,
} from '@/lib/fda';
import { cn } from '@/lib/utils';
import type { ClassificationResult } from '@/types/analysis';
import type { WizardStepProps } from '@/types/scenario';

const fieldLabelClass =
  'mb-1.5 block text-xs font-semibold text-brand-muted';

const inputClassName = cn(
  'border border-brand-border bg-brand-card text-brand-text',
  'placeholder:text-brand-muted/70',
  'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
);

const MANUAL_CLASS_OPTIONS = [
  { value: '1' as const, label: CLASS_LABELS['1'] },
  { value: '2' as const, label: CLASS_LABELS['2'] },
  { value: '3' as const, label: CLASS_LABELS['3'] },
  { value: 'F' as const, label: CLASS_LABELS['F'] },
  { value: 'U' as const, label: CLASS_LABELS['U'] },
];

export function Step3Classification({ scenario, onUpdate }: WizardStepProps) {
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResults, setLookupResults] = useState<ClassificationResult[]>([]);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupEmpty, setLookupEmpty] = useState(false);

  const handleLookup = useCallback(async () => {
    setLookupError(null);
    setLookupEmpty(false);
    const q = buildClassificationSearchQuery(scenario);
    if (!q) {
      setLookupError(
        'Enter a product code, regulation number, or product / device name (from Step 1) to search.',
      );
      setLookupResults([]);
      return;
    }

    setLookupLoading(true);
    setLookupResults([]);
    try {
      const { results, error } = await fetchClassification(q);
      setLookupResults(results);
      setLookupError(error);
      setLookupEmpty(error == null && results.length === 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lookup failed.';
      setLookupResults([]);
      setLookupError(message);
      setLookupEmpty(false);
    } finally {
      setLookupLoading(false);
    }
  }, [scenario]);

  const denovoLocked = scenario.pathway === 'denovo';

  return (
    <Card className="border-brand-border bg-brand-card">
      <CardHeader className="space-y-2 pb-2">
        <p
          className={cn(
            'text-xs text-brand-muted [font-variant:small-caps]',
            'tracking-wide',
          )}
        >
          Step 3 of 7 — Device Classification
        </p>
        <h2 className="font-serif text-2xl font-normal leading-snug text-brand-text">
          What is the device class and regulatory pathway?
        </h2>
        <p className="text-sm leading-relaxed text-brand-muted">
          Class and pathway shape how FDA applies risk and premarket expectations. Use a live
          classification lookup when you have a product code or regulation citation.
        </p>
      </CardHeader>
      <CardContent className="space-y-6 pt-2">
        <div>
          <span className={fieldLabelClass}>Regulatory pathway</span>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                onUpdate({ pathway: 'standard' });
              }}
              aria-pressed={scenario.pathway === 'standard'}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                scenario.pathway === 'standard'
                  ? 'border-brand-accent bg-brand-accent-bg text-brand-text'
                  : 'border-brand-border bg-brand-card text-brand-muted hover:border-brand-muted',
              )}
            >
              Standard — 510(k) / PMA / HDE
            </button>
            <button
              type="button"
              onClick={() => {
                onUpdate({
                  pathway: 'denovo',
                  manualClass: '2',
                  classSource: 'manual',
                });
              }}
              aria-pressed={scenario.pathway === 'denovo'}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                scenario.pathway === 'denovo'
                  ? 'border-brand-accent bg-brand-accent-bg text-brand-text'
                  : 'border-brand-border bg-brand-card text-brand-muted hover:border-brand-muted',
              )}
            >
              De Novo
            </button>
          </div>
        </div>

        {scenario.pathway === 'denovo' ? (
          <div
            className={cn(
              'rounded-lg border border-brand-border bg-brand-card-alt px-4 py-3',
              'text-sm leading-relaxed text-brand-text',
            )}
            role="note"
          >
            <p className="font-semibold text-brand-text">De Novo pathway</p>
            <p className="mt-2 text-brand-muted">
              De Novo requests typically yield a Class II designation with special controls. This
              step assumes <span className="font-medium text-brand-text">Class II</span> for
              inspection framing unless you override after an FDA lookup. If you are preparing for
              a review-heavy, premarket-oriented inspection, consider selecting the{' '}
              <span className="font-medium text-brand-text">premarket review support</span>{' '}
              inspection type in Step 2.
            </p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="min-w-0">
            <label className={fieldLabelClass} htmlFor="wizard-product-code">
              Product code
            </label>
            <Input
              id="wizard-product-code"
              name="productCode"
              autoComplete="off"
              value={scenario.productCode}
              onChange={(e) => {
                onUpdate({ productCode: e.target.value.toUpperCase() });
              }}
              placeholder="e.g., LDD"
              className={inputClassName}
            />
          </div>
          <div className="min-w-0">
            <label className={fieldLabelClass} htmlFor="wizard-regulation-num">
              Regulation number
            </label>
            <Input
              id="wizard-regulation-num"
              name="regulationNum"
              autoComplete="off"
              value={scenario.regulationNum}
              onChange={(e) => {
                onUpdate({ regulationNum: e.target.value });
              }}
              placeholder="e.g., 880.1234"
              className={inputClassName}
            />
          </div>
          <div className="min-w-0">
            <span className={fieldLabelClass}>Device class</span>
            <Select
              value={scenario.manualClass}
              disabled={denovoLocked}
              onValueChange={(v) => {
                onUpdate({
                  manualClass: v as (typeof MANUAL_CLASS_OPTIONS)[number]['value'],
                  classSource: 'manual',
                });
              }}
            >
              <SelectTrigger
                size="default"
                className={cn(
                  'h-8 w-full min-w-0 border border-brand-border bg-brand-card text-brand-text',
                  'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
                  denovoLocked && 'opacity-70',
                )}
              >
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {MANUAL_CLASS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            type="button"
            variant="ghost"
            disabled={lookupLoading}
            onClick={() => {
              void handleLookup();
            }}
            className="text-brand-muted hover:bg-muted/60 hover:text-brand-text"
          >
            {lookupLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                Searching…
              </>
            ) : (
              'Find prior FDA classification'
            )}
          </Button>

          {lookupError ? (
            <p className="text-sm text-brand-warn-text" role="alert">
              {lookupError}
            </p>
          ) : null}

          {lookupResults.length > 0 ? (
            <ul className="space-y-3">
              {lookupResults.map((rec, idx) => (
                <li key={`${rec.product_code}-${rec.regulation_number}-${idx}`}>
                  <Card className="border-brand-border bg-brand-card-alt text-left">
                    <CardContent className="space-y-3 p-4">
                      <div className="space-y-1 text-sm">
                        <p className="font-medium text-brand-text">{rec.device_name || '—'}</p>
                        <p className="text-brand-muted">
                          <span className="font-semibold text-brand-text">Class: </span>
                          {rec.device_class || '—'}
                        </p>
                        <p className="text-brand-muted">
                          <span className="font-semibold text-brand-text">Product code: </span>
                          {rec.product_code || '—'}
                        </p>
                        <p className="text-brand-muted">
                          <span className="font-semibold text-brand-text">Regulation: </span>
                          {rec.regulation_number || '—'}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-brand-accent text-brand-accent hover:bg-brand-accent-bg"
                        onClick={() => {
                          onUpdate({
                            manualClass: denovoLocked
                              ? '2'
                              : mapClassificationDeviceClassToManual(rec.device_class),
                            productCode: rec.product_code.trim().toUpperCase(),
                            regulationNum: rec.regulation_number.trim(),
                            classSource: 'lookup',
                          });
                        }}
                      >
                        Use this
                      </Button>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          ) : null}

          {lookupEmpty ? (
            <p className="text-sm text-brand-muted">
              No classification records matched your search. Try another product code, regulation
              citation, or device name.
            </p>
          ) : null}
        </div>

        <div
          className={cn(
            'rounded-lg border border-brand-accent-border bg-brand-accent-bg px-4 py-3',
            'text-sm leading-relaxed text-brand-text',
          )}
          role="note"
        >
          <p className="font-semibold text-brand-text">How class affects inspection scope</p>
          <p className="mt-2 text-brand-muted">
            Higher classes and broader risk profiles generally increase design-control and
            postmarket surveillance depth. Class I exemptions (where applicable), Class II special
            controls, and Class III PMA expectations change which OAFRs and subsystem threads are
            emphasized in the generated framework — especially when combined with your inspection
            type (Model 1 vs Model 2) from Step 2.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
