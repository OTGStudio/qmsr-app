import type { InspectionType, QMSAreaKey, RatingValue } from '@/types/scenario';

export interface QMSAreaDef {
  readonly key: QMSAreaKey;
  readonly label: string;
  readonly m2: string;
}

export const QMS_AREAS: readonly QMSAreaDef[] = [
  {
    key: 'mgmt',
    label: 'Management Oversight',
    m2: 'Management Review · Medical Device File · Planning of Product Realization',
  },
  {
    key: 'dd',
    label: 'Design & Development',
    m2: 'D&D Inputs · Outputs · Review · Verification · Validation · SW Validation · Transfer',
  },
  {
    key: 'prod',
    label: 'Production & Service Provision',
    m2: 'Validation of Processes · Control of Production · Identification & Traceability',
  },
  {
    key: 'change',
    label: 'Change Control',
    m2: 'Product and Process Changes',
  },
  {
    key: 'out',
    label: 'Outsourcing & Purchasing',
    m2: 'Outsourcing element',
  },
  {
    key: 'meas',
    label: 'Measurement, Analysis & Improvement',
    m2:
      'Analysis of Data · Nonconforming Product · Complaint Handling · Feedback · Internal Audits · CAPA',
  },
] as const satisfies readonly QMSAreaDef[];

export const AREA_ORDER: readonly QMSAreaKey[] = [
  'mgmt',
  'dd',
  'prod',
  'change',
  'out',
  'meas',
] as const satisfies readonly QMSAreaKey[];

export interface InspectionTypeDef {
  readonly label: string;
  readonly model: 1 | 2;
  readonly modelLabel: string;
  readonly summary: string;
  readonly oafrRule: string;
  readonly path: string;
}

export const ITYPES: Record<InspectionType, InspectionTypeDef> = {
  baseline: {
    label: 'Baseline QMSR inspection',
    model: 2,
    modelLabel: 'Model 2',
    summary:
      'First comprehensive inspection of the establishment’s quality management system under QMSR (CP 7382.850). All six QMS areas are required at minimum depth, with emphasis on management oversight and traceability across the product lifecycle.',
    oafrRule:
      'Other Applicable FDA Requirements (OAFRs) for postmarket surveillance apply where the device is marketed in the United States — including Medical Device Reporting (21 CFR Part 803), corrections and removals (21 CFR Part 806), and Unique Device Identification (21 CFR Part 830 / 801 Subpart B) as applicable to the firm’s devices.',
    path: 'Management → Design & Development → Production → Change Control → Outsourcing → Measurement',
  },
  nonBaseline: {
    label: 'Non-baseline follow-up inspection',
    model: 1,
    modelLabel: 'Model 1',
    summary:
      'Targeted follow-up inspection that prioritizes risk-based navigation across QMS areas rather than repeating full baseline breadth. The investigator typically threads from postmarket signals into design and change controls.',
    oafrRule:
      'OAFRs are applied selectively based on device class, marketed status, and the risk signals driving the inspection scope; postmarket reporting and recall obligations remain in scope when the device is US-marketed.',
    path: 'Measurement → Design & Development → Change Control → Management',
  },
  compliance: {
    label: 'Compliance follow-up inspection',
    model: 1,
    modelLabel: 'Model 1',
    summary:
      'Follow-up inspection to verify implementation of corrective actions, commitments, or regulatory obligations from prior interactions (e.g., inspections, warning letters, or agreed plans).',
    oafrRule:
      'OAFR review emphasizes obligations tied to prior deficiencies and commitments; MDR, recall, and tracking requirements are stressed when prior issues involved postmarket surveillance or distribution.',
    path: 'Measurement → Change Control → Design & Development → Management',
  },
  forcause: {
    label: 'For-cause inspection',
    model: 1,
    modelLabel: 'Model 1',
    summary:
      'Inspection opened in response to specific evidence or signals — such as complaints, MDR clusters, recalls, or other indicators of potential noncompliance — with emphasis on measurement, analysis, and improvement.',
    oafrRule:
      'OAFRs for reporting, corrections and removals, and UDI are central when for-cause drivers involve postmarket performance, labeling, or distribution; tracking obligations are emphasized when traceability is in question.',
    path: 'Measurement → Change Control → Design & Development → Management',
  },
  spra: {
    label: 'Submission review / premarket assessment',
    model: 1,
    modelLabel: 'Model 1',
    summary:
      'Premarket-focused review supporting a regulatory submission or premarket interaction, with emphasis on design controls, validation evidence, and manufacturing readiness for the subject device.',
    oafrRule:
      'OAFR review is weighted toward premarket requirements; postmarket surveillance OAFRs may be prospective or limited when the device is not yet marketed in the United States.',
    path: 'Design & Development → Production → Change Control → Measurement',
  },
  pmaPre: {
    label: 'PMA preapproval inspection',
    model: 2,
    modelLabel: 'Model 2',
    summary:
      'Preapproval inspection supporting a PMA submission. All six QMS areas are required at minimum depth, with intensive review of design verification and validation, manufacturing controls, and supplier oversight.',
    oafrRule:
      'OAFR alignment is assessed for the device and operations under review; postmarket OAFR obligations are evaluated prospectively where the device is not yet marketed, and in full where postmarket activities exist.',
    path: 'Design & Development → Production → Change Control → Outsourcing → Measurement → Management',
  },
  pmaPost: {
    label: 'PMA postmarket inspection',
    model: 1,
    modelLabel: 'Model 1',
    summary:
      'Postmarket surveillance inspection for PMA-approved devices, emphasizing changes, complaints, CAPA, and ongoing assurance of design and production integrity after approval.',
    oafrRule:
      'Full postmarket OAFR obligations apply, including MDR, corrections and removals, UDI, and device tracking when applicable to the approved device and firm operations.',
    path: 'Measurement → Change Control → Design & Development → Management',
  },
  premarketReview: {
    label: 'Premarket review support inspection',
    model: 2,
    modelLabel: 'Model 2',
    summary:
      'Inspection supporting premarket review (e.g., Q-Sub, De Novo, IDE, or PMA-related review) where all six QMS areas are required at minimum depth under the QMSR inspection model.',
    oafrRule:
      'OAFR review focuses on design, validation, and manufacturing readiness; postmarket surveillance OAFRs may be limited or prospective when the device is not marketed in the United States.',
    path: 'Design & Development → Production → Change Control → Outsourcing → Measurement → Management',
  },
};

/** Stable iteration order for wizard and UI lists (all eight inspection types). */
export const INSPECTION_TYPE_ORDER: readonly InspectionType[] = [
  'baseline',
  'nonBaseline',
  'compliance',
  'forcause',
  'spra',
  'pmaPre',
  'pmaPost',
  'premarketReview',
] as const satisfies readonly InspectionType[];

export interface OAFRDef {
  readonly key: string;
  readonly label: string;
}

export const OAFRS: readonly OAFRDef[] = [
  { key: 'mdr', label: 'Medical Device Reporting (21 CFR 803)' },
  { key: 'recall', label: 'Corrections & Removals (21 CFR 806)' },
  { key: 'tracking', label: 'Device Tracking (21 CFR 821)' },
  { key: 'udi', label: 'Unique Device Identification (21 CFR 830 / 801 Subpart B)' },
] as const satisfies readonly OAFRDef[];

export const SIGNALS: readonly string[] = [
  'Complaint trend',
  'MDR increase',
  'MDR — rising 3-year trend',
  'Incoming failures',
  'Process variability',
  'Supplier change',
  'Recurring CAPA',
  'Recall / correction',
  'Class I recall',
  'Open recall action',
  'Previous 483 observation',
  'Warning letter / consent decree',
  'UDI discrepancy',
  'Software anomaly',
  'Cybersecurity signal',
  'Clinical / performance drift',
  'Death-type MDR reports',
] as const satisfies readonly string[];

export const RLABELS: Record<RatingValue, string> = {
  unknown: 'Not rated',
  weak: 'Needs work',
  partial: 'Partial',
  strong: 'Strong',
};

export const CLASS_LABELS: Record<string, string> = {
  '1': 'Class I',
  '2': 'Class II',
  '3': 'Class III',
  F: 'HDE',
  U: 'Unclassified',
  DN: 'De Novo (Class II)',
};

export interface PresetDef {
  readonly label: string;
  readonly hint: string;
  readonly risk: string;
  readonly signals: string[];
  readonly ai?: boolean;
  readonly sw?: boolean;
  readonly cyber?: boolean;
}

export const PRESETS: Record<string, PresetDef> = {
  component: {
    label: 'Structural component / implant',
    hint: 'Mechanical fixation, load-bearing hardware, or permanent implants',
    risk:
      'Primary device risks include structural failure under physiological loads, fatigue fracture, screw loosening, or loss of fixation that could require revision surgery or result in serious injury.',
    signals: [
      'Complaint trend',
      'MDR increase',
      'Recall / correction',
      'Class I recall',
    ],
  },
  sterility: {
    label: 'Sterile barrier / sterile processing',
    hint: 'Terminal sterilization, aseptic processing, or sterile packaging integrity',
    risk:
      'Primary risks include loss of sterility assurance, microbial contamination, packaging seal failure, or reprocessing errors that could lead to infection or unusable product.',
    signals: ['Process variability', 'Incoming failures', 'Complaint trend', 'Recall / correction'],
  },
  software: {
    label: 'Software-enabled device',
    hint: 'Embedded software, SaMD, or programmable device behavior',
    risk:
      'Primary risks include software defects, incorrect outputs or alarms, inadequate verification and validation, configuration errors, and residual defects affecting clinical performance.',
    signals: [
      'Software anomaly',
      'Clinical / performance drift',
      'Complaint trend',
      'Cybersecurity signal',
    ],
    sw: true,
  },
  ai: {
    label: 'AI / machine learning device',
    hint: 'Adaptive algorithms, CADx, or learning-based models',
    risk:
      'Primary risks include model drift, insufficient training/validation data, bias, unclear change management for model updates, and inadequate monitoring of real-world performance.',
    signals: [
      'Clinical / performance drift',
      'Complaint trend',
      'MDR increase',
      'Cybersecurity signal',
    ],
    ai: true,
    sw: true,
  },
  cyber: {
    label: 'Connected / cybersecurity (524B)',
    hint: 'Network interfaces, remote monitoring, or updateable software',
    risk:
      'Primary risks include exploitation of remote interfaces, unauthorized access to device or PHI, denial of service, and supply-chain or SBOM gaps affecting safe operation.',
    signals: ['Cybersecurity signal', 'Software anomaly', 'Complaint trend', 'MDR increase'],
    cyber: true,
    sw: true,
  },
  labeling: {
    label: 'Labeling / IFU / UDI',
    hint: 'Symbols, instructions for use, and device identification',
    risk:
      'Primary risks include use error from unclear labeling, UDI mismatch between labeling and records, incorrect unit of use identification, and recall drivers tied to labeling corrections.',
    signals: ['UDI discrepancy', 'Complaint trend', 'Recall / correction', 'Supplier change'],
  },
  process: {
    label: 'Manufacturing process variability',
    hint: 'Machining, molding, coating, assembly, or critical processing',
    risk:
      'Primary risks include unacceptable process variation, out-of-specification dimensions or coating thickness, contamination, and inadequate process validation or monitoring.',
    signals: [
      'Process variability',
      'Incoming failures',
      'Complaint trend',
      'Recurring CAPA',
    ],
  },
  fracture: {
    label: 'Fracture / orthopedic hardware',
    hint: 'Plates, screws, intramedullary devices, or trauma fixation',
    risk:
      'Primary risks include peri-implant fracture, hardware fatigue, osteolysis, malunion/nonunion drivers, and biomechanical failure that could cause serious injury or death.',
    signals: [
      'Complaint trend',
      'MDR increase',
      'Death-type MDR reports',
      'Class I recall',
    ],
  },
};

/** Stable order for wizard risk preset buttons (all eight presets). */
export const PRESET_ORDER = [
  'component',
  'sterility',
  'software',
  'ai',
  'cyber',
  'labeling',
  'process',
  'fracture',
] as const satisfies readonly (keyof typeof PRESETS)[];

export function isPremarket(inspType: InspectionType, marketedUS: boolean): boolean {
  return (inspType === 'pmaPre' || inspType === 'premarketReview') && !marketedUS;
}
