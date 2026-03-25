import type { ScenarioFacts } from '@/types/analysis';
import type { Scenario } from '@/types/scenario';

/**
 * Concatenates scenario text fields into a single lowercase search bank.
 * Used for regex-based fact extraction (fallback approach).
 */
function textBank(scenario: Scenario): string {
  return [
    scenario.risk,
    scenario.signals.join(' '),
    ...Object.values(scenario.areaNotes ?? {}),
    scenario.notes ?? '',
  ]
    .join(' | ')
    .toLowerCase();
}

/**
 * Regex-based fact extraction from scenario text fields.
 * Used as fallback when explicit scenarioFacts are not set.
 */
function extractFromText(scenario: Scenario): ScenarioFacts {
  const t = textBank(scenario);

  // --- TC1: Supplier / material change ---
  const supplierChange = /supplier.*change|material change|component change/.test(t);
  const supplierChangeEvaluated =
    !supplierChange ||
    !/no update performed|not evaluated|without evaluation|no impact assessment/.test(t);
  const biocompatibilityReevaluated =
    !supplierChange || !/biocompatibility.*not re-?evaluated|not re-?evaluated/.test(t);
  const changeClosedWithoutEscalation = /closed without escalation|no escalation/.test(t);

  // --- TC2: Complaint handling ---
  const complaintTrend = /complaint trend|multiple complaints|repeated complaints/.test(t);
  const complaintsMultiple = /multiple complaints|repeated complaints|complaint trend/.test(t);
  const investigationOutcome: ScenarioFacts['investigationOutcome'] = /user error/.test(t)
    ? 'user_error'
    : /investigation outcome/.test(t)
      ? 'other'
      : 'unknown';
  const trendAnalysisPerformed =
    !/trend analysis: not performed|trend analysis not performed|no trend analysis/.test(t);
  const capaInitiated =
    !/capa: not initiated|no capa initiated|capa not initiated/.test(t);
  const riskFileUpdated =
    !/risk file: not updated|risk file not updated|risk management.*not updated/.test(t);

  // --- TC3: Spreadsheet / data integrity ---
  const spreadsheetCriticalCalculation = /spreadsheet|excel/.test(t);
  const calculationErrorPostRelease = /rounding error|post-release|post release/.test(t);
  const softwareValidationPerformed =
    !/software validation: not performed|validation not performed/.test(t);
  const independentReviewPerformed =
    !/no independent review|without independent review/.test(t);

  // --- TC4: Design change ---
  const designChangePresent = /design change|design modification|design revision/.test(t);
  const designVVReassessed =
    !designChangePresent ||
    !/v&v not|verification.*not reassessed|validation.*not reassessed|v&v.*not performed|no v&v/.test(t);

  // --- TC5: CAPA effectiveness ---
  const capaClosedPreviously = /capa.*closed|capa completed|capa.*closure/.test(t);
  const issueRecurred =
    capaClosedPreviously &&
    /recur|same issue|repeat.*issue|similar.*issue|issue.*reappear/.test(t);

  // --- TC6: Process validation ---
  const specialProcessPresent = /steriliz|weld|seal|special process|solder|bond|coating/.test(t);
  const processValidationDocumented =
    !specialProcessPresent ||
    !/process validation.*not|not validated|validation.*not documented|no process validation/.test(t);

  // --- TC7: Management review ---
  const managementReviewPerformed =
    !/management review.*not performed|no management review|management review.*not documented/.test(t);

  // --- TC8: Software lifecycle ---
  const softwareLifecycleDocumented =
    !/software lifecycle.*not|no software lifecycle|lifecycle.*not maintained|lifecycle.*not documented/.test(t);

  return {
    supplierChange,
    supplierChangeEvaluated,
    biocompatibilityReevaluated,
    changeClosedWithoutEscalation,
    complaintTrend,
    complaintsMultiple,
    investigationOutcome,
    trendAnalysisPerformed,
    capaInitiated,
    riskFileUpdated,
    spreadsheetCriticalCalculation,
    calculationErrorPostRelease,
    softwareValidationPerformed,
    independentReviewPerformed,
    designChangePresent,
    designVVReassessed,
    capaClosedPreviously,
    issueRecurred,
    specialProcessPresent,
    processValidationDocumented,
    managementReviewPerformed,
    softwareLifecycleDocumented,
  };
}

/**
 * Extract structured facts from a scenario.
 *
 * When `scenario.scenarioFacts` contains explicit values (set via wizard controls),
 * those take precedence. Undefined/unset fields fall back to regex-based text extraction.
 * When `scenarioFacts` is null or undefined, full regex fallback is used (legacy behavior).
 */
export function extractScenarioFacts(scenario: Scenario): ScenarioFacts {
  const regexFacts = extractFromText(scenario);
  const explicit = scenario.scenarioFacts;

  if (!explicit) return regexFacts;

  return {
    supplierChange: explicit.supplierChange ?? regexFacts.supplierChange,
    supplierChangeEvaluated: explicit.supplierChangeEvaluated ?? regexFacts.supplierChangeEvaluated,
    biocompatibilityReevaluated:
      explicit.biocompatibilityReevaluated ?? regexFacts.biocompatibilityReevaluated,
    changeClosedWithoutEscalation:
      explicit.changeClosedWithoutEscalation ?? regexFacts.changeClosedWithoutEscalation,
    complaintTrend: explicit.complaintTrend ?? regexFacts.complaintTrend,
    complaintsMultiple: explicit.complaintsMultiple ?? regexFacts.complaintsMultiple,
    investigationOutcome: explicit.investigationOutcome ?? regexFacts.investigationOutcome,
    trendAnalysisPerformed: explicit.trendAnalysisPerformed ?? regexFacts.trendAnalysisPerformed,
    capaInitiated: explicit.capaInitiated ?? regexFacts.capaInitiated,
    riskFileUpdated: explicit.riskFileUpdated ?? regexFacts.riskFileUpdated,
    spreadsheetCriticalCalculation:
      explicit.spreadsheetCriticalCalculation ?? regexFacts.spreadsheetCriticalCalculation,
    calculationErrorPostRelease:
      explicit.calculationErrorPostRelease ?? regexFacts.calculationErrorPostRelease,
    softwareValidationPerformed:
      explicit.softwareValidationPerformed ?? regexFacts.softwareValidationPerformed,
    independentReviewPerformed:
      explicit.independentReviewPerformed ?? regexFacts.independentReviewPerformed,
    designChangePresent: explicit.designChangePresent ?? regexFacts.designChangePresent,
    designVVReassessed: explicit.designVVReassessed ?? regexFacts.designVVReassessed,
    capaClosedPreviously: explicit.capaClosedPreviously ?? regexFacts.capaClosedPreviously,
    issueRecurred: explicit.issueRecurred ?? regexFacts.issueRecurred,
    specialProcessPresent: explicit.specialProcessPresent ?? regexFacts.specialProcessPresent,
    processValidationDocumented:
      explicit.processValidationDocumented ?? regexFacts.processValidationDocumented,
    managementReviewPerformed:
      explicit.managementReviewPerformed ?? regexFacts.managementReviewPerformed,
    softwareLifecycleDocumented:
      explicit.softwareLifecycleDocumented ?? regexFacts.softwareLifecycleDocumented,
  };
}
