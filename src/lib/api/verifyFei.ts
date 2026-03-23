import { verifyFEI } from '@/lib/feiVerification';
import type { FEILookupProvider } from '@/lib/feiProviders/base';
import type { FEIVerificationResult, FacilityIdentityInput } from '@/types/facility';

/**
 * Client entry point for FEI establishment verification.
 * Keeps a stable import path if verification later moves behind an Edge Function.
 */
export async function verifyFeiEstablishment(
  input: FacilityIdentityInput,
  options?: { providers?: FEILookupProvider[] },
): Promise<FEIVerificationResult> {
  return verifyFEI(input, options);
}
