import { describe, expect, it } from 'vitest';

import { buildFocus, scenarioToAnalysisContext } from '@/lib/analysis';
import { AREA_ORDER } from '@/lib/domain';
import {
  aiDevice,
  baselineClean,
  cyberForcause,
  postmarketMDR,
} from '@/lib/__fixtures__/scenarios';

function allFocusText(scenario: Parameters<typeof scenarioToAnalysisContext>[0]): string {
  const ctx = scenarioToAnalysisContext(scenario);
  return AREA_ORDER.map((k) => buildFocus(k, ctx).join(' ')).join(' ');
}

function areaFocusText(
  scenario: Parameters<typeof scenarioToAnalysisContext>[0],
  area: (typeof AREA_ORDER)[number],
): string {
  return buildFocus(area, scenarioToAnalysisContext(scenario)).join(' ');
}

describe('signal-to-output contracts', () => {
  describe('cyber + SW flags', () => {
    const scenario = cyberForcause();

    it('dd includes 524B language', () => {
      expect(areaFocusText(scenario, 'dd')).toMatch(/524B/i);
    });

    it('change includes 524B / cybersecurity language', () => {
      expect(areaFocusText(scenario, 'change')).toMatch(/524B|cyber/i);
    });

    it('meas includes 524B / cybersecurity language', () => {
      expect(areaFocusText(scenario, 'meas')).toMatch(/524B|cyber/i);
    });

    it('dd includes software lifecycle language', () => {
      expect(areaFocusText(scenario, 'dd')).toMatch(/software|IEC 62304/i);
    });

    it('prod includes software lifecycle language', () => {
      expect(areaFocusText(scenario, 'prod')).toMatch(/software|IEC 62304/i);
    });
  });

  describe('AI + SW + PCCP flags', () => {
    const scenario = aiDevice();

    it('mgmt includes AI/ML governance', () => {
      expect(areaFocusText(scenario, 'mgmt')).toMatch(/AI\/ML/i);
    });

    it('dd includes AI/ML model development', () => {
      expect(areaFocusText(scenario, 'dd')).toMatch(/AI\/ML/i);
    });

    it('change includes PCCP language', () => {
      expect(areaFocusText(scenario, 'change')).toMatch(/PCCP|Predetermined Change Control/i);
    });

    it('meas includes AI/ML language', () => {
      expect(areaFocusText(scenario, 'meas')).toMatch(/AI\/ML/i);
    });
  });

  describe('postmarket MDR signals', () => {
    const scenario = postmarketMDR();

    it('meas includes complaint/MDR themes', () => {
      const text = areaFocusText(scenario, 'meas');
      expect(text).toMatch(/complaint|MDR/i);
    });

    it('meas includes CAPA themes', () => {
      expect(areaFocusText(scenario, 'meas')).toMatch(/CAPA/i);
    });
  });

  describe('risk text overlays', () => {
    it('sterile risk text adds sterile overlay in prod', () => {
      const s = { ...baselineClean(), risk: 'Primary risk is sterility assurance failure.' };
      expect(areaFocusText(s, 'prod')).toMatch(/sterile product|sterilization/i);
    });

    it('mechanical risk text adds mechanical overlay in prod', () => {
      const s = { ...baselineClean(), risk: 'Fatigue fracture of orthopedic implant could cause injury.' };
      expect(areaFocusText(s, 'prod')).toMatch(/mechanical|fatigue/i);
    });

    it('labeling risk text adds labeling overlay in prod', () => {
      const s = { ...baselineClean(), risk: 'Incorrect label or UDI could cause use error.' };
      expect(areaFocusText(s, 'prod')).toMatch(/label|UDI/i);
    });
  });

  describe('baseline vs postmarket output differs', () => {
    it('postmarketMDR output is different from baselineClean', () => {
      const baseText = allFocusText(baselineClean());
      const postText = allFocusText(postmarketMDR());
      expect(baseText).not.toBe(postText);
    });

    it('cyberForcause output is different from baselineClean', () => {
      const baseText = allFocusText(baselineClean());
      const cyberText = allFocusText(cyberForcause());
      expect(baseText).not.toBe(cyberText);
    });
  });
});
