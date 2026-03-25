import type {
  AdjudicationFinding,
  AdjudicationResult,
  ConfidenceLevel,
  FDAData,
  FlagItem,
  GuardrailCitation,
  RiskLevel,
  TechnologyGuidanceEntry,
} from '@/types/analysis';
import type { Scenario } from '@/types/scenario';

import {
  baseBindingCitations,
  baseInspectionCitations,
  citation,
  dedupeCitations,
} from '@/lib/guardrailRegistry';
import { extractScenarioFacts } from '@/lib/scenarioFacts';

/* ------------------------------------------------------------------ */
/*  Narrative prohibitions (apply to all adjudicated narratives)       */
/* ------------------------------------------------------------------ */

const NARRATIVE_PROHIBITIONS: readonly string[] = [
  'Do not downgrade risk because no complaint data or no public FDA data is available.',
  'Do not treat "same specification claimed" as verification.',
  'Do not soften a locked finding with "may," "appears," or "if accurate."',
];

/* ------------------------------------------------------------------ */
/*  FDA signal limitations (always apply)                              */
/* ------------------------------------------------------------------ */

const FDA_SIGNAL_LIMITATIONS: readonly string[] = [
  'Public FDA/openFDA signal data provide external context and do not by themselves establish noncompliance or causality.',
  'Absence of public FDA signal data does not reduce the compliance significance of internal control failures.',
];

/* ------------------------------------------------------------------ */
/*  Technology-aware guidance routing                                   */
/* ------------------------------------------------------------------ */

export function buildTechnologyGuidance(scenario: Scenario): TechnologyGuidanceEntry[] {
  const entries: TechnologyGuidanceEntry[] = [];

  // Software-enabled devices
  if (scenario.swEnabled) {
    entries.push({
      technology: 'software',
      applies: true,
      citations: [citation('software_validation'), citation('device_software_premarket')],
      narrativeHint:
        'Reference software lifecycle controls, validation, and anomaly management under IEC 62304 principles.',
    });
  }

  // AI-enabled devices
  if (scenario.aiEnabled) {
    const aiCitations: GuardrailCitation[] = [citation('ai_lifecycle_draft')];
    if (scenario.pccpPlanned) {
      aiCitations.push(citation('ai_pccp'));
    }
    entries.push({
      technology: 'ai',
      applies: true,
      citations: aiCitations,
      narrativeHint:
        'Reference AI governance, model validation, change control for algorithm updates, and TPLC risk framing.',
    });
  }

  // Cybersecurity devices
  if (scenario.cyberEnabled) {
    entries.push({
      technology: 'cybersecurity',
      applies: true,
      citations: [citation('cybersecurity')],
      narrativeHint:
        'Reference threat modeling, SBOM, vulnerability management, and section 524B expectations.',
    });
  }

  // MDSAP — always available as benchmarking, not binding
  entries.push({
    technology: 'mdsap',
    applies: true,
    citations: [citation('mdsap_program'), citation('mdsap_audit_approach')],
    narrativeHint: 'MDSAP audit approach available as supplemental process benchmark (not binding FDA law).',
  });

  // USP — only when material-contact / packaging / E&L risk is implicated
  const riskLower = scenario.risk.toLowerCase();
  if (/extractable|leachable|polymer|material contact|packaging/.test(riskLower)) {
    entries.push({
      technology: 'usp',
      applies: true,
      citations: [citation('usp_el'), citation('usp_1661')],
      narrativeHint: 'Reference USP extractables/leachables and packaging material evaluation.',
    });
  }

  return entries;
}

/* ------------------------------------------------------------------ */
/*  Adjudication engine                                                */
/* ------------------------------------------------------------------ */

/**
 * Deterministic adjudication: evaluates scenario facts against known
 * rule patterns and produces locked compliance findings.
 *
 * When no rules fire, returns `triggered: false` with empty findings.
 * The narrative system then falls back to standard LLM behavior.
 */
export function buildAdjudication(
  scenario: Scenario,
  fdaData: FDAData | null,
  _flags: FlagItem[],
): AdjudicationResult {
  const facts = extractScenarioFacts(scenario);
  const findings: AdjudicationFinding[] = [];

  // --- TC1: Supplier change without evaluation (Class III) ---
  if (
    scenario.manualClass === '3' &&
    facts.supplierChange &&
    !facts.supplierChangeEvaluated
  ) {
    const tc1Authorities = [
      ...baseBindingCitations(),
      citation('cp7382850'),
      citation('standards_db'),
    ];

    findings.push({
      ruleId: 'TC1_SUPPLIER_CHANGE_NO_EVAL',
      finding:
        'The firm failed to evaluate the impact of a supplier material change on device safety and effectiveness.',
      riskLevel: 'HIGH',
      authorities: dedupeCitations(tc1Authorities),
      supportingEvidence: [
        'A supplier/material change is present in the scenario.',
        'No updated risk assessment or documented impact assessment is indicated.',
      ],
      inspectionRelevance: [
        'Under CP 7382.850, this presents a risk-based inspection path from change control to design/development, purchasing controls, and management oversight.',
      ],
      recommendedActions: [
        'Perform and document the supplier-change impact assessment.',
        'Re-open and escalate change control with technical justification.',
        'Update the risk management file and affected product realization records.',
      ],
      qmsAreas: ['change', 'out', 'dd'],
      legacyCrosswalk: ['Legacy crosswalk: former 820.30 / 820.50 concept set'],
    });

    // Sub-rule: biocompatibility not re-evaluated
    if (!facts.biocompatibilityReevaluated) {
      findings.push({
        ruleId: 'TC1_BIOCOMP_REVIEW_MISSING',
        finding:
          'Biocompatibility reevaluation is not indicated despite a supplier/material-change context.',
        riskLevel: 'HIGH',
        authorities: dedupeCitations([...baseBindingCitations(), citation('standards_db')]),
        supportingEvidence: [
          'Biocompatibility reevaluation is not indicated despite supplier/material-change context.',
        ],
        inspectionRelevance: [],
        recommendedActions: [
          'Document biocompatibility impact assessment and reevaluation rationale.',
        ],
        qmsAreas: ['dd', 'change'],
      });
    }
  }

  // --- TC2: Complaints attributed to user error without trending ---
  if (
    facts.complaintsMultiple &&
    facts.investigationOutcome === 'user_error' &&
    !facts.trendAnalysisPerformed
  ) {
    const tc2Authorities = [
      ...baseBindingCitations(),
      citation('part803'),
      citation('cp7382850'),
    ];

    findings.push({
      ruleId: 'TC2_USER_ERROR_WITHOUT_TRENDING',
      finding:
        'The firm inadequately handled complaint information and failed to identify a potential systemic issue.',
      riskLevel: 'MEDIUM-HIGH',
      authorities: dedupeCitations(tc2Authorities),
      supportingEvidence: [
        'Multiple complaints are present.',
        'Complaints were attributed to user error.',
        'Trend analysis is not indicated.',
      ],
      inspectionRelevance: [
        'Under CP 7382.850, this creates a measurement/analysis/improvement entry point with likely expansion into CAPA, design feedback, and management oversight.',
      ],
      recommendedActions: [
        'Perform complaint trending and segmentation.',
        'Reassess user-error determinations against objective evidence.',
        'Evaluate CAPA initiation criteria and update risk management documentation.',
      ],
      qmsAreas: ['meas', 'dd', 'mgmt'],
      legacyCrosswalk: ['Legacy crosswalk: former 820.198 / 820.100 concept set'],
    });
  }

  // TC2 sub-rules
  if (facts.complaintsMultiple && !facts.capaInitiated) {
    findings.push({
      ruleId: 'TC2_CAPA_NOT_INITIATED',
      finding: 'No CAPA initiation is indicated despite repeated complaint activity.',
      riskLevel: 'MEDIUM-HIGH',
      authorities: dedupeCitations([...baseBindingCitations(), citation('cp7382850')]),
      supportingEvidence: [
        'No CAPA initiation is indicated despite repeated complaint activity.',
      ],
      inspectionRelevance: [],
      recommendedActions: [
        'Evaluate CAPA initiation criteria against complaint pattern.',
      ],
      qmsAreas: ['meas'],
    });
  }

  if (facts.complaintsMultiple && !facts.riskFileUpdated) {
    findings.push({
      ruleId: 'TC2_RISK_FILE_NOT_UPDATED',
      finding:
        'Risk management documentation is not indicated as updated from postmarket feedback.',
      riskLevel: 'MEDIUM',
      authorities: dedupeCitations([...baseBindingCitations(), citation('cp7382850')]),
      supportingEvidence: [
        'Risk management documentation is not indicated as updated from postmarket feedback.',
      ],
      inspectionRelevance: [],
      recommendedActions: [
        'Update risk management file with postmarket complaint data and re-evaluate residual risk.',
      ],
      qmsAreas: ['meas', 'dd'],
    });
  }

  // --- TC3: Unvalidated spreadsheet with post-release calculation error ---
  if (
    facts.spreadsheetCriticalCalculation &&
    facts.calculationErrorPostRelease &&
    !facts.softwareValidationPerformed
  ) {
    const tc3Authorities = [
      ...baseBindingCitations(),
      citation('cp7382850'),
      citation('software_validation'),
    ];

    findings.push({
      ruleId: 'TC3_UNVALIDATED_SPREADSHEET',
      finding:
        'The firm lacked adequate controls over critical calculation integrity and verification.',
      riskLevel: 'HIGH',
      authorities: dedupeCitations(tc3Authorities),
      supportingEvidence: [
        'A spreadsheet was used for critical calculations.',
        'A post-release calculation error is indicated.',
        'Software validation is not indicated.',
      ],
      inspectionRelevance: [
        'Under CP 7382.850, this presents a data-integrity inspection path from production controls through design verification and CAPA.',
      ],
      recommendedActions: [
        'Validate the spreadsheet or replace it with a controlled validated system.',
        'Perform retrospective impact assessment on released decisions.',
        'Implement independent verification of critical calculations.',
        'Open CAPA for systemic data-integrity remediation.',
      ],
      qmsAreas: ['prod', 'dd'],
      legacyCrosswalk: ['Legacy crosswalk: former 820.70(i) / 820.72 concept set'],
    });
  }

  // TC3 sub-rule: no independent review
  if (facts.spreadsheetCriticalCalculation && !facts.independentReviewPerformed) {
    findings.push({
      ruleId: 'TC3_NO_INDEPENDENT_REVIEW',
      finding:
        'Independent review or verification of the critical calculation is not indicated.',
      riskLevel: 'MEDIUM',
      authorities: dedupeCitations([...baseBindingCitations(), citation('cp7382850')]),
      supportingEvidence: [
        'Independent review or verification of the critical calculation is not indicated.',
      ],
      inspectionRelevance: [],
      recommendedActions: [
        'Implement independent review/verification for critical calculations.',
      ],
      qmsAreas: ['prod'],
    });
  }

  // --- TC4: Design change without V&V reassessment ---
  if (facts.designChangePresent && !facts.designVVReassessed) {
    const riskLevel = scenario.manualClass === '3' ? 'HIGH' : 'MEDIUM-HIGH';
    findings.push({
      ruleId: 'TC4_DESIGN_CHANGE_NO_VV',
      finding:
        'The firm implemented a design change without reassessing verification and validation.',
      riskLevel,
      authorities: dedupeCitations([
        ...baseBindingCitations(),
        citation('cp7382850'),
        citation('standards_db'),
      ]),
      supportingEvidence: [
        'A design change or design modification is present in the scenario.',
        'Verification and validation were not reassessed after the change.',
      ],
      inspectionRelevance: [
        'Under CP 7382.850, this creates an inspection path from change control through design controls and management oversight.',
      ],
      recommendedActions: [
        'Perform and document V&V reassessment for the design change.',
        'Review change control procedures for completeness of V&V linkage.',
        'Update the design history file with change rationale and V&V evidence.',
      ],
      qmsAreas: ['dd', 'change'],
      legacyCrosswalk: ['Legacy crosswalk: former 820.30(i) design change concept'],
    });
  }

  // --- TC5: CAPA ineffectiveness / recurrence ---
  if (facts.capaClosedPreviously && facts.issueRecurred) {
    findings.push({
      ruleId: 'TC5_CAPA_RECURRENCE',
      finding:
        'A previously closed CAPA failed to prevent recurrence of the same or similar issue, indicating systemic corrective action ineffectiveness.',
      riskLevel: 'HIGH',
      authorities: dedupeCitations([...baseBindingCitations(), citation('cp7382850')]),
      supportingEvidence: [
        'A CAPA was previously closed for this issue.',
        'The same or similar issue has recurred.',
      ],
      inspectionRelevance: [
        'Under CP 7382.850, recurring issues after CAPA closure indicate systemic failure in corrective action effectiveness and management review, with likely expansion into root cause analysis adequacy.',
      ],
      recommendedActions: [
        'Re-open or initiate new CAPA with enhanced root cause analysis.',
        'Evaluate adequacy of original corrective action scope and effectiveness checks.',
        'Escalate to management review for systemic quality system assessment.',
        'Consider whether the recurrence constitutes a reportable event.',
      ],
      qmsAreas: ['meas', 'mgmt', 'dd'],
      legacyCrosswalk: ['Legacy crosswalk: former 820.100 CAPA effectiveness concept'],
    });
  }

  // --- TC6: Process validation gap ---
  if (facts.specialProcessPresent && !facts.processValidationDocumented) {
    findings.push({
      ruleId: 'TC6_PROCESS_VALIDATION_GAP',
      finding:
        'A special process lacks documented process validation, creating a production control nonconformity.',
      riskLevel: 'MEDIUM-HIGH',
      authorities: dedupeCitations([...baseBindingCitations(), citation('cp7382850')]),
      supportingEvidence: [
        'A special process (e.g., sterilization, welding, sealing, bonding, coating) is present.',
        'Process validation documentation is not indicated.',
      ],
      inspectionRelevance: [
        'Under CP 7382.850, unvalidated special processes create production control findings with expansion into design verification and process monitoring adequacy.',
      ],
      recommendedActions: [
        'Document and execute process validation (IQ/OQ/PQ) for the special process.',
        'Establish ongoing process monitoring and revalidation criteria.',
        'Review product impact for units produced under the unvalidated process.',
      ],
      qmsAreas: ['prod', 'dd'],
      legacyCrosswalk: ['Legacy crosswalk: former 820.75 process validation concept'],
    });
  }

  // --- TC7: Management review deficiency ---
  if (!facts.managementReviewPerformed) {
    findings.push({
      ruleId: 'TC7_MANAGEMENT_REVIEW_MISSING',
      finding:
        'Management review of the quality system is not indicated as performed or documented.',
      riskLevel: 'MEDIUM',
      authorities: dedupeCitations([
        ...baseBindingCitations(),
        citation('qmsr_supplemental'),
        citation('cp7382850'),
      ]),
      supportingEvidence: [
        'Management review performance or documentation is not indicated.',
      ],
      inspectionRelevance: [
        'Under CP 7382.850, management review is a primary entry point for baseline inspections and establishes the adequacy of the entire QMS.',
      ],
      recommendedActions: [
        'Conduct and document management review per QMSR requirements.',
        'Include review of quality objectives, audit results, CAPA status, and process performance data.',
        'Establish management review schedule and ensure records are maintained.',
      ],
      qmsAreas: ['mgmt'],
    });
  }

  // --- TC8: Software lifecycle gaps (swEnabled devices) ---
  if (scenario.swEnabled && !facts.softwareLifecycleDocumented) {
    const riskLevel = scenario.manualClass === '3' ? 'MEDIUM-HIGH' : 'MEDIUM';
    findings.push({
      ruleId: 'TC8_SOFTWARE_LIFECYCLE_GAP',
      finding:
        'Software lifecycle documentation is not indicated for a software-enabled device.',
      riskLevel,
      authorities: dedupeCitations([
        ...baseBindingCitations(),
        citation('cp7382850'),
        citation('software_validation'),
        citation('device_software_premarket'),
      ]),
      supportingEvidence: [
        'The device is software-enabled (swEnabled: true).',
        'Software lifecycle documentation is not indicated as maintained.',
      ],
      inspectionRelevance: [
        'Under CP 7382.850, software lifecycle control failures affect design controls, production controls, and configuration management.',
      ],
      recommendedActions: [
        'Establish and document software lifecycle processes per IEC 62304 principles.',
        'Maintain software requirements, architecture, and verification/validation records.',
        'Implement configuration management and anomaly resolution processes.',
      ],
      qmsAreas: ['dd', 'prod'],
    });
  }

  // --- TC9: Labeling / UDI deficiency ---
  if (facts.labelingDefectPresent && !facts.labelingChangeControlPerformed) {
    findings.push({
      ruleId: 'TC9_LABELING_UDI_DEFECT',
      finding:
        'A labeling or UDI defect is present without documented labeling change control.',
      riskLevel: 'MEDIUM-HIGH',
      authorities: dedupeCitations([...baseBindingCitations(), citation('cp7382850')]),
      supportingEvidence: [
        'A labeling defect, UDI discrepancy, or artwork error is indicated.',
        'Labeling change control is not indicated as performed.',
      ],
      inspectionRelevance: [
        'Under CP 7382.850, labeling control failures create a production controls finding with expansion into change control and measurement/analysis.',
      ],
      recommendedActions: [
        'Investigate and correct the labeling/UDI defect.',
        'Perform labeling change control per documented procedures.',
        'Verify UDI-to-device master record alignment.',
        'Assess field impact for distributed units with labeling defects.',
      ],
      qmsAreas: ['prod', 'change', 'meas'],
    });
  }

  // --- TC10: Sterility assurance gap ---
  if (facts.sterileDevice && !facts.sterilityValidationComplete) {
    const riskLevel = scenario.manualClass === '3' ? 'HIGH' : 'MEDIUM-HIGH';
    findings.push({
      ruleId: 'TC10_STERILITY_VALIDATION_INCOMPLETE',
      finding:
        'Sterility validation is incomplete for a sterile device, creating a critical production control gap.',
      riskLevel,
      authorities: dedupeCitations([
        ...baseBindingCitations(),
        citation('cp7382850'),
        citation('standards_db'),
      ]),
      supportingEvidence: [
        'The device is identified as sterile.',
        'Sterility validation is not indicated as complete.',
      ],
      inspectionRelevance: [
        'Under CP 7382.850, incomplete sterility validation for a sterile device presents a critical production controls finding with expansion into design verification and change control.',
      ],
      recommendedActions: [
        'Complete sterility validation including challenge studies and bioburden characterization.',
        'Document sterility assurance level (SAL) and validation acceptance criteria.',
        'Establish ongoing process monitoring and environmental controls.',
      ],
      qmsAreas: ['prod', 'change', 'meas', 'dd'],
    });
  }

  if (facts.sterileDevice && !facts.sterilityRevalidatedAfterChange) {
    findings.push({
      ruleId: 'TC10_STERILITY_NOT_REVALIDATED',
      finding:
        'Sterilization process was not revalidated after a change to a sterile device.',
      riskLevel: 'MEDIUM-HIGH',
      authorities: dedupeCitations([...baseBindingCitations(), citation('cp7382850')]),
      supportingEvidence: [
        'The device is sterile.',
        'Sterilization revalidation after change is not indicated.',
      ],
      inspectionRelevance: [],
      recommendedActions: [
        'Perform sterilization revalidation following the change.',
        'Document change impact assessment on sterility assurance.',
      ],
      qmsAreas: ['prod', 'change'],
    });
  }

  // --- TC11: Training / competency gap ---
  if (!facts.trainingRecordsMaintained || !facts.competencyAssessed) {
    const evidence: string[] = [];
    if (!facts.trainingRecordsMaintained) evidence.push('Training records are not indicated as maintained.');
    if (!facts.competencyAssessed) evidence.push('Competency assessment is not indicated for personnel performing critical operations.');

    findings.push({
      ruleId: 'TC11_TRAINING_COMPETENCY_GAP',
      finding:
        'Training records or competency assessments are not maintained for personnel performing quality-affecting operations.',
      riskLevel: 'MEDIUM-HIGH',
      authorities: dedupeCitations([
        ...baseBindingCitations(),
        citation('qmsr_supplemental'),
        citation('cp7382850'),
      ]),
      supportingEvidence: evidence,
      inspectionRelevance: [
        'Under CP 7382.850, training and competency documentation gaps affect management oversight, production controls, and design controls (where personnel perform V&V activities).',
      ],
      recommendedActions: [
        'Establish and maintain training records for all personnel performing quality-affecting work.',
        'Implement competency assessment for critical operations.',
        'Ensure retraining is triggered when procedures change or after corrective actions.',
      ],
      qmsAreas: ['mgmt', 'prod', 'dd'],
    });
  }

  // --- TC12: Risk management file incomplete ---
  if (!facts.riskManagementFileComplete) {
    const riskLevel = scenario.manualClass === '3' ? 'MEDIUM-HIGH' : 'MEDIUM';
    findings.push({
      ruleId: 'TC12_RISK_FILE_INCOMPLETE',
      finding:
        'The risk management file is incomplete or missing required sections.',
      riskLevel,
      authorities: dedupeCitations([
        ...baseBindingCitations(),
        citation('cp7382850'),
        citation('standards_db'),
      ]),
      supportingEvidence: [
        'Risk management file completeness is not indicated (missing hazard analysis, risk assessment, mitigation, or residual risk documentation).',
      ],
      inspectionRelevance: [
        'Under CP 7382.850, an incomplete risk management file undermines design controls, change control justification, and postmarket feedback integration.',
      ],
      recommendedActions: [
        'Complete risk management file per ISO 14971 requirements.',
        'Ensure all required sections are documented: hazard identification, risk estimation, risk evaluation, risk control, residual risk evaluation, and production/post-production information.',
        'Integrate postmarket surveillance data into risk management file.',
      ],
      qmsAreas: ['dd', 'meas', 'mgmt'],
    });
  }

  if (facts.designChangePresent && !facts.riskFileUpdatedAfterChange) {
    findings.push({
      ruleId: 'TC12_RISK_NOT_UPDATED_AFTER_CHANGE',
      finding:
        'The risk management file was not updated after a design change.',
      riskLevel: 'MEDIUM-HIGH',
      authorities: dedupeCitations([...baseBindingCitations(), citation('cp7382850')]),
      supportingEvidence: [
        'A design change is present.',
        'Risk file update after the change is not indicated.',
      ],
      inspectionRelevance: [],
      recommendedActions: [
        'Update risk management file to reflect the design change impact.',
        'Reassess hazards and residual risk in the context of the change.',
      ],
      qmsAreas: ['dd', 'change'],
    });
  }

  // --- TC13: Incoming acceptance / nonconforming product / calibration ---
  if (facts.incomingFailuresRecurring && !facts.incomingEscalated) {
    findings.push({
      ruleId: 'TC13_INCOMING_NOT_ESCALATED',
      finding:
        'Recurring incoming inspection failures have not been escalated to supplier corrective action.',
      riskLevel: 'MEDIUM-HIGH',
      authorities: dedupeCitations([...baseBindingCitations(), citation('cp7382850')]),
      supportingEvidence: [
        'Recurring incoming material failures are indicated.',
        'Escalation to supplier corrective action is not indicated.',
      ],
      inspectionRelevance: [
        'Under CP 7382.850, recurring incoming failures without supplier escalation create an outsourcing/purchasing controls finding with expansion into production controls and CAPA.',
      ],
      recommendedActions: [
        'Escalate recurring failures to supplier corrective action.',
        'Review and strengthen incoming acceptance criteria.',
        'Evaluate supplier qualification and monitoring program adequacy.',
      ],
      qmsAreas: ['out', 'prod', 'meas'],
    });
  }

  if (!facts.calibrationCurrent) {
    findings.push({
      ruleId: 'TC13_CALIBRATION_LAPSED',
      finding:
        'Measurement equipment calibration is lapsed or overdue.',
      riskLevel: 'MEDIUM',
      authorities: dedupeCitations([...baseBindingCitations(), citation('cp7382850')]),
      supportingEvidence: [
        'Equipment calibration is indicated as lapsed, overdue, or not current.',
      ],
      inspectionRelevance: [
        'Under CP 7382.850, calibration gaps affect measurement/analysis confidence and may invalidate acceptance decisions.',
      ],
      recommendedActions: [
        'Bring all measurement equipment into current calibration status.',
        'Perform retrospective impact assessment on measurements made with uncalibrated equipment.',
        'Review calibration schedule and recall procedures.',
      ],
      qmsAreas: ['meas', 'prod'],
    });
  }

  if (!facts.nonconformingProductControlled) {
    findings.push({
      ruleId: 'TC13_NONCONFORMING_NOT_CONTROLLED',
      finding:
        'Nonconforming product is not adequately identified, segregated, or controlled.',
      riskLevel: 'MEDIUM-HIGH',
      authorities: dedupeCitations([...baseBindingCitations(), citation('cp7382850')]),
      supportingEvidence: [
        'Nonconforming product control is not indicated (identification, segregation, or disposition).',
      ],
      inspectionRelevance: [
        'Under CP 7382.850, nonconforming product control failures create production control findings with expansion into CAPA and management oversight.',
      ],
      recommendedActions: [
        'Implement nonconforming product identification, segregation, and disposition procedures.',
        'Review released product for potential nonconforming units.',
        'Evaluate CAPA criteria for systemic nonconformance patterns.',
      ],
      qmsAreas: ['prod', 'meas', 'mgmt'],
    });
  }

  // Deduplicate findings by ruleId
  const seenRules = new Set<string>();
  const uniqueFindings = findings.filter((f) => {
    if (seenRules.has(f.ruleId)) return false;
    seenRules.add(f.ruleId);
    return true;
  });

  // Determine overall risk level
  const overallRiskLevel = computeOverallRisk(uniqueFindings);
  const confidenceLevel: ConfidenceLevel = fdaData ? 'MEDIUM' : 'LOW';

  // Technology-aware guidance
  const technologyGuidance = buildTechnologyGuidance(scenario);

  return {
    triggered: uniqueFindings.length > 0,
    overallRiskLevel,
    confidenceLevel,
    findings: uniqueFindings,
    technologyGuidance,
    narrativeProhibitions: uniqueFindings.length > 0 ? NARRATIVE_PROHIBITIONS : [],
    bindingBasis: baseBindingCitations(),
    inspectionLens: baseInspectionCitations(),
    fdaSignalLimitations: FDA_SIGNAL_LIMITATIONS,
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function computeOverallRisk(findings: AdjudicationFinding[]): RiskLevel {
  if (findings.length === 0) return 'LOW';
  const levels = findings.map((f) => f.riskLevel);
  if (levels.includes('HIGH')) return 'HIGH';
  if (levels.includes('MEDIUM-HIGH')) return 'MEDIUM-HIGH';
  if (levels.includes('MEDIUM')) return 'MEDIUM';
  return 'LOW';
}
