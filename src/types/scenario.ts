import type { FDAData } from './analysis';

export type QMSAreaKey = 'mgmt' | 'dd' | 'prod' | 'change' | 'out' | 'meas';

export type RatingValue = 'unknown' | 'weak' | 'partial' | 'strong';

export type InspectionType =
  | 'baseline'
  | 'nonBaseline'
  | 'compliance'
  | 'forcause'
  | 'spra'
  | 'pmaPre'
  | 'pmaPost'
  | 'premarketReview';

export type ScenarioRatings = Record<QMSAreaKey, RatingValue>;

/** Guided = one step at a time; freeform = all sections on one page (same data). */
export type WizardLayoutMode = 'guided' | 'freeform';

export interface WizardStepProps {
  scenario: Scenario;
  onUpdate: (patch: Partial<Scenario>) => void;
  /** Prefixed to control `id`s when multiple steps mount (freeform). */
  fieldIdPrefix?: string;
  wizardLayout?: WizardLayoutMode;
}

export interface Scenario {
  id?: string;
  name: string;
  notes?: string;
  // Facility
  productName: string;
  companyName: string;
  feiNumber: string;
  // Inspection (optional until selected in wizard step 2)
  inspType?: InspectionType;
  marketedUS: boolean;
  // Classification
  pathway: 'standard' | 'denovo';
  manualClass: '1' | '2' | '3' | 'F' | 'U';
  classSource: 'manual' | 'lookup';
  deviceClass?: string;
  productCode: string;
  regulationNum: string;
  // Risk
  risk: string;
  signals: string[];
  aiEnabled: boolean;
  swEnabled: boolean;
  cyberEnabled: boolean;
  pccpPlanned: boolean;
  // Self-assessment
  ratings: ScenarioRatings;
  areaNotes: Record<QMSAreaKey, string>;
  // FDA data cache
  fdaData?: FDAData | null;
  fdaPulledAt?: string | null;
  /** Cached inspection narrative from the narrative Edge Function (saved with scenario). */
  inspectionNarrative: string;
}

export const DEFAULT_RATINGS = {
  mgmt: 'unknown',
  dd: 'unknown',
  prod: 'unknown',
  change: 'unknown',
  out: 'unknown',
  meas: 'unknown',
} satisfies ScenarioRatings;

export const DEFAULT_SCENARIO = {
  name: 'Untitled scenario',
  productName: '',
  companyName: '',
  feiNumber: '',
  marketedUS: true,
  pathway: 'standard',
  manualClass: '2',
  classSource: 'manual',
  deviceClass: '',
  productCode: '',
  regulationNum: '',
  risk: '',
  signals: [],
  aiEnabled: false,
  swEnabled: false,
  cyberEnabled: false,
  pccpPlanned: false,
  ratings: DEFAULT_RATINGS,
  areaNotes: { mgmt: '', dd: '', prod: '', change: '', out: '', meas: '' },
  fdaData: null,
  fdaPulledAt: null,
  inspectionNarrative: '',
} satisfies Scenario;
