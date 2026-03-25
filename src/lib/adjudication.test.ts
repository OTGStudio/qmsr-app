import { describe, expect, it } from 'vitest';

import { buildAdjudication, buildTechnologyGuidance } from '@/lib/adjudication';
import {
  aiDevice,
  baselineClean,
  capaRecurrence,
  complaintsUserError,
  contradictoryPremarket,
  cyberForcause,
  deathMDR,
  designChangeNoVV,
  emptyFDAData,
  managementReviewMissing,
  pmaPremarket,
  postmarketMDR,
  processValidationGap,
  recallScenario,
  risingMDRData,
  softwareLifecycleGap,
  strongSystem,
  supplierChange,
  supplierChangeClassIII,
  unvalidatedSpreadsheet,
} from '@/lib/__fixtures__/scenarios';

describe('buildAdjudication', () => {
  describe('TC1 — Supplier change Class III', () => {
    it('fires with HIGH risk for Class III supplier change without evaluation', () => {
      const result = buildAdjudication(supplierChangeClassIII(), null, []);
      expect(result.triggered).toBe(true);
      expect(result.overallRiskLevel).toBe('HIGH');

      const tc1 = result.findings.find((f) => f.ruleId === 'TC1_SUPPLIER_CHANGE_NO_EVAL');
      expect(tc1).toBeDefined();
      expect(tc1!.riskLevel).toBe('HIGH');
      expect(tc1!.qmsAreas).toContain('change');
      expect(tc1!.authorities.some((a) => a.key === 'qmsr_part820')).toBe(true);
      expect(tc1!.authorities.some((a) => a.key === 'cp7382850')).toBe(true);
    });

    it('includes biocompatibility sub-finding', () => {
      const result = buildAdjudication(supplierChangeClassIII(), null, []);
      const biocomp = result.findings.find((f) => f.ruleId === 'TC1_BIOCOMP_REVIEW_MISSING');
      expect(biocomp).toBeDefined();
      expect(biocomp!.riskLevel).toBe('HIGH');
    });
  });

  describe('TC2 — Complaints user error without trending', () => {
    it('fires with MEDIUM-HIGH risk', () => {
      const result = buildAdjudication(complaintsUserError(), null, []);
      expect(result.triggered).toBe(true);

      const tc2 = result.findings.find((f) => f.ruleId === 'TC2_USER_ERROR_WITHOUT_TRENDING');
      expect(tc2).toBeDefined();
      expect(tc2!.riskLevel).toBe('MEDIUM-HIGH');
      expect(tc2!.qmsAreas).toContain('meas');
      expect(tc2!.authorities.some((a) => a.key === 'part803')).toBe(true);
    });

    it('includes CAPA not initiated sub-finding', () => {
      const result = buildAdjudication(complaintsUserError(), null, []);
      const capa = result.findings.find((f) => f.ruleId === 'TC2_CAPA_NOT_INITIATED');
      expect(capa).toBeDefined();
    });

    it('includes risk file not updated sub-finding', () => {
      const result = buildAdjudication(complaintsUserError(), null, []);
      const rf = result.findings.find((f) => f.ruleId === 'TC2_RISK_FILE_NOT_UPDATED');
      expect(rf).toBeDefined();
    });
  });

  describe('TC3 — Unvalidated spreadsheet', () => {
    it('fires with HIGH risk for unvalidated spreadsheet with post-release error', () => {
      const result = buildAdjudication(unvalidatedSpreadsheet(), null, []);
      expect(result.triggered).toBe(true);
      expect(result.overallRiskLevel).toBe('HIGH');

      const tc3 = result.findings.find((f) => f.ruleId === 'TC3_UNVALIDATED_SPREADSHEET');
      expect(tc3).toBeDefined();
      expect(tc3!.riskLevel).toBe('HIGH');
      expect(tc3!.qmsAreas).toContain('prod');
      expect(tc3!.authorities.some((a) => a.key === 'software_validation')).toBe(true);
    });

    it('includes no independent review sub-finding', () => {
      const result = buildAdjudication(unvalidatedSpreadsheet(), null, []);
      const ir = result.findings.find((f) => f.ruleId === 'TC3_NO_INDEPENDENT_REVIEW');
      expect(ir).toBeDefined();
    });
  });

  describe('TC4 — Design change without V&V reassessment', () => {
    it('fires with HIGH risk for Class III design change without V&V', () => {
      const result = buildAdjudication(designChangeNoVV(), null, []);
      expect(result.triggered).toBe(true);
      const tc4 = result.findings.find((f) => f.ruleId === 'TC4_DESIGN_CHANGE_NO_VV');
      expect(tc4).toBeDefined();
      expect(tc4!.riskLevel).toBe('HIGH');
      expect(tc4!.qmsAreas).toContain('dd');
      expect(tc4!.qmsAreas).toContain('change');
    });
  });

  describe('TC5 — CAPA recurrence', () => {
    it('fires with HIGH risk for recurring issue after CAPA closure', () => {
      const result = buildAdjudication(capaRecurrence(), null, []);
      expect(result.triggered).toBe(true);
      const tc5 = result.findings.find((f) => f.ruleId === 'TC5_CAPA_RECURRENCE');
      expect(tc5).toBeDefined();
      expect(tc5!.riskLevel).toBe('HIGH');
      expect(tc5!.qmsAreas).toContain('meas');
      expect(tc5!.qmsAreas).toContain('mgmt');
    });
  });

  describe('TC6 — Process validation gap', () => {
    it('fires with MEDIUM-HIGH risk for unvalidated special process', () => {
      const result = buildAdjudication(processValidationGap(), null, []);
      expect(result.triggered).toBe(true);
      const tc6 = result.findings.find((f) => f.ruleId === 'TC6_PROCESS_VALIDATION_GAP');
      expect(tc6).toBeDefined();
      expect(tc6!.riskLevel).toBe('MEDIUM-HIGH');
      expect(tc6!.qmsAreas).toContain('prod');
    });
  });

  describe('TC7 — Management review missing', () => {
    it('fires with MEDIUM risk for missing management review', () => {
      const result = buildAdjudication(managementReviewMissing(), null, []);
      expect(result.triggered).toBe(true);
      const tc7 = result.findings.find((f) => f.ruleId === 'TC7_MANAGEMENT_REVIEW_MISSING');
      expect(tc7).toBeDefined();
      expect(tc7!.riskLevel).toBe('MEDIUM');
      expect(tc7!.qmsAreas).toContain('mgmt');
      expect(tc7!.authorities.some((a) => a.key === 'qmsr_supplemental')).toBe(true);
    });
  });

  describe('TC8 — Software lifecycle gap', () => {
    it('fires with MEDIUM risk for Class 2 swEnabled device without lifecycle docs', () => {
      const result = buildAdjudication(softwareLifecycleGap(), null, []);
      expect(result.triggered).toBe(true);
      const tc8 = result.findings.find((f) => f.ruleId === 'TC8_SOFTWARE_LIFECYCLE_GAP');
      expect(tc8).toBeDefined();
      expect(tc8!.riskLevel).toBe('MEDIUM');
      expect(tc8!.qmsAreas).toContain('dd');
      expect(tc8!.authorities.some((a) => a.key === 'software_validation')).toBe(true);
    });
  });

  describe('regression — existing fixtures do NOT trigger', () => {
    const fixtures = [
      { name: 'baselineClean', factory: baselineClean },
      { name: 'postmarketMDR', factory: postmarketMDR },
      { name: 'cyberForcause', factory: cyberForcause },
      { name: 'pmaPremarket', factory: pmaPremarket },
      { name: 'recallScenario', factory: recallScenario },
      { name: 'aiDevice', factory: aiDevice },
      { name: 'strongSystem', factory: strongSystem },
      { name: 'deathMDR', factory: deathMDR },
      { name: 'supplierChange (Class 2)', factory: supplierChange },
      { name: 'contradictoryPremarket', factory: contradictoryPremarket },
    ];

    for (const { name, factory } of fixtures) {
      it(`${name} → triggered: false`, () => {
        const result = buildAdjudication(factory(), emptyFDAData(), []);
        expect(result.triggered).toBe(false);
        expect(result.findings).toHaveLength(0);
      });
    }
  });

  describe('confidence level', () => {
    it('is MEDIUM when fdaData is present', () => {
      const result = buildAdjudication(supplierChangeClassIII(), risingMDRData(), []);
      expect(result.confidenceLevel).toBe('MEDIUM');
    });

    it('is LOW when fdaData is null', () => {
      const result = buildAdjudication(supplierChangeClassIII(), null, []);
      expect(result.confidenceLevel).toBe('LOW');
    });
  });

  describe('narrative prohibitions', () => {
    it('includes prohibitions when findings are triggered', () => {
      const result = buildAdjudication(supplierChangeClassIII(), null, []);
      expect(result.narrativeProhibitions.length).toBeGreaterThan(0);
    });

    it('has empty prohibitions when no findings trigger', () => {
      const result = buildAdjudication(baselineClean(), null, []);
      expect(result.narrativeProhibitions).toHaveLength(0);
    });
  });

  describe('binding basis and inspection lens', () => {
    it('always includes Part 820, Scope, Subpart B as binding basis', () => {
      const result = buildAdjudication(baselineClean(), null, []);
      const keys = result.bindingBasis.map((c) => c.key);
      expect(keys).toContain('qmsr_part820');
      expect(keys).toContain('qmsr_scope');
      expect(keys).toContain('qmsr_supplemental');
    });

    it('always includes CP 7382.850 and QMSR FAQ as inspection lens', () => {
      const result = buildAdjudication(baselineClean(), null, []);
      const keys = result.inspectionLens.map((c) => c.key);
      expect(keys).toContain('cp7382850');
      expect(keys).toContain('qmsr_faq');
    });
  });
});

describe('buildTechnologyGuidance', () => {
  it('routes AI + software guidance for AI device', () => {
    const guidance = buildTechnologyGuidance(aiDevice());
    const ai = guidance.find((g) => g.technology === 'ai');
    expect(ai).toBeDefined();
    expect(ai!.applies).toBe(true);
    // AI device also has pccpPlanned: true
    expect(ai!.citations.some((c) => c.key === 'ai_pccp')).toBe(true);

    const sw = guidance.find((g) => g.technology === 'software');
    expect(sw).toBeDefined();
    expect(sw!.applies).toBe(true);
  });

  it('routes cybersecurity guidance for cyber device', () => {
    const guidance = buildTechnologyGuidance(cyberForcause());
    const cyber = guidance.find((g) => g.technology === 'cybersecurity');
    expect(cyber).toBeDefined();
    expect(cyber!.applies).toBe(true);
    expect(cyber!.citations.some((c) => c.key === 'cybersecurity')).toBe(true);
  });

  it('always includes MDSAP as benchmarking', () => {
    const guidance = buildTechnologyGuidance(baselineClean());
    const mdsap = guidance.find((g) => g.technology === 'mdsap');
    expect(mdsap).toBeDefined();
    expect(mdsap!.applies).toBe(true);
  });

  it('does NOT route AI/SW/cyber for baseline clean', () => {
    const guidance = buildTechnologyGuidance(baselineClean());
    expect(guidance.find((g) => g.technology === 'ai')).toBeUndefined();
    expect(guidance.find((g) => g.technology === 'software')).toBeUndefined();
    expect(guidance.find((g) => g.technology === 'cybersecurity')).toBeUndefined();
  });

  it('does NOT route USP for scenarios without material-contact risk', () => {
    const guidance = buildTechnologyGuidance(baselineClean());
    expect(guidance.find((g) => g.technology === 'usp')).toBeUndefined();
  });
});
