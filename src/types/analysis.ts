import type { SignalKey } from '@/lib/signalRegistry';
import type { InspectionType, QMSAreaKey, ScenarioRatings } from './scenario';

/** Inputs required by `buildFocus` and `buildRiskThread` (pure analysis layer). */
export interface AnalysisContext {
  inspType: InspectionType;
  marketedUS: boolean;
  ratings: ScenarioRatings;
  areaNotes: Record<QMSAreaKey, string>;
  risk: string;
  signals: SignalKey[];
  aiEnabled: boolean;
  swEnabled: boolean;
  cyberEnabled: boolean;
  pccpPlanned: boolean;
  pathway: 'standard' | 'denovo';
  manualClass: '1' | '2' | '3' | 'F' | 'U';
  classSource: 'manual' | 'lookup';
  deviceClass?: string;
  productCode: string;
  regulationNum: string;
}

export interface AreaFocus {
  key: QMSAreaKey;
  bullets: string[];
}

export interface ThreadArea {
  label: string;
  questions: string[];
}

export interface RiskThread {
  entry: QMSAreaKey;
  sequence: QMSAreaKey[];
  threads: Record<QMSAreaKey, ThreadArea>;
  investigatorQuestion: string;
}

export type OAILevel = 'high' | 'medium' | 'low';

export interface OAIFactor {
  level: OAILevel;
  reason: string;
}

export interface OAIFactors {
  systemic: OAIFactor;
  impact: OAIFactor;
  detect: OAIFactor;
  pattern: string;
  patternTone: 'warn' | 'partial' | 'good';
}

export interface ReadinessSummary {
  label: string;
  tone: 'warn' | 'partial' | 'good';
  note: string | null;
}

/** Inputs for `buildOAIFactors` — ratings, risk text, triangulated flags, and classification context. */
export interface OAIContext {
  ratings: ScenarioRatings;
  risk: string;
  flags: FlagItem[];
  manualClass: '1' | '2' | '3' | 'F' | 'U';
  deviceClass?: string;
  aiEnabled: boolean;
  cyberEnabled: boolean;
  swEnabled: boolean;
}

/** Inputs for `getOverallReadiness` — inspection model and self-ratings vs flags. */
export interface ReadinessContext {
  inspType: InspectionType;
  ratings: ScenarioRatings;
  flags: FlagItem[];
  /** Canonical scenario signals for deterministic weighting (optional for legacy callers). */
  signalKeys?: SignalKey[];
  /** Risk text length / content is not scored here; reserved for future use. */
  risk?: string;
  marketedUS?: boolean;
}

/** Structured narrative request — grounded facts for the Edge Function (client-built JSON). */
export interface NarrativeStructuredPayload {
  readonly version: 1;
  readonly scenarioSummary: {
    readonly name: string;
    readonly companyName: string;
    readonly productName: string;
    readonly inspType: InspectionType | undefined;
    readonly inspTypeLabel: string | null;
    readonly marketedUS: boolean;
    readonly pathway: string;
    readonly manualClass: string;
    readonly deviceClass?: string;
    readonly productCode: string;
    readonly regulationNum: string;
    readonly risk: string;
    readonly technology: {
      readonly aiEnabled: boolean;
      readonly swEnabled: boolean;
      readonly cyberEnabled: boolean;
      readonly pccpPlanned: boolean;
    };
  };
  readonly normalizedSignals: ReadonlyArray<{ readonly key: SignalKey; readonly label: string }>;
  readonly unsupportedSignalNotes: readonly string[];
  readonly fdaSummary: {
    readonly hasData: boolean;
    readonly error: string | null;
    readonly gudidUrl: string | null;
    readonly mdrByYear: Record<string, number>;
    readonly mdrTypes: Record<string, number>;
    readonly recallCount: number;
    readonly recallSample: readonly string[];
  };
  readonly triangulationFlags: ReadonlyArray<{
    readonly severity: FlagSeverity;
    readonly area: QMSAreaKey;
    readonly label: string;
    readonly detail: string;
  }>;
  readonly readinessSummary: ReadinessSummary | null;
  readonly riskThreadPreview: {
    readonly entry: QMSAreaKey;
    readonly sequence: readonly QMSAreaKey[];
  };
}

export type FlagSeverity = 'high' | 'medium' | 'low';

export interface FlagItem {
  severity: FlagSeverity;
  area: QMSAreaKey;
  label: string;
  detail: string;
}

/** Row returned by `fetchRecalls` (mapped from openFDA device recall results). */
export interface RecallItem {
  classification: string;
  status: string;
  reason: string;
  initiated: string;
  description: string;
  /** Present when openFDA returns `recall_number`. */
  recallNumber?: string;
}

/** Row returned by `fetchClassification` (mapped from openFDA device classification). */
export interface ClassificationResult {
  device_name: string;
  device_class: string;
  product_code: string;
  regulation_number: string;
  implant_flag: boolean;
  life_sustain_support_flag: boolean;
  gmp_exempt_flag: boolean;
}

/**
 * Normalized recall row aligned with openFDA device recall search payloads
 * (see https://open.fda.gov/apis/device/recall/).
 */
export interface FDARecallRecord {
  /** `recall_number` */
  recallNumber?: string;
  /** `product_code` */
  productCode?: string;
  /** `classification` (e.g. Class I / II / III) */
  classification?: string;
  /** `reason_for_recall` */
  reasonForRecall?: string;
  /** `recall_initiation_date` */
  recallInitiationDate?: string;
  /** `status` */
  status?: string;
  /** `open_status` — e.g. Open / Closed */
  openStatus?: string;
}

/**
 * Cached FDA layer: aggregated MDR counts, recall rows, GUDID link, and last error.
 */
export interface FDAData {
  /** MDR adverse-event counts keyed by calendar year (string) */
  mdr: Record<string, number>;
  /** Counts by report type or other facet (openFDA `mdr_report_key` / similar buckets) */
  mdrTypes: Record<string, number>;
  recalls: FDARecallRecord[];
  gudidUrl: string | null;
  error: string | null;
  /** Set by `fetchFDAData`: sum of yearly MDR counts */
  mdrTotal?: number;
  /** Sum of MDR counts in the last 3 calendar years in the fetched window */
  mdrRecent3yr?: number;
  /** Sum of MDR counts in the 3 calendar years immediately before the recent window */
  mdrOlder3yr?: number;
  /** Percent change of recent vs older window; null when the older sum is zero */
  mdrTrendPercent?: number | null;
}

/* ------------------------------------------------------------------ */
/*  Adjudication layer — deterministic compliance conclusions          */
/* ------------------------------------------------------------------ */

/** Tiered regulatory citation authority levels. */
export type GuardrailTier =
  | 'binding'
  | 'inspection-program'
  | 'guidance'
  | 'standard'
  | 'mdsap'
  | 'public-signal';

/** A single entry in the guardrail citation registry. */
export interface GuardrailCitation {
  readonly key: string;
  readonly title: string;
  readonly shortLabel: string;
  readonly citation: string;
  readonly url: string;
  readonly tier: GuardrailTier;
  readonly alwaysReference?: boolean;
  readonly rationale: string;
}

/** Flat boolean facts extracted from scenario text (interim regex-based). */
export interface ScenarioFacts {
  readonly supplierChange: boolean;
  readonly supplierChangeEvaluated: boolean;
  readonly biocompatibilityReevaluated: boolean;
  readonly changeClosedWithoutEscalation: boolean;

  readonly complaintTrend: boolean;
  readonly complaintsMultiple: boolean;
  readonly investigationOutcome: 'user_error' | 'other' | 'unknown';
  readonly trendAnalysisPerformed: boolean;
  readonly capaInitiated: boolean;
  readonly riskFileUpdated: boolean;

  readonly spreadsheetCriticalCalculation: boolean;
  readonly calculationErrorPostRelease: boolean;
  readonly softwareValidationPerformed: boolean;
  readonly independentReviewPerformed: boolean;

  // TC4: Design change
  readonly designChangePresent: boolean;
  readonly designVVReassessed: boolean;

  // TC5: CAPA effectiveness
  readonly capaClosedPreviously: boolean;
  readonly issueRecurred: boolean;

  // TC6: Process validation
  readonly specialProcessPresent: boolean;
  readonly processValidationDocumented: boolean;

  // TC7: Management review
  readonly managementReviewPerformed: boolean;

  // TC8: Software lifecycle
  readonly softwareLifecycleDocumented: boolean;

  // TC9: Labeling / UDI
  readonly labelingDefectPresent: boolean;
  readonly labelingChangeControlPerformed: boolean;

  // TC10: Sterility assurance
  readonly sterileDevice: boolean;
  readonly sterilityValidationComplete: boolean;
  readonly sterilityRevalidatedAfterChange: boolean;

  // TC11: Training / competency
  readonly trainingRecordsMaintained: boolean;
  readonly competencyAssessed: boolean;

  // TC12: Risk management file
  readonly riskManagementFileComplete: boolean;
  readonly riskFileUpdatedAfterChange: boolean;

  // TC13: Incoming / nonconforming / calibration
  readonly incomingFailuresRecurring: boolean;
  readonly incomingEscalated: boolean;
  readonly calibrationCurrent: boolean;
  readonly nonconformingProductControlled: boolean;
}

export type RiskLevel = 'HIGH' | 'MEDIUM-HIGH' | 'MEDIUM' | 'LOW';
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

/** A single deterministic adjudication finding. */
export interface AdjudicationFinding {
  readonly ruleId: string;
  readonly finding: string;
  readonly riskLevel: RiskLevel;
  readonly authorities: readonly GuardrailCitation[];
  readonly supportingEvidence: readonly string[];
  readonly inspectionRelevance: readonly string[];
  readonly recommendedActions: readonly string[];
  readonly qmsAreas: readonly QMSAreaKey[];
  readonly legacyCrosswalk?: readonly string[];
}

/** Technology-aware guidance routing entry. */
export interface TechnologyGuidanceEntry {
  readonly technology: 'ai' | 'software' | 'cybersecurity' | 'mdsap' | 'usp';
  readonly applies: boolean;
  readonly citations: readonly GuardrailCitation[];
  readonly narrativeHint: string;
}

/** Complete adjudication result (may be empty when no rules fire). */
export interface AdjudicationResult {
  readonly triggered: boolean;
  readonly overallRiskLevel: RiskLevel;
  readonly confidenceLevel: ConfidenceLevel;
  readonly findings: readonly AdjudicationFinding[];
  readonly technologyGuidance: readonly TechnologyGuidanceEntry[];
  readonly narrativeProhibitions: readonly string[];
  readonly bindingBasis: readonly GuardrailCitation[];
  readonly inspectionLens: readonly GuardrailCitation[];
  readonly fdaSignalLimitations: readonly string[];
}

/** Version 2 payload — extends version 1 with adjudication. */
export interface NarrativeStructuredPayloadV2 extends Omit<NarrativeStructuredPayload, 'version'> {
  readonly version: 2;
  readonly adjudication: AdjudicationResult;
}

/** Union type accepted by buildNarrativeUserMessage. */
export type NarrativePayloadVersioned = NarrativeStructuredPayload | NarrativeStructuredPayloadV2;
