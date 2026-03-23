import { describe, expect, it } from 'vitest';

import type { FEILookupProvider } from '@/lib/feiProviders/base';
import { createMockFeiProvider } from '@/lib/feiProviders/mockProvider';
import {
  buildVerificationResultFromProvider,
  compareFacilityIdentity,
  normalizeFEI,
  summarizeFeiVerificationForUi,
  verifyFEI,
} from '@/lib/feiVerification';

describe('normalizeFEI', () => {
  it('trims whitespace', () => {
    expect(normalizeFEI('  3001234567  ')).toEqual({ ok: true, value: '3001234567' });
  });

  it('rejects non-digit characters', () => {
    expect(normalizeFEI('300-123-4567')).toEqual({ ok: false });
    expect(normalizeFEI('300ABC4567')).toEqual({ ok: false });
  });

  it('rejects wrong length', () => {
    expect(normalizeFEI('12345')).toEqual({ ok: false });
    expect(normalizeFEI('12345678901')).toEqual({ ok: false });
  });

  it('accepts exactly 10 digits', () => {
    expect(normalizeFEI('0000000000')).toEqual({ ok: true, value: '0000000000' });
  });
});

describe('compareFacilityIdentity', () => {
  it('flags company name mismatch', () => {
    const o = compareFacilityIdentity(
      { companyName: 'Acme Medical Devices' },
      { facilityName: 'Unrelated Pharma LLC' },
    );
    expect(o.aligned).toBe(false);
    expect(o.warnings.some((w) => /facility name/i.test(w))).toBe(true);
  });

  it('flags state mismatch', () => {
    const o = compareFacilityIdentity({ state: 'MA' }, { state: 'CA', facilityName: 'X' });
    expect(o.warnings.some((w) => /state mismatch/i.test(w))).toBe(true);
  });

  it('returns aligned when user context is empty', () => {
    const o = compareFacilityIdentity({}, { facilityName: 'Any Corp', state: 'TX' });
    expect(o.aligned).toBe(true);
    expect(o.warnings).toHaveLength(0);
  });
});

describe('buildVerificationResultFromProvider', () => {
  it('downgrades matched to possible_match when identity warnings exist', () => {
    const r = buildVerificationResultFromProvider(
      {
        provider: 'test',
        outcome: 'matched',
        confidence: 'exact',
        facilityName: 'Other Name LLC',
        city: 'Boston',
        state: 'MA',
        country: 'US',
      },
      '3001234567',
      { fei: '3001234567', companyName: 'Different Co', city: 'Boston', state: 'MA' },
      true,
    );
    expect(r.status).toBe('possible_match');
    expect(r.confidence).toBe('weak');
    expect(r.notes?.some((n) => /downgraded/i.test(n))).toBe(true);
  });
});

describe('verifyFEI', () => {
  const mock = createMockFeiProvider();

  it('returns format_invalid when FEI is not 10 digits', async () => {
    const r = await verifyFEI({ fei: '12' }, { providers: [mock] });
    expect(r.status).toBe('format_invalid');
  });

  it('mock exact match FEI returns matched', async () => {
    const r = await verifyFEI({ fei: '3001234567', companyName: 'TestCo' }, { providers: [mock] });
    expect(r.status).toBe('matched');
    expect(r.matchedFacilityName).toBeDefined();
  });

  it('mock possible match FEI returns possible_match', async () => {
    const r = await verifyFEI({ fei: '3001234568' }, { providers: [mock] });
    expect(r.status).toBe('possible_match');
  });

  it('mock not_found FEI returns not_found', async () => {
    const r = await verifyFEI({ fei: '0000000000' }, { providers: [mock] });
    expect(r.status).toBe('not_found');
  });

  it('returns unavailable for FEIs not covered by mock rules', async () => {
    const r = await verifyFEI({ fei: '1111111111' }, { providers: [mock] });
    expect(r.status).toBe('lookup_unavailable');
  });

  it('downgrades strong provider match when user identity mismatches', async () => {
    const mismatchProvider: FEILookupProvider = {
      id: 'mismatch',
      label: 'mismatch',
      async lookup() {
        return {
          provider: 'mismatch',
          outcome: 'matched',
          confidence: 'exact',
          facilityName: 'Completely Different Industries Inc',
          city: 'Seattle',
          state: 'WA',
          country: 'US',
        };
      },
    };
    const r = await verifyFEI(
      { fei: '3001234567', companyName: 'Acme Medical', city: 'Boston', state: 'MA' },
      { providers: [mismatchProvider] },
    );
    expect(r.status).toBe('possible_match');
    expect(r.notes?.some((n) => /differs|mismatch|downgraded/i.test(n))).toBe(true);
  });
});

describe('summarizeFeiVerificationForUi', () => {
  it('describes format invalid', () => {
    expect(summarizeFeiVerificationForUi('12', null, true)).toContain('invalid');
  });

  it('describes not attempted', () => {
    expect(summarizeFeiVerificationForUi('1234567890', null, false)).toContain('not attempted');
  });

  it('describes matched', () => {
    expect(
      summarizeFeiVerificationForUi(
        '1234567890',
        {
          version: 1,
          status: 'matched',
          fei: '1234567890',
          checkedAt: '2026-01-01T00:00:00.000Z',
        },
        false,
      ),
    ).toContain('Matched establishment');
  });
});
