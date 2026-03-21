import type { FlagItem } from '@/types/analysis';
import type { OAFRDef } from '@/lib/domain';
import type { QMSAreaKey, Scenario } from '@/types/scenario';

export interface FrameworkViewProps {
  scenario: Scenario;
  areaPrompts: Record<QMSAreaKey, string[]>;
  flags: FlagItem[];
  isM2: boolean;
  premarket: boolean;
  oafrs: readonly OAFRDef[];
}
