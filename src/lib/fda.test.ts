import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildClassificationSearchQuery,
  buildFDASearchTerms,
  fetchClassification,
  fetchFDAData,
  fetchMDRByYear,
  fetchMDRTypes,
  fetchRecalls,
  mapClassificationDeviceClassToManual,
} from '@/lib/fda';

describe('buildFDASearchTerms', () => {
  it('returns null event search when product code or company name is missing', () => {
    expect(
      buildFDASearchTerms({
        companyName: 'Acme',
        productCode: '',
        feiNumber: '',
      }).eventSearch,
    ).toBeNull();
    expect(
      buildFDASearchTerms({
        companyName: '',
        productCode: 'ABC',
        feiNumber: '',
      }).eventSearch,
    ).toBeNull();
  });

  it('builds device event search with product code and exact manufacturer name', () => {
    const { eventSearch } = buildFDASearchTerms({
      companyName: 'Acme Med',
      productCode: 'LZK',
      feiNumber: '',
    });
    expect(eventSearch).toBe(
      'device.device_report_product_code:LZK+AND+manufacturer_d_name.exact:"Acme Med"',
    );
  });

  it('escapes double quotes in manufacturer name for exact match', () => {
    const { eventSearch } = buildFDASearchTerms({
      companyName: 'Say "Hi"',
      productCode: 'X',
      feiNumber: '',
    });
    expect(eventSearch).toContain('manufacturer_d_name.exact:"Say \\"Hi\\""');
  });

  it('prefers FEI for recall search and ANDs product code when present', () => {
    const { recallSearch } = buildFDASearchTerms({
      companyName: '',
      productCode: 'LZK',
      feiNumber: '3001234567',
    });
    expect(recallSearch).toBe('firm_fei_number:3001234567+AND+product_code:LZK');
  });

  it('uses recalling_firm with quoted name when no FEI', () => {
    const { recallSearch } = buildFDASearchTerms({
      companyName: 'Beta Corp',
      productCode: 'AB',
      feiNumber: '',
    });
    expect(recallSearch).toBe('recalling_firm:"Beta Corp"+AND+product_code:AB');
  });

  it('allows recall-only search by firm without product code', () => {
    const { recallSearch } = buildFDASearchTerms({
      companyName: 'Gamma',
      productCode: '',
      feiNumber: '',
    });
    expect(recallSearch).toBe('recalling_firm:"Gamma"');
  });
});

describe('buildClassificationSearchQuery', () => {
  it('returns product_code search when product code is set', () => {
    expect(
      buildClassificationSearchQuery({
        productCode: 'lzk',
        regulationNum: '21 CFR 801.109',
        productName: 'Widget',
      }),
    ).toBe('product_code:LZK');
  });

  it('normalizes 21 CFR prefix and whitespace for regulation lookup', () => {
    expect(
      buildClassificationSearchQuery({
        productCode: '',
        regulationNum: '  21 CFR  801.109  ',
        productName: '',
      }),
    ).toBe('openfda.regulation_number:801.109');
  });

  it('returns null when regulation strips to empty', () => {
    expect(
      buildClassificationSearchQuery({
        productCode: '',
        regulationNum: '21 CFR   ',
        productName: '',
      }),
    ).toBeNull();
  });

  it('falls back to quoted device name when code and regulation absent', () => {
    expect(
      buildClassificationSearchQuery({
        productCode: '',
        regulationNum: '',
        productName: 'Cool Device',
      }),
    ).toBe('device_name:"Cool Device"');
  });

  it('returns null when all fields empty', () => {
    expect(
      buildClassificationSearchQuery({
        productCode: '',
        regulationNum: '',
        productName: '',
      }),
    ).toBeNull();
  });
});

describe('mapClassificationDeviceClassToManual', () => {
  it('maps HDE and F to F', () => {
    expect(mapClassificationDeviceClassToManual('HDE something')).toBe('F');
    expect(mapClassificationDeviceClassToManual('f')).toBe('F');
  });

  it('maps Class III variants to 3', () => {
    expect(mapClassificationDeviceClassToManual('CLASS III')).toBe('3');
    expect(mapClassificationDeviceClassToManual('III')).toBe('3');
    expect(mapClassificationDeviceClassToManual('3')).toBe('3');
  });

  it('maps Class II variants to 2', () => {
    expect(mapClassificationDeviceClassToManual('CLASS II')).toBe('2');
    expect(mapClassificationDeviceClassToManual('II')).toBe('2');
    expect(mapClassificationDeviceClassToManual('2')).toBe('2');
  });

  it('maps Class I and single I to 1', () => {
    expect(mapClassificationDeviceClassToManual('CLASS I')).toBe('1');
    expect(mapClassificationDeviceClassToManual('I')).toBe('1');
    expect(mapClassificationDeviceClassToManual('1')).toBe('1');
  });

  it('maps unclassified and unknown text to U', () => {
    expect(mapClassificationDeviceClassToManual('UNCLASSIFIED')).toBe('U');
    expect(mapClassificationDeviceClassToManual('U')).toBe('U');
    expect(mapClassificationDeviceClassToManual('something odd')).toBe('U');
  });
});

describe('fetchMDRByYear', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns empty object when search term is blank', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await expect(fetchMDRByYear('   ')).resolves.toEqual({});
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('requests one device/event call per year and sums meta total', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      new Response(JSON.stringify({ meta: { results: { total: 2 } } }), { status: 200 }),
    );

    const out = await fetchMDRByYear('device.device_report_product_code:X+AND+foo:bar');

    expect(globalThis.fetch).toHaveBeenCalledTimes(6);
    const firstUrl = String(vi.mocked(globalThis.fetch).mock.calls[0]?.[0]);
    expect(firstUrl).toContain('/device/event.json');
    expect(firstUrl).toContain('search=');
    expect(firstUrl).toContain('limit=1');
    expect(firstUrl).toContain('date_received%3A%5B20210101%2BTO%2B20211231%5D');

    expect(Object.keys(out).sort()).toEqual(['2021', '2022', '2023', '2024', '2025', '2026']);
    expect(Object.values(out).reduce((a, b) => a + b, 0)).toBe(12);
  });

  it('records zero for a year when the response is not ok', async () => {
    let call = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      call += 1;
      if (call === 1) {
        return new Response('', { status: 429 });
      }
      return new Response(JSON.stringify({ meta: { results: { total: 1 } } }), { status: 200 });
    });

    const out = await fetchMDRByYear('term');
    expect(out['2021']).toBe(0);
    expect(out['2022']).toBe(1);
  });
});

describe('fetchMDRTypes', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty array when search is blank', async () => {
    vi.spyOn(globalThis, 'fetch');
    await expect(fetchMDRTypes('')).resolves.toEqual([]);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('maps count results from openFDA', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            { term: 'Malfunction', count: 10 },
            { term: 'Injury', count: 2 },
          ],
        }),
        { status: 200 },
      ),
    );

    await expect(fetchMDRTypes('x')).resolves.toEqual([
      { term: 'Malfunction', count: 10 },
      { term: 'Injury', count: 2 },
    ]);
    const url = String(vi.mocked(globalThis.fetch).mock.calls[0]?.[0]);
    expect(url).toContain('count=event_type.exact');
  });
});

describe('fetchRecalls', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty when search is blank', async () => {
    await expect(fetchRecalls('')).resolves.toEqual([]);
  });

  it('maps recall_status and falls back to status', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            {
              classification: 'Class 2',
              recall_status: 'Open',
              reason_for_recall: 'Sterility',
              recall_initiation_date: '20240101',
              product_description: 'Kit',
              recall_number: 'Z-123',
            },
            {
              classification: 'Class 1',
              status: 'Closed',
              reason_for_recall: '',
              recall_initiation_date: '',
              product_description: '',
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const rows = await fetchRecalls('firm_fei_number:1');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      classification: 'Class 2',
      status: 'Open',
      reason: 'Sterility',
      initiated: '20240101',
      description: 'Kit',
      recallNumber: 'Z-123',
    });
    expect(rows[1]?.status).toBe('Closed');
  });
});

describe('fetchClassification', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty results for blank query without calling fetch', async () => {
    vi.spyOn(globalThis, 'fetch');
    await expect(fetchClassification('  ')).resolves.toEqual({ results: [], error: null });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('returns error message when response is not ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 503 }));

    const { results, error } = await fetchClassification('product_code:LZK');
    expect(results).toEqual([]);
    expect(error).toMatch(/503/);
  });

  it('maps classification rows and boolean flags', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            {
              device_name: 'Pump',
              device_class: 'CLASS II',
              product_code: 'FRN',
              regulation_number: '870.1234',
              implant_flag: 'Y',
              life_sustain_support_flag: '0',
              gmp_exempt_flag: 'true',
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const { results, error } = await fetchClassification('product_code:FRN');
    expect(error).toBeNull();
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      device_name: 'Pump',
      device_class: 'CLASS II',
      product_code: 'FRN',
      regulation_number: '870.1234',
      implant_flag: true,
      life_sustain_support_flag: false,
      gmp_exempt_flag: true,
    });
  });
});

describe('fetchFDAData', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('aggregates MDR by year, types, recalls, analytics, and GUDID URL', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL) => {
      const u = typeof input === 'string' ? input : input.toString();
      // Match `limit=1` but not `limit=1000` (substring "limit=1" matches both).
      const isMdrYearCall = u.includes('/device/event.json') && /[&?]limit=1(?:&|$)/.test(u);
      if (u.includes('count=event_type.exact')) {
        return new Response(
          JSON.stringify({ results: [{ term: 'Malfunction', count: 4 }] }),
          { status: 200 },
        );
      }
      if (isMdrYearCall) {
        return new Response(JSON.stringify({ meta: { results: { total: 10 } } }), { status: 200 });
      }
      if (u.includes('/device/recall.json')) {
        return new Response(
          JSON.stringify({
            results: [
              {
                classification: 'Class 2',
                recall_status: 'Open',
                reason_for_recall: 'Label',
                recall_initiation_date: '20250101',
                product_description: 'Device X',
                recall_number: 'R-1',
              },
            ],
          }),
          { status: 200 },
        );
      }
      return new Response('{}', { status: 404 });
    });

    const data = await fetchFDAData({
      companyName: 'Acme',
      productCode: 'LZK',
      feiNumber: '3000000001',
    });

    expect(data.mdrTotal).toBe(60);
    expect(data.mdrRecent3yr).toBe(30);
    expect(data.mdrOlder3yr).toBe(30);
    expect(data.mdrTrendPercent).toBe(0);
    expect(data.mdrTypes).toEqual({ Malfunction: 4 });
    expect(data.recalls[0]).toMatchObject({
      recallNumber: 'R-1',
      openStatus: 'Open',
      reasonForRecall: 'Label',
    });
    expect(data.gudidUrl).toBe('https://accessgudid.nlm.nih.gov/verify-ci.htm?query=LZK');
    expect(data.error).toBeNull();
  });

  it('sets mdrTrendPercent to 100 when older window is zero but recent has events', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL) => {
      const u = typeof input === 'string' ? input : input.toString();
      if (u.includes('/device/event.json') && u.includes('limit=1')) {
        const is2026 = u.includes('20260101');
        return new Response(
          JSON.stringify({ meta: { results: { total: is2026 ? 5 : 0 } } }),
          { status: 200 },
        );
      }
      if (u.includes('count=event_type.exact')) {
        return new Response(JSON.stringify({ results: [] }), { status: 200 });
      }
      return new Response(JSON.stringify({ results: [] }), { status: 200 });
    });

    const data = await fetchFDAData({
      companyName: 'Solo',
      productCode: 'X',
      feiNumber: '',
    });

    expect(data.mdrOlder3yr).toBe(0);
    expect(data.mdrRecent3yr).toBe(5);
    expect(data.mdrTrendPercent).toBe(100);
  });
});
