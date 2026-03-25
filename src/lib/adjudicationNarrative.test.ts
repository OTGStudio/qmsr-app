import { describe, expect, it } from 'vitest';

import {
  buildNarrativePrompt,
  buildNarrativeStructuredPayloadV2,
  buildNarrativeUserMessage,
} from '@/lib/analysis';
import {
  baselineClean,
  complaintsUserError,
  emptyFDAData,
  supplierChangeClassIII,
  unvalidatedSpreadsheet,
} from '@/lib/__fixtures__/scenarios';

describe('adjudication → narrative integration', () => {
  describe('V2 payload with triggered adjudication', () => {
    it('includes LOCKED ADJUDICATION section for TC1', () => {
      const payload = buildNarrativeStructuredPayloadV2(supplierChangeClassIII(), null, []);
      const msg = buildNarrativeUserMessage(payload);
      expect(msg).toContain('## LOCKED ADJUDICATION');
      expect(msg).toContain('TC1_SUPPLIER_CHANGE_NO_EVAL');
      expect(msg).toContain('HIGH');
      expect(msg).toContain('21 CFR Part 820');
      expect(msg).toContain('CP 7382.850');
    });

    it('includes LOCKED ADJUDICATION section for TC2', () => {
      const payload = buildNarrativeStructuredPayloadV2(complaintsUserError(), null, []);
      const msg = buildNarrativeUserMessage(payload);
      expect(msg).toContain('## LOCKED ADJUDICATION');
      expect(msg).toContain('TC2_USER_ERROR_WITHOUT_TRENDING');
      expect(msg).toContain('MEDIUM-HIGH');
      expect(msg).toContain('21 CFR Part 803');
    });

    it('includes LOCKED ADJUDICATION section for TC3', () => {
      const payload = buildNarrativeStructuredPayloadV2(unvalidatedSpreadsheet(), null, []);
      const msg = buildNarrativeUserMessage(payload);
      expect(msg).toContain('## LOCKED ADJUDICATION');
      expect(msg).toContain('TC3_UNVALIDATED_SPREADSHEET');
      expect(msg).toContain('Software Validation Guidance');
    });

    it('includes narrative prohibitions', () => {
      const payload = buildNarrativeStructuredPayloadV2(supplierChangeClassIII(), null, []);
      const msg = buildNarrativeUserMessage(payload);
      expect(msg).toContain('Narrative prohibitions:');
      expect(msg).toContain('Do not downgrade risk');
    });

    it('includes FDA signal limitations', () => {
      const payload = buildNarrativeStructuredPayloadV2(supplierChangeClassIII(), null, []);
      const msg = buildNarrativeUserMessage(payload);
      expect(msg).toContain('FDA signal limitations:');
      expect(msg).toContain('do not by themselves establish noncompliance');
    });

    it('includes recommended actions', () => {
      const payload = buildNarrativeStructuredPayloadV2(supplierChangeClassIII(), null, []);
      const msg = buildNarrativeUserMessage(payload);
      expect(msg).toContain('Recommended actions:');
      expect(msg).toContain('supplier-change impact assessment');
    });

    it('includes technology guidance when applicable', () => {
      // TC3 scenario has swEnabled: false but the adjudication always includes MDSAP
      const payload = buildNarrativeStructuredPayloadV2(unvalidatedSpreadsheet(), null, []);
      const msg = buildNarrativeUserMessage(payload);
      expect(msg).toContain('Applicable guidance / standards');
      expect(msg).toContain('mdsap');
    });
  });

  describe('V2 payload without triggered adjudication', () => {
    it('does NOT include LOCKED ADJUDICATION for baseline clean', () => {
      const payload = buildNarrativeStructuredPayloadV2(baselineClean(), emptyFDAData(), []);
      const msg = buildNarrativeUserMessage(payload);
      expect(msg).not.toContain('## LOCKED ADJUDICATION');
      expect(msg).not.toContain('Narrative prohibitions:');
    });

    it('preserves all V1 sections', () => {
      const payload = buildNarrativeStructuredPayloadV2(baselineClean(), emptyFDAData(), []);
      const msg = buildNarrativeUserMessage(payload);
      expect(msg).toContain('## Provided inputs');
      expect(msg).toContain('## Risk and normalized signals');
      expect(msg).toContain('## FDA public data summary');
      expect(msg).toContain('## Triangulation flags');
      expect(msg).toContain('## Readiness summary');
      expect(msg).toContain('## Risk thread preview');
      expect(msg).toContain('## Interpretation task');
    });
  });

  describe('V1 backward compatibility', () => {
    it('buildNarrativePrompt still produces V1 output without adjudication', () => {
      const prompt = buildNarrativePrompt(supplierChangeClassIII(), null, []);
      // V1 path uses buildNarrativeStructuredPayload which returns version 1
      // — no adjudication property, so no LOCKED ADJUDICATION section
      expect(prompt).not.toContain('## LOCKED ADJUDICATION');
      expect(prompt).toContain('## Provided inputs');
      expect(prompt).toContain('## Interpretation task');
    });

    it('buildNarrativePrompt output for baseline clean is unchanged', () => {
      const prompt = buildNarrativePrompt(baselineClean(), emptyFDAData(), []);
      expect(prompt).not.toContain('## LOCKED ADJUDICATION');
      expect(prompt).toContain('Acme Medical');
      expect(prompt).toContain('Infusion Pump X');
    });
  });

  describe('V2 payload version field', () => {
    it('has version 2', () => {
      const payload = buildNarrativeStructuredPayloadV2(baselineClean(), null, []);
      expect(payload.version).toBe(2);
    });

    it('preserves all V1 fields', () => {
      const payload = buildNarrativeStructuredPayloadV2(baselineClean(), emptyFDAData(), []);
      expect(payload.scenarioSummary.name).toBe('Baseline clean');
      expect(payload.scenarioSummary.companyName).toBe('Acme Medical');
      expect(payload.readinessSummary).toBeDefined();
      expect(payload.riskThreadPreview).toBeDefined();
      expect(payload.normalizedSignals).toBeDefined();
      expect(payload.fdaSummary).toBeDefined();
    });

    it('includes adjudication field', () => {
      const payload = buildNarrativeStructuredPayloadV2(supplierChangeClassIII(), null, []);
      expect(payload.adjudication).toBeDefined();
      expect(payload.adjudication.triggered).toBe(true);
      expect(payload.adjudication.findings.length).toBeGreaterThan(0);
    });
  });
});
