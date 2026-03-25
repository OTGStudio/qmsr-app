import { buildAdjudication } from '@/lib/adjudication';
import { AREA_ORDER, ITYPES, QMS_AREAS, isPremarket } from '@/lib/domain';
import { getSignalSeveritySummary, hasAnySignal, signalLabel } from '@/lib/signalRegistry';
import type {
  AnalysisContext,
  FDAData,
  FDARecallRecord,
  FlagItem,
  FlagSeverity,
  NarrativePayloadVersioned,
  NarrativeStructuredPayload,
  NarrativeStructuredPayloadV2,
  OAIFactors,
  OAIContext,
  ReadinessContext,
  ReadinessSummary,
  RiskThread,
  ThreadArea,
} from '@/types/analysis';
import type { InspectionType, QMSAreaKey, Scenario } from '@/types/scenario';

/** Map a saved scenario into analysis-layer context (defaults inspection type for legacy rows). */
export function scenarioToAnalysisContext(scenario: Scenario): AnalysisContext {
  return {
    inspType: scenario.inspType ?? 'baseline',
    marketedUS: scenario.marketedUS,
    ratings: scenario.ratings,
    areaNotes: scenario.areaNotes,
    risk: scenario.risk,
    signals: scenario.signals,
    aiEnabled: scenario.aiEnabled,
    swEnabled: scenario.swEnabled,
    cyberEnabled: scenario.cyberEnabled,
    pccpPlanned: scenario.pccpPlanned,
    pathway: scenario.pathway,
    manualClass: scenario.manualClass,
    classSource: scenario.classSource,
    deviceClass: scenario.deviceClass,
    productCode: scenario.productCode,
    regulationNum: scenario.regulationNum,
  };
}

/** From 05-domain.mdc — do not change keys or targets. */
const ENTRY_MAP: Record<InspectionType, QMSAreaKey> = {
  forcause: 'meas',
  compliance: 'meas',
  nonBaseline: 'meas',
  spra: 'dd',
  baseline: 'mgmt',
  pmaPre: 'dd',
  pmaPost: 'meas',
  premarketReview: 'dd',
};

const MODEL_1_SEQUENCES: Partial<Record<InspectionType, QMSAreaKey[]>> = {
  forcause: ['meas', 'change', 'dd', 'mgmt'],
  compliance: ['meas', 'change', 'dd', 'mgmt'],
  nonBaseline: ['meas', 'dd', 'change', 'mgmt'],
  spra: ['dd', 'prod', 'change', 'meas'],
  pmaPost: ['meas', 'change', 'dd', 'mgmt'],
};

const BASELINE_M2: readonly QMSAreaKey[] = ['mgmt', 'dd', 'prod', 'change', 'out', 'meas'];
const OTHER_M2: readonly QMSAreaKey[] = ['dd', 'prod', 'change', 'out', 'meas', 'mgmt'];

const SAFETY_KEYWORD_RE =
  /safety|harm|death|injury|malfunction|fail|drift|error|contamin|steril|bias|fracture|fatigue|implant|surgical|orthopedic|stapler|structural|rupture|perforation/i;

const STERILE_RE = /steril|sterility|aseptic|barrier/i;
const LABEL_RE = /label|ifu|udi|instruction/i;
const MECHANICAL_RE = /mechanical|fracture|fatigue|implant|orthopedic|load-bearing|structural|plate|screw|nail/i;

function areaLabel(key: QMSAreaKey): string {
  const row = QMS_AREAS.find((a) => a.key === key);
  return row?.label ?? key;
}

function getSequence(inspType: InspectionType): QMSAreaKey[] {
  if (ITYPES[inspType].model === 2) {
    return inspType === 'baseline' ? [...BASELINE_M2] : [...OTHER_M2];
  }
  const seq = MODEL_1_SEQUENCES[inspType];
  return seq ? [...seq] : ['meas', 'dd', 'change', 'mgmt'];
}

function countRating(
  ratings: OAIContext['ratings'] | ReadinessContext['ratings'],
  value: 'weak' | 'unknown' | 'partial',
): number {
  return AREA_ORDER.filter((k) => ratings[k] === value).length;
}

function countFlagsBySeverity(flags: FlagItem[], severity: FlagSeverity): number {
  return flags.filter((f) => f.severity === severity).length;
}

function isClassIII(deviceClass: string): boolean {
  const d = deviceClass.trim();
  return d === '3' || /^class\s*iii$/i.test(d) || d === 'III';
}

function isHde(deviceClass: string): boolean {
  return deviceClass.trim().toUpperCase() === 'F' || /^hde$/i.test(deviceClass.trim());
}

function parseRecallDate(rec: FDARecallRecord): number | null {
  const raw = rec.recallInitiationDate?.trim();
  if (!raw) return null;
  if (/^\d{8}$/.test(raw)) {
    const y = Number(raw.slice(0, 4));
    const m = Number(raw.slice(4, 6)) - 1;
    const day = Number(raw.slice(6, 8));
    return new Date(y, m, day).getTime();
  }
  const t = Date.parse(raw);
  return Number.isNaN(t) ? null : t;
}

function isRecentRecall(rec: FDARecallRecord, withinMs: number): boolean {
  const t = parseRecallDate(rec);
  if (t === null) return false;
  return Date.now() - t <= withinMs;
}

function isOpenRecall(rec: FDARecallRecord): boolean {
  const os = rec.openStatus?.toLowerCase() ?? '';
  const st = rec.status?.toLowerCase() ?? '';
  return os.includes('open') || st.includes('open');
}

function isClassIRecall(rec: FDARecallRecord): boolean {
  const c = rec.classification?.toLowerCase() ?? '';
  return c.includes('class i') || c.includes('class 1') || c === '1' || c.includes('i');
}

function mdrYearKeys(mdr: Record<string, number>): number[] {
  return Object.keys(mdr)
    .map((y) => Number(y))
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
}

function mdrTrendRatio(mdr: Record<string, number>): number | null {
  const years = mdrYearKeys(mdr);
  if (years.length < 2) return null;
  const recentYears = years.slice(-3);
  const priorYears = years.slice(-6, -3);
  if (priorYears.length === 0) {
    const y0 = years[0];
    const y1 = years[years.length - 1];
    const a = mdr[String(y0)] ?? 0;
    const b = mdr[String(y1)] ?? 0;
    if (a === 0) return b > 0 ? 1 : 0;
    return (b - a) / a;
  }
  const recent = recentYears.reduce((s, y) => s + (mdr[String(y)] ?? 0), 0);
  const prior = priorYears.reduce((s, y) => s + (mdr[String(y)] ?? 0), 0);
  if (prior === 0) return recent > 0 ? 1 : 0;
  return (recent - prior) / prior;
}

function totalMdr(mdr: Record<string, number>): number {
  return Object.values(mdr).reduce((a, b) => a + b, 0);
}

function deathTypeCount(mdrTypes: Record<string, number>): number {
  let n = 0;
  for (const [k, v] of Object.entries(mdrTypes)) {
    if (/death/i.test(k)) n += v;
  }
  return n;
}

function fdaRowsEmpty(data: FDAData): boolean {
  return Object.keys(data.mdr).length === 0 && data.recalls.length === 0;
}

function baseBullets(areaKey: QMSAreaKey, premarket: boolean): string[] {
  switch (areaKey) {
    case 'mgmt':
      return premarket
        ? [
            'Demonstrate management review of QMS adequacy for the device under review.',
            'Show the Medical Device File (or equivalent) is established and accessible for the inspection scope.',
            'Evidence planning of product realization and resource allocation for design transfer and validation.',
          ]
        : [
            'Demonstrate management review of quality system performance using appropriate data (complaints, feedback, audits).',
            'Show oversight of CAPA, complaints, and postmarket surveillance for marketed devices.',
            'Trace management responsibility for Medical Device File completeness and device history.',
          ];
    case 'dd':
      return premarket
        ? [
            'Trace design inputs and outputs to intended use, risk management, and applicable standards.',
            'Provide design verification and validation evidence (including software where applicable).',
            'Demonstrate readiness for design transfer to manufacturing and controlled design changes.',
          ]
        : [
            'Review design change control for marketed devices and linkage to risk files.',
            'Assess complaint and MDR feedback loops into design changes where applicable.',
            'Verify software lifecycle records (SRS, testing, release) for software-enabled devices.',
          ];
    case 'prod':
      return premarket
        ? [
            'Demonstrate process validation and monitoring for critical manufacturing and service processes.',
            'Show production controls, equipment qualification, and environmental controls as applicable.',
            'Evidence identification and traceability from incoming materials to finished device.',
          ]
        : [
            'Review batch/lot records and nonconforming product control for marketed product.',
            'Assess process validation maintenance after changes and revalidation triggers.',
            'Verify control of monitoring and measuring equipment used for product acceptance.',
          ];
    case 'change':
      return premarket
        ? [
            'Demonstrate change evaluation for design and process changes prior to market release.',
            'Show impact analysis and linkage to validation, risk management, and regulatory filings.',
            'Evidence controlled implementation and effectiveness review for changes.',
          ]
        : [
            'Review postmarket change control including supplier changes and field actions.',
            'Assess communication with FDA for reportable changes and corrections.',
            'Verify change records tie to DHF/DMR updates and training.',
          ];
    case 'out':
      return premarket
        ? [
            'Demonstrate supplier evaluation and selection criteria for critical suppliers and outsourced processes.',
            'Show purchasing controls and quality agreements for critical components.',
            'Evidence traceability of outsourced activities and incoming inspection.',
          ]
        : [
            'Review supplier monitoring, scorecards, and corrective action for quality issues.',
            'Assess purchasing data used to approve product release.',
            'Verify control of changes at suppliers and notification requirements.',
          ];
    case 'meas':
      return premarket
        ? [
            'Demonstrate planned design validation and verification evidence for performance and safety.',
            'Show internal audit program readiness and trending of quality metrics pre-commercialization.',
            'Evidence CAPA process readiness and management of nonconformities during development.',
          ]
        : [
            'Review complaint handling, trending, and escalation to MDR where applicable.',
            'Assess MDR and adverse event reporting processes and timeliness.',
            'Verify CAPA effectiveness checks and recall readiness procedures.',
          ];
  }
}

function overlayBullets(areaKey: QMSAreaKey, context: AnalysisContext): string[] {
  const out: string[] = [];
  const { aiEnabled, swEnabled, cyberEnabled, pccpPlanned, risk } = context;
  const r = risk.toLowerCase();

  if ((swEnabled || aiEnabled) && (areaKey === 'dd' || areaKey === 'change' || areaKey === 'prod')) {
    out.push(
      'Software: expect IEC 62304-aligned software lifecycle records, anomaly handling, and release controls.',
    );
  }
  if (aiEnabled && areaKey === 'mgmt') {
    out.push(
      'AI/ML: expect management oversight of AI governance, model validation, and change control for algorithm updates.',
    );
  }
  if (aiEnabled && (areaKey === 'dd' || areaKey === 'meas' || areaKey === 'change')) {
    out.push(
      'AI/ML: expect model development records, training/validation data controls, and change management for model updates.',
    );
  }
  if (cyberEnabled && (areaKey === 'dd' || areaKey === 'change' || areaKey === 'meas')) {
    out.push(
      'Cybersecurity (524B): expect threat modeling, secure design, SBOM considerations, and vulnerability management records.',
    );
  }
  if (pccpPlanned && areaKey === 'change') {
    out.push(
      'Predetermined Change Control Plan (PCCP): expect documented predetermined changes, verification/validation strategy, and FDA interaction for applicable AI-DSF changes.',
    );
  }

  const sigs = context.signals;
  if (areaKey === 'meas') {
    if (hasAnySignal(sigs, ['complaint_trend', 'mdr_increase', 'mdr_rising_3yr', 'death_type_mdr'])) {
      out.push(
        'Signals: scenario-selected complaint/MDR threads — expect complaint records, trending, and MDR decision-making evidence.',
      );
    }
    if (hasAnySignal(sigs, ['recall_correction', 'class_i_recall', 'open_recall_action'])) {
      out.push(
        'Signals: recall/correction threads — expect corrections and removals records, distribution control, and CAPA linkage.',
      );
    }
  }
  if (areaKey === 'change' && hasAnySignal(sigs, ['supplier_change', 'recurring_capa'])) {
    out.push('Signals: supplier or recurring CAPA stress — emphasize change evaluation and effectiveness verification.');
  }
  if (areaKey === 'dd' && hasAnySignal(sigs, ['software_anomaly', 'cybersecurity_signal', 'clinical_performance_drift'])) {
    out.push(
      'Signals: software/cyber/performance drift — tie design outputs, verification, and risk file updates to the stated signal.',
    );
  }

  if (areaKey === 'prod') {
    if (STERILE_RE.test(r)) {
      out.push('Sterile product: emphasize sterilization validation, bioburden controls, and packaging integrity.');
    }
    if (LABEL_RE.test(r)) {
      out.push('Labeling/UDI: emphasize label controls, IFU accuracy, and UDI assignment consistency.');
    }
    if (MECHANICAL_RE.test(r)) {
      out.push('Mechanical/structural risk: emphasize mechanical testing, fatigue, and use-related hazards.');
    }
  }

  return out;
}

function userNoteBullet(areaKey: QMSAreaKey, context: AnalysisContext): string[] {
  const note = context.areaNotes[areaKey]?.trim();
  if (!note) return [];
  return [`User note — ${note}`];
}

export function buildFocus(areaKey: QMSAreaKey, context: AnalysisContext): string[] {
  const premarket = isPremarket(context.inspType, context.marketedUS);
  const bullets = [...baseBullets(areaKey, premarket)];
  return [...bullets, ...overlayBullets(areaKey, context), ...userNoteBullet(areaKey, context)];
}

function threadQuestions(areaKey: QMSAreaKey, context: AnalysisContext): string[] {
  const pm = isPremarket(context.inspType, context.marketedUS);
  const { aiEnabled, swEnabled, cyberEnabled, pccpPlanned } = context;
  const qs: string[] = [];

  switch (areaKey) {
    case 'mgmt':
      qs.push(
        pm
          ? 'How does top management ensure the QMS supports safe and effective design validation for the device under review?'
          : 'How does management review data from complaints, CAPA, and audits to drive improvement?',
      );
      qs.push('How is resource allocation documented for critical QMS activities?');
      qs.push('How does the firm ensure the Medical Device File remains current after changes?');
      break;
    case 'dd':
      qs.push(
        pm
          ? 'How are design inputs and outputs traced to risk management and intended use?'
          : 'How does the firm evaluate design changes driven by complaints or field data?',
      );
      if (swEnabled || aiEnabled) {
        qs.push('How is software verification and validation documented and released under change control?');
      }
      if (aiEnabled) {
        qs.push('How is model performance monitored and updated over time, including data drift controls?');
      }
      if (cyberEnabled) {
        qs.push('How does secure design integrate into hazard analysis and verification testing?');
      }
      break;
    case 'prod':
      qs.push(
        pm
          ? 'How are manufacturing processes validated and revalidated after changes?'
          : 'How are production records reviewed for trends and nonconformities?',
      );
      qs.push('How is identification and traceability maintained from components to finished devices?');
      if (swEnabled || aiEnabled) {
        qs.push('How is manufacturing software / tooling controlled and validated?');
      }
      break;
    case 'change':
      qs.push('How are changes evaluated for impact on risk, validation, and regulatory obligations?');
      if (pccpPlanned && aiEnabled) {
        qs.push('How does the PCCP define predetermined changes and verification for AI-enabled software?');
      }
      if (cyberEnabled) {
        qs.push('How are cybersecurity updates evaluated and released under change control?');
      }
      break;
    case 'out':
      qs.push('How are suppliers selected, monitored, and corrected when quality issues arise?');
      qs.push('How does purchasing data support release decisions?');
      break;
    case 'meas':
      if (pm) {
        qs.push('How will postmarket surveillance and complaint handling be established prior to commercial distribution?');
        qs.push('How are internal audits used to verify readiness of CAPA and improvement processes?');
      } else {
        qs.push('How are complaints trended and evaluated for reportability (e.g., MDR)?');
        qs.push('How is CAPA effectiveness verified with objective evidence?');
        qs.push('How does the firm analyze service and production data for negative trends?');
      }
      if (cyberEnabled) {
        qs.push('How are cybersecurity vulnerabilities monitored and escalated into CAPA when needed?');
      }
      break;
  }

  return qs;
}

function buildAllThreads(context: AnalysisContext): Record<QMSAreaKey, ThreadArea> {
  const threads = {} as Record<QMSAreaKey, ThreadArea>;
  for (const key of AREA_ORDER) {
    threads[key] = {
      label: areaLabel(key),
      questions: threadQuestions(key, context),
    };
  }
  return threads;
}

function investigatorQuestion(context: AnalysisContext): string {
  if (context.aiEnabled) {
    return (
      'For this AI-enabled device, how does the firm demonstrate ongoing assurance of safe and effective performance ' +
      'after deployment — including monitoring of real-world data, change control for model updates, and governance of training data and bias?'
    );
  }
  return (
    'How does management ensure corrective and preventive actions address root cause, are effective, and prevent recurrence across the QMS?'
  );
}

export function buildRiskThread(context: AnalysisContext): RiskThread {
  const entry = ENTRY_MAP[context.inspType];
  const sequence = getSequence(context.inspType);
  return {
    entry,
    sequence,
    threads: buildAllThreads(context),
    investigatorQuestion: investigatorQuestion(context),
  };
}

export function buildRecordsRequest(context: AnalysisContext): string[] {
  const pm = isPremarket(context.inspType, context.marketedUS);
  const { swEnabled, aiEnabled, cyberEnabled, pccpPlanned, inspType, risk, manualClass } = context;
  const r = risk.toLowerCase();

  const list: string[] = ['Design History File (DHF)', 'Risk Management File (ISO 14971)'];

  if (swEnabled || aiEnabled) {
    list.push('Software lifecycle records (SRS, testing, anomaly tracking, release records)');
    list.push('Software version history and configuration management records');
  }
  if (aiEnabled) {
    list.push('AI/ML training, validation, and performance monitoring records');
  }
  if (pccpPlanned && aiEnabled) {
    list.push('Predetermined Change Control Plan (PCCP) documentation');
  }
  if (cyberEnabled) {
    list.push('Cybersecurity threat model and secure design artifacts');
    list.push('Software Bill of Materials (SBOM) and vulnerability disclosure process records');
  }

  if (pm) {
    list.push('Process validation protocols and reports for manufacturing and service processes');
    list.push('Management review records supporting design transfer readiness');
  } else {
    list.push('CAPA records (including root cause and effectiveness)');
    list.push('Complaint records and complaint trending analyses');
    list.push('Management review minutes and follow-up actions');
    list.push('Device Master Record / batch production records for marketed product');
  }

  const classiiiOrHighRiskSupplier =
    manualClass === '3' ||
    /fracture|orthopedic|implant|surgical/i.test(r) ||
    /\bclass\s*iii\b/i.test(r);

  if (classiiiOrHighRiskSupplier) {
    list.push('Supplier qualification and audit records for critical suppliers');
  }

  if (STERILE_RE.test(r) || /steril|barrier|aseptic/i.test(r)) {
    list.push('Sterilization validation and requalification records');
  }

  if (inspType === 'compliance') {
    list.push('Prior FDA inspection records (483, if any) and commitments / responses');
    list.push('Correspondence related to warning letters or regulatory agreements (if applicable)');
  }

  return [...new Set(list)];
}

export function buildOAIFactors(context: OAIContext): OAIFactors {
  const { ratings, risk, flags, manualClass, deviceClass, aiEnabled, cyberEnabled, swEnabled } = context;
  const weakCount = countRating(ratings, 'weak');
  const highFlagCount = countFlagsBySeverity(flags, 'high');

  let systemic: OAIFactors['systemic'];
  if (highFlagCount >= 2 || weakCount >= 3 || (highFlagCount >= 1 && weakCount >= 2)) {
    systemic = {
      level: 'high',
      reason: `${weakCount} QMS area(s) rated needs work and/or ${highFlagCount} high-severity FDA signal flag(s) (self-ratings are contextual, not evidence).`,
    };
  } else if (weakCount >= 2 || highFlagCount === 1) {
    systemic = {
      level: 'medium',
      reason:
        'Weak self-ratings and/or triangulation flags suggest focus areas; confirm with objective records rather than self-assessment alone.',
    };
  } else if (weakCount === 1) {
    systemic = {
      level: 'low',
      reason: 'Single weak self-rating — secondary indicator pending corroboration.',
    };
  } else {
    systemic = { level: 'low', reason: 'Limited weak ratings and no high-severity triangulation flags.' };
  }

  const dc = (deviceClass ?? manualClass).trim();
  const classIiiOrHde = isClassIII(dc) || isHde(dc);
  const safetyHit = SAFETY_KEYWORD_RE.test(risk);

  let impact: OAIFactors['impact'];
  if ((classIiiOrHde && safetyHit) || aiEnabled || cyberEnabled) {
    impact = {
      level: 'high',
      reason:
        'High patient impact risk due to device class/HDE context with safety-relevant risk language, and/or AI or cybersecurity considerations.',
    };
  } else if (safetyHit || /implant|surgical|orthopedic|stapler/i.test(risk)) {
    impact = {
      level: 'medium',
      reason: 'Safety-related language or surgical/implant risk profile elevates potential patient impact.',
    };
  } else {
    impact = { level: 'low', reason: 'Risk statement does not emphasize acute safety harms in assessed categories.' };
  }

  const meas = ratings.meas;
  let detect: OAIFactors['detect'];
  if (meas === 'weak' || ((aiEnabled || swEnabled) && meas === 'unknown')) {
    detect = {
      level: 'high',
      reason:
        'Measurement / improvement area is weak or monitoring is not established for a software/AI device profile.',
    };
  } else if (meas === 'unknown') {
    detect = { level: 'medium', reason: 'Measurement / improvement area not self-rated — detectability uncertain.' };
  } else {
    detect = { level: 'low', reason: 'Measurement / improvement area rated partial or strong.' };
  }

  const highFactors = [systemic, impact, detect].filter((f) => f.level === 'high').length;
  const mediumFactors = [systemic, impact, detect].filter((f) => f.level === 'medium').length;

  let patternTone: OAIFactors['patternTone'];
  let pattern: string;
  if (highFactors >= 2) {
    patternTone = 'warn';
    pattern = 'Multiple high-severity OAI dimensions align — elevated likelihood of substantive inspection focus.';
  } else if (highFactors === 1 || mediumFactors >= 2) {
    patternTone = 'partial';
    pattern = 'Mixed signals across systemic, impact, and detectability — moderate inspection vulnerability.';
  } else {
    patternTone = 'good';
    pattern = 'OAI factors are comparatively balanced toward lower apparent vulnerability.';
  }

  return { systemic, impact, detect, pattern, patternTone };
}

export function getOverallReadiness(context: ReadinessContext): ReadinessSummary {
  const { inspType, ratings, flags, signalKeys = [] } = context;
  const isM2 = ITYPES[inspType].model === 2;
  const weak = countRating(ratings, 'weak');
  const unknown = countRating(ratings, 'unknown');
  const partial = countRating(ratings, 'partial');
  const highFlags = countFlagsBySeverity(flags, 'high');
  const mediumFlags = countFlagsBySeverity(flags, 'medium');
  const ss = getSignalSeveritySummary(signalKeys);

  if (highFlags >= 1) {
    return {
      label: 'High inspection vulnerability',
      tone: 'warn',
      note: 'High-severity FDA triangulation flags drive the posture; self-ratings are secondary context only.',
    };
  }

  if (ss.level === 'high') {
    return {
      label: 'High inspection vulnerability',
      tone: 'warn',
      note: 'Selected scenario signals indicate high postmarket or safety stress — confirm with records and FDA data.',
    };
  }

  if (mediumFlags >= 2 || (mediumFlags >= 1 && ss.level === 'medium')) {
    return {
      label: 'Moderate apparent vulnerability',
      tone: 'partial',
      note: 'Medium-severity FDA flags and/or scenario signals increase likely investigator focus.',
    };
  }

  if (ss.level === 'medium') {
    return {
      label: 'Moderate apparent vulnerability',
      tone: 'partial',
      note: 'Scenario signals elevate threads; self-assessment refines emphasis but does not replace evidence.',
    };
  }

  if (isM2) {
    if (weak >= 2) {
      return {
        label: 'Moderate apparent vulnerability',
        tone: 'partial',
        note: 'Self-assessment flags multiple weak areas under Model 2 breadth — confirm with objective records.',
      };
    }
    if (weak === 1) {
      return {
        label: 'Moderate apparent vulnerability',
        tone: 'partial',
        note: 'Self-assessment flags at least one weak area; triangulation and records remain primary.',
      };
    }
    if (unknown >= 1 || partial >= 1) {
      return {
        label: 'Moderate apparent vulnerability',
        tone: 'partial',
        note: 'Incomplete or partial self-assessment overlay — deterministic inputs still drive the framework.',
      };
    }
    return {
      label: 'Lower apparent vulnerability',
      tone: 'good',
      note: 'No high-severity FDA flags; scenario signals comparatively contained for the selected profile.',
    };
  }

  if (unknown >= 3) {
    return {
      label: 'Moderate apparent vulnerability',
      tone: 'partial',
      note:
        'Several QMS areas are not self-rated — overall posture is driven primarily by inspection type, risk, and signals rather than self-assessment.',
    };
  }
  if (weak >= 2) {
    return {
      label: 'Moderate apparent vulnerability',
      tone: 'partial',
      note: 'Multiple weak self-assessment areas suggest focus; triangulation flags take precedence when present.',
    };
  }
  if (weak >= 1 || partial >= 2 || mediumFlags >= 1) {
    return {
      label: 'Moderate apparent vulnerability',
      tone: 'partial',
      note: 'Some weak/partial ratings or medium-severity FDA flags increase focus areas.',
    };
  }
  return {
    label: 'Lower apparent vulnerability',
    tone: 'good',
    note: 'Deterministic inputs and triangulation suggest comparatively lower apparent vulnerability under Model 1 navigation.',
  };
}

export function triangulate(
  fdaData: FDAData | null,
  inspType: InspectionType,
  deviceClass: string,
): FlagItem[] {
  const flags: FlagItem[] = [];

  if (!fdaData) {
    return [
      {
        severity: 'low',
        area: 'meas',
        label: 'No FDA signal data loaded',
        detail: 'Pull or refresh openFDA data to strengthen triangulation.',
      },
    ];
  }

  if (fdaData.error && fdaData.error.length > 0) {
    return [
      {
        severity: 'low',
        area: 'meas',
        label: 'FDA data pull reported an error',
        detail: fdaData.error,
      },
    ];
  }

  const ratio = mdrTrendRatio(fdaData.mdr);
  if (ratio !== null && ratio > 0.25) {
    flags.push({
      severity: 'high',
      area: 'meas',
      label: 'Rising MDR trend',
      detail: `Recent MDR counts increased by ${Math.round(ratio * 100)}% versus the prior comparable period.`,
    });
  }

  const total = totalMdr(fdaData.mdr);
  if (total > 50) {
    flags.push({
      severity: 'medium',
      area: 'meas',
      label: 'Elevated MDR volume',
      detail: `Total MDR events in the analyzed window: ${total}.`,
    });
  }

  const deaths = deathTypeCount(fdaData.mdrTypes);
  if (deaths > 0) {
    flags.push({
      severity: 'high',
      area: 'meas',
      label: 'Death-type MDR reports present',
      detail: `Aggregated death-related MDR counts: ${deaths}.`,
    });
  }

  for (const rec of fdaData.recalls) {
    if (isClassIRecall(rec)) {
      flags.push({
        severity: 'high',
        area: 'change',
        label: 'Class I recall',
        detail: `Recall ${rec.recallNumber ?? 'unknown'} — Class I classification.`,
      });
      break;
    }
  }

  for (const rec of fdaData.recalls) {
    if (isOpenRecall(rec)) {
      flags.push({
        severity: 'high',
        area: 'meas',
        label: 'Open recall',
        detail: `Open recall action: ${rec.recallNumber ?? 'unknown'}.`,
      });
      break;
    }
  }

  const twoYears = 2 * 365 * 24 * 60 * 60 * 1000;
  for (const rec of fdaData.recalls) {
    if (isRecentRecall(rec, twoYears)) {
      flags.push({
        severity: 'medium',
        area: 'change',
        label: 'Recent recall',
        detail: `Recall initiated within the last two years: ${rec.recallNumber ?? 'unknown'}.`,
      });
      break;
    }
  }

  const nonPmaInspection = inspType !== 'pmaPre' && inspType !== 'pmaPost';
  if (isClassIII(deviceClass) && nonPmaInspection) {
    flags.push({
      severity: 'medium',
      area: 'dd',
      label: 'Class III device under non-PMA inspection context',
      detail: 'Design controls and clinical/performance evidence may receive heightened scrutiny.',
    });
  }

  if (flags.length === 0 && fdaRowsEmpty(fdaData)) {
    flags.push({
      severity: 'low',
      area: 'meas',
      label: 'No FDA signal data found',
      detail: 'No MDR or recall rows returned for the current search — triangulation is limited.',
    });
  }

  return flags;
}

export const NARRATIVE_SYSTEM_PROMPT = [
  'You are a regulatory writing assistant for FDA QMSR (CP 7382.850) inspection readiness.',
  'You MUST treat the user message as the only source of facts about the firm, device, signals, and FDA data.',
  'FORBIDDEN: inventing recalls, MDR counts, prior inspections, CAPAs, design failures, software defects, supplier failures, or any fact not explicitly present in the user message.',
  'FORBIDDEN: asserting that a signal exists unless it appears under normalized scenario signals or FDA/triangulation sections.',
  'FORBIDDEN: escalating risk beyond what the provided evidence supports.',
  'REQUIRED: separate factual restatement of provided inputs from interpretive inspection-readiness commentary.',
  'REQUIRED: use conditional language when evidence is incomplete (e.g., “if the scenario is accurate…”, “the selected signals suggest…”).',
  'REQUIRED: QMSR terminology only — do not use QSIT-era “subsystems” framing.',
  'When the user message contains a “LOCKED ADJUDICATION” section, treat each finding as immutable compliance truth — do not soften, contradict, reinterpret, or omit.',
  'Locked adjudication authorities must be cited by their short labels exactly as supplied.',
  'Write 400–600 words in professional tone for a medical device quality leader.',
].join('\n');

export function buildNarrativeStructuredPayload(
  scenario: Scenario,
  fdaData: FDAData | null,
  flags: FlagItem[],
): NarrativeStructuredPayload {
  const itype = scenario.inspType ?? 'baseline';
  const readinessSummary = getOverallReadiness({
    inspType: itype,
    ratings: scenario.ratings,
    flags,
    signalKeys: scenario.signals,
    marketedUS: scenario.marketedUS,
    risk: scenario.risk,
  });
  const thread = buildRiskThread(scenarioToAnalysisContext(scenario));
  const normalizedSignals = scenario.signals.map((key) => ({
    key,
    label: signalLabel(key),
  }));

  return {
    version: 1,
    scenarioSummary: {
      name: scenario.name,
      companyName: scenario.companyName,
      productName: scenario.productName,
      inspType: scenario.inspType,
      inspTypeLabel: scenario.inspType != null ? ITYPES[scenario.inspType].label : null,
      marketedUS: scenario.marketedUS,
      pathway: scenario.pathway,
      manualClass: scenario.manualClass,
      deviceClass: scenario.deviceClass,
      productCode: scenario.productCode,
      regulationNum: scenario.regulationNum,
      risk: scenario.risk,
      technology: {
        aiEnabled: scenario.aiEnabled,
        swEnabled: scenario.swEnabled,
        cyberEnabled: scenario.cyberEnabled,
        pccpPlanned: scenario.pccpPlanned,
      },
    },
    normalizedSignals,
    unsupportedSignalNotes: [...scenario.unsupportedSignals],
    fdaSummary: {
      hasData: fdaData != null,
      error: fdaData?.error ?? null,
      gudidUrl: fdaData?.gudidUrl ?? null,
      mdrByYear: fdaData?.mdr ?? {},
      mdrTypes: fdaData?.mdrTypes ?? {},
      recallCount: fdaData?.recalls.length ?? 0,
      recallSample: (fdaData?.recalls ?? [])
        .slice(0, 5)
        .map((r) => r.recallNumber ?? r.classification ?? 'recall'),
    },
    triangulationFlags: flags.map((f) => ({
      severity: f.severity,
      area: f.area,
      label: f.label,
      detail: f.detail,
    })),
    readinessSummary,
    riskThreadPreview: {
      entry: thread.entry,
      sequence: thread.sequence,
    },
  };
}

export function buildNarrativeUserMessage(payload: NarrativePayloadVersioned): string {
  const s = payload.scenarioSummary;
  const sigLine = payload.normalizedSignals.length
    ? payload.normalizedSignals.map((x) => `${x.label} (${x.key})`).join('; ')
    : '(none)';
  const unsupported =
    payload.unsupportedSignalNotes.length > 0
      ? payload.unsupportedSignalNotes.join('; ')
      : '(none)';

  const lines: string[] = [
    '## Provided inputs (do not invent beyond this section)',
    `Scenario name: ${s.name}`,
    `Company: ${s.companyName || '(not provided)'}`,
    `Product/device: ${s.productName || '(not provided)'}`,
    `Inspection type: ${
      s.inspType != null ? `${s.inspType} (${s.inspTypeLabel ?? ''})` : '(not selected)'
    }`,
    `Marketed in US: ${s.marketedUS ? 'yes' : 'no'}`,
    `Pathway: ${s.pathway}; class: ${s.manualClass}${s.deviceClass ? `; device class note: ${s.deviceClass}` : ''}`,
    `Product code: ${s.productCode || '(not provided)'}; Regulation: ${s.regulationNum || '(not provided)'}`,
    '',
    '## Risk and normalized signals',
    `Primary risk statement: ${s.risk || '(not provided)'}`,
    `Normalized canonical signals (engine-driving): ${sigLine}`,
    `Context-only notes (not deterministic drivers): ${unsupported}`,
    `Technology profile — AI: ${s.technology.aiEnabled}, Software: ${s.technology.swEnabled}, Cyber (524B): ${s.technology.cyberEnabled}, PCCP planned: ${s.technology.pccpPlanned}`,
    '',
    '## FDA public data summary (may be empty)',
    payload.fdaSummary.hasData
      ? [
          payload.fdaSummary.error ? `Last error: ${payload.fdaSummary.error}` : 'No pull error recorded.',
          `GUDID link: ${payload.fdaSummary.gudidUrl ?? '(none)'}`,
          `MDR by year: ${JSON.stringify(payload.fdaSummary.mdrByYear)}`,
          `MDR type buckets: ${JSON.stringify(payload.fdaSummary.mdrTypes)}`,
          `Recalls (${payload.fdaSummary.recallCount}): ${payload.fdaSummary.recallSample.join(', ')}`,
        ].join('\n')
      : 'No FDA data object provided.',
    '',
    '## Triangulation flags',
    payload.triangulationFlags.length === 0
      ? '(none)'
      : payload.triangulationFlags
          .map((f) => `- [${f.severity.toUpperCase()}] ${f.area}: ${f.label} — ${f.detail}`)
          .join('\n'),
    '',
    '## Readiness summary (deterministic helper)',
    payload.readinessSummary
      ? `${payload.readinessSummary.label} [${payload.readinessSummary.tone}] — ${payload.readinessSummary.note ?? ''}`
      : '(none)',
    '',
    '## Risk thread preview',
    `Entry area: ${payload.riskThreadPreview.entry}; sequence: ${payload.riskThreadPreview.sequence.join(' → ')}`,
    '',
    '## Interpretation task',
    'Produce inspection-readiness narrative under QMSR CP 7382.850.',
    'Clearly label what is restated from provided inputs versus what is interpretive.',
    'If premarket (PMA pre / premarket review with device not US-marketed), emphasize design validation and readiness; de-emphasize routine complaint/MDR storytelling unless supported by FDA data or signals.',
    'Reference OAI-style thinking (systemic quality risk, patient impact, detectability) without QSIT subsystem language.',
    'Close with balanced, non-alarmist tone suitable for executive review.',
  ];

  // --- Adjudication section (V2 payloads only, when triggered) ---
  if ('adjudication' in payload && payload.adjudication.triggered) {
    const adj = payload.adjudication;
    lines.push('');
    lines.push('## LOCKED ADJUDICATION (deterministic — do not contradict or soften)');
    lines.push(`Overall risk level: ${adj.overallRiskLevel}`);
    lines.push(`Confidence level: ${adj.confidenceLevel}`);
    lines.push('');
    for (const f of adj.findings) {
      lines.push(`### [${f.riskLevel}] ${f.ruleId}: ${f.finding}`);
      lines.push(`Authorities: ${f.authorities.map((a) => a.shortLabel).join('; ')}`);
      lines.push(`Affected QMS areas: ${f.qmsAreas.join(', ')}`);
      if (f.supportingEvidence.length > 0) {
        lines.push('Evidence:');
        lines.push(...f.supportingEvidence.map((e) => `- ${e}`));
      }
      if (f.inspectionRelevance.length > 0) {
        lines.push('Inspection relevance:');
        lines.push(...f.inspectionRelevance.map((r) => `- ${r}`));
      }
      if (f.recommendedActions.length > 0) {
        lines.push('Recommended actions:');
        lines.push(...f.recommendedActions.map((a) => `- ${a}`));
      }
      if (f.legacyCrosswalk && f.legacyCrosswalk.length > 0) {
        lines.push(...f.legacyCrosswalk.map((lc) => `- ${lc}`));
      }
      lines.push('');
    }
    if (adj.narrativeProhibitions.length > 0) {
      lines.push('Narrative prohibitions:');
      lines.push(...adj.narrativeProhibitions.map((p) => `- ${p}`));
      lines.push('');
    }
    if (adj.fdaSignalLimitations.length > 0) {
      lines.push('FDA signal limitations:');
      lines.push(...adj.fdaSignalLimitations.map((l) => `- ${l}`));
      lines.push('');
    }
    const applicableTech = adj.technologyGuidance.filter((tg) => tg.applies);
    if (applicableTech.length > 0) {
      lines.push('## Applicable guidance / standards (incorporate where applicable)');
      for (const tg of applicableTech) {
        lines.push(`- ${tg.technology}: ${tg.narrativeHint}`);
        lines.push(`  Citations: ${tg.citations.map((c) => c.shortLabel).join('; ')}`);
      }
    }
  }

  return lines.join('\n');
}

/**
 * V2 narrative payload: extends V1 with deterministic adjudication.
 * When adjudication rules fire, the narrative LLM is constrained by locked findings.
 * When no rules fire, output is identical to V1.
 */
export function buildNarrativeStructuredPayloadV2(
  scenario: Scenario,
  fdaData: FDAData | null,
  flags: FlagItem[],
): NarrativeStructuredPayloadV2 {
  const v1 = buildNarrativeStructuredPayload(scenario, fdaData, flags);
  const adjudication = buildAdjudication(scenario, fdaData, flags);
  // Spread V1 fields and override version + add adjudication
  const { version: _v, ...rest } = v1;
  return {
    ...rest,
    version: 2,
    adjudication,
  } as NarrativeStructuredPayloadV2;
}

/** Convenience wrapper: V1 path (used by existing tests). */
export function buildNarrativePrompt(
  scenario: Scenario,
  fdaData: FDAData | null,
  flags: FlagItem[],
): string {
  return buildNarrativeUserMessage(buildNarrativeStructuredPayload(scenario, fdaData, flags));
}
