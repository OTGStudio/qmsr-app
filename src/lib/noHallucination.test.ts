import { describe, expect, it } from 'vitest';

import {
  buildFocus,
  buildNarrativePrompt,
  buildRecordsRequest,
  scenarioToAnalysisContext,
} from '@/lib/analysis';
import { AREA_ORDER } from '@/lib/domain';
import { baselineClean, pmaPremarket } from '@/lib/__fixtures__/scenarios';
import type { Scenario } from '@/types/scenario';
import { DEFAULT_SCENARIO } from '@/types/scenario';

function allFocusText(scenario: Scenario): string {
  const ctx = scenarioToAnalysisContext(scenario);
  return AREA_ORDER.map((k) => buildFocus(k, ctx).join(' ')).join(' ');
}

describe('no-hallucination guards', () => {
  describe('buildFocus suppression', () => {
    it('aiEnabled:false — no AI/ML in any area', () => {
      const s = { ...baselineClean(), aiEnabled: false, swEnabled: false };
      const text = allFocusText(s);
      expect(text).not.toMatch(/AI\/ML/i);
    });

    it('cyberEnabled:false — no 524B or SBOM in any area', () => {
      const s = { ...baselineClean(), cyberEnabled: false };
      const text = allFocusText(s);
      expect(text).not.toMatch(/524B/i);
      expect(text).not.toMatch(/SBOM/i);
    });

    it('swEnabled:false + aiEnabled:false — no software lifecycle in any area', () => {
      const s = { ...baselineClean(), swEnabled: false, aiEnabled: false };
      const text = allFocusText(s);
      expect(text).not.toMatch(/IEC 62304/i);
      // Note: base bullets may reference "software" generically for software-enabled devices
      // in the dd area postmarket framing. This test checks the overlay isn't injected.
    });

    it('pccpPlanned:false — no PCCP in any area', () => {
      const s = { ...baselineClean(), pccpPlanned: false };
      const text = allFocusText(s);
      expect(text).not.toMatch(/PCCP|Predetermined Change Control/i);
    });

    it('premarket mode — meas does not mention MDR, complaint handling, or recall readiness', () => {
      const s = pmaPremarket();
      const ctx = scenarioToAnalysisContext(s);
      const measText = buildFocus('meas', ctx).join(' ');
      expect(measText).not.toMatch(/\bMDR\b/i);
      expect(measText).not.toMatch(/complaint handling/i);
      expect(measText).not.toMatch(/recall readiness/i);
    });

    it('premarket mode — mgmt does not mention complaints or postmarket surveillance', () => {
      const s = pmaPremarket();
      const ctx = scenarioToAnalysisContext(s);
      const mgmtText = buildFocus('mgmt', ctx).join(' ');
      expect(mgmtText).not.toMatch(/complaint/i);
      expect(mgmtText).not.toMatch(/postmarket surveillance/i);
    });
  });

  describe('buildRecordsRequest suppression', () => {
    it('all tech flags off — no AI/SW/cyber/PCCP records', () => {
      const s = { ...baselineClean(), aiEnabled: false, swEnabled: false, cyberEnabled: false, pccpPlanned: false };
      const records = buildRecordsRequest(scenarioToAnalysisContext(s));
      const text = records.join(' ');
      expect(text).not.toMatch(/AI\/ML/i);
      expect(text).not.toMatch(/SBOM/i);
      expect(text).not.toMatch(/PCCP/i);
      expect(text).not.toMatch(/threat model/i);
    });

    it('aiEnabled:false — no AI/ML in any record', () => {
      const s = { ...baselineClean(), aiEnabled: false, swEnabled: true };
      const records = buildRecordsRequest(scenarioToAnalysisContext(s));
      const text = records.join(' ');
      expect(text).not.toMatch(/AI\/ML/i);
    });

    it('cyberEnabled:false — no SBOM or threat model in any record', () => {
      const s = { ...baselineClean(), cyberEnabled: false };
      const records = buildRecordsRequest(scenarioToAnalysisContext(s));
      const text = records.join(' ');
      expect(text).not.toMatch(/SBOM/i);
      expect(text).not.toMatch(/threat model/i);
    });

    it('pccpPlanned:false — no PCCP in any record', () => {
      const s = { ...baselineClean(), pccpPlanned: false };
      const records = buildRecordsRequest(scenarioToAnalysisContext(s));
      const text = records.join(' ');
      expect(text).not.toMatch(/PCCP/i);
    });
  });

  describe('buildNarrativePrompt empty-field handling', () => {
    const emptyScenario: Scenario = {
      ...DEFAULT_SCENARIO,
      companyName: '',
      productName: '',
      risk: '',
      signals: [],
      inspType: undefined,
      productCode: '',
      regulationNum: '',
    };

    it('empty companyName shows "(not provided)"', () => {
      const prompt = buildNarrativePrompt(emptyScenario, null, []);
      expect(prompt).toContain('Company: (not provided)');
    });

    it('empty productName shows "(not provided)"', () => {
      const prompt = buildNarrativePrompt(emptyScenario, null, []);
      expect(prompt).toContain('Product/device: (not provided)');
    });

    it('empty risk shows "(not provided)"', () => {
      const prompt = buildNarrativePrompt(emptyScenario, null, []);
      expect(prompt).toContain('Primary risk statement: (not provided)');
    });

    it('empty signals shows "(none)"', () => {
      const prompt = buildNarrativePrompt(emptyScenario, null, []);
      expect(prompt).toContain('Selected signals: (none)');
    });

    it('no inspType shows "(not selected)"', () => {
      const prompt = buildNarrativePrompt(emptyScenario, null, []);
      expect(prompt).toContain('(not selected)');
    });

    it('fdaData=null shows "No FDA data object provided"', () => {
      const prompt = buildNarrativePrompt(emptyScenario, null, []);
      expect(prompt).toContain('No FDA data object provided');
    });

    it('empty productCode shows "(not provided)"', () => {
      const prompt = buildNarrativePrompt(emptyScenario, null, []);
      expect(prompt).toContain('Product code: (not provided)');
    });

    it('empty regulationNum shows "(not provided)"', () => {
      const prompt = buildNarrativePrompt(emptyScenario, null, []);
      expect(prompt).toContain('Regulation: (not provided)');
    });
  });
});
