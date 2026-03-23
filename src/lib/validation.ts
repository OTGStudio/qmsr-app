import {
  hasAnySignal,
  PREMARKET_RECALL_PATTERN_KEYS,
  POSTMARKET_ONLY_SIGNAL_KEYS,
  signalLabel,
  SW_AI_COVERAGE_SIGNAL_KEYS,
} from '@/lib/signalRegistry';
import type { InspectionType, Scenario } from '@/types/scenario';

export interface ValidationMessage {
  field: string;
  code: string;
  message: string;
}

export interface ValidationSummary {
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
  notices: ValidationMessage[];
}

const PREMARKET_INSP_TYPES = new Set<InspectionType>(['pmaPre', 'premarketReview']);

/**
 * Validate a standalone FEI value.
 * Returns null if valid (or empty — FEI is optional).
 */
export function validateFEI(fei: string): ValidationMessage | null {
  const trimmed = fei.trim();
  if (trimmed.length === 0) return null;

  if (!/^\d+$/.test(trimmed)) {
    return {
      field: 'feiNumber',
      code: 'FEI_FORMAT',
      message: 'FEI must be exactly 10 numeric digits (no letters, spaces, or punctuation).',
    };
  }
  if (trimmed.length !== 10) {
    return {
      field: 'feiNumber',
      code: 'FEI_FORMAT',
      message: 'FEI must be exactly 10 numeric digits.',
    };
  }

  return null;
}

function feiLaunchBlockingError(scenario: Scenario): ValidationMessage | null {
  const fei = scenario.feiNumber.trim();
  if (!fei) return null;

  const v = scenario.feiVerification;
  if (!v?.userInitiatedLookup) return null;

  if (v.status === 'not_found') {
    return {
      field: 'feiNumber',
      code: 'FEI_NOT_FOUND_AFTER_LOOKUP',
      message:
        'No establishment match was found for this FEI using the available lookup. Confirm the FEI with authoritative records, adjust verification, or clear the FEI before launch.',
    };
  }
  if (v.status === 'verification_failed') {
    return {
      field: 'feiNumber',
      code: 'FEI_VERIFICATION_FAILED',
      message:
        'FEI verification did not support this establishment identity. Resolve the mismatch or clear the FEI before launch.',
    };
  }
  return null;
}

/**
 * Validate a full scenario for launch readiness.
 * Errors block launch; warnings and notices are non-blocking.
 */
export function validateScenario(scenario: Scenario): ValidationSummary {
  const errors: ValidationMessage[] = [];
  const warnings: ValidationMessage[] = [];
  const notices: ValidationMessage[] = [];

  const feiError = validateFEI(scenario.feiNumber);
  if (feiError) errors.push(feiError);

  const feiBlock = feiLaunchBlockingError(scenario);
  if (feiBlock) errors.push(feiBlock);

  const feiTrim = scenario.feiNumber.trim();
  const feiFormatOk = feiTrim.length > 0 && !validateFEI(scenario.feiNumber);
  const fv = scenario.feiVerification;

  if (feiFormatOk && !fv) {
    notices.push({
      field: 'feiNumber',
      code: 'FEI_VERIFICATION_NOT_ATTEMPTED',
      message:
        'FEI format is valid, but establishment verification has not been run — format validity is not the same as confirming an FDA establishment match.',
    });
  }

  if (fv?.userInitiatedLookup && fv.status === 'lookup_unavailable') {
    warnings.push({
      field: 'feiNumber',
      code: 'FEI_LOOKUP_UNAVAILABLE',
      message:
        'Establishment lookup is currently unavailable — automated FEI verification was not performed. Triangulation may still use other FDA public data.',
    });
  }

  if (fv?.userInitiatedLookup && fv.status === 'possible_match') {
    warnings.push({
      field: 'feiNumber',
      code: 'FEI_POSSIBLE_MATCH',
      message:
        'Possible establishment match only — review returned facility fields and firm records before treating this as confirmed.',
    });
  }

  if (!scenario.inspType) {
    errors.push({
      field: 'inspType',
      code: 'INSP_TYPE_REQUIRED',
      message: 'Select an inspection type.',
    });
  }

  if (!scenario.risk.trim()) {
    errors.push({
      field: 'risk',
      code: 'RISK_REQUIRED',
      message: 'Enter a primary risk statement.',
    });
  }

  if (scenario.inspType && PREMARKET_INSP_TYPES.has(scenario.inspType) && scenario.marketedUS) {
    warnings.push({
      field: 'inspType',
      code: 'PREMARKET_MARKETED_CONTRADICTION',
      message:
        'A premarket inspection type was selected while the device is marked as currently marketed in the United States.',
    });
  }

  if (!scenario.marketedUS) {
    const incompatible = scenario.signals.filter((k) => POSTMARKET_ONLY_SIGNAL_KEYS.includes(k));
    if (incompatible.length > 0) {
      warnings.push({
        field: 'signals',
        code: 'POSTMARKET_SIGNAL_ON_PREMARKET',
        message: `These signals are usually postmarket and may be inconsistent with a not-yet-marketed device: ${incompatible.map((k) => signalLabel(k)).join(', ')}`,
      });
    }
  }

  const insp = scenario.inspType;
  if (
    insp &&
    PREMARKET_INSP_TYPES.has(insp) &&
    scenario.marketedUS === false &&
    hasAnySignal(scenario.signals, [...PREMARKET_RECALL_PATTERN_KEYS])
  ) {
    warnings.push({
      field: 'signals',
      code: 'PREMARKET_STRONG_POSTMARKET_PATTERN',
      message:
        'Premarket inspection context with strong recall/MDR-style signals: confirm whether postmarket events apply; narrative and OAFR emphasis may need careful framing.',
    });
  }

  if ((scenario.aiEnabled || scenario.swEnabled) && !hasAnySignal(scenario.signals, SW_AI_COVERAGE_SIGNAL_KEYS)) {
    warnings.push({
      field: 'signals',
      code: 'SW_AI_SIGNAL_GAP',
      message:
        'Software- or AI-enabled profile without a matching software, cybersecurity, performance-drift, or postmarket-style signal. Consider adding at least one relevant signal, or rely on risk text and records (output confidence may be limited).',
    });
  }

  const riskLen = scenario.risk.trim().length;
  if (
    riskLen > 0 &&
    riskLen < 40 &&
    scenario.signals.length === 0 &&
    scenario.unsupportedSignals.length === 0
  ) {
    notices.push({
      field: 'risk',
      code: 'WEAK_INPUT_CONFIDENCE',
      message:
        'Very short risk statement and no signals: deterministic output confidence may be weak—expand risk detail or add canonical signals where applicable.',
    });
  }

  return { errors, warnings, notices };
}
