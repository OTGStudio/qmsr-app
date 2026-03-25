import { normalizeSignals } from '@/lib/signalRegistry';
import type { FDAData, ScenarioFacts } from '@/types/analysis';
import type { Database, Json } from '@/types/database';
import type { FEIVerificationResult } from '@/types/facility';
import {
  DEFAULT_SCENARIO,
  type InspectionType,
  type QMSAreaKey,
  type Scenario,
  type ScenarioRatings,
} from '@/types/scenario';

export type ScenarioInsert = Database['public']['Tables']['scenarios']['Insert'];

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseRatings(value: Json | null | undefined): ScenarioRatings {
  if (!isRecord(value)) {
    return {
      mgmt: 'unknown',
      dd: 'unknown',
      prod: 'unknown',
      change: 'unknown',
      out: 'unknown',
      meas: 'unknown',
    };
  }
  const keys: QMSAreaKey[] = ['mgmt', 'dd', 'prod', 'change', 'out', 'meas'];
  const out = { ...value } as Record<string, string>;
  const base: Partial<ScenarioRatings> = {};
  for (const k of keys) {
    const v = out[k];
    base[k] =
      v === 'unknown' || v === 'weak' || v === 'partial' || v === 'strong'
        ? v
        : 'unknown';
  }
  return base as ScenarioRatings;
}

function parseFeiVerificationJson(value: Json | null | undefined): FEIVerificationResult | null {
  if (value === null || value === undefined) return null;
  if (!isRecord(value)) return null;
  if (typeof value.status !== 'string') return null;
  return value as unknown as FEIVerificationResult;
}

function parseSignalsFromRow(
  signalsCol: string[] | null | undefined,
  unsupportedCol: string[] | null | undefined,
): Pick<Scenario, 'signals' | 'unsupportedSignals'> {
  const { canonical, rejected } = normalizeSignals(signalsCol ?? []);
  const fromDb = unsupportedCol ?? [];
  const mergedUnsupported = [...new Set([...rejected, ...fromDb])];
  return { signals: canonical, unsupportedSignals: mergedUnsupported };
}

function parseAreaNotes(value: Json | null | undefined): Record<QMSAreaKey, string> {
  const empty: Record<QMSAreaKey, string> = {
    mgmt: '',
    dd: '',
    prod: '',
    change: '',
    out: '',
    meas: '',
  };
  if (!isRecord(value)) return empty;
  const keys: QMSAreaKey[] = ['mgmt', 'dd', 'prod', 'change', 'out', 'meas'];
  for (const k of keys) {
    const v = value[k];
    empty[k] = typeof v === 'string' ? v : '';
  }
  return empty;
}

function parseScenarioFacts(value: Json | null | undefined): Partial<ScenarioFacts> | null {
  if (!isRecord(value)) return null;
  return value as unknown as Partial<ScenarioFacts>;
}

/** Temporary storage key for wizard scenario when user must sign in before save. */
export const PENDING_SCENARIO_STORAGE_KEY = 'qmsr_pending_scenario_v1' as const;

/** Merge JSON-parsed wizard state with defaults and normalize legacy signal labels to keys. */
export function mergePendingScenarioIntoDefault(raw: Partial<Scenario>): Scenario {
  const base: Scenario = { ...DEFAULT_SCENARIO, ...raw };
  const rawSignals = raw.signals ?? base.signals;
  const { canonical, rejected } = normalizeSignals(rawSignals as unknown as string[]);
  const unsupported = [...new Set([...(base.unsupportedSignals ?? []), ...rejected])];
  const feiVerification =
    raw.feiVerification !== undefined ? raw.feiVerification : base.feiVerification;
  return {
    ...base,
    signals: canonical,
    unsupportedSignals: unsupported,
    feiVerification,
  };
}

export function scenarioToDb(scenario: Scenario): ScenarioInsert {
  return {
    name: scenario.name,
    notes: scenario.notes ?? null,
    product_name: scenario.productName,
    company_name: scenario.companyName,
    fei_number: scenario.feiNumber,
    fei_verification: (scenario.feiVerification ?? null) as unknown as Json | null,
    insp_type: scenario.inspType ?? 'baseline',
    marketed_us: scenario.marketedUS,
    pathway: scenario.pathway,
    manual_class: scenario.manualClass,
    class_source: scenario.classSource,
    device_class: scenario.deviceClass ?? null,
    product_code: scenario.productCode,
    regulation_num: scenario.regulationNum,
    risk: scenario.risk,
    signals: scenario.signals,
    unsupported_signals: scenario.unsupportedSignals,
    ai_enabled: scenario.aiEnabled,
    sw_enabled: scenario.swEnabled,
    cyber_enabled: scenario.cyberEnabled,
    pccp_planned: scenario.pccpPlanned,
    scenario_facts: (scenario.scenarioFacts ?? null) as unknown as Json | null,
    ratings: scenario.ratings as unknown as Json,
    area_notes: scenario.areaNotes as unknown as Json,
    fda_data: (scenario.fdaData ?? null) as unknown as Json | null,
    fda_pulled_at: scenario.fdaPulledAt ?? null,
    inspection_narrative:
      scenario.inspectionNarrative.trim() === ''
        ? null
        : scenario.inspectionNarrative.trim(),
  };
}

/** Deep-merge `patch` into `base` for optimistic updates (ratings / areaNotes shallow-merge). */
export function mergeScenarioPatch(base: Scenario, patch: Partial<Scenario>): Scenario {
  return {
    ...base,
    ...patch,
    ratings: patch.ratings ? { ...base.ratings, ...patch.ratings } : base.ratings,
    areaNotes: patch.areaNotes ? { ...base.areaNotes, ...patch.areaNotes } : base.areaNotes,
    signals: patch.signals !== undefined ? patch.signals : base.signals,
    unsupportedSignals:
      patch.unsupportedSignals !== undefined ? patch.unsupportedSignals : base.unsupportedSignals,
    feiVerification:
      patch.feiVerification !== undefined ? patch.feiVerification : base.feiVerification,
    scenarioFacts:
      patch.scenarioFacts !== undefined ? patch.scenarioFacts : base.scenarioFacts,
    fdaData: patch.fdaData !== undefined ? patch.fdaData : base.fdaData,
    fdaPulledAt: patch.fdaPulledAt !== undefined ? patch.fdaPulledAt : base.fdaPulledAt,
    inspectionNarrative:
      patch.inspectionNarrative !== undefined
        ? patch.inspectionNarrative
        : base.inspectionNarrative,
  };
}

export function dbToScenario(row: Tables<'scenarios'>): Scenario {
  return {
    id: row.id,
    name: row.name,
    notes: row.notes ?? undefined,
    productName: row.product_name ?? '',
    companyName: row.company_name ?? '',
    feiNumber: row.fei_number ?? '',
    feiVerification: parseFeiVerificationJson(row.fei_verification),
    inspType: row.insp_type as InspectionType,
    marketedUS: row.marketed_us ?? true,
    pathway: (row.pathway === 'denovo' ? 'denovo' : 'standard') as Scenario['pathway'],
    manualClass: (row.manual_class ?? '2') as Scenario['manualClass'],
    classSource: (row.class_source === 'lookup' ? 'lookup' : 'manual') as Scenario['classSource'],
    deviceClass: row.device_class ?? '',
    productCode: row.product_code ?? '',
    regulationNum: row.regulation_num ?? '',
    risk: row.risk ?? '',
    ...parseSignalsFromRow(row.signals, row.unsupported_signals),
    aiEnabled: row.ai_enabled ?? false,
    swEnabled: row.sw_enabled ?? false,
    cyberEnabled: row.cyber_enabled ?? false,
    pccpPlanned: row.pccp_planned ?? false,
    scenarioFacts: parseScenarioFacts(row.scenario_facts),
    ratings: parseRatings(row.ratings),
    areaNotes: parseAreaNotes(row.area_notes),
    fdaData: (row.fda_data as FDAData | null | undefined) ?? null,
    fdaPulledAt: row.fda_pulled_at ?? null,
    inspectionNarrative: row.inspection_narrative ?? '',
  };
}
