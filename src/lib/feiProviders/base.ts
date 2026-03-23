import type { FEILookupProviderResult, FacilityIdentityInput } from '@/types/facility';

export interface FEILookupProvider {
  readonly id: string;
  readonly label: string;
  lookup(input: FacilityIdentityInput): Promise<FEILookupProviderResult>;
}
