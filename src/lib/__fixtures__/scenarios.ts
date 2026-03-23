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
