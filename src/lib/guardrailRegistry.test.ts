import { describe, expect, it } from 'vitest';

import {
  GUARDRAILS,
  alwaysReferenceCitations,
  baseBindingCitations,
  baseInspectionCitations,
  citation,
  citationsByTier,
  dedupeCitations,
} from '@/lib/guardrailRegistry';

describe('GUARDRAILS registry', () => {
  it('contains all expected keys', () => {
    const expected = [
      'qmsr_part820',
      'qmsr_scope',
      'qmsr_supplemental',
      'part803',
      'cp7382850',
      'qmsr_faq',
      'software_validation',
      'device_software_premarket',
      'ai_pccp',
      'ai_lifecycle_draft',
      'cybersecurity',
      'standards_db',
      'usp_el',
      'usp_1661',
      'mdsap_program',
      'mdsap_audit_approach',
    ];
    for (const key of expected) {
      expect(GUARDRAILS[key], `missing key: ${key}`).toBeDefined();
    }
  });

  it('every entry has required fields', () => {
    for (const [key, entry] of Object.entries(GUARDRAILS)) {
      expect(entry.key, `${key}.key`).toBe(key);
      expect(entry.title, `${key}.title`).toBeTruthy();
      expect(entry.shortLabel, `${key}.shortLabel`).toBeTruthy();
      expect(entry.citation, `${key}.citation`).toBeTruthy();
      expect(entry.url, `${key}.url`).toBeTruthy();
      expect(entry.tier, `${key}.tier`).toBeTruthy();
      expect(entry.rationale, `${key}.rationale`).toBeTruthy();
    }
  });
});

describe('citation()', () => {
  it('returns the correct entry', () => {
    const c = citation('qmsr_part820');
    expect(c.shortLabel).toBe('21 CFR Part 820');
    expect(c.tier).toBe('binding');
  });

  it('throws for unknown key', () => {
    expect(() => citation('nonexistent')).toThrow('Unknown guardrail key');
  });
});

describe('alwaysReferenceCitations()', () => {
  it('returns entries with alwaysReference: true', () => {
    const always = alwaysReferenceCitations();
    expect(always.length).toBeGreaterThanOrEqual(4);
    for (const c of always) {
      expect(c.alwaysReference).toBe(true);
    }
  });

  it('includes Part 820, Scope, Subpart B, CP 7382.850, and QMSR FAQ', () => {
    const keys = alwaysReferenceCitations().map((c) => c.key);
    expect(keys).toContain('qmsr_part820');
    expect(keys).toContain('qmsr_scope');
    expect(keys).toContain('qmsr_supplemental');
    expect(keys).toContain('cp7382850');
    expect(keys).toContain('qmsr_faq');
  });
});

describe('citationsByTier()', () => {
  it('returns only binding entries for binding tier', () => {
    const binding = citationsByTier('binding');
    expect(binding.length).toBeGreaterThanOrEqual(3);
    for (const c of binding) {
      expect(c.tier).toBe('binding');
    }
  });

  it('returns only mdsap entries for mdsap tier', () => {
    const mdsap = citationsByTier('mdsap');
    expect(mdsap.length).toBe(2);
    for (const c of mdsap) {
      expect(c.tier).toBe('mdsap');
    }
  });
});

describe('baseBindingCitations()', () => {
  it('returns Part 820, Scope, and Subpart B', () => {
    const basis = baseBindingCitations();
    expect(basis.map((c) => c.key)).toEqual(['qmsr_part820', 'qmsr_scope', 'qmsr_supplemental']);
  });
});

describe('baseInspectionCitations()', () => {
  it('returns CP 7382.850 and QMSR FAQ', () => {
    const lens = baseInspectionCitations();
    expect(lens.map((c) => c.key)).toEqual(['cp7382850', 'qmsr_faq']);
  });
});

describe('dedupeCitations()', () => {
  it('removes duplicate entries by key', () => {
    const c1 = citation('qmsr_part820');
    const c2 = citation('cp7382850');
    const result = dedupeCitations([c1, c2, c1, c2]);
    expect(result).toHaveLength(2);
    expect(result[0].key).toBe('qmsr_part820');
    expect(result[1].key).toBe('cp7382850');
  });
});
