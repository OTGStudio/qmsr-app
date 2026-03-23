/**
 * FEI format validation is separate from establishment verification (evidence-based lookup).
 * @see src/lib/validation.ts — validateFEI
 * @see src/lib/feiVerification.ts — verifyFEI
 */

export type FEIVerificationStatus =
  | 'not_provided'
  | 'format_invalid'
  | 'not_attempted'
  | 'lookup_in_progress'
  | 'matched'
  | 'possible_match'
  | 'not_found'
  | 'lookup_unavailable'
  | 'verification_failed';

export type FEIMatchConfidence = 'exact' | 'strong' | 'weak' | 'none' | 'unknown';

/** Persisted evidence object for FEI establishment lookup (not a single boolean). */
export interface FEIVerificationResult {
  readonly version?: 1;
  readonly status: FEIVerificationStatus;
  readonly fei: string;
  readonly confidence?: FEIMatchConfidence;
  /** e.g. "mock provider", "openFDA-adjacent search", "legacy-import" */
  readonly source?: string;
  readonly sourceDetails?: string;
  readonly matchedFacilityName?: string | null;
  readonly matchedAddress?: string | null;
  readonly matchedCity?: string | null;
  readonly matchedState?: string | null;
  readonly matchedCountry?: string | null;
  readonly matchedPostalCode?: string | null;
  readonly notes?: readonly string[];
  readonly checkedAt?: string | null;
  /** True when the user explicitly ran verification (vs stale import). */
  readonly userInitiatedLookup?: boolean;
  readonly rawEvidence?: unknown;
}

export interface FacilityIdentityInput {
  readonly fei?: string;
  readonly companyName?: string;
  readonly addressLine1?: string;
  readonly city?: string;
  readonly state?: string;
  readonly postalCode?: string;
  readonly country?: string;
}

export type IdentityComparisonOutcome = {
  readonly aligned: boolean;
  readonly notes: readonly string[];
  readonly warnings: readonly string[];
};

/** Single provider response before mapping to FEIVerificationResult. */
export type FEILookupProviderOutcome = 'matched' | 'possible_match' | 'not_found' | 'unavailable';

export interface FEILookupProviderResult {
  readonly provider: string;
  readonly outcome: FEILookupProviderOutcome;
  readonly confidence: FEIMatchConfidence;
  readonly facilityName?: string;
  readonly address?: string;
  readonly city?: string;
  readonly state?: string;
  readonly postalCode?: string;
  readonly country?: string;
  readonly evidence?: unknown;
  readonly notes?: readonly string[];
}
