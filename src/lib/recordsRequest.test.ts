import { describe, expect, it } from 'vitest';

import { buildRecordsRequest, scenarioToAnalysisContext } from '@/lib/analysis';
import {
  aiDevice,
  baselineClean,
  cyberForcause,
  pmaPremarket,
  recallScenario,
} from '@/lib/__fixtures__/scenarios';
import type { Scenario } from '@/types/scenario';

function records(scenario: Scenario): string[] {
  return buildRecordsRequest(scenarioToAnalysisContext(scenario));
}

function recordsText(scenario: Scenario): string {
  return records(scenario).join('\n');
}

describe('buildRecordsRequest', () => {
  describe('always-present records', () => {
    it('always includes DHF', () => {
      expect(recordsText(baselineClean())).toMatch(/Design History File/i);
    });

    it('always includes Risk Management File', () => {
      expect(recordsText(baselineClean())).toMatch(/Risk Management File/i);
    });
  });

  describe('premarket vs postmarket', () => {
    it('premarket includes process validation and management review for design transfer', () => {
      const text = recordsText(pmaPremarket());
      expect(text).toMatch(/process validation/i);
      expect(text).toMatch(/design transfer/i);
    });

    it('premarket does NOT include CAPA records or complaint records', () => {
      const text = recordsText(pmaPremarket());
      expect(text).not.toMatch(/CAPA records/i);
      expect(text).not.toMatch(/Complaint records/i);
    });

    it('postmarket includes CAPA, complaints, management review, DMR/batch records', () => {
      const text = recordsText(baselineClean());
      expect(text).toMatch(/CAPA/i);
      expect(text).toMatch(/Complaint/i);
      expect(text).toMatch(/Management review/i);
      expect(text).toMatch(/batch|Device Master Record/i);
    });

    it('postmarket does NOT include "design transfer readiness"', () => {
      const text = recordsText(baselineClean());
      expect(text).not.toMatch(/design transfer readiness/i);
    });
  });

  describe('technology flags', () => {
    it('swEnabled:true adds software lifecycle and version history records', () => {
      const s = { ...baselineClean(), swEnabled: true };
      const text = recordsText(s);
      expect(text).toMatch(/software lifecycle|SRS/i);
      expect(text).toMatch(/version history|configuration management/i);
    });

    it('aiEnabled:true adds AI/ML training/validation records', () => {
      const text = recordsText(aiDevice());
      expect(text).toMatch(/AI\/ML/i);
    });

    it('aiEnabled:true + pccpPlanned:true adds PCCP documentation', () => {
      const text = recordsText(aiDevice());
      expect(text).toMatch(/PCCP/i);
    });

    it('pccpPlanned:true alone (aiEnabled:false) does NOT add PCCP documentation', () => {
      const s = { ...baselineClean(), pccpPlanned: true, aiEnabled: false };
      const text = recordsText(s);
      expect(text).not.toMatch(/PCCP/i);
    });

    it('cyberEnabled:true adds threat model and SBOM records', () => {
      const text = recordsText(cyberForcause());
      expect(text).toMatch(/threat model/i);
      expect(text).toMatch(/SBOM/i);
    });
  });

  describe('class and risk-driven records', () => {
    it('manualClass "3" adds supplier qualification records', () => {
      const text = recordsText(pmaPremarket()); // Class III
      expect(text).toMatch(/supplier/i);
    });

    it('risk containing "orthopedic" adds supplier qualification records', () => {
      const s = { ...baselineClean(), risk: 'Orthopedic implant fracture could cause harm.' };
      const text = recordsText(s);
      expect(text).toMatch(/supplier/i);
    });

    it('risk containing "steril" adds sterilization validation records', () => {
      const s = { ...baselineClean(), risk: 'Loss of sterility assurance could cause infection.' };
      const text = recordsText(s);
      expect(text).toMatch(/sterilization validation/i);
    });

    it('inspType "compliance" adds prior 483 and warning letter records', () => {
      const text = recordsText(recallScenario()); // compliance inspType
      expect(text).toMatch(/483/);
      expect(text).toMatch(/warning letter/i);
    });
  });

  describe('deduplication', () => {
    it('result contains no duplicate entries', () => {
      const list = records(cyberForcause());
      const unique = new Set(list);
      expect(list.length).toBe(unique.size);
    });
  });
});
