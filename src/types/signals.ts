import type { FlagItem, RecallItem } from './analysis';
import type { InspectionType, Scenario } from './scenario';

export interface SignalsViewProps {
  scenario: Scenario;
  premarket: boolean;
  itype: InspectionType;
  onScenarioSynced: (patch: Partial<Scenario>) => void;
}

export interface MDRSparklineProps {
  byYear: Record<string, number>;
  years: string[];
}

export interface RecallListProps {
  recalls: RecallItem[];
}

export interface FlagCardProps {
  flag: FlagItem;
}
