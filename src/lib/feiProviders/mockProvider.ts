import type { FEILookupProvider } from '@/lib/feiProviders/base';
import type { FEILookupProviderResult } from '@/types/facility';

/**
 * Deterministic mock provider for tests and offline demos.
 * Not authoritative — label clearly identifies source.
 */
export function createMockFeiProvider(rules?: {
  readonly exactMatchFei?: string;
  readonly possibleMatchFei?: string;
  readonly notFoundFei?: string;
}): FEILookupProvider {
  const exact = rules?.exactMatchFei ?? '3001234567';
  const possible = rules?.possibleMatchFei ?? '3001234568';
  const notFound = rules?.notFoundFei ?? '0000000000';

  return {
    id: 'mock',
    label: 'mock provider',
    async lookup(input): Promise<FEILookupProviderResult> {
      const fei = (input.fei ?? '').trim();
      if (fei === exact) {
        return {
          provider: 'mock provider',
          outcome: 'matched',
          confidence: 'exact',
          facilityName: input.companyName ? `Registered: ${input.companyName}` : 'Mock Establishment LLC',
          city: 'Arlington',
          state: 'VA',
          country: 'US',
          postalCode: '22202',
          evidence: { mock: true, fei },
          notes: ['Deterministic mock match for automated tests.'],
        };
      }
      if (fei === possible) {
        return {
          provider: 'mock provider',
          outcome: 'possible_match',
          confidence: 'weak',
          facilityName: 'Similar-Sounding Medical Co.',
          city: 'Boston',
          state: 'MA',
          country: 'US',
          evidence: { mock: true, fei },
          notes: ['Mock possible match — user should confirm against authoritative records.'],
        };
      }
      if (fei === notFound) {
        return {
          provider: 'mock provider',
          outcome: 'not_found',
          confidence: 'none',
          evidence: { mock: true, fei },
          notes: ['Mock: no establishment row returned for this FEI.'],
        };
      }
      return {
        provider: 'mock provider',
        outcome: 'unavailable',
        confidence: 'unknown',
        evidence: { mock: true, fei },
        notes: ['Mock: no rule for this FEI — treated as unavailable.'],
      };
    },
  };
}
