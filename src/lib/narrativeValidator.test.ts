import { describe, expect, it } from 'vitest';

import { validateNarrative } from '@/lib/narrativeValidator';
import { buildAdjudication } from '@/lib/adjudication';
import {
  baselineClean,
  supplierChangeClassIII,
} from '@/lib/__fixtures__/scenarios';

describe('validateNarrative', () => {
  describe('non-triggered adjudication', () => {
    it('returns valid with no warnings', () => {
      const adj = buildAdjudication(baselineClean(), null, []);
      const result = validateNarrative('Any text here.', adj);
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('authority citation checks', () => {
    it('passes when all authorities are cited', () => {
      const adj = buildAdjudication(supplierChangeClassIII(), null, []);
      const narrative =
        'The firm failed to evaluate the supplier change. Under 21 CFR Part 820 and CP 7382.850, ' +
        'this creates a high-risk finding. 21 CFR 820.1 and 21 CFR Part 820 Subpart B require ' +
        'documented impact assessment. FDA Recognized Standards DB should be consulted.';
      const result = validateNarrative(narrative, adj);
      const authorityWarnings = result.warnings.filter((w) => w.type === 'missing_authority');
      expect(authorityWarnings).toHaveLength(0);
    });

    it('warns when no authority from a finding is cited', () => {
      const adj = buildAdjudication(supplierChangeClassIII(), null, []);
      // Narrative that mentions nothing about regulatory authorities
      const narrative = 'The firm has a supplier change issue that needs attention.';
      const result = validateNarrative(narrative, adj);
      const authorityWarnings = result.warnings.filter((w) => w.type === 'missing_authority');
      expect(authorityWarnings.length).toBeGreaterThan(0);
      expect(authorityWarnings[0].message).toContain('none of the required authorities');
    });
  });

  describe('softening language checks', () => {
    it('passes when no softening phrases are present', () => {
      const adj = buildAdjudication(supplierChangeClassIII(), null, []);
      const narrative =
        'The firm failed to evaluate the supplier change. This is a high-risk finding. ' +
        '21 CFR Part 820 and CP 7382.850 apply. 21 CFR 820.1 scope. 21 CFR Part 820 Subpart B. ' +
        'FDA Recognized Standards DB.';
      const result = validateNarrative(narrative, adj);
      const softeningWarnings = result.warnings.filter((w) => w.type === 'softening_language');
      expect(softeningWarnings).toHaveLength(0);
    });

    it('warns when "may appear" is found', () => {
      const adj = buildAdjudication(supplierChangeClassIII(), null, []);
      const narrative =
        'The firm may appear to have a gap in supplier evaluation. 21 CFR Part 820. CP 7382.850. ' +
        '21 CFR 820.1. 21 CFR Part 820 Subpart B. FDA Recognized Standards DB. High risk.';
      const result = validateNarrative(narrative, adj);
      const softeningWarnings = result.warnings.filter((w) => w.type === 'softening_language');
      expect(softeningWarnings).toHaveLength(1);
      expect(softeningWarnings[0].message).toContain('may appear');
    });

    it('warns when "if accurate" is found', () => {
      const adj = buildAdjudication(supplierChangeClassIII(), null, []);
      const narrative =
        'If accurate, the supplier change presents risk. 21 CFR Part 820. CP 7382.850. ' +
        '21 CFR 820.1. 21 CFR Part 820 Subpart B. FDA Recognized Standards DB. High risk.';
      const result = validateNarrative(narrative, adj);
      const softeningWarnings = result.warnings.filter((w) => w.type === 'softening_language');
      expect(softeningWarnings).toHaveLength(1);
      expect(softeningWarnings[0].message.toLowerCase()).toContain('if accurate');
    });

    it('warns when "moderate vulnerability" is found', () => {
      const adj = buildAdjudication(supplierChangeClassIII(), null, []);
      const narrative =
        'This presents a moderate vulnerability. 21 CFR Part 820. CP 7382.850. ' +
        '21 CFR 820.1. 21 CFR Part 820 Subpart B. FDA Recognized Standards DB. High risk.';
      const result = validateNarrative(narrative, adj);
      const softeningWarnings = result.warnings.filter((w) => w.type === 'softening_language');
      expect(softeningWarnings).toHaveLength(1);
    });
  });

  describe('risk level checks', () => {
    it('passes when risk level term appears', () => {
      const adj = buildAdjudication(supplierChangeClassIII(), null, []);
      const narrative =
        'This is a high-risk finding. 21 CFR Part 820. CP 7382.850. ' +
        '21 CFR 820.1. 21 CFR Part 820 Subpart B. FDA Recognized Standards DB.';
      const result = validateNarrative(narrative, adj);
      const riskWarnings = result.warnings.filter((w) => w.type === 'missing_risk_level');
      expect(riskWarnings).toHaveLength(0);
    });

    it('warns when risk level term is missing', () => {
      const adj = buildAdjudication(supplierChangeClassIII(), null, []);
      const narrative =
        'The firm has a supplier change issue. 21 CFR Part 820. CP 7382.850. ' +
        '21 CFR 820.1. 21 CFR Part 820 Subpart B. FDA Recognized Standards DB.';
      const result = validateNarrative(narrative, adj);
      const riskWarnings = result.warnings.filter((w) => w.type === 'missing_risk_level');
      expect(riskWarnings).toHaveLength(1);
      expect(riskWarnings[0].message).toContain('HIGH');
    });
  });

  describe('multiple issues', () => {
    it('reports multiple warnings simultaneously', () => {
      const adj = buildAdjudication(supplierChangeClassIII(), null, []);
      // Missing authorities, has softening, missing risk level
      const narrative = 'The firm may appear to have an issue.';
      const result = validateNarrative(narrative, adj);
      expect(result.valid).toBe(false);
      expect(result.warnings.length).toBeGreaterThanOrEqual(2);
      const types = result.warnings.map((w) => w.type);
      expect(types).toContain('softening_language');
      expect(types).toContain('missing_risk_level');
    });
  });

  describe('valid: true only when no warnings', () => {
    it('returns valid: false when any warning exists', () => {
      const adj = buildAdjudication(supplierChangeClassIII(), null, []);
      const narrative = 'Just some text without any authority citations.';
      const result = validateNarrative(narrative, adj);
      expect(result.valid).toBe(false);
    });
  });
});
