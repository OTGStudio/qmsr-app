import type { FDAData, FDARecallRecord } from '@/types/analysis';
import type { Scenario, ScenarioRatings } from '@/types/scenario';
import { DEFAULT_SCENARIO } from '@/types/scenario';

// ── helpers ──────────────────────────────────────────────────────────

export function withRatings(
  scenario: Scenario,
  override: Partial<ScenarioRatings>,
): Scenario {
  return { ...scenario, ratings: { ...scenario.ratings, ...override } };
}

const emptyAreaNotes = { mgmt: '', dd: '', prod: '', change: '', out: '', meas: '' } as const;

// ── scenario factories ───────────────────────────────────────────────

export function baselineClean(): Scenario {
  return {
    ...DEFAULT_SCENARIO,
    name: 'Baseline clean',
    companyName: 'Acme Medical',
    productName: 'Infusion Pump X',
    feiNumber: '1234567890',
    feiVerification: null,
    inspType: 'baseline',
    marketedUS: true,
    pathway: 'standard',
    manualClass: '2',
    classSource: 'manual',
    productCode: '',
    regulationNum: '',
    risk: 'Software malfunction could cause incorrect infusion rate.',
    signals: [],
    unsupportedSignals: [],
    aiEnabled: false,
    swEnabled: false,
    cyberEnabled: false,
    pccpPlanned: false,
    ratings: { mgmt: 'unknown', dd: 'unknown', prod: 'unknown', change: 'unknown', out: 'unknown', meas: 'unknown' },
    areaNotes: { ...emptyAreaNotes },
    inspectionNarrative: '',
  };
}

export function postmarketMDR(): Scenario {
  return {
    ...DEFAULT_SCENARIO,
    name: 'Postmarket MDR',
    companyName: 'MedTech Inc',
    productName: 'Remote Monitoring Device',
    feiNumber: '1234567890',
    feiVerification: null,
    inspType: 'nonBaseline',
    marketedUS: true,
    pathway: 'standard',
    manualClass: '2',
    classSource: 'manual',
    risk: 'Performance drift or software defects could affect alarm accuracy and patient monitoring reliability.',
    signals: ['mdr_increase', 'complaint_trend', 'mdr_rising_3yr'],
    unsupportedSignals: [],
    aiEnabled: false,
    swEnabled: true,
    cyberEnabled: false,
    pccpPlanned: false,
    ratings: { mgmt: 'partial', dd: 'partial', prod: 'partial', change: 'weak', out: 'partial', meas: 'weak' },
    areaNotes: { ...emptyAreaNotes },
    inspectionNarrative: '',
  };
}

export function cyberForcause(): Scenario {
  return {
    ...DEFAULT_SCENARIO,
    name: 'Cyber for-cause',
    companyName: 'Connected Health Systems',
    productName: 'Remote Patient Monitoring Platform',
    feiNumber: '1234567890',
    feiVerification: null,
    inspType: 'forcause',
    marketedUS: true,
    pathway: 'denovo',
    manualClass: '2',
    classSource: 'manual',
    risk: 'A cybersecurity weakness could compromise essential performance, data integrity, or remote update controls.',
    signals: ['cybersecurity_signal', 'software_anomaly'],
    unsupportedSignals: [],
    aiEnabled: false,
    swEnabled: true,
    cyberEnabled: true,
    pccpPlanned: false,
    ratings: { mgmt: 'partial', dd: 'weak', prod: 'partial', change: 'weak', out: 'partial', meas: 'partial' },
    areaNotes: { ...emptyAreaNotes },
    inspectionNarrative: '',
  };
}

export function pmaPremarket(): Scenario {
  return {
    ...DEFAULT_SCENARIO,
    name: 'PMA premarket',
    companyName: 'ImplantCorp',
    productName: 'Cardiac Implant',
    feiNumber: '1234567890',
    feiVerification: null,
    inspType: 'pmaPre',
    marketedUS: false,
    pathway: 'standard',
    manualClass: '3',
    classSource: 'manual',
    deviceClass: '3',
    risk: 'Implant failure could result in life-threatening complications requiring surgical revision.',
    signals: [],
    unsupportedSignals: [],
    aiEnabled: false,
    swEnabled: false,
    cyberEnabled: false,
    pccpPlanned: false,
    ratings: { mgmt: 'partial', dd: 'partial', prod: 'weak', change: 'weak', out: 'partial', meas: 'partial' },
    areaNotes: { ...emptyAreaNotes },
    inspectionNarrative: '',
  };
}

export function recallScenario(): Scenario {
  return {
    ...DEFAULT_SCENARIO,
    name: 'Recall scenario',
    companyName: 'RecallMed',
    productName: 'Surgical Tool',
    feiNumber: '1234567890',
    feiVerification: null,
    inspType: 'compliance',
    marketedUS: true,
    pathway: 'standard',
    manualClass: '2',
    classSource: 'manual',
    risk: 'Device defect could result in surgical complications.',
    signals: ['recall_correction', 'class_i_recall', 'open_recall_action'],
    unsupportedSignals: [],
    aiEnabled: false,
    swEnabled: false,
    cyberEnabled: false,
    pccpPlanned: false,
    ratings: { mgmt: 'weak', dd: 'partial', prod: 'weak', change: 'weak', out: 'partial', meas: 'weak' },
    areaNotes: { ...emptyAreaNotes },
    inspectionNarrative: '',
  };
}

export function aiDevice(): Scenario {
  return {
    ...DEFAULT_SCENARIO,
    name: 'AI device',
    companyName: 'AI Diagnostics',
    productName: 'Imaging AI Tool',
    feiNumber: '1234567890',
    feiVerification: null,
    inspType: 'baseline',
    marketedUS: true,
    pathway: 'denovo',
    manualClass: '2',
    classSource: 'manual',
    risk: 'Algorithm drift may impact diagnostic accuracy.',
    signals: ['clinical_performance_drift'],
    unsupportedSignals: [],
    aiEnabled: true,
    swEnabled: true,
    cyberEnabled: false,
    pccpPlanned: true,
    ratings: { mgmt: 'partial', dd: 'weak', prod: 'partial', change: 'weak', out: 'partial', meas: 'weak' },
    areaNotes: { ...emptyAreaNotes },
    inspectionNarrative: '',
  };
}

export function strongSystem(): Scenario {
  return {
    ...DEFAULT_SCENARIO,
    name: 'Strong system',
    companyName: 'BestInClass',
    productName: 'Standard Device',
    feiNumber: '1234567890',
    feiVerification: null,
    inspType: 'spra',
    marketedUS: false,
    pathway: 'standard',
    manualClass: '2',
    classSource: 'manual',
    risk: 'Low residual risk under normal operation.',
    signals: [],
    unsupportedSignals: [],
    aiEnabled: false,
    swEnabled: true,
    cyberEnabled: false,
    pccpPlanned: false,
    ratings: { mgmt: 'strong', dd: 'strong', prod: 'strong', change: 'strong', out: 'strong', meas: 'strong' },
    areaNotes: { ...emptyAreaNotes },
    inspectionNarrative: '',
  };
}

export function deathMDR(): Scenario {
  return {
    ...DEFAULT_SCENARIO,
    name: 'Death MDR',
    companyName: 'CriticalCare',
    productName: 'Ventilator Model Z',
    feiNumber: '1234567890',
    feiVerification: null,
    inspType: 'forcause',
    marketedUS: true,
    pathway: 'standard',
    manualClass: '3',
    classSource: 'manual',
    deviceClass: '3',
    risk: 'Device failure could result in death or serious patient harm.',
    signals: ['death_type_mdr', 'mdr_increase'],
    unsupportedSignals: [],
    aiEnabled: false,
    swEnabled: false,
    cyberEnabled: false,
    pccpPlanned: false,
    ratings: { mgmt: 'partial', dd: 'partial', prod: 'partial', change: 'partial', out: 'partial', meas: 'weak' },
    areaNotes: { ...emptyAreaNotes },
    inspectionNarrative: '',
  };
}

export function supplierChange(): Scenario {
  return {
    ...DEFAULT_SCENARIO,
    name: 'Supplier change',
    companyName: 'Global Devices',
    productName: 'Assembly System',
    feiNumber: '1234567890',
    feiVerification: null,
    inspType: 'nonBaseline',
    marketedUS: true,
    pathway: 'standard',
    manualClass: '2',
    classSource: 'manual',
    risk: 'Supplier variability may impact device quality.',
    signals: ['supplier_change', 'incoming_failures', 'process_variability'],
    unsupportedSignals: [],
    aiEnabled: false,
    swEnabled: false,
    cyberEnabled: false,
    pccpPlanned: false,
    ratings: { mgmt: 'partial', dd: 'partial', prod: 'partial', change: 'weak', out: 'weak', meas: 'partial' },
    areaNotes: { ...emptyAreaNotes },
    inspectionNarrative: '',
  };
}

export function contradictoryPremarket(): Scenario {
  return {
    ...DEFAULT_SCENARIO,
    name: 'Contradictory premarket',
    companyName: 'PreMkt Corp',
    productName: 'Widget X',
    feiNumber: '1234567890',
    feiVerification: null,
    inspType: 'pmaPre',
    marketedUS: true,
    pathway: 'standard',
    manualClass: '3',
    classSource: 'manual',
    deviceClass: '3',
    risk: 'Safety-critical implant failure modes.',
    signals: ['clinical_performance_drift'],
    unsupportedSignals: [],
    aiEnabled: true,
    swEnabled: true,
    cyberEnabled: false,
    pccpPlanned: false,
    ratings: { mgmt: 'partial', dd: 'partial', prod: 'partial', change: 'partial', out: 'partial', meas: 'partial' },
    areaNotes: { ...emptyAreaNotes },
    inspectionNarrative: '',
  };
}

// ── adjudication test case factories ─────────────────────────────────

/** TC1: Class III supplier change with no evaluation — triggers adjudication. */
export function supplierChangeClassIII(): Scenario {
  return {
    ...DEFAULT_SCENARIO,
    name: 'TC1 — Supplier change Class III',
    companyName: 'Implant Dynamics',
    productName: 'Spinal Fusion Cage',
    feiNumber: '9999900001',
    feiVerification: null,
    inspType: 'nonBaseline',
    marketedUS: true,
    pathway: 'standard',
    manualClass: '3',
    classSource: 'manual',
    deviceClass: '3',
    risk: 'Supplier material change on Class III implant. No update performed on risk assessment. Biocompatibility not re-evaluated. Change closed without escalation.',
    signals: ['supplier_change'],
    unsupportedSignals: [],
    aiEnabled: false,
    swEnabled: false,
    cyberEnabled: false,
    pccpPlanned: false,
    scenarioFacts: {
      supplierChange: true,
      supplierChangeEvaluated: false,
      biocompatibilityReevaluated: false,
      changeClosedWithoutEscalation: true,
    },
    ratings: { mgmt: 'partial', dd: 'partial', prod: 'partial', change: 'weak', out: 'weak', meas: 'partial' },
    areaNotes: { ...emptyAreaNotes },
    inspectionNarrative: '',
  };
}

/** TC2: Multiple complaints attributed to user error with no trending — triggers adjudication. */
export function complaintsUserError(): Scenario {
  return {
    ...DEFAULT_SCENARIO,
    name: 'TC2 — Complaints user error',
    companyName: 'DiagnostiCo',
    productName: 'Blood Glucose Monitor',
    feiNumber: '9999900002',
    feiVerification: null,
    inspType: 'compliance',
    marketedUS: true,
    pathway: 'standard',
    manualClass: '2',
    classSource: 'manual',
    risk: 'Multiple complaints attributed to user error. Trend analysis not performed. No CAPA initiated. Risk file not updated.',
    signals: ['complaint_trend'],
    unsupportedSignals: [],
    aiEnabled: false,
    swEnabled: false,
    cyberEnabled: false,
    pccpPlanned: false,
    scenarioFacts: {
      complaintsMultiple: true,
      complaintTrend: true,
      investigationOutcome: 'user_error',
      trendAnalysisPerformed: false,
      capaInitiated: false,
      riskFileUpdated: false,
    },
    ratings: { mgmt: 'partial', dd: 'partial', prod: 'partial', change: 'partial', out: 'partial', meas: 'weak' },
    areaNotes: { ...emptyAreaNotes },
    inspectionNarrative: '',
  };
}

/** TC3: Unvalidated spreadsheet with post-release calculation error — triggers adjudication. */
export function unvalidatedSpreadsheet(): Scenario {
  return {
    ...DEFAULT_SCENARIO,
    name: 'TC3 — Unvalidated spreadsheet',
    companyName: 'PrecisionMed',
    productName: 'Drug Eluting Stent',
    feiNumber: '9999900003',
    feiVerification: null,
    inspType: 'baseline',
    marketedUS: true,
    pathway: 'standard',
    manualClass: '2',
    classSource: 'manual',
    risk: 'Spreadsheet used for critical dose calculations. Rounding error found post-release. Software validation: not performed. No independent review.',
    signals: ['software_anomaly'],
    unsupportedSignals: [],
    aiEnabled: false,
    swEnabled: false,
    cyberEnabled: false,
    pccpPlanned: false,
    scenarioFacts: {
      spreadsheetCriticalCalculation: true,
      calculationErrorPostRelease: true,
      softwareValidationPerformed: false,
      independentReviewPerformed: false,
    },
    ratings: { mgmt: 'partial', dd: 'weak', prod: 'weak', change: 'partial', out: 'partial', meas: 'partial' },
    areaNotes: { ...emptyAreaNotes },
    inspectionNarrative: '',
  };
}

/** TC4: Design change without V&V reassessment — triggers adjudication. */
export function designChangeNoVV(): Scenario {
  return {
    ...DEFAULT_SCENARIO,
    name: 'TC4 — Design change no V&V',
    companyName: 'OrthoDesign',
    productName: 'Hip Replacement System',
    feiNumber: '9999900004',
    feiVerification: null,
    inspType: 'nonBaseline',
    marketedUS: true,
    pathway: 'standard',
    manualClass: '3',
    classSource: 'manual',
    deviceClass: '3',
    risk: 'Design change to bearing surface geometry. V&V not reassessed after modification.',
    signals: [],
    unsupportedSignals: [],
    aiEnabled: false,
    swEnabled: false,
    cyberEnabled: false,
    pccpPlanned: false,
    scenarioFacts: {
      designChangePresent: true,
      designVVReassessed: false,
    },
    ratings: { mgmt: 'partial', dd: 'weak', prod: 'partial', change: 'weak', out: 'partial', meas: 'partial' },
    areaNotes: { ...emptyAreaNotes },
    inspectionNarrative: '',
  };
}

/** TC5: CAPA recurrence — triggers adjudication. */
export function capaRecurrence(): Scenario {
  return {
    ...DEFAULT_SCENARIO,
    name: 'TC5 — CAPA recurrence',
    companyName: 'MedFlow',
    productName: 'Infusion Set',
    feiNumber: '9999900005',
    feiVerification: null,
    inspType: 'forcause',
    marketedUS: true,
    pathway: 'standard',
    manualClass: '2',
    classSource: 'manual',
    risk: 'CAPA closed for connector leak issue. Same issue recurred in subsequent production lot.',
    signals: ['recurring_capa'],
    unsupportedSignals: [],
    aiEnabled: false,
    swEnabled: false,
    cyberEnabled: false,
    pccpPlanned: false,
    scenarioFacts: {
      capaClosedPreviously: true,
      issueRecurred: true,
    },
    ratings: { mgmt: 'partial', dd: 'partial', prod: 'weak', change: 'partial', out: 'partial', meas: 'weak' },
    areaNotes: { ...emptyAreaNotes },
    inspectionNarrative: '',
  };
}

/** TC6: Process validation gap — triggers adjudication. */
export function processValidationGap(): Scenario {
  return {
    ...DEFAULT_SCENARIO,
    name: 'TC6 — Process validation gap',
    companyName: 'SterileTech',
    productName: 'Sterile Surgical Kit',
    feiNumber: '9999900006',
    feiVerification: null,
    inspType: 'baseline',
    marketedUS: true,
    pathway: 'standard',
    manualClass: '2',
    classSource: 'manual',
    risk: 'Sterilization is a special process. Process validation not documented.',
    signals: [],
    unsupportedSignals: [],
    aiEnabled: false,
    swEnabled: false,
    cyberEnabled: false,
    pccpPlanned: false,
    scenarioFacts: {
      specialProcessPresent: true,
      processValidationDocumented: false,
    },
    ratings: { mgmt: 'partial', dd: 'partial', prod: 'weak', change: 'partial', out: 'partial', meas: 'partial' },
    areaNotes: { ...emptyAreaNotes },
    inspectionNarrative: '',
  };
}

/** TC7: Management review deficiency — triggers adjudication. */
export function managementReviewMissing(): Scenario {
  return {
    ...DEFAULT_SCENARIO,
    name: 'TC7 — Management review missing',
    companyName: 'QuickMed',
    productName: 'Diagnostic Test Kit',
    feiNumber: '9999900007',
    feiVerification: null,
    inspType: 'baseline',
    marketedUS: true,
    pathway: 'standard',
    manualClass: '2',
    classSource: 'manual',
    risk: 'General device risk. Management review not performed for quality system.',
    signals: [],
    unsupportedSignals: [],
    aiEnabled: false,
    swEnabled: false,
    cyberEnabled: false,
    pccpPlanned: false,
    scenarioFacts: {
      managementReviewPerformed: false,
    },
    ratings: { mgmt: 'weak', dd: 'partial', prod: 'partial', change: 'partial', out: 'partial', meas: 'partial' },
    areaNotes: { ...emptyAreaNotes },
    inspectionNarrative: '',
  };
}

/** TC8: Software lifecycle gap — triggers adjudication. */
export function softwareLifecycleGap(): Scenario {
  return {
    ...DEFAULT_SCENARIO,
    name: 'TC8 — Software lifecycle gap',
    companyName: 'SoftMed',
    productName: 'Patient Monitoring Software',
    feiNumber: '9999900008',
    feiVerification: null,
    inspType: 'baseline',
    marketedUS: true,
    pathway: 'standard',
    manualClass: '2',
    classSource: 'manual',
    risk: 'Software-enabled device. Software lifecycle not maintained or documented.',
    signals: ['software_anomaly'],
    unsupportedSignals: [],
    aiEnabled: false,
    swEnabled: true,
    cyberEnabled: false,
    pccpPlanned: false,
    scenarioFacts: {
      softwareLifecycleDocumented: false,
    },
    ratings: { mgmt: 'partial', dd: 'weak', prod: 'partial', change: 'partial', out: 'partial', meas: 'partial' },
    areaNotes: { ...emptyAreaNotes },
    inspectionNarrative: '',
  };
}

// ── FDA data factories ───────────────────────────────────────────────

export function emptyFDAData(): FDAData {
  return { mdr: {}, mdrTypes: {}, recalls: [], gudidUrl: null, error: null };
}

export function risingMDRData(): FDAData {
  return {
    mdr: { '2019': 10, '2020': 10, '2021': 10, '2022': 50, '2023': 50, '2024': 50 },
    mdrTypes: { Malfunction: 80, Injury: 20 },
    recalls: [],
    gudidUrl: null,
    error: null,
  };
}

export function classIRecallData(): FDAData {
  const recall: FDARecallRecord = {
    recallNumber: 'Z-1234-2024',
    classification: 'Class I',
    reasonForRecall: 'Software defect causing incorrect dose',
    recallInitiationDate: '20240601',
    status: 'Ongoing',
    openStatus: 'Open',
  };
  return { mdr: {}, mdrTypes: {}, recalls: [recall], gudidUrl: null, error: null };
}

export function deathMDRData(): FDAData {
  return {
    mdr: { '2022': 5, '2023': 8, '2024': 12 },
    mdrTypes: { Death: 3, Malfunction: 15, Injury: 7 },
    recalls: [],
    gudidUrl: null,
    error: null,
  };
}
