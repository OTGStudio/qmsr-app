import type { Scenario } from '@/types/scenario';

export interface ValidationMessage {
  field: string;
  code: string;
  message: string;
}

export interface ValidationResult {
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
}

const POSTMARKET_SIGNALS = new Set([
  'Complaint trend',
  'MDR increase',
  'MDR — rising 3-year trend',
  'Death-type MDR reports',
  'Open recall action',
  'Recall / correction',
  'Class I recall',
  'UDI discrepancy',
]);

const PREMARKET_INSP_TYPES = new Set(['pmaPre', 'premarketReview']);

/**
 * Validate a standalone FEI value.
 * Returns null if valid (or empty — FEI is optional).
 */
export function validateFEI(fei: string): ValidationMessage | null {
  const trimmed = fei.trim();
  if (trimmed.length === 0) return null;

  if (!/^\d+$/.test(trimmed)) {
    return { field: 'feiNumber', code: 'FEI_FORMAT', message: 'FEI must contain numbers only.' };
  }

  if (trimmed.length !== 10) {
    return { field: 'feiNumber', code: 'FEI_FORMAT', message: 'FEI must be exactly 10 digits.' };
  }

  return null;
}

/**
 * Validate a full scenario for launch readiness.
 * Returns errors (block launch) and warnings (informational).
 */
export function validateScenario(scenario: Scenario): ValidationResult {
  const errors: ValidationMessage[] = [];
  const warnings: ValidationMessage[] = [];

  // FEI format
  const feiError = validateFEI(scenario.feiNumber);
  if (feiError) errors.push(feiError);

  // Required: inspection type
  if (!scenario.inspType) {
    errors.push({
      field: 'inspType',
      code: 'INSP_TYPE_REQUIRED',
      message: 'Select an inspection type.',
    });
  }

  // Required: risk statement
  if (!scenario.risk.trim()) {
    errors.push({
      field: 'risk',
      code: 'RISK_REQUIRED',
      message: 'Enter a primary risk statement.',
    });
  }

  // Warning: premarket type + marketed contradiction
  if (scenario.inspType && PREMARKET_INSP_TYPES.has(scenario.inspType) && scenario.marketedUS) {
    warnings.push({
      field: 'inspType',
      code: 'PREMARKET_MARKETED_CONTRADICTION',
      message:
        'A premarket inspection type was selected while the device is marked as currently marketed in the United States.',
    });
  }

  // Warning: postmarket signals on not-marketed device
  if (!scenario.marketedUS) {
    const incompatible = scenario.signals.filter((s) => POSTMARKET_SIGNALS.has(s));
    if (incompatible.length > 0) {
      warnings.push({
        field: 'signals',
        code: 'POSTMARKET_SIGNAL_ON_PREMARKET',
        message: `These signals are usually postmarket and may be inconsistent with a not-yet-marketed device: ${incompatible.join(', ')}`,
      });
    }
  }

  return { errors, warnings };
}
