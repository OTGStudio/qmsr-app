import { createMockFeiProvider } from '@/lib/feiProviders/mockProvider';
import { provisionalOpenFdaProvider } from '@/lib/feiProviders/provisionalOpenFdaProvider';
import type { FEILookupProvider } from '@/lib/feiProviders/base';
import type {
  FEILookupProviderResult,
  FEIVerificationResult,
  FEIVerificationStatus,
  FacilityIdentityInput,
  IdentityComparisonOutcome,
} from '@/types/facility';

export type { FEILookupProviderResult } from '@/types/facility';

function defaultProviders(): FEILookupProvider[] {
  if (import.meta.env.VITE_FEI_MOCK === 'true') {
    return [createMockFeiProvider()];
  }
  return [provisionalOpenFdaProvider];
}

/** Trim and validate FEI is exactly 10 digits (aligned with validateFEI in validation.ts). */
export function normalizeFEI(raw: string): { ok: true; value: string } | { ok: false } {
  const t = raw.trim();
  if (t.length === 0) return { ok: false };
  if (!/^\d{10}$/.test(t)) return { ok: false };
  return { ok: true, value: t };
}

function normalizeToken(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Conservative comparison of user-entered facility context vs lookup match.
 * Does not use fuzzy-match libraries — substring / equality only.
 */
export function compareFacilityIdentity(
  user: FacilityIdentityInput,
  matched: {
    readonly facilityName?: string;
    readonly city?: string;
    readonly state?: string;
    readonly postalCode?: string;
    readonly country?: string;
  },
): IdentityComparisonOutcome {
  const notes: string[] = [];
  const warnings: string[] = [];

  const uc = (user.companyName ?? '').trim();
  const mf = (matched.facilityName ?? '').trim();
  if (uc && mf) {
    const a = normalizeToken(uc);
    const b = normalizeToken(mf);
    const loose =
      a === b || b.includes(a) || a.includes(b) || a.replace(/[^a-z0-9]/g, '') === b.replace(/[^a-z0-9]/g, '');
    if (!loose) {
      warnings.push(
        'FEI lookup returned a facility name that differs from the entered company name — review before treating the match as authoritative.',
      );
    } else {
      notes.push('Company name is loosely consistent with the matched establishment label.');
    }
  }

  const us = (user.state ?? '').trim().toUpperCase();
  const ms = (matched.state ?? '').trim().toUpperCase();
  if (us && ms && us !== ms) {
    warnings.push('State mismatch between entered context and matched establishment.');
  }

  const ucity = (user.city ?? '').trim();
  const mcity = (matched.city ?? '').trim();
  if (ucity && mcity && normalizeToken(ucity) !== normalizeToken(mcity)) {
    warnings.push('City mismatch between entered context and matched establishment.');
  }

  const uco = (user.country ?? '').trim().toUpperCase();
  const mco = (matched.country ?? '').trim().toUpperCase();
  if (uco && mco && uco !== mco) {
    warnings.push('Country mismatch between entered context and matched establishment.');
  }

  if (user.postalCode && matched.postalCode) {
    const uzip = user.postalCode.replace(/\D/g, '').slice(0, 5);
    const mzip = matched.postalCode.replace(/\D/g, '').slice(0, 5);
    if (uzip && mzip && uzip !== mzip) {
      warnings.push('Postal code mismatch between entered context and matched establishment.');
    }
  }

  return { aligned: warnings.length === 0, notes, warnings };
}

function mapOutcomeToStatus(outcome: FEILookupProviderResult['outcome']): FEIVerificationStatus {
  switch (outcome) {
    case 'matched':
      return 'matched';
    case 'possible_match':
      return 'possible_match';
    case 'not_found':
      return 'not_found';
    case 'unavailable':
      return 'lookup_unavailable';
    default:
      return 'lookup_unavailable';
  }
}

export function buildVerificationResultFromProvider(
  providerResult: FEILookupProviderResult,
  fei: string,
  user: FacilityIdentityInput,
  userInitiatedLookup: boolean,
): FEIVerificationResult {
  let status = mapOutcomeToStatus(providerResult.outcome);
  let confidence = providerResult.confidence;

  const identity = compareFacilityIdentity(user, {
    facilityName: providerResult.facilityName,
    city: providerResult.city,
    state: providerResult.state,
    postalCode: providerResult.postalCode,
    country: providerResult.country,
  });

  let mergedNotes = [...(providerResult.notes ?? []), ...identity.notes];
  if (providerResult.outcome === 'matched' && identity.warnings.length > 0) {
    status = 'possible_match';
    confidence = 'weak';
    mergedNotes = [
      ...mergedNotes,
      'Match strength downgraded to possible match because entered facility context does not align with the returned establishment fields.',
    ];
  }

  return {
    version: 1,
    status,
    fei,
    confidence,
    source: providerResult.provider,
    matchedFacilityName: providerResult.facilityName ?? null,
    matchedAddress: providerResult.address ?? null,
    matchedCity: providerResult.city ?? null,
    matchedState: providerResult.state ?? null,
    matchedCountry: providerResult.country ?? null,
    matchedPostalCode: providerResult.postalCode ?? null,
    notes: [...mergedNotes, ...identity.warnings],
    checkedAt: new Date().toISOString(),
    userInitiatedLookup,
    rawEvidence: providerResult.evidence,
  };
}

/**
 * Run establishment lookup through the configured provider chain.
 * First provider wins; extend with additional providers when authoritative sources exist.
 */
export async function verifyFEI(
  input: FacilityIdentityInput,
  options?: { providers?: FEILookupProvider[] },
): Promise<FEIVerificationResult> {
  const providers = options?.providers ?? defaultProviders();
  const n = normalizeFEI(input.fei ?? '');
  if (!n.ok) {
    return {
      version: 1,
      status: 'format_invalid',
      fei: (input.fei ?? '').trim(),
      notes: ['FEI format is not valid — use exactly 10 numeric digits before verification.'],
      checkedAt: new Date().toISOString(),
      userInitiatedLookup: true,
    };
  }

  const fei = n.value;
  const userWithFei: FacilityIdentityInput = { ...input, fei };

  for (const p of providers) {
    const pr = await p.lookup(userWithFei);
    return buildVerificationResultFromProvider(pr, fei, userWithFei, true);
  }

  return {
    version: 1,
    status: 'lookup_unavailable',
    fei,
    source: 'none',
    notes: ['No lookup providers configured.'],
    checkedAt: new Date().toISOString(),
    userInitiatedLookup: true,
  };
}

/** Short, inspection-oriented copy for Step 1 / Step 7 (non-authoritative wording). */
export function summarizeFeiVerificationForUi(
  fei: string,
  verify: FEIVerificationResult | null,
  formatInvalid: boolean,
): string {
  if (!fei.trim()) return 'FEI not provided.';
  if (formatInvalid) return 'FEI format invalid — enter exactly 10 numeric digits.';
  if (!verify) {
    return 'Verification not attempted — FEI format valid is not the same as establishment verification.';
  }
  switch (verify.status) {
    case 'matched':
      return 'Matched establishment identity (non-authoritative source — confirm with firm records if required).';
    case 'possible_match':
      return 'Possible establishment match — review matched fields before relying on them.';
    case 'not_found':
      return 'No establishment match found from available lookup.';
    case 'lookup_unavailable':
      return 'Lookup currently unavailable — automated FEI establishment check was not performed.';
    case 'format_invalid':
      return 'Last verification attempt: FEI format was invalid.';
    case 'verification_failed':
      return 'Verification did not support this FEI as a usable establishment match.';
    case 'lookup_in_progress':
      return 'Lookup in progress…';
    case 'not_provided':
    case 'not_attempted':
      return 'Verification not attempted.';
    default:
      return verify.status;
  }
}
