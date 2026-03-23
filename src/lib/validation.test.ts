import { describe, expect, it } from 'vitest';

import { validateFEI, validateScenario } from '@/lib/validation';
import {
  baselineClean,
  contradictoryPremarket,
  pmaPremarket,
  postmarketMDR,
} from '@/lib/__fixtures__/scenarios';
import type { Scenario } from '@/types/scenario';
import { DEFAULT_SCENARIO } from '@/types/scenario';

describe('validateFEI', () => {
  it('returns null for empty string', () => {
    expect(validateFEI('')).toBeNull();
  });

  it('returns null for whitespace-only string', () => {
    expect(validateFEI('   ')).toBeNull();
  });

  it('returns null for valid 10-digit FEI', () => {
    expect(validateFEI('3001234567')).toBeNull();
  });

  it('returns error for 9 digits', () => {
    const result = validateFEI('123456789');
    expect(result).not.toBeNull();
    expect(result!.code).toBe('FEI_FORMAT');
    expect(result!.message).toContain('exactly 10 digits');
  });

  it('returns error for 11 digits', () => {
    const result = validateFEI('12345678901');
    expect(result).not.toBeNull();
    expect(result!.code).toBe('FEI_FORMAT');
    expect(result!.message).toContain('exactly 10 digits');
  });

  it('returns error for alpha characters', () => {
    const result = validateFEI('300ABC4567');
    expect(result).not.toBeNull();
    expect(result!.code).toBe('FEI_FORMAT');
    expect(result!.message).toContain('numbers only');
  });

  it('returns error for FEI with spaces', () => {
    const result = validateFEI('300 123 4567');
    expect(result).not.toBeNull();
    expect(result!.code).toBe('FEI_FORMAT');
  });

  it('returns error for FEI with dashes', () => {
    const result = validateFEI('300-123-4567');
    expect(result).not.toBeNull();
    expect(result!.code).toBe('FEI_FORMAT');
  });
});

describe('validateScenario', () => {
  describe('errors', () => {
    it('missing inspType returns INSP_TYPE_REQUIRED error', () => {
      const s: Scenario = { ...DEFAULT_SCENARIO, inspType: undefined, risk: 'Some risk.' };
      const result = validateScenario(s);
      expect(result.errors.some((e) => e.code === 'INSP_TYPE_REQUIRED')).toBe(true);
    });

    it('empty risk returns RISK_REQUIRED error', () => {
      const s: Scenario = { ...DEFAULT_SCENARIO, inspType: 'baseline', risk: '' };
      const result = validateScenario(s);
      expect(result.errors.some((e) => e.code === 'RISK_REQUIRED')).toBe(true);
    });

    it('whitespace-only risk returns RISK_REQUIRED error', () => {
      const s: Scenario = { ...DEFAULT_SCENARIO, inspType: 'baseline', risk: '   ' };
      const result = validateScenario(s);
      expect(result.errors.some((e) => e.code === 'RISK_REQUIRED')).toBe(true);
    });

    it('invalid FEI returns FEI_FORMAT error', () => {
      const s: Scenario = { ...baselineClean(), feiNumber: '12345' };
      const result = validateScenario(s);
      expect(result.errors.some((e) => e.code === 'FEI_FORMAT')).toBe(true);
    });

    it('multiple errors returned together', () => {
      const s: Scenario = { ...DEFAULT_SCENARIO, inspType: undefined, risk: '', feiNumber: 'ABC' };
      const result = validateScenario(s);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });

    it('valid scenario returns no errors', () => {
      const result = validateScenario(baselineClean());
      expect(result.errors).toEqual([]);
    });
  });

  describe('warnings', () => {
    it('pmaPre + marketedUS:true returns PREMARKET_MARKETED_CONTRADICTION', () => {
      const result = validateScenario(contradictoryPremarket());
      expect(result.warnings.some((w) => w.code === 'PREMARKET_MARKETED_CONTRADICTION')).toBe(true);
    });

    it('premarketReview + marketedUS:true returns PREMARKET_MARKETED_CONTRADICTION', () => {
      const s: Scenario = { ...baselineClean(), inspType: 'premarketReview', marketedUS: true };
      const result = validateScenario(s);
      expect(result.warnings.some((w) => w.code === 'PREMARKET_MARKETED_CONTRADICTION')).toBe(true);
    });

    it('pmaPre + marketedUS:false returns NO contradiction warning', () => {
      const result = validateScenario(pmaPremarket());
      expect(result.warnings.some((w) => w.code === 'PREMARKET_MARKETED_CONTRADICTION')).toBe(false);
    });

    it('baseline + marketedUS:true returns NO contradiction warning', () => {
      const result = validateScenario(baselineClean());
      expect(result.warnings.some((w) => w.code === 'PREMARKET_MARKETED_CONTRADICTION')).toBe(false);
    });

    it('marketedUS:false + MDR increase signal returns POSTMARKET_SIGNAL_ON_PREMARKET', () => {
      const s: Scenario = {
        ...pmaPremarket(),
        signals: ['MDR increase'],
      };
      const result = validateScenario(s);
      expect(result.warnings.some((w) => w.code === 'POSTMARKET_SIGNAL_ON_PREMARKET')).toBe(true);
    });

    it('marketedUS:true + MDR increase signal returns NO postmarket warning', () => {
      const result = validateScenario(postmarketMDR());
      expect(result.warnings.some((w) => w.code === 'POSTMARKET_SIGNAL_ON_PREMARKET')).toBe(false);
    });

    it('marketedUS:false + no postmarket signals returns NO postmarket warning', () => {
      const result = validateScenario(pmaPremarket()); // signals: []
      expect(result.warnings.some((w) => w.code === 'POSTMARKET_SIGNAL_ON_PREMARKET')).toBe(false);
    });
  });
});
