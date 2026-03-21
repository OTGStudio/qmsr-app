import { useOutletContext } from 'react-router-dom';

import { OAFRS, QMS_AREAS } from '@/lib/domain';
import type { FrameworkViewProps } from '@/types/framework';
import type { ScenarioDetailOutletContext } from '@/types/scenarioDetail';

import { AreaCard } from './AreaCard';
import { OAFRList } from './OAFRList';

function FrameworkViewInner({
  scenario,
  areaPrompts,
  flags,
  isM2,
  premarket,
  oafrs,
}: FrameworkViewProps) {
  const sectionLabel = isM2
    ? 'All six QMS areas — required minimum elements (Model 2)'
    : 'Generated lifecycle framework';

  return (
    <div className="flex flex-col gap-6">
      {isM2 ? (
        <div
          className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm leading-relaxed text-indigo-950 dark:border-indigo-500/40 dark:bg-indigo-950/35 dark:text-indigo-100"
          role="note"
        >
          <p className="font-medium">Inspection Model 2 — comprehensive minimum coverage required.</p>
          <p className="mt-1">
            Every area below is required at the elements listed.
          </p>
        </div>
      ) : null}

      {premarket ? (
        <div
          className="rounded-xl border border-brand-border bg-brand-card px-4 py-3 text-sm leading-relaxed text-brand-text"
          role="note"
        >
          <p className="font-medium text-brand-text">Premarket mode</p>
          <p className="mt-1 text-brand-muted">
            Area focus reflects QMS readiness requirements for design and
            manufacturing controls; routine postmarket surveillance language is
            de-emphasized where the device is not yet marketed in the United
            States.
          </p>
        </div>
      ) : null}

      <div>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-muted">
          {sectionLabel}
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {QMS_AREAS.map((area) => {
            const bullets = areaPrompts[area.key] ?? [];
            const isFlagged = flags.some((f) => f.area === area.key);
            const rating = scenario.ratings[area.key];
            return (
              <AreaCard
                key={area.key}
                area={area}
                rating={rating}
                bullets={bullets}
                isFlagged={isFlagged}
                isM2={isM2}
              />
            );
          })}
        </div>
      </div>

      <OAFRList premarket={premarket} oafrs={oafrs} />
    </div>
  );
}

export function FrameworkView() {
  const ctx = useOutletContext<ScenarioDetailOutletContext>();
  const props: FrameworkViewProps = {
    scenario: ctx.scenario,
    areaPrompts: ctx.areaPrompts,
    flags: ctx.flags,
    isM2: ctx.isM2,
    premarket: ctx.premarket,
    oafrs: OAFRS,
  };
  return <FrameworkViewInner {...props} />;
}
