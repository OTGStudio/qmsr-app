import type { FDAData, FlagItem } from './analysis';
import type { Scenario } from './scenario';

export interface NarrativeViewProps {
  scenario: Scenario;
  fdaData: FDAData | null;
  flags: FlagItem[];
  isM2: boolean;
  premarket: boolean;
  onScenarioUpdate: (patch: Partial<Scenario>) => void;
}
