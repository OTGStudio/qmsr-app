import { useMemo } from 'react';
import { Link, useOutletContext } from 'react-router-dom';

import { FlagCard } from '@/components/signals/FlagCard';
import { MDRSparkline } from '@/components/signals/MDRSparkline';
import { RecallList } from '@/components/signals/RecallList';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { triangulate } from '@/lib/analysis';
import { useFDA } from '@/hooks/useFDA';
import type { FDARecallRecord, RecallItem } from '@/types/analysis';
import type { SignalsViewProps } from '@/types/signals';
import type { ScenarioDetailOutletContext } from '@/types/scenarioDetail';

function fdaRecallToRecallItem(r: FDARecallRecord): RecallItem {
  const statusParts = [r.openStatus, r.status].filter(
    (s): s is string => Boolean(s?.trim()),
  );
  const statusJoined = statusParts.length > 0 ? statusParts.join(' — ') : '';

  return {
    classification: r.classification ?? '',
    status: statusJoined,
    reason: r.reasonForRecall ?? '',
    initiated: r.recallInitiationDate ?? '',
    description: '',
    recallNumber: r.recallNumber,
  };
}

function SignalsViewInner({
  scenario,
  premarket,
  itype,
  onScenarioSynced,
}: SignalsViewProps) {
  const { fdaData, loading, pulled, error, pullFDA } = useFDA(scenario, onScenarioSynced);

  const deviceClass = scenario.deviceClass?.trim() || scenario.manualClass;
  const flags = useMemo(
    () => triangulate(fdaData, itype, deviceClass),
    [fdaData, itype, deviceClass],
  );

  const mdrYearKeys = useMemo(() => {
    if (!fdaData) return [];
    return Object.keys(fdaData.mdr).sort((a, b) => Number(a) - Number(b));
  }, [fdaData]);

  const recallItems = useMemo(() => {
    if (!fdaData) return [];
    return fdaData.recalls.map(fdaRecallToRecallItem);
  }, [fdaData]);

  const hasSearchCriteria =
    Boolean(scenario.companyName.trim()) ||
    Boolean(scenario.productCode.trim()) ||
    Boolean(scenario.feiNumber.trim()) ||
    Boolean(scenario.productName.trim());

  const firmDisplay = scenario.companyName.trim() || '—';
  const codeDisplay = scenario.productCode.trim() || '—';
  const feiDisplay = scenario.feiNumber.trim() || '—';
  const deviceDisplay = scenario.productName.trim() || '—';

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-accent">
          Public FDA data layer — Elsa-aware signal analysis
        </p>
        <h2 className="font-serif text-xl font-semibold text-brand-text md:text-2xl">
          FDA signals
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-brand-muted">
          This tab queries{' '}
          <a
            href="https://open.fda.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand-accent underline-offset-2 hover:underline"
          >
            openFDA
          </a>{' '}
          public device APIs (adverse events and recalls) using your firm name, product code, FEI,
          and product or device name when provided. Counts are informational and depend on how
          manufacturers report to FDA; they are not inspection predictions.
        </p>
      </div>

      {premarket ? (
        <div
          className="rounded-xl border border-brand-border bg-brand-card px-4 py-3 text-sm leading-relaxed text-brand-text"
          role="note"
        >
          <p className="font-medium">Premarket mode is active.</p>
          <p className="mt-1 text-brand-muted">
            Postmarket surveillance language elsewhere in the app is reduced. MDR and recall data
            may still be shown for context where openFDA returns results for your search terms.
          </p>
        </div>
      ) : null}

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="font-serif text-lg">Pull openFDA data</CardTitle>
          <CardDescription className="text-brand-muted">
            Status: firm &apos;{firmDisplay}&apos;, product code &apos;{codeDisplay}&apos;, FEI
            &apos;{feiDisplay}&apos;, device name &apos;{deviceDisplay}&apos;.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-0">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              disabled={!hasSearchCriteria || loading}
              onClick={() => void pullFDA(scenario)}
            >
              Pull public FDA signal data
            </Button>
            {pulled ? (
              <Badge
                variant="outline"
                className="border-brand-good-border bg-brand-good-bg text-brand-good-text"
              >
                ✓ Data pulled
              </Badge>
            ) : null}
          </div>
          {!hasSearchCriteria ? (
            <p className="text-sm text-brand-muted">
              Add at least one of firm name, product code, FEI, or product / device name via{' '}
              <Link
                to={scenario.id ? `/app/new?edit=${scenario.id}` : '/app/new'}
                className="font-medium text-brand-accent underline-offset-2 hover:underline"
              >
                Edit inputs
              </Link>{' '}
              first.
            </p>
          ) : null}
          {error ? (
            <p className="text-sm text-brand-warn-text" role="alert">
              {error}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading FDA data">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      ) : null}

      {!loading && fdaData ? (
        <div className="flex flex-col gap-6">
          {fdaData.error ? (
            <div
              className="rounded-lg border border-brand-warn-border bg-brand-warn-bg px-4 py-3 text-sm text-brand-warn-text"
              role="alert"
            >
              {fdaData.error}
            </div>
          ) : null}

          <MDRSparkline byYear={fdaData.mdr} years={mdrYearKeys} />
          <RecallList recalls={recallItems} />

          {flags.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-serif text-lg font-semibold text-brand-text">
                Signal triangulation
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {flags.map((f, i) => (
                  <FlagCard key={`${f.area}-${f.label}-${i}`} flag={f} />
                ))}
              </div>
            </div>
          ) : null}

          {fdaData.gudidUrl ? (
            <div className="rounded-xl border border-brand-border bg-brand-card px-4 py-3">
              <p className="text-sm font-medium text-brand-text">GUDID lookup</p>
              <p className="mt-1 text-sm text-brand-muted">
                Verify device identifiers in AccessGUDID using your product code.
              </p>
              <Button asChild variant="link" className="mt-2 h-auto px-0 text-brand-accent">
                <a href={fdaData.gudidUrl} target="_blank" rel="noopener noreferrer">
                  Open AccessGUDID →
                </a>
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function SignalsView() {
  const ctx = useOutletContext<ScenarioDetailOutletContext>();
  const props: SignalsViewProps = {
    scenario: ctx.scenario,
    premarket: ctx.premarket,
    itype: ctx.itype,
    onScenarioSynced: ctx.update,
  };
  return <SignalsViewInner {...props} />;
}
