import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { PRESET_ORDER, PRESETS, type PresetDef } from '@/lib/domain';
import { cn } from '@/lib/utils';
import type { ScenarioFacts } from '@/types/analysis';
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

function fact<K extends keyof ScenarioFacts>(
  scenario: Scenario,
  key: K,
): ScenarioFacts[K] | undefined {
  return scenario.scenarioFacts?.[key] as ScenarioFacts[K] | undefined;
}

function updateFact(
  scenario: Scenario,
  onUpdate: (patch: Partial<Scenario>) => void,
  patch: Partial<ScenarioFacts>,
): void {
  onUpdate({
    scenarioFacts: {
      ...(scenario.scenarioFacts ?? {}),
      ...patch,
    },
  });
}

type InvestigationOutcome = ScenarioFacts['investigationOutcome'];

interface OutcomePillProps {
  label: string;
  value: InvestigationOutcome;
  current: InvestigationOutcome | undefined;
  onSelect: (value: InvestigationOutcome) => void;
}

function OutcomePill({ label, value, current, onSelect }: OutcomePillProps) {
  const active = current === value;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={() => onSelect(value)}
      className={cn(
        'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'border-brand-text bg-brand-text text-white dark:text-brand-card'
          : 'border-brand-border bg-brand-card text-brand-text hover:border-brand-muted',
      )}
    >
      {label}
    </button>
  );
}

export function Step4Risk({ scenario, onUpdate, fieldIdPrefix = '' }: WizardStepProps) {
  const fid = (suffix: string): string => `${fieldIdPrefix}${suffix}`;
  const riskTrimmed = scenario.risk.trim();
  const showRiskLengthWarn = riskTrimmed.length > 0 && riskTrimmed.length < 20;
  const aiOn = scenario.aiEnabled;
  const swEffective = aiOn || scenario.swEnabled;

  const supplierChange = fact(scenario, 'supplierChange') ?? false;
  const complaintsMultiple = fact(scenario, 'complaintsMultiple') ?? false;
  const spreadsheet = fact(scenario, 'spreadsheetCriticalCalculation') ?? false;
  const designChange = fact(scenario, 'designChangePresent') ?? false;
  const capaClosed = fact(scenario, 'capaClosedPreviously') ?? false;
  const specialProcess = fact(scenario, 'specialProcessPresent') ?? false;

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

      <Card className="border-brand-border bg-brand-card">
        <CardHeader className="space-y-2 pb-2">
          <p className={cn('text-xs font-semibold uppercase tracking-wide text-brand-muted')}>
            Inspection context facts
          </p>
          <p className="text-sm leading-relaxed text-brand-muted">
            These optional toggles drive deterministic inspection-readiness adjudication. When set,
            they override text-based inference from the risk statement.
          </p>
        </CardHeader>
        <CardContent className="px-0 pt-0">
          {/* TC1: Supplier / material change */}
          <div className="px-6">
            <p className="pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-brand-muted">
              Supplier / material change
            </p>
            <ToggleRow
              label="Supplier or material change involved"
              hint="A supplier, material, or component change is present in this scenario."
              checked={supplierChange}
              onToggle={() => updateFact(scenario, onUpdate, { supplierChange: !supplierChange })}
            />
            {supplierChange ? (
              <>
                <ToggleRow
                  label="Change impact evaluated"
                  hint="The firm performed and documented an impact assessment for the change."
                  checked={fact(scenario, 'supplierChangeEvaluated') ?? true}
                  onToggle={() =>
                    updateFact(scenario, onUpdate, {
                      supplierChangeEvaluated: !(fact(scenario, 'supplierChangeEvaluated') ?? true),
                    })
                  }
                />
                <ToggleRow
                  label="Biocompatibility re-evaluated"
                  hint="Biocompatibility assessment was revisited after the material/supplier change."
                  checked={fact(scenario, 'biocompatibilityReevaluated') ?? true}
                  onToggle={() =>
                    updateFact(scenario, onUpdate, {
                      biocompatibilityReevaluated: !(fact(scenario, 'biocompatibilityReevaluated') ?? true),
                    })
                  }
                />
              </>
            ) : null}
          </div>

          <div className="my-2 border-t border-brand-border" />

          {/* TC2: Complaint handling */}
          <div className="px-6">
            <p className="pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-brand-muted">
              Complaint handling
            </p>
            <ToggleRow
              label="Multiple or repeated complaints"
              hint="The scenario involves multiple complaints or a complaint trend."
              checked={complaintsMultiple}
              onToggle={() => updateFact(scenario, onUpdate, { complaintsMultiple: !complaintsMultiple })}
            />
            {complaintsMultiple ? (
              <>
                <div className="flex flex-col gap-2 py-4">
                  <span className="text-sm font-semibold text-brand-text">
                    Investigation outcome
                  </span>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Investigation outcome">
                    <OutcomePill
                      label="User error"
                      value="user_error"
                      current={fact(scenario, 'investigationOutcome')}
                      onSelect={(v) => updateFact(scenario, onUpdate, { investigationOutcome: v })}
                    />
                    <OutcomePill
                      label="Other"
                      value="other"
                      current={fact(scenario, 'investigationOutcome')}
                      onSelect={(v) => updateFact(scenario, onUpdate, { investigationOutcome: v })}
                    />
                    <OutcomePill
                      label="Unknown"
                      value="unknown"
                      current={fact(scenario, 'investigationOutcome')}
                      onSelect={(v) => updateFact(scenario, onUpdate, { investigationOutcome: v })}
                    />
                  </div>
                </div>
                <ToggleRow
                  label="Trend analysis performed"
                  hint="Complaint data has been analyzed for trends and patterns."
                  checked={fact(scenario, 'trendAnalysisPerformed') ?? true}
                  onToggle={() =>
                    updateFact(scenario, onUpdate, {
                      trendAnalysisPerformed: !(fact(scenario, 'trendAnalysisPerformed') ?? true),
                    })
                  }
                />
                <ToggleRow
                  label="CAPA initiated"
                  hint="A corrective and preventive action has been opened for this complaint pattern."
                  checked={fact(scenario, 'capaInitiated') ?? true}
                  onToggle={() =>
                    updateFact(scenario, onUpdate, {
                      capaInitiated: !(fact(scenario, 'capaInitiated') ?? true),
                    })
                  }
                />
                <ToggleRow
                  label="Risk file updated"
                  hint="The risk management file has been updated with postmarket complaint data."
                  checked={fact(scenario, 'riskFileUpdated') ?? true}
                  onToggle={() =>
                    updateFact(scenario, onUpdate, {
                      riskFileUpdated: !(fact(scenario, 'riskFileUpdated') ?? true),
                    })
                  }
                />
              </>
            ) : null}
          </div>

          <div className="my-2 border-t border-brand-border" />

          {/* TC3: Data integrity */}
          <div className="px-6">
            <p className="pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-brand-muted">
              Data integrity / critical calculations
            </p>
            <ToggleRow
              label="Spreadsheet used for critical calculations"
              hint="An Excel or other spreadsheet is used for quality-critical calculations (e.g. dose, tolerance, acceptance criteria)."
              checked={spreadsheet}
              onToggle={() =>
                updateFact(scenario, onUpdate, { spreadsheetCriticalCalculation: !spreadsheet })
              }
            />
            {spreadsheet ? (
              <>
                <ToggleRow
                  label="Post-release calculation error found"
                  hint="A calculation error (e.g. rounding, formula) was discovered after product release."
                  checked={fact(scenario, 'calculationErrorPostRelease') ?? false}
                  onToggle={() =>
                    updateFact(scenario, onUpdate, {
                      calculationErrorPostRelease: !(fact(scenario, 'calculationErrorPostRelease') ?? false),
                    })
                  }
                />
                <ToggleRow
                  label="Software validation performed"
                  hint="The spreadsheet or calculation tool has been validated per applicable guidance."
                  checked={fact(scenario, 'softwareValidationPerformed') ?? true}
                  onToggle={() =>
                    updateFact(scenario, onUpdate, {
                      softwareValidationPerformed: !(fact(scenario, 'softwareValidationPerformed') ?? true),
                    })
                  }
                />
                <ToggleRow
                  label="Independent review performed"
                  hint="Critical calculations were independently reviewed or verified."
                  checked={fact(scenario, 'independentReviewPerformed') ?? true}
                  onToggle={() =>
                    updateFact(scenario, onUpdate, {
                      independentReviewPerformed: !(fact(scenario, 'independentReviewPerformed') ?? true),
                    })
                  }
                />
              </>
            ) : null}
          </div>

          <div className="my-2 border-t border-brand-border" />

          {/* TC4: Design change */}
          <div className="px-6">
            <p className="pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-brand-muted">
              Design change
            </p>
            <ToggleRow
              label="Design change present"
              hint="A design change, modification, or revision has been implemented."
              checked={designChange}
              onToggle={() => updateFact(scenario, onUpdate, { designChangePresent: !designChange })}
            />
            {designChange ? (
              <ToggleRow
                label="V&V reassessed"
                hint="Verification and validation were reassessed after the design change."
                checked={fact(scenario, 'designVVReassessed') ?? true}
                onToggle={() =>
                  updateFact(scenario, onUpdate, {
                    designVVReassessed: !(fact(scenario, 'designVVReassessed') ?? true),
                  })
                }
              />
            ) : null}
          </div>

          <div className="my-2 border-t border-brand-border" />

          {/* TC5: CAPA effectiveness */}
          <div className="px-6">
            <p className="pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-brand-muted">
              CAPA effectiveness
            </p>
            <ToggleRow
              label="CAPA previously closed"
              hint="A corrective/preventive action was previously closed for a related issue."
              checked={capaClosed}
              onToggle={() => updateFact(scenario, onUpdate, { capaClosedPreviously: !capaClosed })}
            />
            {capaClosed ? (
              <ToggleRow
                label="Same or similar issue recurred"
                hint="The same or a similar issue has reappeared after CAPA closure."
                checked={fact(scenario, 'issueRecurred') ?? false}
                onToggle={() =>
                  updateFact(scenario, onUpdate, {
                    issueRecurred: !(fact(scenario, 'issueRecurred') ?? false),
                  })
                }
              />
            ) : null}
          </div>

          <div className="my-2 border-t border-brand-border" />

          {/* TC6: Process validation */}
          <div className="px-6">
            <p className="pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-brand-muted">
              Process validation
            </p>
            <ToggleRow
              label="Special process involved"
              hint="Sterilization, welding, sealing, bonding, coating, or other special process."
              checked={specialProcess}
              onToggle={() =>
                updateFact(scenario, onUpdate, { specialProcessPresent: !specialProcess })
              }
            />
            {specialProcess ? (
              <ToggleRow
                label="Process validation documented"
                hint="The special process has been validated with documented IQ/OQ/PQ."
                checked={fact(scenario, 'processValidationDocumented') ?? true}
                onToggle={() =>
                  updateFact(scenario, onUpdate, {
                    processValidationDocumented: !(fact(scenario, 'processValidationDocumented') ?? true),
                  })
                }
              />
            ) : null}
          </div>

          <div className="my-2 border-t border-brand-border" />

          {/* TC7: Management review */}
          <div className="px-6">
            <p className="pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-brand-muted">
              Management oversight
            </p>
            <ToggleRow
              label="Management review performed"
              hint="Management review of the quality system has been conducted and documented."
              checked={fact(scenario, 'managementReviewPerformed') ?? true}
              onToggle={() =>
                updateFact(scenario, onUpdate, {
                  managementReviewPerformed: !(fact(scenario, 'managementReviewPerformed') ?? true),
                })
              }
            />
          </div>

          {/* TC8: Software lifecycle (only when swEnabled) */}
          {swEffective ? (
            <>
              <div className="my-2 border-t border-brand-border" />
              <div className="px-6">
                <p className="pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-brand-muted">
                  Software lifecycle
                </p>
                <ToggleRow
                  label="Software lifecycle documented"
                  hint="Software lifecycle processes, requirements, architecture, and verification records are maintained."
                  checked={fact(scenario, 'softwareLifecycleDocumented') ?? true}
                  onToggle={() =>
                    updateFact(scenario, onUpdate, {
                      softwareLifecycleDocumented: !(fact(scenario, 'softwareLifecycleDocumented') ?? true),
                    })
                  }
                />
              </div>
            </>
          ) : null}

          <div className="my-2 border-t border-brand-border" />

          {/* TC9: Labeling / UDI */}
          <div className="px-6">
            <p className="pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-brand-muted">
              Labeling / UDI
            </p>
            <ToggleRow
              label="Labeling or UDI defect present"
              hint="A UDI discrepancy, label error, or artwork defect has been identified."
              checked={fact(scenario, 'labelingDefectPresent') ?? false}
              onToggle={() =>
                updateFact(scenario, onUpdate, {
                  labelingDefectPresent: !(fact(scenario, 'labelingDefectPresent') ?? false),
                })
              }
            />
            {(fact(scenario, 'labelingDefectPresent') ?? false) ? (
              <ToggleRow
                label="Labeling change control performed"
                hint="Labeling change was processed through documented change control procedures."
                checked={fact(scenario, 'labelingChangeControlPerformed') ?? true}
                onToggle={() =>
                  updateFact(scenario, onUpdate, {
                    labelingChangeControlPerformed: !(fact(scenario, 'labelingChangeControlPerformed') ?? true),
                  })
                }
              />
            ) : null}
          </div>

          <div className="my-2 border-t border-brand-border" />

          {/* TC10: Sterility assurance */}
          <div className="px-6">
            <p className="pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-brand-muted">
              Sterility assurance
            </p>
            <ToggleRow
              label="Sterile device"
              hint="The device is provided sterile or requires sterilization processing."
              checked={fact(scenario, 'sterileDevice') ?? false}
              onToggle={() =>
                updateFact(scenario, onUpdate, {
                  sterileDevice: !(fact(scenario, 'sterileDevice') ?? false),
                })
              }
            />
            {(fact(scenario, 'sterileDevice') ?? false) ? (
              <>
                <ToggleRow
                  label="Sterility validation complete"
                  hint="Sterilization validation (including challenge studies) is fully documented."
                  checked={fact(scenario, 'sterilityValidationComplete') ?? true}
                  onToggle={() =>
                    updateFact(scenario, onUpdate, {
                      sterilityValidationComplete: !(fact(scenario, 'sterilityValidationComplete') ?? true),
                    })
                  }
                />
                <ToggleRow
                  label="Sterilization revalidated after change"
                  hint="Sterilization process was revalidated following any process or packaging change."
                  checked={fact(scenario, 'sterilityRevalidatedAfterChange') ?? true}
                  onToggle={() =>
                    updateFact(scenario, onUpdate, {
                      sterilityRevalidatedAfterChange: !(fact(scenario, 'sterilityRevalidatedAfterChange') ?? true),
                    })
                  }
                />
              </>
            ) : null}
          </div>

          <div className="my-2 border-t border-brand-border" />

          {/* TC11: Training / competency */}
          <div className="px-6">
            <p className="pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-brand-muted">
              Training &amp; competency
            </p>
            <ToggleRow
              label="Training records maintained"
              hint="Training records are maintained for personnel performing quality-affecting operations."
              checked={fact(scenario, 'trainingRecordsMaintained') ?? true}
              onToggle={() =>
                updateFact(scenario, onUpdate, {
                  trainingRecordsMaintained: !(fact(scenario, 'trainingRecordsMaintained') ?? true),
                })
              }
            />
            <ToggleRow
              label="Competency assessed"
              hint="Competency assessments are documented for critical operations."
              checked={fact(scenario, 'competencyAssessed') ?? true}
              onToggle={() =>
                updateFact(scenario, onUpdate, {
                  competencyAssessed: !(fact(scenario, 'competencyAssessed') ?? true),
                })
              }
            />
          </div>

          <div className="my-2 border-t border-brand-border" />

          {/* TC12: Risk management file */}
          <div className="px-6">
            <p className="pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-brand-muted">
              Risk management file
            </p>
            <ToggleRow
              label="Risk management file complete"
              hint="All required sections are documented: hazard ID, risk estimation, risk control, residual risk."
              checked={fact(scenario, 'riskManagementFileComplete') ?? true}
              onToggle={() =>
                updateFact(scenario, onUpdate, {
                  riskManagementFileComplete: !(fact(scenario, 'riskManagementFileComplete') ?? true),
                })
              }
            />
            <ToggleRow
              label="Risk file updated after design change"
              hint="Risk management file was updated to reflect impact of any design change."
              checked={fact(scenario, 'riskFileUpdatedAfterChange') ?? true}
              onToggle={() =>
                updateFact(scenario, onUpdate, {
                  riskFileUpdatedAfterChange: !(fact(scenario, 'riskFileUpdatedAfterChange') ?? true),
                })
              }
            />
          </div>

          <div className="my-2 border-t border-brand-border" />

          {/* TC13: Incoming / calibration / nonconforming */}
          <div className="px-6">
            <p className="pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-brand-muted">
              Incoming acceptance &amp; calibration
            </p>
            <ToggleRow
              label="Incoming failures recurring"
              hint="Repeated incoming inspection failures or supplier defects have been identified."
              checked={fact(scenario, 'incomingFailuresRecurring') ?? false}
              onToggle={() =>
                updateFact(scenario, onUpdate, {
                  incomingFailuresRecurring: !(fact(scenario, 'incomingFailuresRecurring') ?? false),
                })
              }
            />
            {(fact(scenario, 'incomingFailuresRecurring') ?? false) ? (
              <ToggleRow
                label="Escalated to supplier corrective action"
                hint="Recurring failures have been escalated to the supplier with corrective action requested."
                checked={fact(scenario, 'incomingEscalated') ?? true}
                onToggle={() =>
                  updateFact(scenario, onUpdate, {
                    incomingEscalated: !(fact(scenario, 'incomingEscalated') ?? true),
                  })
                }
              />
            ) : null}
            <ToggleRow
              label="Calibration current"
              hint="All measurement equipment is within current calibration status."
              checked={fact(scenario, 'calibrationCurrent') ?? true}
              onToggle={() =>
                updateFact(scenario, onUpdate, {
                  calibrationCurrent: !(fact(scenario, 'calibrationCurrent') ?? true),
                })
              }
            />
            <ToggleRow
              label="Nonconforming product controlled"
              hint="Nonconforming product is identified, segregated, and dispositioned per documented procedures."
              checked={fact(scenario, 'nonconformingProductControlled') ?? true}
              onToggle={() =>
                updateFact(scenario, onUpdate, {
                  nonconformingProductControlled: !(fact(scenario, 'nonconformingProductControlled') ?? true),
                })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
