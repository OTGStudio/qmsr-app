import { describe, expect, it } from 'vitest';

import {
  dbToScenario,
  mergePendingScenarioIntoDefault,
  mergeScenarioPatch,
  scenarioToDb,
} from '@/lib/scenarioMapper';
import {
  aiDevice,
  baselineClean,
  cyberForcause,
  emptyFDAData,
} from '@/lib/__fixtures__/scenarios';
import type { SignalKey } from '@/lib/signalRegistry';
import type { Database } from '@/types/database';
import type { Scenario } from '@/types/scenario';

type ScenarioRow = Database['public']['Tables']['scenarios']['Row'];

/** Build a mock DB row from a scenario insert, adding server-generated columns. */
function toMockRow(scenario: Scenario): ScenarioRow {
  const insert = scenarioToDb(scenario);
  return {
    id: 'test-uuid',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    user_id: 'user-uuid',
    org_id: null,
    ...insert,
  } as ScenarioRow;
}

describe('scenarioToDb', () => {
  it('maps all Scenario fields to snake_case DB columns', () => {
    const s = baselineClean();
    const db = scenarioToDb(s);
    expect(db.name).toBe(s.name);
    expect(db.product_name).toBe(s.productName);
    expect(db.company_name).toBe(s.companyName);
    expect(db.fei_number).toBe(s.feiNumber);
    expect(db.insp_type).toBe(s.inspType ?? 'baseline');
    expect(db.marketed_us).toBe(s.marketedUS);
    expect(db.pathway).toBe(s.pathway);
    expect(db.manual_class).toBe(s.manualClass);
    expect(db.class_source).toBe(s.classSource);
    expect(db.risk).toBe(s.risk);
    expect(db.signals).toEqual(s.signals);
    expect(db.ai_enabled).toBe(s.aiEnabled);
    expect(db.sw_enabled).toBe(s.swEnabled);
    expect(db.cyber_enabled).toBe(s.cyberEnabled);
    expect(db.pccp_planned).toBe(s.pccpPlanned);
    expect(db.fei_verification).toBeNull();
  });

  it('maps feiVerification to fei_verification JSON and round-trips', () => {
    const feiVerification = {
      version: 1 as const,
      status: 'matched' as const,
      fei: '1234567890',
      userInitiatedLookup: true,
      checkedAt: '2026-01-01T00:00:00.000Z',
    };
    const s: Scenario = { ...baselineClean(), feiVerification };
    expect(scenarioToDb(s).fei_verification).toEqual(feiVerification);
    const row = toMockRow(s);
    expect(dbToScenario(row).feiVerification).toEqual(feiVerification);
  });

  it('defaults inspType to "baseline" when undefined', () => {
    const s: Scenario = { ...baselineClean(), inspType: undefined };
    const db = scenarioToDb(s);
    expect(db.insp_type).toBe('baseline');
  });

  it('trims and nullifies empty inspectionNarrative', () => {
    const s = { ...baselineClean(), inspectionNarrative: '   ' };
    expect(scenarioToDb(s).inspection_narrative).toBeNull();
  });

  it('preserves non-empty inspectionNarrative (trimmed)', () => {
    const s = { ...baselineClean(), inspectionNarrative: '  Some narrative.  ' };
    expect(scenarioToDb(s).inspection_narrative).toBe('Some narrative.');
  });

  it('nullifies undefined fdaData', () => {
    const s = { ...baselineClean(), fdaData: undefined };
    expect(scenarioToDb(s).fda_data).toBeNull();
  });
});

describe('dbToScenario', () => {
  it('maps all DB columns back to camelCase Scenario fields', () => {
    const original = baselineClean();
    const row = toMockRow(original);
    const result = dbToScenario(row);
    expect(result.id).toBe('test-uuid');
    expect(result.name).toBe(original.name);
    expect(result.productName).toBe(original.productName);
    expect(result.companyName).toBe(original.companyName);
    expect(result.feiNumber).toBe(original.feiNumber);
    expect(result.inspType).toBe(original.inspType);
    expect(result.marketedUS).toBe(original.marketedUS);
  });

  it('defaults null booleans to false', () => {
    const row = toMockRow(baselineClean());
    row.ai_enabled = null;
    row.sw_enabled = null;
    row.cyber_enabled = null;
    row.pccp_planned = null;
    const result = dbToScenario(row);
    expect(result.aiEnabled).toBe(false);
    expect(result.swEnabled).toBe(false);
    expect(result.cyberEnabled).toBe(false);
    expect(result.pccpPlanned).toBe(false);
  });

  it('defaults null strings to empty string', () => {
    const row = toMockRow(baselineClean());
    row.product_name = null;
    row.company_name = null;
    row.fei_number = null;
    const result = dbToScenario(row);
    expect(result.productName).toBe('');
    expect(result.companyName).toBe('');
    expect(result.feiNumber).toBe('');
  });

  it('parses ratings JSON with fallback to "unknown" for invalid values', () => {
    const row = toMockRow(baselineClean());
    row.ratings = { mgmt: 'strong', dd: 'INVALID', prod: null, change: 'weak', out: 'partial', meas: 'unknown' };
    const result = dbToScenario(row);
    expect(result.ratings.mgmt).toBe('strong');
    expect(result.ratings.dd).toBe('unknown'); // invalid value falls back
    expect(result.ratings.prod).toBe('unknown'); // null falls back
    expect(result.ratings.change).toBe('weak');
  });

  it('parses areaNotes JSON with fallback to empty strings', () => {
    const row = toMockRow(baselineClean());
    row.area_notes = { mgmt: 'test note', dd: 123, prod: null };
    const result = dbToScenario(row);
    expect(result.areaNotes.mgmt).toBe('test note');
    expect(result.areaNotes.dd).toBe(''); // non-string falls back
    expect(result.areaNotes.prod).toBe(''); // null falls back
    expect(result.areaNotes.change).toBe(''); // missing falls back
  });

  it('casts pathway to "standard" for unknown values', () => {
    const row = toMockRow(baselineClean());
    row.pathway = 'something_invalid';
    expect(dbToScenario(row).pathway).toBe('standard');
  });

  it('casts classSource to "manual" for unknown values', () => {
    const row = toMockRow(baselineClean());
    row.class_source = 'something_invalid';
    expect(dbToScenario(row).classSource).toBe('manual');
  });
});

describe('round-trip: scenarioToDb -> dbToScenario', () => {
  const fixtures = [
    ['baselineClean', baselineClean],
    ['aiDevice', aiDevice],
    ['cyberForcause', cyberForcause],
  ] as const;

  for (const [name, factory] of fixtures) {
    it(`${name} survives round-trip`, () => {
      const original = factory();
      const row = toMockRow(original);
      const result = dbToScenario(row);
      // Compare all fields except id (set by mock) and notes (optional/undefined vs absent)
      expect(result.name).toBe(original.name);
      expect(result.productName).toBe(original.productName);
      expect(result.companyName).toBe(original.companyName);
      expect(result.feiNumber).toBe(original.feiNumber);
      expect(result.inspType).toBe(original.inspType);
      expect(result.marketedUS).toBe(original.marketedUS);
      expect(result.pathway).toBe(original.pathway);
      expect(result.manualClass).toBe(original.manualClass);
      expect(result.risk).toBe(original.risk);
      expect(result.signals).toEqual(original.signals);
      expect(result.aiEnabled).toBe(original.aiEnabled);
      expect(result.swEnabled).toBe(original.swEnabled);
      expect(result.cyberEnabled).toBe(original.cyberEnabled);
      expect(result.pccpPlanned).toBe(original.pccpPlanned);
      expect(result.ratings).toEqual(original.ratings);
      expect(result.areaNotes).toEqual(original.areaNotes);
    });
  }
});

describe('mergePendingScenarioIntoDefault', () => {
  it('normalizes legacy label strings in signals to canonical keys', () => {
    const merged = mergePendingScenarioIntoDefault({
      name: 'Test',
      signals: ['MDR increase', 'Complaint trend'] as unknown as Scenario['signals'],
    });
    expect(merged.signals).toEqual(['mdr_increase', 'complaint_trend']);
  });

  it('moves unrecognized strings to unsupportedSignals', () => {
    const merged = mergePendingScenarioIntoDefault({
      signals: ['MDR increase', 'custom worry text'] as unknown as Scenario['signals'],
    });
    expect(merged.signals).toEqual(['mdr_increase']);
    expect(merged.unsupportedSignals).toContain('custom worry text');
  });
});

describe('mergeScenarioPatch', () => {
  it('shallow-merges top-level scalar fields', () => {
    const base = baselineClean();
    const merged = mergeScenarioPatch(base, { companyName: 'New Corp' });
    expect(merged.companyName).toBe('New Corp');
    expect(merged.productName).toBe(base.productName); // preserved
  });

  it('shallow-merges ratings (does not lose unmentioned keys)', () => {
    const base = baselineClean();
    const merged = mergeScenarioPatch(base, { ratings: { ...base.ratings, mgmt: 'strong' } });
    expect(merged.ratings.mgmt).toBe('strong');
    expect(merged.ratings.dd).toBe(base.ratings.dd); // preserved
  });

  it('shallow-merges areaNotes (does not lose unmentioned keys)', () => {
    const base = { ...baselineClean(), areaNotes: { mgmt: 'original', dd: 'dd note', prod: '', change: '', out: '', meas: '' } };
    const merged = mergeScenarioPatch(base, { areaNotes: { ...base.areaNotes, mgmt: 'updated' } });
    expect(merged.areaNotes.mgmt).toBe('updated');
    expect(merged.areaNotes.dd).toBe('dd note');
  });

  it('replaces signals array entirely when provided', () => {
    const base = { ...baselineClean(), signals: ['mdr_increase'] as SignalKey[] };
    const merged = mergeScenarioPatch(base, { signals: ['complaint_trend'] });
    expect(merged.signals).toEqual(['complaint_trend']);
  });

  it('preserves signals when patch.signals is undefined', () => {
    const base = { ...baselineClean(), signals: ['mdr_increase'] as SignalKey[] };
    const merged = mergeScenarioPatch(base, { companyName: 'New' });
    expect(merged.signals).toEqual(['mdr_increase']);
  });

  it('replaces fdaData when provided (including null)', () => {
    const base = { ...baselineClean(), fdaData: emptyFDAData() };
    const merged = mergeScenarioPatch(base, { fdaData: null });
    expect(merged.fdaData).toBeNull();
  });

  it('preserves fdaData when patch.fdaData is undefined', () => {
    const fda = emptyFDAData();
    const base = { ...baselineClean(), fdaData: fda };
    const merged = mergeScenarioPatch(base, { companyName: 'New' });
    expect(merged.fdaData).toBe(fda);
  });

  it('replaces inspectionNarrative when provided', () => {
    const base = { ...baselineClean(), inspectionNarrative: 'old' };
    const merged = mergeScenarioPatch(base, { inspectionNarrative: 'new' });
    expect(merged.inspectionNarrative).toBe('new');
  });

  it('preserves inspectionNarrative when not in patch', () => {
    const base = { ...baselineClean(), inspectionNarrative: 'keep' };
    const merged = mergeScenarioPatch(base, { companyName: 'New' });
    expect(merged.inspectionNarrative).toBe('keep');
  });

  it('replaces feiVerification when provided', () => {
    const base = baselineClean();
    const fv = {
      version: 1 as const,
      status: 'lookup_unavailable' as const,
      fei: base.feiNumber,
      userInitiatedLookup: true,
      checkedAt: '2026-01-01T00:00:00.000Z',
    };
    const merged = mergeScenarioPatch(base, { feiVerification: fv });
    expect(merged.feiVerification).toEqual(fv);
  });
});
