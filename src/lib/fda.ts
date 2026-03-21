import type { ClassificationResult, FDAData, FDARecallRecord, RecallItem } from '@/types/analysis';
import type { Scenario } from '@/types/scenario';

const OPENFDA_BASE = 'https://api.fda.gov';

function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError';
}

function quoteSearchTerm(value: string): string {
  const escaped = value.replace(/"/g, '\\"');
  return `"${escaped}"`;
}

export function buildFDASearchTerms(
  scenario: Pick<Scenario, 'companyName' | 'productCode' | 'feiNumber'>,
): { eventSearch: string | null; recallSearch: string | null } {
  const productCode = scenario.productCode.trim();
  const companyName = scenario.companyName.trim();
  const fei = scenario.feiNumber.trim();

  let eventSearch: string | null = null;
  if (productCode && companyName) {
    eventSearch = [
      `device.device_report_product_code:${productCode}`,
      'AND',
      `manufacturer_d_name.exact:${quoteSearchTerm(companyName)}`,
    ].join('+');
  }

  let recallSearch: string | null = null;
  if (fei) {
    recallSearch = `firm_fei_number:${fei}`;
  } else if (companyName) {
    recallSearch = `recalling_firm:${quoteSearchTerm(companyName)}`;
  }
  if (recallSearch && productCode) {
    recallSearch = `${recallSearch}+AND+product_code:${productCode}`;
  }

  return { eventSearch, recallSearch };
}

interface OpenFDACountResult {
  term: string;
  count: number;
}

interface OpenFDACountResponse {
  results?: OpenFDACountResult[];
}

interface OpenFDARecallResult {
  classification?: string;
  recall_status?: string;
  status?: string;
  reason_for_recall?: string;
  recall_initiation_date?: string;
  product_description?: string;
  recall_number?: string;
}

interface OpenFDARecallResponse {
  results?: OpenFDARecallResult[];
}

interface OpenFDAClassificationResult {
  device_name?: string;
  device_class?: string;
  product_code?: string;
  regulation_number?: string;
  implant_flag?: string;
  life_sustain_support_flag?: string;
  gmp_exempt_flag?: string;
}

interface OpenFDAClassificationResponse {
  results?: OpenFDAClassificationResult[];
}

function parseMetaTotal(json: { meta?: { results?: { total?: number } } }): number {
  return json.meta?.results?.total ?? 0;
}

export async function fetchMDRByYear(
  searchTerm: string,
  signal?: AbortSignal,
  yearsBack = 6,
): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  const trimmed = searchTerm.trim();
  if (!trimmed) return out;

  const currentYear = new Date().getFullYear();
  const startYear = currentYear - yearsBack + 1;

  for (let y = startYear; y <= currentYear; y++) {
    try {
      const dateRange = `date_received:[${y}0101+TO+${y}1231]`;
      const fullSearch = `${trimmed}+AND+${dateRange}`;
      const url = `${OPENFDA_BASE}/device/event.json?search=${encodeURIComponent(fullSearch)}&limit=1`;
      const res = await fetch(url, { signal });
      if (!res.ok) {
        out[String(y)] = 0;
        continue;
      }
      const json = (await res.json()) as { meta?: { results?: { total?: number } } };
      out[String(y)] = parseMetaTotal(json);
    } catch (err) {
      if (isAbortError(err)) return out;
      out[String(y)] = 0;
    }
  }

  return out;
}

export async function fetchMDRTypes(
  searchTerm: string,
  signal?: AbortSignal,
): Promise<Array<{ term: string; count: number }>> {
  const trimmed = searchTerm.trim();
  if (!trimmed) return [];

  try {
    const url = `${OPENFDA_BASE}/device/event.json?search=${encodeURIComponent(trimmed)}&count=event_type.exact&limit=1000`;
    const res = await fetch(url, { signal });
    if (!res.ok) return [];
    const json = (await res.json()) as OpenFDACountResponse;
    return (json.results ?? []).map((r) => ({ term: r.term, count: r.count }));
  } catch (err) {
    if (isAbortError(err)) return [];
    return [];
  }
}

function mapRecallRow(r: OpenFDARecallResult): RecallItem {
  return {
    classification: r.classification ?? '',
    status: r.recall_status ?? r.status ?? '',
    reason: r.reason_for_recall ?? '',
    initiated: r.recall_initiation_date ?? '',
    description: r.product_description ?? '',
    recallNumber: r.recall_number,
  };
}

export async function fetchRecalls(recallSearch: string, signal?: AbortSignal): Promise<RecallItem[]> {
  const trimmed = recallSearch.trim();
  if (!trimmed) return [];

  try {
    const url = `${OPENFDA_BASE}/device/recall.json?search=${encodeURIComponent(trimmed)}&limit=100`;
    const res = await fetch(url, { signal });
    if (!res.ok) return [];
    const json = (await res.json()) as OpenFDARecallResponse;
    return (json.results ?? []).map(mapRecallRow);
  } catch (err) {
    if (isAbortError(err)) return [];
    return [];
  }
}

function mapClassificationRow(r: OpenFDAClassificationResult): ClassificationResult {
  const yn = (v: string | undefined): boolean =>
    v === 'Y' || v === 'y' || v === '1' || /^true$/i.test(v ?? '');

  return {
    device_name: r.device_name ?? '',
    device_class: r.device_class ?? '',
    product_code: r.product_code ?? '',
    regulation_number: r.regulation_number ?? '',
    implant_flag: yn(r.implant_flag),
    life_sustain_support_flag: yn(r.life_sustain_support_flag),
    gmp_exempt_flag: yn(r.gmp_exempt_flag),
  };
}

/** Map openFDA `device_class` text to scenario `manualClass` keys. */
export function mapClassificationDeviceClassToManual(
  deviceClass: string,
): '1' | '2' | '3' | 'F' | 'U' {
  const s = deviceClass.trim().toUpperCase();
  if (s === 'F' || s.includes('HDE')) return 'F';
  if (/\bCLASS\s+III\b|\bIII\b/.test(s) || s === '3') return '3';
  if (/\bCLASS\s+II\b|\bII\b/.test(s) || s === '2') return '2';
  if (/\bCLASS\s+I\b/.test(s) || s === '1' || (s === 'I' && !s.includes('II'))) return '1';
  if (s.includes('UNCLASS') || s === 'U') return 'U';
  if (/^[123]$/.test(s)) {
    return s === '1' ? '1' : s === '2' ? '2' : '3';
  }
  return 'U';
}

/** Build openFDA device classification `search` query from scenario fields (priority: product code → regulation → device name). */
export function buildClassificationSearchQuery(
  scenario: Pick<Scenario, 'productCode' | 'regulationNum' | 'productName'>,
): string | null {
  const pc = scenario.productCode.trim().toUpperCase();
  const reg = scenario.regulationNum.trim();
  const name = scenario.productName.trim();
  if (pc) return `product_code:${pc}`;
  if (reg) {
    const n = reg.replace(/^21\s*CFR\s*/i, '').replace(/\s+/g, '').trim();
    if (!n) return null;
    return `openfda.regulation_number:${n}`;
  }
  if (name) return `device_name:${quoteSearchTerm(name)}`;
  return null;
}

export async function fetchClassification(query: string): Promise<{
  results: ClassificationResult[];
  error: string | null;
}> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { results: [], error: null };
  }

  try {
    const url = `${OPENFDA_BASE}/device/classification.json?search=${encodeURIComponent(trimmed)}&limit=100`;
    const res = await fetch(url);
    if (!res.ok) {
      return {
        results: [],
        error: `FDA classification lookup failed (${res.status}). Try again later.`,
      };
    }
    const json = (await res.json()) as OpenFDAClassificationResponse;
    return {
      results: (json.results ?? []).map(mapClassificationRow),
      error: null,
    };
  } catch (err) {
    if (isAbortError(err)) {
      return { results: [], error: null };
    }
    const message = err instanceof Error ? err.message : 'Lookup failed.';
    return { results: [], error: message };
  }
}

function recallItemToFdaRecord(item: RecallItem): FDARecallRecord {
  const open = /open/i.test(item.status);
  return {
    recallNumber: item.recallNumber,
    classification: item.classification || undefined,
    reasonForRecall: item.reason || undefined,
    recallInitiationDate: item.initiated || undefined,
    status: item.status || undefined,
    openStatus: item.status ? (open ? 'Open' : 'Closed') : undefined,
  };
}

export async function fetchFDAData(
  scenario: Pick<Scenario, 'companyName' | 'productCode' | 'feiNumber'>,
  signal?: AbortSignal,
): Promise<FDAData> {
  const { eventSearch, recallSearch } = buildFDASearchTerms(scenario);

  let mdr: Record<string, number> = {};
  let mdrTypesList: Array<{ term: string; count: number }> = [];

  if (eventSearch) {
    const [byYear, types] = await Promise.all([
      fetchMDRByYear(eventSearch, signal),
      fetchMDRTypes(eventSearch, signal),
    ]);
    mdr = byYear;
    mdrTypesList = types;
  }

  const recallItems = recallSearch ? await fetchRecalls(recallSearch, signal) : [];

  const mdrTypes: Record<string, number> = Object.fromEntries(
    mdrTypesList.map((x) => [x.term, x.count]),
  );

  return {
    mdr,
    mdrTypes,
    recalls: recallItems.map(recallItemToFdaRecord),
    gudidUrl: buildGudidUrl(scenario.productCode),
    error: null,
    ...computeMdrAnalytics(mdr),
  };
}

function computeMdrAnalytics(mdr: Record<string, number>): Pick<
  FDAData,
  'mdrTotal' | 'mdrRecent3yr' | 'mdrOlder3yr' | 'mdrTrendPercent'
> {
  const years = Object.keys(mdr)
    .map((y) => Number(y))
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);

  const mdrTotal = Object.values(mdr).reduce((a, b) => a + b, 0);

  const recentYears = years.slice(-3);
  const olderYears = years.slice(-6, -3);

  const mdrRecent3yr = recentYears.reduce((s, y) => s + (mdr[String(y)] ?? 0), 0);
  const mdrOlder3yr = olderYears.reduce((s, y) => s + (mdr[String(y)] ?? 0), 0);

  let mdrTrendPercent: number | null = null;
  if (mdrOlder3yr > 0) {
    mdrTrendPercent = ((mdrRecent3yr - mdrOlder3yr) / mdrOlder3yr) * 100;
  } else if (mdrOlder3yr === 0 && mdrRecent3yr > 0) {
    mdrTrendPercent = 100;
  }

  return { mdrTotal, mdrRecent3yr, mdrOlder3yr, mdrTrendPercent };
}

function buildGudidUrl(productCode: string): string | null {
  const pc = productCode.trim();
  if (!pc) return null;
  return `https://accessgudid.nlm.nih.gov/verify-ci.htm?query=${encodeURIComponent(pc)}`;
}
