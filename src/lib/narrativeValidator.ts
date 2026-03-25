import type { AdjudicationResult } from '@/types/analysis';

export type NarrativeWarningType =
  | 'missing_authority'
  | 'softening_language'
  | 'missing_risk_level';

export interface NarrativeWarning {
  /** Which TC rule triggered the warning, or 'GENERAL'. */
  ruleId: string;
  type: NarrativeWarningType;
  message: string;
}

export interface NarrativeValidationResult {
  valid: boolean;
  warnings: NarrativeWarning[];
}

/**
 * Prohibited softening phrases — the system prompt explicitly forbids these
 * when a LOCKED ADJUDICATION section is present.
 */
const SOFTENING_PATTERNS =
  /\bmay appear\b|\bappears to\b|\bif accurate\b|\bmoderate vulnerability\b|\bpotential vulnerability\b|\bmay suggest\b/i;

/**
 * Validate generated narrative text against locked adjudication findings.
 *
 * Checks:
 * 1. Each finding's authority short labels are cited in the narrative
 * 2. Prohibited softening phrases are absent
 * 3. The overall risk level term appears in the narrative
 *
 * Returns `{ valid: true, warnings: [] }` when adjudication is not triggered
 * or when no issues are found.
 */
export function validateNarrative(
  narrative: string,
  adjudication: AdjudicationResult,
): NarrativeValidationResult {
  if (!adjudication.triggered) {
    return { valid: true, warnings: [] };
  }

  const warnings: NarrativeWarning[] = [];
  const textLower = narrative.toLowerCase();

  // 1. Check that at least one authority shortLabel from each finding appears
  for (const finding of adjudication.findings) {
    const hasAnyCitation = finding.authorities.some((auth) =>
      textLower.includes(auth.shortLabel.toLowerCase()),
    );
    if (!hasAnyCitation && finding.authorities.length > 0) {
      warnings.push({
        ruleId: finding.ruleId,
        type: 'missing_authority',
        message: `Finding ${finding.ruleId}: none of the required authorities (${finding.authorities.map((a) => a.shortLabel).join(', ')}) appear in the narrative.`,
      });
    }
  }

  // 2. Check for prohibited softening phrases
  const softeningMatch = SOFTENING_PATTERNS.exec(narrative);
  if (softeningMatch) {
    warnings.push({
      ruleId: 'GENERAL',
      type: 'softening_language',
      message: `Narrative contains prohibited softening language: "${softeningMatch[0]}". Locked findings should not be hedged.`,
    });
  }

  // 3. Check that overall risk level term appears
  const riskTerm = adjudication.overallRiskLevel.toLowerCase();
  if (!textLower.includes(riskTerm)) {
    warnings.push({
      ruleId: 'GENERAL',
      type: 'missing_risk_level',
      message: `The overall risk level "${adjudication.overallRiskLevel}" does not appear in the narrative.`,
    });
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}
