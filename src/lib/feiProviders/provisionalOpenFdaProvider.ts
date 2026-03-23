import type { FEILookupProvider } from '@/lib/feiProviders/base';
import type { FEILookupProviderResult } from '@/types/facility';

/**
 * Provisional / openFDA-adjacent provider.
 *
 * openFDA does not expose a guaranteed canonical “FEI exists” API suitable for
 * authoritative establishment verification. This provider therefore does NOT
 * claim a match from public endpoints alone.
 *
 * TODO: Plug in a future authoritative FDA establishment / FEI registry source
 * (e.g. internal FDA systems, licensed data, or a validated backend service).
 */
export const provisionalOpenFdaProvider: FEILookupProvider = {
  id: 'provisional-openfda',
  label: 'openFDA-adjacent search',
  async lookup(input): Promise<FEILookupProviderResult> {
    const fei = (input.fei ?? '').trim();
    return {
      provider: 'openFDA-adjacent search',
      outcome: 'unavailable',
      confidence: 'unknown',
      evidence: { fei, reason: 'no_authoritative_public_fei_endpoint_wired' },
      notes: [
        'No authoritative FEI existence check is wired yet. Public openFDA endpoints are useful for enrichment (e.g. recalls, MDR) but are not treated as a complete FEI registry.',
        'Use firm records or FDA establishment verification outside this tool when required.',
      ],
    };
  },
};
