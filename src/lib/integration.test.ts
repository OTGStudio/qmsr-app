import { describe, expect, it } from 'vitest';

import {
  buildFocus,
  buildOAIFactors,
  buildRecordsRequest,
  buildRiskThread,
  getOverallReadiness,
  scenarioToAnalysisContext,
  triangulate,
} from '@/lib/analysis';
import { AREA_ORDER, ITYPES } from '@/lib/domain';
import {
  aiDevice,
  baselineClean,
  contradictoryPremarket,
  cyberForcause,
  deathMDR,
  pmaPremarket,
  postmarketMDR,
  recallScenario,
  strongSystem,
  supplierChange,
} from '@/lib/__fixtures__/scenarios';
import type { Scenario } from '@/types/scenario';

const ALL_FIXTURES: [string, () => Scenario][] = [
  ['baselineClean', baselineClean],
  ['postmarketMDR', postmarketMDR],
  ['cyberForcause', cyberForcause],
  ['pmaPremarket', pmaPremarket],
  ['recallScenario', recallScenario],
  ['aiDevice', aiDevice],
  ['strongSystem', strongSystem],
  ['deathMDR', deathMDR],
  ['supplierChange', supplierChange],
  ['contradictoryPremarket', contradictoryPremarket],
];

describe('full scenario integration', () => {
  describe.each(ALL_FIXTURES)('pipeline for %s', (_name, factory) => {
    const scenario = factory();
    const ctx = scenarioToAnalysisContext(scenario);

    it('buildFocus returns non-empty string[] for all 6 areas', () => {
      for (const area of AREA_ORDER) {
        const bullets = buildFocus(area, ctx);
        expect(Array.isArray(bullets)).toBe(true);
        expect(bullets.length).toBeGreaterThan(0);
      }
    });

    it('buildRiskThread returns valid entry, sequence, and threads', () => {
      const thread = buildRiskThread(ctx);
      expect(AREA_ORDER).toContain(thread.entry);
      expect(thread.sequence.length).toBeGreaterThan(0);
      expect(thread.investigatorQuestion.length).toBeGreaterThan(0);
      for (const area of AREA_ORDER) {
        expect(thread.threads[area]).toBeDefined();
        expect(thread.threads[area].label.length).toBeGreaterThan(0);
        expect(thread.threads[area].questions.length).toBeGreaterThan(0);
      }
    });

    it('buildRiskThread sequence length matches model', () => {
      const thread = buildRiskThread(ctx);
      const inspType = ctx.inspType;
      const model = ITYPES[inspType].model;
      if (model === 2) {
        expect(thread.sequence).toHaveLength(6);
      } else {
        expect(thread.sequence.length).toBeGreaterThanOrEqual(3);
        expect(thread.sequence.length).toBeLessThanOrEqual(6);
      }
    });

    it('buildOAIFactors returns valid levels', () => {
      const flags = triangulate(null, ctx.inspType, ctx.manualClass);
      const oai = buildOAIFactors({
        ratings: ctx.ratings,
        risk: ctx.risk,
        flags,
        manualClass: ctx.manualClass,
        deviceClass: ctx.deviceClass,
        aiEnabled: ctx.aiEnabled,
        cyberEnabled: ctx.cyberEnabled,
        swEnabled: ctx.swEnabled,
      });
      const validLevels = ['high', 'medium', 'low'];
      expect(validLevels).toContain(oai.systemic.level);
      expect(validLevels).toContain(oai.impact.level);
      expect(validLevels).toContain(oai.detect.level);
      expect(['warn', 'partial', 'good']).toContain(oai.patternTone);
    });

    it('getOverallReadiness returns a recognized label', () => {
      const flags = triangulate(null, ctx.inspType, ctx.manualClass);
      const readiness = getOverallReadiness({
        inspType: ctx.inspType,
        ratings: ctx.ratings,
        flags,
      });
      expect(readiness.label.length).toBeGreaterThan(0);
      expect(['warn', 'partial', 'good']).toContain(readiness.tone);
    });

    it('buildRecordsRequest returns at least DHF and risk management file', () => {
      const records = buildRecordsRequest(ctx);
      expect(records.length).toBeGreaterThanOrEqual(2);
      const text = records.join(' ');
      expect(text).toMatch(/Design History File/i);
      expect(text).toMatch(/Risk Management/i);
    });

    it('triangulate with null FDA data returns at least one flag', () => {
      const flags = triangulate(null, ctx.inspType, ctx.manualClass);
      expect(flags.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('cross-function consistency', () => {
    it('aiDevice: focus mentions AI, records include AI, thread includes model performance', () => {
      const ctx = scenarioToAnalysisContext(aiDevice());
      const allFocus = AREA_ORDER.map((k) => buildFocus(k, ctx).join(' ')).join(' ');
      const records = buildRecordsRequest(ctx).join(' ');
      const thread = buildRiskThread(ctx);
      const allQuestions = AREA_ORDER.flatMap((k) => thread.threads[k].questions).join(' ');

      expect(allFocus).toMatch(/AI\/ML/i);
      expect(records).toMatch(/AI\/ML/i);
      expect(allQuestions).toMatch(/model|AI/i);
    });

    it('cyberForcause: entry is meas, focus includes 524B, records include SBOM', () => {
      const ctx = scenarioToAnalysisContext(cyberForcause());
      const thread = buildRiskThread(ctx);
      const allFocus = AREA_ORDER.map((k) => buildFocus(k, ctx).join(' ')).join(' ');
      const records = buildRecordsRequest(ctx).join(' ');

      expect(thread.entry).toBe('meas');
      expect(allFocus).toMatch(/524B/i);
      expect(records).toMatch(/SBOM/i);
    });

    it('pmaPremarket: uses premarket bullets, records use premarket list', () => {
      const ctx = scenarioToAnalysisContext(pmaPremarket());
      const mgmtFocus = buildFocus('mgmt', ctx).join(' ');
      const records = buildRecordsRequest(ctx).join(' ');

      expect(mgmtFocus).toMatch(/Medical Device File|product realization/i);
      expect(records).toMatch(/design transfer/i);
      expect(records).not.toMatch(/CAPA records/i);
    });

    it('contradictoryPremarket: marketedUS=true overrides, uses postmarket bullets', () => {
      const ctx = scenarioToAnalysisContext(contradictoryPremarket());
      // isPremarket returns false when marketedUS=true
      const mgmtFocus = buildFocus('mgmt', ctx).join(' ');
      expect(mgmtFocus).toMatch(/complaint|CAPA|postmarket/i);
    });

    it('strongSystem: lower apparent vulnerability', () => {
      const ctx = scenarioToAnalysisContext(strongSystem());
      const flags = triangulate(null, ctx.inspType, ctx.manualClass);
      const readiness = getOverallReadiness({ inspType: ctx.inspType, ratings: ctx.ratings, flags });
      expect(readiness.tone).toBe('good');
    });
  });
});
