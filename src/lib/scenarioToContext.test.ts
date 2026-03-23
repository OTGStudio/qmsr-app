import { describe, expect, it } from 'vitest';

import { scenarioToAnalysisContext } from '@/lib/analysis';
import { aiDevice, baselineClean, cyberForcause, pmaPremarket } from '@/lib/__fixtures__/scenarios';
import type { Scenario } from '@/types/scenario';
import { DEFAULT_SCENARIO } from '@/types/scenario';

describe('scenarioToAnalysisContext', () => {
  it('maps all core fields correctly', () => {
    const s = cyberForcause();
    const ctx = scenarioToAnalysisContext(s);
    expect(ctx.inspType).toBe('forcause');
    expect(ctx.marketedUS).toBe(true);
    expect(ctx.risk).toBe(s.risk);
    expect(ctx.signals).toEqual(s.signals);
    expect(ctx.aiEnabled).toBe(false);
    expect(ctx.swEnabled).toBe(true);
    expect(ctx.cyberEnabled).toBe(true);
    expect(ctx.pccpPlanned).toBe(false);
    expect(ctx.pathway).toBe('denovo');
    expect(ctx.manualClass).toBe('2');
    expect(ctx.classSource).toBe('manual');
  });

  it('defaults inspType to "baseline" when scenario.inspType is undefined', () => {
    const s: Scenario = { ...DEFAULT_SCENARIO, inspType: undefined };
    const ctx = scenarioToAnalysisContext(s);
    expect(ctx.inspType).toBe('baseline');
  });

  it('preserves ratings record', () => {
    const s = pmaPremarket();
    const ctx = scenarioToAnalysisContext(s);
    expect(ctx.ratings).toEqual(s.ratings);
  });

  it('preserves areaNotes record', () => {
    const s = {
      ...baselineClean(),
      areaNotes: { mgmt: 'mgmt note', dd: '', prod: '', change: '', out: '', meas: '' },
    };
    const ctx = scenarioToAnalysisContext(s);
    expect(ctx.areaNotes.mgmt).toBe('mgmt note');
  });

  it('preserves all technology flags', () => {
    const s = aiDevice();
    const ctx = scenarioToAnalysisContext(s);
    expect(ctx.aiEnabled).toBe(true);
    expect(ctx.swEnabled).toBe(true);
    expect(ctx.cyberEnabled).toBe(false);
    expect(ctx.pccpPlanned).toBe(true);
  });

  it('preserves classification fields', () => {
    const s = pmaPremarket();
    const ctx = scenarioToAnalysisContext(s);
    expect(ctx.pathway).toBe('standard');
    expect(ctx.manualClass).toBe('3');
    expect(ctx.classSource).toBe('manual');
    expect(ctx.deviceClass).toBe('3');
    expect(ctx.productCode).toBe('');
    expect(ctx.regulationNum).toBe('');
  });
});
