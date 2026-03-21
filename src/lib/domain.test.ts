import { describe, expect, it } from 'vitest';

import {
  AREA_ORDER,
  CLASS_LABELS,
  ITYPES,
  OAFRS,
  PRESETS,
  QMS_AREAS,
  RLABELS,
  SIGNALS,
  isPremarket,
} from '@/lib/domain';
import type { InspectionType, QMSAreaKey } from '@/types/scenario';

describe('QMS_AREAS', () => {
  it('has 6 entries with unique keys', () => {
    expect(QMS_AREAS).toHaveLength(6);
    const keys = QMS_AREAS.map((a) => a.key);
    expect(new Set(keys).size).toBe(6);
  });

  it('covers all QMSAreaKey values', () => {
    const expected: QMSAreaKey[] = ['mgmt', 'dd', 'prod', 'change', 'out', 'meas'];
    expect(QMS_AREAS.map((a) => a.key)).toEqual(expected);
  });

  it('each entry has non-empty label and m2', () => {
    for (const row of QMS_AREAS) {
      expect(row.label.trim().length).toBeGreaterThan(0);
      expect(row.m2.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('AREA_ORDER', () => {
  it('matches documented order', () => {
    expect(AREA_ORDER).toEqual(['mgmt', 'dd', 'prod', 'change', 'out', 'meas']);
  });
});

describe('ITYPES', () => {
  const inspectionTypes: InspectionType[] = [
    'baseline',
    'nonBaseline',
    'compliance',
    'forcause',
    'spra',
    'pmaPre',
    'pmaPost',
    'premarketReview',
  ];

  it('defines all 8 inspection types', () => {
    for (const t of inspectionTypes) {
      expect(ITYPES[t]).toBeDefined();
      expect(ITYPES[t].label.length).toBeGreaterThan(0);
      expect(ITYPES[t].summary.length).toBeGreaterThan(0);
      expect(ITYPES[t].oafrRule.length).toBeGreaterThan(0);
      expect(ITYPES[t].path.length).toBeGreaterThan(0);
      expect([1, 2]).toContain(ITYPES[t].model);
      expect(ITYPES[t].modelLabel).toMatch(/Model [12]/);
    }
  });

  it('marks Model 2 for baseline, pmaPre, premarketReview', () => {
    expect(ITYPES.baseline.model).toBe(2);
    expect(ITYPES.pmaPre.model).toBe(2);
    expect(ITYPES.premarketReview.model).toBe(2);
  });

  it('marks Model 1 for remaining types', () => {
    const m1: InspectionType[] = [
      'nonBaseline',
      'compliance',
      'forcause',
      'spra',
      'pmaPost',
    ];
    for (const t of m1) {
      expect(ITYPES[t].model).toBe(1);
    }
  });
});

describe('OAFRS', () => {
  it('has four CFR references', () => {
    expect(OAFRS).toHaveLength(4);
    const keys = OAFRS.map((o) => o.key);
    expect(keys).toContain('mdr');
    expect(keys).toContain('recall');
    expect(keys).toContain('tracking');
    expect(keys).toContain('udi');
  });
});

describe('SIGNALS', () => {
  it('lists 17 predefined signals', () => {
    expect(SIGNALS).toHaveLength(17);
    expect(SIGNALS).toContain('Complaint trend');
    expect(SIGNALS).toContain('Death-type MDR reports');
  });
});

describe('RLABELS', () => {
  it('maps all rating values to display strings', () => {
    expect(RLABELS.unknown).toBe('Not rated');
    expect(RLABELS.weak).toBe('Needs work');
    expect(RLABELS.partial).toBe('Partial');
    expect(RLABELS.strong).toBe('Strong');
  });
});

describe('CLASS_LABELS', () => {
  it('includes class and pathway labels', () => {
    expect(CLASS_LABELS['1']).toBe('Class I');
    expect(CLASS_LABELS['3']).toBe('Class III');
    expect(CLASS_LABELS.DN).toBe('De Novo (Class II)');
  });
});

describe('PRESETS', () => {
  const presetKeys = [
    'component',
    'sterility',
    'software',
    'ai',
    'cyber',
    'labeling',
    'process',
    'fracture',
  ];

  it('defines 8 scenario presets', () => {
    for (const k of presetKeys) {
      expect(PRESETS[k]).toBeDefined();
      expect(PRESETS[k].label.length).toBeGreaterThan(0);
      expect(PRESETS[k].hint.length).toBeGreaterThan(0);
      expect(PRESETS[k].risk.length).toBeGreaterThan(0);
      expect(PRESETS[k].signals.length).toBeGreaterThan(0);
    }
  });

  it('sets technology flags on relevant presets', () => {
    expect(PRESETS.software.sw).toBe(true);
    expect(PRESETS.ai.ai).toBe(true);
    expect(PRESETS.ai.sw).toBe(true);
    expect(PRESETS.cyber.cyber).toBe(true);
  });
});

describe('isPremarket', () => {
  it('matches analysis contract for premarket types', () => {
    expect(isPremarket('premarketReview', false)).toBe(true);
    expect(isPremarket('premarketReview', true)).toBe(false);
  });
});
