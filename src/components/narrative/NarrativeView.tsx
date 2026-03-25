import { useMemo } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  buildNarrativeStructuredPayloadV2,
  buildNarrativeUserMessage,
  NARRATIVE_SYSTEM_PROMPT,
} from '@/lib/analysis';
import { buildAdjudication } from '@/lib/adjudication';
import { useNarrative } from '@/hooks/useNarrative';
import { useAuth } from '@/providers/AuthProvider';
import { cn } from '@/lib/utils';
import { AdjudicationCard } from '@/components/narrative/AdjudicationCard';
import type { NarrativeViewProps } from '@/types/narrative';
import type { ScenarioDetailOutletContext } from '@/types/scenarioDetail';

const LINKEDIN_URL = 'https://www.linkedin.com/company/respress-solutions-llc';

function NarrativeViewInner({
  scenario,
  fdaData,
  flags,
  isM2,
  premarket,
  onScenarioUpdate,
}: NarrativeViewProps) {
  const { user, loading: authLoading } = useAuth();
  const { narrative, loading, error, usesLeft, generate } = useNarrative(
    scenario.inspectionNarrative,
    (text) => onScenarioUpdate({ inspectionNarrative: text }),
  );

  const narrativeRequest = useMemo(() => {
    if (!scenario.risk.trim()) return null;
    const payload = buildNarrativeStructuredPayloadV2(scenario, fdaData, flags);
    return {
      systemPrompt: NARRATIVE_SYSTEM_PROMPT,
      userContent: buildNarrativeUserMessage(payload),
    };
  }, [scenario, fdaData, flags]);

  const adjudication = useMemo(() => {
    if (!scenario.risk.trim()) return null;
    return buildAdjudication(scenario, fdaData, flags);
  }, [scenario, fdaData, flags]);

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-accent">
          Elsa-style inspection narrative — AI Powered
        </p>
        <h2 className="font-serif text-xl font-semibold text-brand-text md:text-2xl">
          Inspection narrative
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-brand-muted">
          Generates a 400–600 word QMSR-aligned readiness narrative from your scenario, FDA signal
          triangulation, and risk context. Output is educational and not legal or regulatory
          advice.
        </p>
      </div>

      {isM2 ? (
        <div
          className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm leading-relaxed text-indigo-950 dark:border-indigo-500/40 dark:bg-indigo-950/35 dark:text-indigo-100"
          role="note"
        >
          <p className="font-medium">Model 2 — comprehensive minimum inspection coverage.</p>
          <p className="mt-1">
            Your narrative may reference full six-area coverage and depth expectations under the
            Model 2 inspection model where applicable.
          </p>
        </div>
      ) : null}

      {premarket ? (
        <div
          className="rounded-xl border border-brand-border bg-brand-card px-4 py-3 text-sm leading-relaxed text-brand-text"
          role="note"
        >
          <p className="font-medium">Premarket mode is active.</p>
          <p className="mt-1 text-brand-muted">
            Narrative framing emphasizes design, validation, and readiness; routine postmarket
            complaint volume is de-emphasized where the device is not yet marketed in the United
            States.
          </p>
        </div>
      ) : null}

      {adjudication?.triggered ? <AdjudicationCard adjudication={adjudication} /> : null}

      {!scenario.risk.trim() ? (
        <div
          className="rounded-lg border border-brand-warn-border bg-brand-warn-bg px-4 py-3 text-sm text-brand-warn-text"
          role="alert"
        >
          Enter a primary product risk in the scenario first to enable narrative generation.
        </div>
      ) : null}

      {authLoading ? (
        <div className="flex items-center gap-2 text-sm text-brand-muted">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Checking session…
        </div>
      ) : null}

      {!authLoading && !user ? (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">Sign in required</CardTitle>
            <CardDescription className="text-brand-muted">
              Narrative generation uses your account and runs on the server — sign in or create an
              account to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 pt-0">
            <Button asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/signup">Create account</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!authLoading && user && usesLeft > 0 ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              disabled={loading || !narrativeRequest}
              onClick={() => {
                if (narrativeRequest) void generate(narrativeRequest);
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Generating…
                </>
              ) : (
                'Generate narrative'
              )}
            </Button>
            <p className="text-sm text-brand-muted">
              {usesLeft} of 3 free generations remaining this session
            </p>
          </div>

          {error ? (
            <div
              className="rounded-lg border border-brand-warn-border bg-brand-warn-bg px-4 py-3 text-sm text-brand-warn-text"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          {narrative ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-lg">
                    {adjudication?.triggered ? 'AI Commentary' : 'Generated narrative'}
                  </CardTitle>
                  {adjudication?.triggered ? (
                    <CardDescription className="text-brand-muted">
                      LLM-generated prose constrained by the locked adjudication above.
                    </CardDescription>
                  ) : null}
                </CardHeader>
                <CardContent className="pt-0">
                  <div
                    className={cn(
                      'rounded-lg border border-brand-border bg-brand-bg px-4 py-3',
                      'text-[12px] leading-[1.7] text-brand-text whitespace-pre-wrap',
                    )}
                  >
                    {narrative}
                  </div>
                </CardContent>
              </Card>
              <Button
                type="button"
                variant="outline"
                disabled={loading || !narrativeRequest}
                onClick={() => {
                  if (narrativeRequest) void generate(narrativeRequest);
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                    Regenerating…
                  </>
                ) : (
                  'Regenerate'
                )}
              </Button>
            </>
          ) : null}
        </div>
      ) : null}

      {!authLoading && user && usesLeft <= 0 ? (
        <Card className="border-brand-partial-border bg-brand-partial-bg/30">
          <CardHeader>
            <CardTitle className="font-serif text-lg text-brand-text">Session limit reached</CardTitle>
            <CardDescription className="text-brand-text">
              You have used all free narrative generations for this browser session. For a tailored
              regulatory assessment or consulting engagement, contact Respress Solutions.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button asChild variant="outline" className="border-brand-accent text-brand-accent">
              <a href="mailto:contact@respresssolutions.com">Contact Respress Solutions</a>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-brand-accent-border bg-brand-accent-bg">
        <CardHeader>
          <CardTitle className="font-serif text-lg text-brand-text">Need a tailored assessment?</CardTitle>
          <CardDescription className="text-brand-muted">
            QMSR Inspection Readiness supports preparation workflows; custom consulting scopes,
            workshops, and inspection support are available from Respress Solutions.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Button asChild variant="outline" className="border-brand-accent bg-brand-card text-brand-accent">
            <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer">
              Respress Solutions on LinkedIn
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function NarrativeView() {
  const ctx = useOutletContext<ScenarioDetailOutletContext>();
  const props: NarrativeViewProps = {
    scenario: ctx.scenario,
    fdaData: ctx.scenario.fdaData ?? null,
    flags: ctx.flags,
    isM2: ctx.isM2,
    premarket: ctx.premarket,
    onScenarioUpdate: ctx.update,
  };
  return <NarrativeViewInner {...props} />;
}
