import { describe, expect, it } from 'vitest';

import {
  buildFocus,
  buildOAIFactors,
  buildRiskThread,
  getOverallReadiness,
  triangulate,
} from '@/lib/analysis';
import { isPremarket } from '@/lib/domain';
import type { AnalysisContext, FDAData, OAIContext, ReadinessContext } from '@/types/analysis';
import type { SignalKey } from '@/lib/signalRegistry';
import { DEFAULT_RATINGS } from '@/types/scenario';

const emptyAreaNotes = {
  mgmt: '',
  dd: '',
  prod: '',
  change: '',
  out: '',
  meas: '',
} as const;

function baseAnalysisContext(overrides: Partial<AnalysisContext> = {}): AnalysisContext {
  return {
    inspType: 'baseline',
    marketedUS: true,
    ratings: { ...DEFAULT_RATINGS },
    areaNotes: { ...emptyAreaNotes },
    risk: '',
    signals: [] as SignalKey[],
    aiEnabled: false,
    swEnabled: false,
    cyberEnabled: false,
    pccpPlanned: false,
    pathway: 'standard',
    manualClass: '2',
    classSource: 'manual',
    deviceClass: '',
    productCode: '',
    regulationNum: '',
    ...overrides,
  };
}

describe('isPremarket', () => {
  it('returns true for pmaPre + marketedUS=false', () => {
    expect(isPremarket('pmaPre', false)).toBe(true);
  });

  it('returns false for pmaPre + marketedUS=true', () => {
    expect(isPremarket('pmaPre', true)).toBe(false);
  });

  it('returns false for baseline + marketedUS=false', () => {
    expect(isPremarket('baseline', false)).toBe(false);
  });
});

describe('buildFocus', () => {
  it("for 'mgmt' in a baseline AI-device scenario: result includes AI-related language", () => {
    const bullets = buildFocus(
      'mgmt',
      baseAnalysisContext({
        inspType: 'baseline',
        aiEnabled: true,
        swEnabled: true,
      }),
    );
    const text = bullets.join(' ');
    expect(text).toMatch(/AI\/ML/i);
  });

  it("for 'dd' with cyber=true: result includes Section 524B language", () => {
    const bullets = buildFocus('dd', baseAnalysisContext({ cyberEnabled: true }));
    const text = bullets.join(' ');
    expect(text).toMatch(/524B/i);
  });

  it("for 'prod' with risk containing 'sterility': includes sterile product overlay", () => {
    const bullets = buildFocus(
      'prod',
      baseAnalysisContext({ risk: 'Primary risk is sterility assurance failure.' }),
    );
    const text = bullets.join(' ');
    expect(text).toMatch(/Sterile product/i);
  });

  it("for premarket mode: suppresses MDR/recall language in 'meas' area", () => {
    const premarket = buildFocus(
      'meas',
      baseAnalysisContext({
        inspType: 'pmaPre',
        marketedUS: false,
      }),
    );
    const postmarket = buildFocus('meas', baseAnalysisContext({ inspType: 'baseline', marketedUS: true }));

    const pmText = premarket.join(' ');
    expect(pmText).not.toMatch(/\bMDR\b/i);
    expect(pmText).not.toMatch(/complaint handling/i);
    expect(pmText).not.toMatch(/recall readiness/i);

    const postText = postmarket.join(' ');
    expect(postText).toMatch(/MDR|complaint/i);
  });
});

describe('buildRiskThread', () => {
  it("for 'baseline': sequence starts with 'mgmt'", () => {
    const t = buildRiskThread(baseAnalysisContext({ inspType: 'baseline' }));
    expect(t.sequence[0]).toBe('mgmt');
  });

  it("for 'forcause': entry is 'meas', sequence starts with 'meas'", () => {
    const t = buildRiskThread(baseAnalysisContext({ inspType: 'forcause' }));
    expect(t.entry).toBe('meas');
    expect(t.sequence[0]).toBe('meas');
  });

  it("for 'spra': entry is 'dd'", () => {
    const t = buildRiskThread(baseAnalysisContext({ inspType: 'spra' }));
    expect(t.entry).toBe('dd');
  });

  it("for 'pmaPre': sequence uses ['dd','prod','change','out','meas','mgmt']", () => {
    const t = buildRiskThread(baseAnalysisContext({ inspType: 'pmaPre' }));
    expect(t.sequence).toEqual(['dd', 'prod', 'change', 'out', 'meas', 'mgmt']);
  });
});

describe('buildOAIFactors', () => {
  const baseOai = (overrides: Partial<OAIContext>): OAIContext => ({
    ratings: { ...DEFAULT_RATINGS },
    risk: '',
    flags: [],
    manualClass: '2',
    deviceClass: '',
    aiEnabled: false,
    cyberEnabled: false,
    swEnabled: false,
    ...overrides,
  });

  it('2 weak areas → systemic medium (ratings are secondary to triangulation)', () => {
    const o = buildOAIFactors(
      baseOai({
        ratings: {
          mgmt: 'weak',
          dd: 'weak',
          prod: 'strong',
          change: 'strong',
          out: 'strong',
          meas: 'strong',
        },
      }),
    );
    expect(o.systemic.level).toBe('medium');
  });

  it('0 weak areas → systemic low', () => {
    const o = buildOAIFactors(
      baseOai({
        ratings: {
          mgmt: 'strong',
          dd: 'strong',
          prod: 'strong',
          change: 'strong',
          out: 'strong',
          meas: 'strong',
        },
      }),
    );
    expect(o.systemic.level).toBe('low');
  });

  it('Class III + safety risk keyword → impact high', () => {
    const o = buildOAIFactors(
      baseOai({
        manualClass: '3',
        deviceClass: '3',
        risk: 'Potential patient harm and safety failure modes.',
      }),
    );
    expect(o.impact.level).toBe('high');
  });

  it('meas=weak + sw=true → detect high', () => {
    const o = buildOAIFactors(
      baseOai({
        swEnabled: true,
        ratings: {
          mgmt: 'strong',
          dd: 'strong',
          prod: 'strong',
          change: 'strong',
          out: 'strong',
          meas: 'weak',
        },
      }),
    );
    expect(o.detect.level).toBe('high');
  });

  it('2+ high factors → patternTone warn', () => {
    const o = buildOAIFactors(
      baseOai({
        ratings: {
          mgmt: 'weak',
          dd: 'weak',
          prod: 'weak',
          change: 'strong',
          out: 'strong',
          meas: 'strong',
        },
        manualClass: '3',
        deviceClass: '3',
        risk: 'Safety-critical failure modes for Class III implant.',
      }),
    );
    expect(o.patternTone).toBe('warn');
  });
});

describe('getOverallReadiness', () => {
  const baseReadiness = (overrides: Partial<ReadinessContext>): ReadinessContext => ({
    inspType: 'baseline',
    ratings: { ...DEFAULT_RATINGS },
    flags: [],
    ...overrides,
  });

  it("isM2=true, one weak area → moderate (self-ratings do not alone imply 'high')", () => {
    const r = getOverallReadiness(
      baseReadiness({
        inspType: 'baseline',
        ratings: {
          mgmt: 'weak',
          dd: 'strong',
          prod: 'strong',
          change: 'strong',
          out: 'strong',
          meas: 'strong',
        },
      }),
    );
    expect(r.label).toBe('Moderate apparent vulnerability');
  });

  it("isM2=false, 2 strong + 4 unknown → moderate (unknown ratings do not block deterministic posture)", () => {
    const r = getOverallReadiness(
      baseReadiness({
        inspType: 'spra',
        ratings: {
          mgmt: 'strong',
          dd: 'strong',
          prod: 'unknown',
          change: 'unknown',
          out: 'unknown',
          meas: 'unknown',
        },
      }),
    );
    expect(r.label).toBe('Moderate apparent vulnerability');
  });

  it('All 6 strong, no high flags → Lower apparent vulnerability', () => {
    const r = getOverallReadiness(
      baseReadiness({
        inspType: 'spra',
        ratings: {
          mgmt: 'strong',
          dd: 'strong',
          prod: 'strong',
          change: 'strong',
          out: 'strong',
          meas: 'strong',
        },
        flags: [],
      }),
    );
    expect(r.label).toBe('Lower apparent vulnerability');
  });
});

describe('triangulate', () => {
  const emptyFda = (): FDAData => ({
    mdr: {},
    mdrTypes: {},
    recalls: [],
    gudidUrl: null,
    error: null,
  });

  it('MDR trend >25% → returns a high severity meas flag', () => {
    const data: FDAData = {
      ...emptyFda(),
      mdr: {
        '2019': 10,
        '2020': 10,
        '2021': 10,
        '2022': 50,
        '2023': 50,
        '2024': 50,
      },
    };
    const flags = triangulate(data, 'baseline', '2');
    const highMeas = flags.find((f) => f.severity === 'high' && f.area === 'meas');
    expect(highMeas).toBeDefined();
    expect(highMeas?.label).toMatch(/Rising MDR trend/i);
  });

  it('Class I recall present → returns a high severity change flag', () => {
    const data: FDAData = {
      ...emptyFda(),
      recalls: [
        {
          classification: 'Class I',
          recallNumber: 'Z-1234-2024',
        },
      ],
    };
    const flags = triangulate(data, 'baseline', '2');
    const highChange = flags.find((f) => f.severity === 'high' && f.area === 'change');
    expect(highChange).toBeDefined();
    expect(highChange?.label).toMatch(/Class I recall/i);
  });

  it('No data → returns a low severity meas flag', () => {
    const flags = triangulate(null, 'baseline', '2');
    expect(flags.some((f) => f.severity === 'low' && f.area === 'meas')).toBe(true);
  });
});
