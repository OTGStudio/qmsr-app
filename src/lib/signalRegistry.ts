import type { QMSAreaKey } from '@/types/scenario';

export type SignalCategory =
  | 'postmarket'
  | 'manufacturing'
  | 'supplier'
  | 'software'
  | 'ai'
  | 'cybersecurity'
  | 'labeling'
  | 'clinical';

export type SignalSeverityDefault = 'low' | 'medium' | 'high';

export type SignalAppliesTo = 'premarket' | 'postmarket' | 'both';

export interface SignalDef {
  readonly key: SignalKey;
  readonly label: string;
  readonly category: SignalCategory;
  readonly severityDefault: SignalSeverityDefault;
  readonly appliesTo: SignalAppliesTo;
  readonly affectsAreas: readonly QMSAreaKey[];
  readonly tags: readonly string[];
  readonly synonyms: readonly string[];
  readonly suggestedInspectionThreads: readonly string[];
}

/** Canonical keys — stable for persistence and analysis (snake_case). */
export type SignalKey =
  | 'complaint_trend'
  | 'mdr_increase'
  | 'mdr_rising_3yr'
  | 'incoming_failures'
  | 'process_variability'
  | 'supplier_change'
  | 'recurring_capa'
  | 'recall_correction'
  | 'class_i_recall'
  | 'open_recall_action'
  | 'previous_483'
  | 'warning_letter'
  | 'udi_discrepancy'
  | 'software_anomaly'
  | 'cybersecurity_signal'
  | 'clinical_performance_drift'
  | 'death_type_mdr';

const AREAS = {
  all: ['mgmt', 'dd', 'prod', 'change', 'out', 'meas'] as const satisfies readonly QMSAreaKey[],
  measHeavy: ['meas', 'change', 'mgmt'] as const satisfies readonly QMSAreaKey[],
  ddMeas: ['dd', 'meas'] as const satisfies readonly QMSAreaKey[],
  supply: ['out', 'prod', 'meas'] as const satisfies readonly QMSAreaKey[],
} satisfies Record<string, readonly QMSAreaKey[]>;

export const SIGNAL_DEFINITIONS: readonly SignalDef[] = [
  {
    key: 'complaint_trend',
    label: 'Complaint trend',
    category: 'postmarket',
    severityDefault: 'medium',
    appliesTo: 'postmarket',
    affectsAreas: AREAS.measHeavy,
    tags: ['complaints', 'trending'],
    synonyms: ['complaint trend', 'complaints trend', 'complaint increase'],
    suggestedInspectionThreads: [
      'Complaint handling records and escalation to investigations',
      'Trend analysis linkage to CAPA and design changes',
    ],
  },
  {
    key: 'mdr_increase',
    label: 'MDR increase',
    category: 'postmarket',
    severityDefault: 'high',
    appliesTo: 'postmarket',
    affectsAreas: AREAS.measHeavy,
    tags: ['mdr', 'adverse events'],
    synonyms: ['mdr', 'maude', 'adverse event increase'],
    suggestedInspectionThreads: [
      'MDR decision-making and reportability determinations',
      'MDR trending and feedback into CAPA and risk management',
    ],
  },
  {
    key: 'mdr_rising_3yr',
    label: 'MDR — rising 3-year trend',
    category: 'postmarket',
    severityDefault: 'high',
    appliesTo: 'postmarket',
    affectsAreas: AREAS.measHeavy,
    tags: ['mdr', 'trend'],
    synonyms: ['rising mdr', 'mdr trend', 'mdr rising'],
    suggestedInspectionThreads: [
      'Statistical trending of MDRs vs production and complaint volume',
      'Corrective actions tied to sustained adverse event patterns',
    ],
  },
  {
    key: 'incoming_failures',
    label: 'Incoming failures',
    category: 'manufacturing',
    severityDefault: 'medium',
    appliesTo: 'both',
    affectsAreas: ['prod', 'out', 'meas'],
    tags: ['iqc', 'supplier incoming'],
    synonyms: ['incoming inspection failures', 'incoming quality'],
    suggestedInspectionThreads: [
      'Incoming inspection sampling and nonconforming material control',
      'Supplier corrective actions for repeated incoming issues',
    ],
  },
  {
    key: 'process_variability',
    label: 'Process variability',
    category: 'manufacturing',
    severityDefault: 'medium',
    appliesTo: 'both',
    affectsAreas: ['prod', 'change', 'meas'],
    tags: ['process', 'capability'],
    synonyms: ['process variation', 'manufacturing variability'],
    suggestedInspectionThreads: [
      'Process validation maintenance and change control',
      'SPC / monitoring evidence for critical processes',
    ],
  },
  {
    key: 'supplier_change',
    label: 'Supplier change',
    category: 'supplier',
    severityDefault: 'medium',
    appliesTo: 'both',
    affectsAreas: AREAS.supply,
    tags: ['supplier', 'purchasing'],
    synonyms: ['supplier changes', 'critical supplier change'],
    suggestedInspectionThreads: [
      'Supplier change evaluation and re-qualification',
      'Purchasing controls and approved supplier records',
    ],
  },
  {
    key: 'recurring_capa',
    label: 'Recurring CAPA',
    category: 'postmarket',
    severityDefault: 'high',
    appliesTo: 'postmarket',
    affectsAreas: ['meas', 'change', 'mgmt'],
    tags: ['capa', 'recurrence'],
    synonyms: ['repeat capa', 'recurring corrective action'],
    suggestedInspectionThreads: [
      'CAPA effectiveness checks and root cause verification',
      'Escalation when similar issues recur across product lines',
    ],
  },
  {
    key: 'recall_correction',
    label: 'Recall / correction',
    category: 'postmarket',
    severityDefault: 'high',
    appliesTo: 'postmarket',
    affectsAreas: ['change', 'meas', 'mgmt'],
    tags: ['recall', 'correction'],
    synonyms: ['recall', 'field correction', 'fsca'],
    suggestedInspectionThreads: [
      'Corrections and removals decision records',
      'Distribution records and execution of corrections',
    ],
  },
  {
    key: 'class_i_recall',
    label: 'Class I recall',
    category: 'postmarket',
    severityDefault: 'high',
    appliesTo: 'postmarket',
    affectsAreas: ['change', 'meas', 'mgmt'],
    tags: ['recall', 'class i'],
    synonyms: ['class 1 recall', 'class one recall'],
    suggestedInspectionThreads: [
      'Recall classification rationale and health hazard evaluation',
      'Remediation design changes and verification',
    ],
  },
  {
    key: 'open_recall_action',
    label: 'Open recall action',
    category: 'postmarket',
    severityDefault: 'high',
    appliesTo: 'postmarket',
    affectsAreas: ['meas', 'change'],
    tags: ['recall', 'open'],
    synonyms: ['open recall', 'ongoing recall'],
    suggestedInspectionThreads: [
      'Open recall status monitoring and closure criteria',
      'Linkage to CAPA and management review',
    ],
  },
  {
    key: 'previous_483',
    label: 'Previous 483 observation',
    category: 'postmarket',
    severityDefault: 'medium',
    appliesTo: 'postmarket',
    affectsAreas: ['mgmt', 'meas'],
    tags: ['483', 'inspection'],
    synonyms: ['483', 'form 483', 'inspection observation'],
    suggestedInspectionThreads: [
      'Prior inspection commitments and evidence of implementation',
      'CAPA tied to inspection observations',
    ],
  },
  {
    key: 'warning_letter',
    label: 'Warning letter / consent decree',
    category: 'postmarket',
    severityDefault: 'high',
    appliesTo: 'postmarket',
    affectsAreas: ['mgmt', 'meas'],
    tags: ['enforcement', 'warning letter'],
    synonyms: ['warning letter', 'consent decree', 'regulatory action'],
    suggestedInspectionThreads: [
      'Ongoing obligations from enforcement correspondence',
      'Evidence of sustainable corrective action',
    ],
  },
  {
    key: 'udi_discrepancy',
    label: 'UDI discrepancy',
    category: 'labeling',
    severityDefault: 'medium',
    appliesTo: 'postmarket',
    affectsAreas: ['prod', 'change', 'meas'],
    tags: ['udi', 'labeling'],
    synonyms: ['udi mismatch', 'udi error', 'labeling discrepancy'],
    suggestedInspectionThreads: [
      'UDI assignment and label vs DMR consistency',
      'Label change control and artwork verification',
    ],
  },
  {
    key: 'software_anomaly',
    label: 'Software anomaly',
    category: 'software',
    severityDefault: 'high',
    appliesTo: 'both',
    affectsAreas: AREAS.ddMeas,
    tags: ['software', '62304'],
    synonyms: ['software defect', 'software bug', 'anomaly'],
    suggestedInspectionThreads: [
      'Software anomaly handling and problem resolution per lifecycle',
      'Regression testing evidence for software changes',
    ],
  },
  {
    key: 'cybersecurity_signal',
    label: 'Cybersecurity signal',
    category: 'cybersecurity',
    severityDefault: 'high',
    appliesTo: 'both',
    affectsAreas: ['dd', 'change', 'meas'],
    tags: ['cyber', '524b'],
    synonyms: ['cybersecurity', 'security vulnerability', 'cyber signal'],
    suggestedInspectionThreads: [
      'Coordinated vulnerability disclosure and patching under change control',
      'Threat modeling and secure design evidence',
    ],
  },
  {
    key: 'clinical_performance_drift',
    label: 'Clinical / performance drift',
    category: 'clinical',
    severityDefault: 'high',
    appliesTo: 'both',
    affectsAreas: AREAS.ddMeas,
    tags: ['clinical', 'performance', 'drift'],
    synonyms: ['performance drift', 'clinical drift', 'model drift'],
    suggestedInspectionThreads: [
      'Real-world performance monitoring vs validation claims',
      'Design changes driven by performance or clinical feedback',
    ],
  },
  {
    key: 'death_type_mdr',
    label: 'Death-type MDR reports',
    category: 'postmarket',
    severityDefault: 'high',
    appliesTo: 'postmarket',
    affectsAreas: ['meas', 'dd', 'mgmt'],
    tags: ['mdr', 'death'],
    synonyms: ['death mdr', 'death reports'],
    suggestedInspectionThreads: [
      'Investigations and reportability for serious outcomes',
      'Risk file updates after death-related events',
    ],
  },
] as const satisfies readonly SignalDef[];

const DEF_BY_KEY: ReadonlyMap<SignalKey, SignalDef> = new Map(
  SIGNAL_DEFINITIONS.map((d) => [d.key, d]),
);

const DEF_BY_LABEL_LOWER: ReadonlyMap<string, SignalDef> = new Map(
  SIGNAL_DEFINITIONS.map((d) => [d.label.toLowerCase().trim(), d]),
);

function normalizeForMatch(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[—–]/g, '-');
}

export function getSignalDefByKey(key: string): SignalDef | undefined {
  return DEF_BY_KEY.get(key as SignalKey);
}

export function getSignalDefByLabel(label: string): SignalDef | undefined {
  const direct = DEF_BY_LABEL_LOWER.get(label.trim().toLowerCase());
  if (direct) return direct;
  const norm = normalizeForMatch(label);
  for (const d of SIGNAL_DEFINITIONS) {
    if (normalizeForMatch(d.label) === norm) return d;
    for (const syn of d.synonyms) {
      if (normalizeForMatch(syn) === norm) return d;
    }
  }
  return undefined;
}

export function normalizeSignal(input: string): {
  matched: boolean;
  key?: SignalKey;
  normalizedLabel?: string;
  reason?: string;
} {
  const trimmed = input.trim();
  if (!trimmed) {
    return { matched: false, reason: 'empty' };
  }

  const asKey = getSignalDefByKey(trimmed);
  if (asKey) {
    return { matched: true, key: asKey.key, normalizedLabel: asKey.label };
  }

  const byLabel = getSignalDefByLabel(trimmed);
  if (byLabel) {
    return { matched: true, key: byLabel.key, normalizedLabel: byLabel.label };
  }

  return { matched: false, reason: 'unknown_signal' };
}

export function normalizeSignals(inputs: string[]): {
  canonical: SignalKey[];
  rejected: string[];
  warnings: string[];
} {
  const seen = new Set<SignalKey>();
  const rejected: string[] = [];
  const warnings: string[] = [];

  for (const raw of inputs) {
    const n = normalizeSignal(raw);
    if (n.matched && n.key) {
      if (!seen.has(n.key)) {
        seen.add(n.key);
      } else {
        warnings.push(`Duplicate normalized signal skipped: ${n.normalizedLabel ?? n.key}`);
      }
    } else if (raw.trim()) {
      rejected.push(raw.trim());
    }
  }

  return { canonical: [...seen], rejected, warnings };
}

/** Display order for pills — matches legacy SIGNALS order. */
export const SIGNAL_KEYS_ORDER: readonly SignalKey[] = SIGNAL_DEFINITIONS.map((d) => d.key);

export function isSignalKey(value: string): value is SignalKey {
  return DEF_BY_KEY.has(value as SignalKey);
}

export function signalLabel(key: SignalKey): string {
  return DEF_BY_KEY.get(key)?.label ?? key;
}

/** True if this signal is usually meaningful only after US marketing. */
export function isPostmarketOnlySignal(key: SignalKey): boolean {
  const d = DEF_BY_KEY.get(key);
  return d?.appliesTo === 'postmarket';
}

export function signalAffectsArea(key: SignalKey, area: QMSAreaKey): boolean {
  const d = DEF_BY_KEY.get(key);
  return d ? d.affectsAreas.includes(area) : false;
}

export function hasSignal(keys: readonly SignalKey[] | undefined, key: SignalKey): boolean {
  return keys?.includes(key) ?? false;
}

export function hasAnySignal(keys: readonly SignalKey[] | undefined, check: readonly SignalKey[]): boolean {
  if (!keys?.length) return false;
  return check.some((k) => keys.includes(k));
}

export type SignalSeverityLevel = 'low' | 'medium' | 'high';

export function getSignalSeveritySummary(keys: readonly SignalKey[] | undefined): {
  level: SignalSeverityLevel;
  highCount: number;
  mediumCount: number;
  lowCount: number;
} {
  if (!keys?.length) {
    return { level: 'low', highCount: 0, mediumCount: 0, lowCount: 0 };
  }
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  for (const k of keys) {
    const d = DEF_BY_KEY.get(k);
    if (!d) continue;
    if (d.severityDefault === 'high') highCount += 1;
    else if (d.severityDefault === 'medium') mediumCount += 1;
    else lowCount += 1;
  }
  let level: SignalSeverityLevel = 'low';
  if (highCount >= 1) level = 'high';
  else if (mediumCount >= 2) level = 'high';
  else if (mediumCount >= 1) level = 'medium';

  return { level, highCount, mediumCount, lowCount };
}

/** Premarket inspection types that should warn on strong recall/MDR-style signals. */
export const PREMARKET_RECALL_PATTERN_KEYS: readonly SignalKey[] = [
  'recall_correction',
  'class_i_recall',
  'open_recall_action',
  'mdr_increase',
  'mdr_rising_3yr',
  'death_type_mdr',
];

export const POSTMARKET_ONLY_SIGNAL_KEYS: readonly SignalKey[] = SIGNAL_DEFINITIONS.filter(
  (d) => d.appliesTo === 'postmarket',
).map((d) => d.key);

/** Signals that satisfy “software / cyber / performance / AI-related” coverage for SW/AI devices. */
export const SW_AI_COVERAGE_SIGNAL_KEYS: readonly SignalKey[] = [
  'software_anomaly',
  'cybersecurity_signal',
  'clinical_performance_drift',
  'mdr_increase',
  'mdr_rising_3yr',
  'complaint_trend',
  'death_type_mdr',
];
