import type { OAIFactors as OAIFactorsData, RiskThread } from '@/types/analysis';
import type { Scenario } from '@/types/scenario';

export interface ThreadViewProps {
  scenario: Scenario;
  riskThread: RiskThread;
  recordsList: string[];
  oaiFactors: OAIFactorsData;
  isM2: boolean;
  premarket: boolean;
}
