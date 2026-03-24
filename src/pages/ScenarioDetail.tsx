import { useMemo } from 'react';
import { Link, NavLink, Outlet, useParams } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  buildFocus,
  buildOAIFactors,
  buildRecordsRequest,
  buildRiskThread,
  getOverallReadiness,
  scenarioToAnalysisContext,
  triangulate,
} from '@/lib/analysis';
import { AREA_ORDER, ITYPES, isPremarket } from '@/lib/domain';
import { cn } from '@/lib/utils';
import { useScenario } from '@/hooks/useScenario';
import type { OAIContext, ReadinessContext } from '@/types/analysis';
import type { ScenarioDetailOutletContext } from '@/types/scenarioDetail';
import type { QMSAreaKey } from '@/types/scenario';

const tabClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-t-md border-b-2 px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'border-brand-accent text-brand-accent'
      : 'border-transparent text-brand-muted hover:text-brand-text'
  );

const readinessBadgeClass: Record<
  'warn' | 'partial' | 'good',
  string
> = {
  warn: 'border-brand-warn-border bg-brand-warn-bg text-brand-warn-text',
  partial:
    'border-brand-partial-border bg-brand-partial-bg text-brand-partial-text',
  good: 'border-brand-good-border bg-brand-good-bg text-brand-good-text',
};

function ScenarioDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-wrap items-start gap-4 border-b border-brand-border pb-4">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-7 w-56 max-w-full" />
          <Skeleton className="h-5 w-40 max-w-full" />
        </div>
        <Skeleton className="h-6 w-44 rounded-full" />
        <Skeleton className="h-9 w-36 shrink-0" />
      </div>
      <div className="flex flex-wrap gap-2 border-b border-brand-border pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-md" />
        ))}
      </div>
      <Skeleton className="h-72 w-full max-w-3xl rounded-xl" />
    </div>
  );
}

export function ScenarioDetail() {
  const { id } = useParams();
  const { scenario, loading, error, update } = useScenario(id);

  const analysisDerived = useMemo(() => {
    if (!scenario) return null;
    const itype = scenario.inspType ?? 'baseline';
    const analysisContext = scenarioToAnalysisContext(scenario);
    const deviceClass = scenario.deviceClass?.trim() || scenario.manualClass;
    const flags = triangulate(scenario.fdaData ?? null, itype, deviceClass);

    const areaPrompts = Object.fromEntries(
      AREA_ORDER.map((k) => [k, buildFocus(k, analysisContext)])
    ) as Record<QMSAreaKey, string[]>;

    const riskThread = buildRiskThread(analysisContext);
    const recordsList = buildRecordsRequest(analysisContext);

    const oaiContext: OAIContext = {
      ratings: scenario.ratings,
      risk: scenario.risk,
      flags,
      manualClass: scenario.manualClass,
      deviceClass: scenario.deviceClass,
      aiEnabled: scenario.aiEnabled,
      cyberEnabled: scenario.cyberEnabled,
      swEnabled: scenario.swEnabled,
    };
    const oaiFactors = buildOAIFactors(oaiContext);

    const readinessContext: ReadinessContext = {
      inspType: itype,
      ratings: scenario.ratings,
      flags,
      signalKeys: scenario.signals,
      marketedUS: scenario.marketedUS,
      risk: scenario.risk,
    };
    const overallReadiness = getOverallReadiness(readinessContext);

    return {
      isM2: ITYPES[itype].model === 2,
      premarket: isPremarket(itype, scenario.marketedUS),
      itype,
      softwareEnabled: scenario.swEnabled,
      flags,
      areaPrompts,
      riskThread,
      recordsList,
      oaiFactors,
      overallReadiness,
    };
  }, [scenario]);

  const outletContext = useMemo((): ScenarioDetailOutletContext | null => {
    if (!scenario || !analysisDerived) return null;
    return {
      scenario,
      update,
      ...analysisDerived,
    };
  }, [scenario, analysisDerived, update]);

  if (!id) {
    return (
      <div className="p-8">
        <p className="mb-4 text-brand-text">Invalid scenario link.</p>
        <Button asChild variant="outline">
          <Link to="/app">← Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  if (loading) {
    return <ScenarioDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="mb-4 text-brand-text">
          {error === 'not_found' ? 'Scenario not found' : error}
        </p>
        <Button asChild variant="outline">
          <Link to="/app">← Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  if (!scenario || !analysisDerived || !outletContext) {
    return (
      <div className="p-8">
        <p className="mb-4 text-brand-text">Scenario not found</p>
        <Button asChild variant="outline">
          <Link to="/app">← Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  const { overallReadiness } = analysisDerived;
  const productTitle =
    scenario.productName.trim() || 'Untitled product';
  const companyLine =
    scenario.companyName.trim() || 'Company not set';

  return (
    <div className="flex flex-col">
      <div className="border-b border-brand-border bg-brand-card/80 px-4 py-4 md:px-8">
        <div className="flex flex-wrap items-start gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-xl font-semibold text-brand-text md:text-2xl">
              {productTitle}
            </h1>
            <p className="mt-1 text-sm text-brand-muted">{companyLine}</p>
          </div>
          <Badge
            className={cn(
              'shrink-0 border',
              readinessBadgeClass[overallReadiness.tone]
            )}
          >
            {overallReadiness.label}
          </Badge>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link to={`/app/new?edit=${id}`}>← Edit inputs</Link>
          </Button>
        </div>
      </div>

      <div className="border-b border-brand-border bg-brand-bg px-4 md:px-8">
        <nav
          className="-mb-px flex flex-wrap gap-1"
          aria-label="Scenario sections"
        >
          <NavLink to="." end className={tabClass}>
            Framework
          </NavLink>
          <NavLink to="thread" className={tabClass}>
            Risk Thread
          </NavLink>
          <NavLink to="signals" className={tabClass}>
            FDA Signals
          </NavLink>
          <NavLink to="narrative" className={tabClass}>
            Narrative
          </NavLink>
          <NavLink to="export" className={tabClass}>
            Export
          </NavLink>
        </nav>
      </div>

      <div className="p-6 md:p-8">
        <Outlet context={outletContext} />
      </div>
    </div>
  );
}
