import { describe, expect, it } from 'vitest';

import {
  buildFocus,
  getOverallReadiness,
  scenarioToAnalysisContext,
  triangulate,
} from '@/lib/analysis';
import { AREA_ORDER } from '@/lib/domain';
import { baselineClean, postmarketMDR } from '@/lib/__fixtures__/scenarios';

describe('scenario output contracts', () => {
  it('unsupported custom signal in scenario does not alter deterministic focus when canonical signals empty', () => {
    const base = scenarioToAnalysisContext(baselineClean());
    const withNote = scenarioToAnalysisContext({
      ...baselineClean(),
      unsupportedSignals: ['something vague from leadership'],
    });
    const baseText = AREA_ORDER.map((k) => buildFocus(k, base).join(' ')).join('\n');
    const noteText = AREA_ORDER.map((k) => buildFocus(k, withNote).join(' ')).join('\n');
    expect(baseText).toBe(noteText);
  });

  it('postmarketMDR fixture produces stable high-level readiness vs null FDA flags', () => {
    const s = postmarketMDR();
    const flags = triangulate(null, s.inspType ?? 'baseline', s.manualClass);
    const r = getOverallReadiness({
      inspType: s.inspType ?? 'baseline',
      ratings: s.ratings,
      flags,
      signalKeys: s.signals,
    });
    expect(['warn', 'partial', 'good']).toContain(r.tone);
    expect(r.label.length).toBeGreaterThan(0);
  });
});
