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
