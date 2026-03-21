import type {
  FlagItem,
  OAIFactors,
  ReadinessSummary,
  RiskThread,
} from '@/types/analysis';
import type { InspectionType, QMSAreaKey, Scenario } from '@/types/scenario';

/** Values passed from `ScenarioDetail` to nested tab routes via `<Outlet context />`. */
export interface ScenarioDetailOutletContext {
  scenario: Scenario;
  update: (patch: Partial<Scenario>) => void;
  isM2: boolean;
  premarket: boolean;
  itype: InspectionType;
  softwareEnabled: boolean;
  flags: FlagItem[];
  areaPrompts: Record<QMSAreaKey, string[]>;
  riskThread: RiskThread;
  recordsList: string[];
  oaiFactors: OAIFactors;
  overallReadiness: ReadinessSummary;
}
