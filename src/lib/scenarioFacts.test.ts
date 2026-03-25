import { describe, expect, it } from 'vitest';

import { extractScenarioFacts } from '@/lib/scenarioFacts';
import { baselineClean } from '@/lib/__fixtures__/scenarios';
import type { Scenario } from '@/types/scenario';
import { DEFAULT_SCENARIO } from '@/types/scenario';

function scenario(overrides: Partial<Scenario> = {}): Scenario {
  return { ...DEFAULT_SCENARIO, ...overrides };
}

describe('extractScenarioFacts', () => {
  describe('TC1 — supplier change', () => {
    it('detects supplier change with no evaluation', () => {
      const s = scenario({
        risk: 'Supplier material change on Class III implant. No update performed on risk file.',
        manualClass: '3',
      });
      const facts = extractScenarioFacts(s);
      expect(facts.supplierChange).toBe(true);
      expect(facts.supplierChangeEvaluated).toBe(false);
    });

    it('detects supplier change WITH evaluation', () => {
      const s = scenario({
        risk: 'Supplier material change on Class III implant. Impact assessment completed.',
      });
      const facts = extractScenarioFacts(s);
      expect(facts.supplierChange).toBe(true);
      expect(facts.supplierChangeEvaluated).toBe(true);
    });

    it('no supplier change yields supplierChange: false', () => {
      const s = scenario({ risk: 'General device risk concern.' });
      const facts = extractScenarioFacts(s);
      expect(facts.supplierChange).toBe(false);
    });

    it('detects biocompatibility not re-evaluated', () => {
      const s = scenario({
        risk: 'Supplier material change. Biocompatibility not re-evaluated.',
      });
      const facts = extractScenarioFacts(s);
      expect(facts.supplierChange).toBe(true);
      expect(facts.biocompatibilityReevaluated).toBe(false);
    });
  });

  describe('TC2 — complaint handling', () => {
    it('detects multiple complaints with user error and no trending', () => {
      const s = scenario({
        risk: 'Multiple complaints attributed to user error. Trend analysis not performed.',
      });
      const facts = extractScenarioFacts(s);
      expect(facts.complaintsMultiple).toBe(true);
      expect(facts.investigationOutcome).toBe('user_error');
      expect(facts.trendAnalysisPerformed).toBe(false);
    });

    it('detects complaints with trending performed', () => {
      const s = scenario({
        risk: 'Multiple complaints attributed to user error. Trend analysis completed, CAPA opened.',
      });
      const facts = extractScenarioFacts(s);
      expect(facts.complaintsMultiple).toBe(true);
      expect(facts.investigationOutcome).toBe('user_error');
      expect(facts.trendAnalysisPerformed).toBe(true);
    });

    it('detects CAPA not initiated', () => {
      const s = scenario({
        risk: 'Multiple complaints. No CAPA initiated.',
      });
      const facts = extractScenarioFacts(s);
      expect(facts.complaintsMultiple).toBe(true);
      expect(facts.capaInitiated).toBe(false);
    });

    it('detects risk file not updated', () => {
      const s = scenario({
        risk: 'Repeated complaints. Risk file not updated.',
      });
      const facts = extractScenarioFacts(s);
      expect(facts.riskFileUpdated).toBe(false);
    });
  });

  describe('TC3 — spreadsheet / data integrity', () => {
    it('detects unvalidated spreadsheet with post-release error', () => {
      const s = scenario({
        risk: 'Spreadsheet used for critical calculations. Rounding error found post-release. Software validation: not performed.',
      });
      const facts = extractScenarioFacts(s);
      expect(facts.spreadsheetCriticalCalculation).toBe(true);
      expect(facts.calculationErrorPostRelease).toBe(true);
      expect(facts.softwareValidationPerformed).toBe(false);
    });

    it('detects validated spreadsheet', () => {
      const s = scenario({
        risk: 'Excel used for critical calculations. Validated per CSV guidance.',
      });
      const facts = extractScenarioFacts(s);
      expect(facts.spreadsheetCriticalCalculation).toBe(true);
      expect(facts.softwareValidationPerformed).toBe(true);
    });

    it('detects missing independent review', () => {
      const s = scenario({
        risk: 'Spreadsheet calculations. No independent review performed.',
      });
      const facts = extractScenarioFacts(s);
      expect(facts.independentReviewPerformed).toBe(false);
    });
  });

  describe('baseline clean scenario', () => {
    it('returns safe defaults for generic scenario', () => {
      const s = baselineClean();
      const facts = extractScenarioFacts(s);
      expect(facts.supplierChange).toBe(false);
      expect(facts.complaintsMultiple).toBe(false);
      expect(facts.spreadsheetCriticalCalculation).toBe(false);
      expect(facts.trendAnalysisPerformed).toBe(true);
      expect(facts.capaInitiated).toBe(true);
      expect(facts.riskFileUpdated).toBe(true);
      expect(facts.softwareValidationPerformed).toBe(true);
      expect(facts.independentReviewPerformed).toBe(true);
    });
  });

  describe('TC4 — design change', () => {
    it('detects design change without V&V reassessment', () => {
      const s = scenario({
        risk: 'Design change to catheter tip geometry. V&V not reassessed.',
      });
      const facts = extractScenarioFacts(s);
      expect(facts.designChangePresent).toBe(true);
      expect(facts.designVVReassessed).toBe(false);
    });

    it('detects design change with V&V reassessed', () => {
      const s = scenario({
        risk: 'Design modification to housing. V&V reassessment completed.',
      });
      const facts = extractScenarioFacts(s);
      expect(facts.designChangePresent).toBe(true);
      expect(facts.designVVReassessed).toBe(true);
    });

    it('no design change yields designChangePresent: false', () => {
      const s = scenario({ risk: 'General device risk.' });
      const facts = extractScenarioFacts(s);
      expect(facts.designChangePresent).toBe(false);
    });
  });

  describe('TC5 — CAPA recurrence', () => {
    it('detects CAPA closed with issue recurrence', () => {
      const s = scenario({
        risk: 'CAPA closed for leak defect. Same issue recurred in next lot.',
      });
      const facts = extractScenarioFacts(s);
      expect(facts.capaClosedPreviously).toBe(true);
      expect(facts.issueRecurred).toBe(true);
    });

    it('detects CAPA closed without recurrence', () => {
      const s = scenario({
        risk: 'CAPA completed for labeling issue. No further reports.',
      });
      const facts = extractScenarioFacts(s);
      expect(facts.capaClosedPreviously).toBe(true);
      expect(facts.issueRecurred).toBe(false);
    });
  });

  describe('TC6 — process validation', () => {
    it('detects unvalidated special process', () => {
      const s = scenario({
        risk: 'Sterilization is a special process. Process validation not documented.',
      });
      const facts = extractScenarioFacts(s);
      expect(facts.specialProcessPresent).toBe(true);
      expect(facts.processValidationDocumented).toBe(false);
    });

    it('detects validated special process', () => {
      const s = scenario({
        risk: 'Welding used for assembly. Process validated per IQ/OQ/PQ.',
      });
      const facts = extractScenarioFacts(s);
      expect(facts.specialProcessPresent).toBe(true);
      expect(facts.processValidationDocumented).toBe(true);
    });
  });

  describe('TC7 — management review', () => {
    it('detects management review not performed', () => {
      const s = scenario({
        risk: 'General device risk. Management review not performed.',
      });
      const facts = extractScenarioFacts(s);
      expect(facts.managementReviewPerformed).toBe(false);
    });

    it('defaults to management review performed when not mentioned', () => {
      const s = scenario({ risk: 'General device risk.' });
      const facts = extractScenarioFacts(s);
      expect(facts.managementReviewPerformed).toBe(true);
    });
  });

  describe('TC8 — software lifecycle', () => {
    it('detects software lifecycle not documented', () => {
      const s = scenario({
        risk: 'Software-enabled device. Software lifecycle not maintained.',
        swEnabled: true,
      });
      const facts = extractScenarioFacts(s);
      expect(facts.softwareLifecycleDocumented).toBe(false);
    });

    it('defaults to lifecycle documented when not mentioned', () => {
      const s = scenario({ risk: 'General software device.', swEnabled: true });
      const facts = extractScenarioFacts(s);
      expect(facts.softwareLifecycleDocumented).toBe(true);
    });
  });

  describe('explicit scenarioFacts override regex', () => {
    it('explicit supplierChange: false overrides regex that would match', () => {
      const s = scenario({
        risk: 'Supplier material change on Class III implant. No update performed.',
        scenarioFacts: { supplierChange: false },
      });
      const facts = extractScenarioFacts(s);
      // Regex would find "supplier material change" but explicit field says false
      expect(facts.supplierChange).toBe(false);
    });

    it('explicit supplierChange: true fires even without matching text', () => {
      const s = scenario({
        risk: 'General device risk concern.',
        scenarioFacts: { supplierChange: true, supplierChangeEvaluated: false },
      });
      const facts = extractScenarioFacts(s);
      // No regex match, but explicit field is set
      expect(facts.supplierChange).toBe(true);
      expect(facts.supplierChangeEvaluated).toBe(false);
    });

    it('null scenarioFacts uses full regex fallback (backward compat)', () => {
      const s = scenario({
        risk: 'Supplier material change. No update performed.',
        scenarioFacts: null,
      });
      const facts = extractScenarioFacts(s);
      expect(facts.supplierChange).toBe(true);
      expect(facts.supplierChangeEvaluated).toBe(false);
    });

    it('undefined scenarioFacts uses full regex fallback (backward compat)', () => {
      const s = scenario({
        risk: 'Supplier material change. No update performed.',
      });
      // scenarioFacts not set → undefined
      const facts = extractScenarioFacts(s);
      expect(facts.supplierChange).toBe(true);
      expect(facts.supplierChangeEvaluated).toBe(false);
    });

    it('partial scenarioFacts: set fields override, unset fields use regex', () => {
      const s = scenario({
        risk: 'Multiple complaints attributed to user error. Trend analysis not performed.',
        scenarioFacts: {
          complaintsMultiple: true,
          // investigationOutcome NOT set → regex fallback
          // trendAnalysisPerformed NOT set → regex fallback
        },
      });
      const facts = extractScenarioFacts(s);
      expect(facts.complaintsMultiple).toBe(true); // explicit
      expect(facts.investigationOutcome).toBe('user_error'); // regex fallback
      expect(facts.trendAnalysisPerformed).toBe(false); // regex fallback
    });

    it('explicit investigationOutcome overrides regex', () => {
      const s = scenario({
        risk: 'Multiple complaints attributed to user error.',
        scenarioFacts: { investigationOutcome: 'other' },
      });
      const facts = extractScenarioFacts(s);
      // Regex would find "user error" but explicit says 'other'
      expect(facts.investigationOutcome).toBe('other');
    });

    it('explicit spreadsheet facts override regex', () => {
      const s = scenario({
        risk: 'General device risk.',
        scenarioFacts: {
          spreadsheetCriticalCalculation: true,
          calculationErrorPostRelease: true,
          softwareValidationPerformed: false,
          independentReviewPerformed: false,
        },
      });
      const facts = extractScenarioFacts(s);
      expect(facts.spreadsheetCriticalCalculation).toBe(true);
      expect(facts.calculationErrorPostRelease).toBe(true);
      expect(facts.softwareValidationPerformed).toBe(false);
      expect(facts.independentReviewPerformed).toBe(false);
    });
  });
});
