import type { GuardrailCitation, GuardrailTier } from '@/types/analysis';

/**
 * Static registry of regulatory citations, tiered by authority level.
 *
 * Tier hierarchy (most → least binding):
 *   binding → inspection-program → guidance → standard → mdsap → public-signal
 *
 * `alwaysReference: true` entries appear in every narrative.
 * All others are routed conditionally based on scenario facts.
 */
export const GUARDRAILS: Record<string, GuardrailCitation> = {
  /* ---- binding (current law) ---- */

  qmsr_part820: {
    key: 'qmsr_part820',
    title: '21 CFR Part 820 — Quality Management System Regulation',
    shortLabel: '21 CFR Part 820',
    citation: '21 CFR Part 820',
    url: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-H/part-820',
    tier: 'binding',
    alwaysReference: true,
    rationale: 'Current binding device QMS regulation.',
  },
  qmsr_scope: {
    key: 'qmsr_scope',
    title: '21 CFR 820.1 — Scope',
    shortLabel: '21 CFR 820.1',
    citation: '21 CFR 820.1',
    url: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-H/part-820/subpart-A/section-820.1',
    tier: 'binding',
    alwaysReference: true,
    rationale: 'Defines QMSR applicability to finished devices.',
  },
  qmsr_supplemental: {
    key: 'qmsr_supplemental',
    title: '21 CFR Part 820 Subpart B — Supplemental Provisions',
    shortLabel: '21 CFR Part 820 Subpart B',
    citation: '21 CFR Part 820 Subpart B',
    url: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-H/part-820/subpart-B',
    tier: 'binding',
    alwaysReference: true,
    rationale: 'FDA-specific supplemental provisions layered on ISO 13485 incorporation.',
  },
  part803: {
    key: 'part803',
    title: '21 CFR Part 803 — Medical Device Reporting',
    shortLabel: '21 CFR Part 803',
    citation: '21 CFR Part 803',
    url: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-H/part-803',
    tier: 'binding',
    rationale: 'MDR obligations for complaint/reportability scenarios.',
  },

  /* ---- inspection program ---- */

  cp7382850: {
    key: 'cp7382850',
    title: 'Inspection of Medical Device Manufacturers Compliance Program 7382.850',
    shortLabel: 'CP 7382.850',
    citation: 'FDA CP 7382.850',
    url: 'https://www.fda.gov/media/80195/download',
    tier: 'inspection-program',
    alwaysReference: true,
    rationale: 'Current FDA device inspection framework and risk-based inspection lens.',
  },

  /* ---- guidance ---- */

  qmsr_faq: {
    key: 'qmsr_faq',
    title: 'FDA QMSR Frequently Asked Questions',
    shortLabel: 'FDA QMSR FAQ',
    citation: 'FDA QMSR FAQ',
    url: 'https://www.fda.gov/medical-devices/quality-management-system-regulation-qmsr/quality-management-system-regulation-frequently-asked-questions',
    tier: 'guidance',
    alwaysReference: true,
    rationale: 'Current FDA implementation clarifications for QMSR and post-QSIT inspections.',
  },
  software_validation: {
    key: 'software_validation',
    title: 'General Principles of Software Validation',
    shortLabel: 'Software Validation Guidance',
    citation: 'FDA General Principles of Software Validation',
    url: 'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/general-principles-software-validation',
    tier: 'guidance',
    rationale:
      'Relevant when software is used to design, develop, or manufacture devices or to support acceptance decisions.',
  },
  device_software_premarket: {
    key: 'device_software_premarket',
    title: 'Content of Premarket Submissions for Device Software Functions',
    shortLabel: 'Device Software Functions Guidance',
    citation: 'FDA Device Software Functions Guidance',
    url: 'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/content-premarket-submissions-device-software-functions',
    tier: 'guidance',
    rationale: 'Relevant for device software functions and software-enabled devices.',
  },
  ai_pccp: {
    key: 'ai_pccp',
    title: 'Marketing Submission Recommendations for a Predetermined Change Control Plan for AI-Enabled Device Software Functions',
    shortLabel: 'AI PCCP Guidance',
    citation: 'FDA AI PCCP Guidance',
    url: 'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/marketing-submission-recommendations-predetermined-change-control-plan-artificial-intelligence',
    tier: 'guidance',
    rationale: 'Relevant when AI-enabled software and PCCP are in scope.',
  },
  ai_lifecycle_draft: {
    key: 'ai_lifecycle_draft',
    title: 'Artificial Intelligence-Enabled Device Software Functions: Lifecycle Management and Marketing Submission Recommendations',
    shortLabel: 'AI Lifecycle Draft Guidance',
    citation: 'FDA AI Lifecycle Draft Guidance',
    url: 'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/artificial-intelligence-enabled-device-software-functions-lifecycle-management-and-marketing',
    tier: 'guidance',
    rationale: 'Relevant for AI-enabled device lifecycle and TPLC risk framing.',
  },
  cybersecurity: {
    key: 'cybersecurity',
    title: 'Cybersecurity in Medical Devices: Quality Management System Considerations and Content of Premarket Submissions',
    shortLabel: 'Cybersecurity Guidance',
    citation: 'FDA Cybersecurity Guidance',
    url: 'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/cybersecurity-medical-devices-quality-management-system-considerations-and-content-premarket',
    tier: 'guidance',
    rationale: 'Relevant for cyber devices and section 524B expectations.',
  },

  /* ---- standards ---- */

  standards_db: {
    key: 'standards_db',
    title: 'Recognized Consensus Standards: Medical Devices',
    shortLabel: 'FDA Recognized Standards DB',
    citation: 'FDA Recognized Consensus Standards Database',
    url: 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfstandards/search.cfm',
    tier: 'standard',
    rationale: 'Use to route recognized standards such as ISO 10993, IEC 62304, IEC 62366, etc.',
  },
  usp_el: {
    key: 'usp_el',
    title: 'USP Extractables and Leachables',
    shortLabel: 'USP E&L',
    citation: 'USP Extractables and Leachables',
    url: 'https://www.usp.org/impurities/extractables-and-leachables',
    tier: 'standard',
    rationale: 'Relevant when material-contact, polymer, packaging, or leachables issues are implicated.',
  },
  usp_1661: {
    key: 'usp_1661',
    title: 'USP <1661> Evaluation of Plastic Packaging Systems and Their Materials of Construction',
    shortLabel: 'USP <1661>',
    citation: 'USP <1661>',
    url: 'https://www.usp.org/sites/default/files/usp/document/workshops/1661_evaluation_of_plastic_packaging_systems_and_their_materials_of_construction_with_respect_to_their_user_safety_impact_pf_42.pdf',
    tier: 'standard',
    rationale: 'Relevant for polymeric packaging/material-contact risk narratives.',
  },

  /* ---- MDSAP ---- */

  mdsap_program: {
    key: 'mdsap_program',
    title: 'Medical Device Single Audit Program',
    shortLabel: 'MDSAP',
    citation: 'FDA MDSAP',
    url: 'https://www.fda.gov/medical-devices/cdrh-international-affairs/medical-device-single-audit-program-mdsap',
    tier: 'mdsap',
    rationale: 'Supplemental benchmarking source for device QMS process expectations.',
  },
  mdsap_audit_approach: {
    key: 'mdsap_audit_approach',
    title: 'MDSAP Audit Procedures and Forms / Audit Approach',
    shortLabel: 'MDSAP Audit Approach',
    citation: 'MDSAP AU P0002',
    url: 'https://www.fda.gov/medical-devices/medical-device-single-audit-program-mdsap/mdsap-audit-procedures-and-forms',
    tier: 'mdsap',
    rationale: 'Process-based audit benchmarking, not primary FDA QMSR law.',
  },
};

/** Look up a single citation by key. Throws if not found. */
export function citation(key: string): GuardrailCitation {
  const entry = GUARDRAILS[key];
  if (!entry) throw new Error(`Unknown guardrail key: ${key}`);
  return entry;
}

/** All citations that should appear in every narrative. */
export function alwaysReferenceCitations(): GuardrailCitation[] {
  return Object.values(GUARDRAILS).filter((c) => c.alwaysReference === true);
}

/** Filter registry by tier. */
export function citationsByTier(tier: GuardrailTier): GuardrailCitation[] {
  return Object.values(GUARDRAILS).filter((c) => c.tier === tier);
}

/** Binding QMSR basis (Part 820, Scope, Subpart B). */
export function baseBindingCitations(): GuardrailCitation[] {
  return [GUARDRAILS.qmsr_part820, GUARDRAILS.qmsr_scope, GUARDRAILS.qmsr_supplemental];
}

/** Inspection lens (CP 7382.850, QMSR FAQ). */
export function baseInspectionCitations(): GuardrailCitation[] {
  return [GUARDRAILS.cp7382850, GUARDRAILS.qmsr_faq];
}

/** Deduplicate citations by key. */
export function dedupeCitations(items: GuardrailCitation[]): GuardrailCitation[] {
  const seen = new Set<string>();
  return items.filter((c) => {
    if (seen.has(c.key)) return false;
    seen.add(c.key);
    return true;
  });
}
