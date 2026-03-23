import { describe, expect, it } from 'vitest';

import { buildNarrativePrompt } from '@/lib/analysis';
import {
  baselineClean,
  cyberForcause,
  emptyFDAData,
  risingMDRData,
} from '@/lib/__fixtures__/scenarios';
import type { FlagItem } from '@/types/analysis';

describe('buildNarrativePrompt', () => {
  describe('scenario section', () => {
    it('includes scenario name', () => {
      const s = baselineClean();
      const prompt = buildNarrativePrompt(s, null, []);
      expect(prompt).toContain(s.name);
    });

    it('includes company name when provided', () => {
      const s = baselineClean();
      const prompt = buildNarrativePrompt(s, null, []);
      expect(prompt).toContain('Acme Medical');
    });

    it('includes product name when provided', () => {
      const s = baselineClean();
      const prompt = buildNarrativePrompt(s, null, []);
      expect(prompt).toContain('Infusion Pump X');
    });

    it('includes inspType label when set', () => {
      const s = baselineClean();
      const prompt = buildNarrativePrompt(s, null, []);
      expect(prompt).toMatch(/baseline/i);
    });

    it('includes pathway and manual class', () => {
      const s = baselineClean();
      const prompt = buildNarrativePrompt(s, null, []);
      expect(prompt).toContain('standard');
      expect(prompt).toContain('class: 2');
    });

    it('includes product code when provided', () => {
      const s = { ...baselineClean(), productCode: 'FRN' };
      const prompt = buildNarrativePrompt(s, null, []);
      expect(prompt).toContain('FRN');
    });

    it('includes technology profile booleans', () => {
      const s = cyberForcause();
      const prompt = buildNarrativePrompt(s, null, []);
      expect(prompt).toContain('Cyber (524B): true');
      expect(prompt).toContain('Software: true');
    });
  });

  describe('risk and signals section', () => {
    it('includes risk statement', () => {
      const s = baselineClean();
      const prompt = buildNarrativePrompt(s, null, []);
      expect(prompt).toContain(s.risk);
    });

    it('includes selected signals', () => {
      const s = cyberForcause();
      const prompt = buildNarrativePrompt(s, null, []);
      expect(prompt).toContain('Cybersecurity signal');
      expect(prompt).toContain('Software anomaly');
    });

    it('shows "(none)" for empty signals', () => {
      const s = baselineClean();
      const prompt = buildNarrativePrompt(s, null, []);
      expect(prompt).toContain('Selected signals: (none)');
    });
  });

  describe('FDA data section', () => {
    it('with fdaData: includes MDR JSON', () => {
      const fda = risingMDRData();
      const prompt = buildNarrativePrompt(baselineClean(), fda, []);
      expect(prompt).toContain('"2022"');
    });

    it('with fdaData having error: includes error message', () => {
      const fda = { ...emptyFDAData(), error: 'Rate limit exceeded' };
      const prompt = buildNarrativePrompt(baselineClean(), fda, []);
      expect(prompt).toContain('Rate limit exceeded');
    });

    it('with fdaData=null: shows "No FDA data object provided"', () => {
      const prompt = buildNarrativePrompt(baselineClean(), null, []);
      expect(prompt).toContain('No FDA data object provided');
    });
  });

  describe('flags section', () => {
    it('with flags: lists each flag', () => {
      const flags: FlagItem[] = [
        { severity: 'high', area: 'meas', label: 'Rising MDR trend', detail: 'Increased by 150%.' },
      ];
      const prompt = buildNarrativePrompt(baselineClean(), null, flags);
      expect(prompt).toContain('[HIGH]');
      expect(prompt).toContain('Rising MDR trend');
      expect(prompt).toContain('Increased by 150%');
    });

    it('with no flags: shows "(none)"', () => {
      const prompt = buildNarrativePrompt(baselineClean(), null, []);
      expect(prompt).toMatch(/Triangulation flags[\s\S]*\(none\)/);
    });
  });

  describe('instruction section', () => {
    it('always includes QMSR and CP 7382.850', () => {
      const prompt = buildNarrativePrompt(baselineClean(), null, []);
      expect(prompt).toContain('QMSR');
      expect(prompt).toContain('CP 7382.850');
    });

    it('instructs not to use QSIT terminology', () => {
      const prompt = buildNarrativePrompt(baselineClean(), null, []);
      expect(prompt).toMatch(/DO NOT use QSIT/i);
    });

    it('instructs six QMS areas', () => {
      const prompt = buildNarrativePrompt(baselineClean(), null, []);
      expect(prompt).toMatch(/SIX QMS areas/i);
    });
  });
});
