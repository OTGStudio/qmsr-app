import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { PRESET_ORDER, PRESETS, type PresetDef } from '@/lib/domain';
import { cn } from '@/lib/utils';
import type { Scenario, WizardStepProps } from '@/types/scenario';

const textareaClassName = cn(
  'min-h-[120px] border border-brand-border bg-brand-card text-brand-text',
  'placeholder:text-brand-muted/70',
  'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
);

function applyPreset(preset: PresetDef): Partial<Scenario> {
  return {
    risk: preset.risk,
    signals: [...new Set(preset.signals)],
    aiEnabled: preset.ai ?? false,
    swEnabled: Boolean(preset.sw || preset.ai),
    cyberEnabled: preset.cyber ?? false,
    pccpPlanned: false,
  };
}

interface ToggleRowProps {
  label: string;
  labelSuffix?: string;
  hint: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

function ToggleRow({ label, labelSuffix, hint, checked, disabled, onToggle }: ToggleRowProps) {
  return (
    <div
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled ?? false}
      tabIndex={disabled ? -1 : 0}
      onClick={() => {
        if (!disabled) {
          onToggle();
        }
      }}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
      className={cn(
        'flex cursor-pointer items-center gap-10 border-b border-brand-border py-8 last:border-b-0',
        disabled && 'cursor-not-allowed opacity-70',
      )}
    >
      <div
        className={cn(
          'flex h-10 w-36 shrink-0 rounded-full border-2 p-1 transition-colors',
          checked
            ? 'border-brand-text bg-brand-text'
            : 'border-brand-border bg-brand-card',
        )}
        aria-hidden
      >
        <div
          className={cn(
            'h-8 w-8 rounded-full bg-white shadow transition-[margin] dark:bg-brand-card',
            checked && 'ml-auto',
          )}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-semibold text-brand-text">
          {label}
          {labelSuffix ? (
            <span className="font-normal text-brand-muted"> {labelSuffix}</span>
          ) : null}
        </span>
        <span className="text-sm text-brand-muted">{hint}</span>
      </div>
    </div>
  );
}

export function Step4Risk({ scenario, onUpdate, fieldIdPrefix = '' }: WizardStepProps) {
  const fid = (suffix: string): string => `${fieldIdPrefix}${suffix}`;
  const riskTrimmed = scenario.risk.trim();
  const showRiskLengthWarn = riskTrimmed.length > 0 && riskTrimmed.length < 20;
  const aiOn = scenario.aiEnabled;
  const swEffective = aiOn || scenario.swEnabled;

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
            Step 4 of 7 — Risk Profile
          </p>
          <h2 className="font-serif text-2xl font-normal leading-snug text-brand-text">
            What is the primary product risk?
          </h2>
          <p className="text-sm leading-relaxed text-brand-muted">
            The risk statement anchors the inspection risk thread and narrative. Choose a preset to
            load a starting risk description and signal set, then refine the text so it reflects
            your device and firm.
          </p>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
            {PRESET_ORDER.map((key) => {
              const preset = PRESETS[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    onUpdate(applyPreset(preset));
                  }}
                  className={cn(
                    'flex flex-col gap-1 rounded-lg border border-brand-border bg-brand-card px-3 py-3 text-left',
                    'transition-colors hover:border-brand-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                  )}
                >
                  <span className="text-sm font-bold leading-snug text-brand-text">
                    {preset.label}
                  </span>
                  <span className="text-xs leading-snug text-brand-muted">{preset.hint}</span>
                </button>
              );
            })}
          </div>

          <div>
            <div className="mb-1.5 flex flex-wrap items-baseline gap-2">
              <label className="text-xs font-semibold text-brand-text" htmlFor={fid('wizard-risk-text')}>
                Primary risk statement
                <span className="text-brand-warn-text"> *</span>
              </label>
              <span className="text-xs text-brand-muted">
                (required for narrative &amp; risk thread)
              </span>
            </div>
            <Textarea
              id={fid('wizard-risk-text')}
              name="risk"
              value={scenario.risk}
              onChange={(e) => {
                onUpdate({ risk: e.target.value });
              }}
              placeholder="Describe the main clinical, safety, or performance risks for this device…"
              className={textareaClassName}
              required
              aria-invalid={showRiskLengthWarn}
            />
            {showRiskLengthWarn ? (
              <div
                className={cn(
                  'mt-2 rounded-lg border border-brand-warn-border bg-brand-warn-bg px-3 py-2',
                  'text-sm text-brand-warn-text',
                )}
                role="status"
              >
                Add more detail. A fuller risk statement helps the thread and narrative
                triangulate to the right QMS areas.
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="border-brand-border bg-brand-card">
        <CardHeader className="space-y-2 pb-2">
          <p className={cn('text-xs font-semibold uppercase tracking-wide text-brand-muted')}>
            Technology profile
          </p>
          <p className="text-sm leading-relaxed text-brand-muted">
            These toggles flag technologies that often trigger additional inspection elements (for
            example software lifecycle, cybersecurity, or change plans for ML).
          </p>
        </CardHeader>
        <CardContent className="px-0 pt-0">
          <div className="px-6">
            <ToggleRow
              label="AI-enabled device"
              hint="Machine learning, adaptive algorithms, or CADx that may require model lifecycle and change controls."
              checked={aiOn}
              onToggle={() => {
                const next = !scenario.aiEnabled;
                onUpdate(
                  next
                    ? { aiEnabled: true, swEnabled: true }
                    : { aiEnabled: false },
                );
              }}
            />
            <ToggleRow
              label="Software-enabled device"
              labelSuffix={aiOn ? '(required by AI)' : undefined}
              hint="Embedded software, SaMD, programmable behavior, or software validation scope."
              checked={swEffective}
              disabled={aiOn}
              onToggle={() => {
                if (aiOn) return;
                onUpdate({ swEnabled: !scenario.swEnabled });
              }}
            />
            <ToggleRow
              label="Cyber device / 524B"
              hint="Network interfaces, remote monitoring, updatable software, or cybersecurity obligations."
              checked={scenario.cyberEnabled}
              onToggle={() => {
                onUpdate({ cyberEnabled: !scenario.cyberEnabled });
              }}
            />
          </div>

          {aiOn ? (
            <>
              <div className="my-2 border-t border-brand-border" />
              <div className="px-6">
                <ToggleRow
                  label="PCCP planned"
                  hint="Predetermined Change Control Plan — activates PCCP-specific prompts when algorithm or software changes are pre-cleared."
                  checked={scenario.pccpPlanned}
                  onToggle={() => {
                    onUpdate({ pccpPlanned: !scenario.pccpPlanned });
                  }}
                />
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
