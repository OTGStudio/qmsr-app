import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCreateScenario } from '@/hooks/useCreateScenario';
import { PENDING_SCENARIO_STORAGE_KEY } from '@/lib/scenarioMapper';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { DEFAULT_SCENARIO, type Scenario } from '@/types/scenario';

import { Step1Facility } from './Step1Facility';
import { Step2Inspection } from './Step2Inspection';
import { Step3Classification } from './Step3Classification';
import { Step4Risk } from './Step4Risk';
import { Step5Signals } from './Step5Signals';
import { Step6Rating } from './Step6Rating';
import { Step7Review } from './Step7Review';

const STEP_LABELS = [
  'Facility',
  'Inspection',
  'Classification',
  'Risk',
  'Signals',
  'QMS Rating',
  'Review',
] as const;

const AUTH_REDIRECT_PATH = '/app/new?resume=1';

function scrollToTop(): void {
  window.scrollTo(0, 0);
}

export function WizardShell() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const createMutation = useCreateScenario();

  const [step, setStep] = useState(1);
  const [scenario, setScenario] = useState<Scenario>(() => ({
    ...DEFAULT_SCENARIO,
  }));
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  const resumeConsumedRef = useRef(false);

  const update = useCallback((patch: Partial<Scenario>) => {
    setScenario((prev) => ({ ...prev, ...patch }));
  }, []);

  const canProceed = useCallback((): boolean => {
    if (step === 2) {
      return scenario.inspType != null;
    }
    return true;
  }, [step, scenario.inspType]);

  const goNext = useCallback(() => {
    setStep((s) => Math.min(7, s + 1));
    scrollToTop();
  }, []);

  const goBack = useCallback(() => {
    setStep((s) => Math.max(1, s - 1));
    scrollToTop();
  }, []);

  const goToStep = useCallback((target: number) => {
    setStep(target);
    scrollToTop();
  }, []);

  const resumeFlag = searchParams.get('resume');

  useEffect(() => {
    if (resumeFlag !== '1') {
      resumeConsumedRef.current = false;
      return;
    }
    if (resumeConsumedRef.current) return;
    if (authLoading) return;

    resumeConsumedRef.current = true;

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('resume');
        return next;
      },
      { replace: true },
    );

    const raw = sessionStorage.getItem(PENDING_SCENARIO_STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Scenario;
      setScenario(parsed);
      setStep(7);
      sessionStorage.removeItem(PENDING_SCENARIO_STORAGE_KEY);
      toast.success('Your scenario was restored. Tap Launch to save.');
    } catch {
      sessionStorage.removeItem(PENDING_SCENARIO_STORAGE_KEY);
      toast.error('Could not restore your scenario.');
    }
  }, [resumeFlag, setSearchParams, authLoading]);

  const handleWizardComplete = useCallback(
    async (completed: Scenario) => {
      if (!user) {
        try {
          sessionStorage.setItem(
            PENDING_SCENARIO_STORAGE_KEY,
            JSON.stringify(completed),
          );
        } catch {
          toast.error('Could not store scenario locally.');
          return;
        }
        setAuthDialogOpen(true);
        return;
      }

      try {
        const { id } = await createMutation.mutateAsync(completed);
        navigate(`/app/s/${id}`);
      } catch {
        toast.error('Failed to save scenario. Please try again.');
      }
    },
    [user, createMutation, navigate],
  );

  const stepProps = { scenario, onUpdate: update };

  const loginHref = `/login?redirect=${encodeURIComponent(AUTH_REDIRECT_PATH)}`;
  const signupHref = `/signup?redirect=${encodeURIComponent(AUTH_REDIRECT_PATH)}`;

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in to save</DialogTitle>
            <DialogDescription>
              Your scenario is saved temporarily in this browser. Sign in or create an account to
              store it in your workspace, then you will return here to finish.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button asChild variant="default">
              <Link to={loginHref}>Sign in</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={signupHref}>Create account</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8 pb-28">
        <header className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <p className="text-xs text-brand-muted">
              Educational tool — generic and non-tailored by design. Not a substitute for
              professional regulatory consulting. Does not create a consulting relationship
              with Respress Solutions LLC.
            </p>
            <button
              type="button"
              onClick={() => {
                navigate('/app');
              }}
              className="shrink-0 text-sm font-medium text-brand-accent underline-offset-4 hover:underline"
            >
              Skip wizard
            </button>
          </div>
        </header>

        <nav aria-label="Wizard progress">
          <ol className="flex flex-wrap gap-1 sm:flex-nowrap">
            {STEP_LABELS.map((label, i) => {
              const stepNum = i + 1;
              const isActive = stepNum === step;
              const isFuture = stepNum > step;

              if (isActive) {
                return (
                  <li key={label} className="min-w-0 flex-1">
                    <div
                      className={cn(
                        'w-full rounded-md px-1.5 py-2 text-center text-[0.65rem] font-medium leading-tight shadow-sm sm:text-xs',
                        'bg-muted text-foreground dark:bg-zinc-800 dark:text-zinc-50',
                      )}
                      aria-current="step"
                    >
                      {label}
                    </div>
                  </li>
                );
              }

              if (isFuture) {
                return (
                  <li key={label} className="min-w-0 flex-1">
                    <span
                      className={cn(
                        'block w-full cursor-default rounded-md px-1.5 py-2 text-center text-[0.65rem] font-medium leading-tight text-brand-muted sm:text-xs',
                      )}
                    >
                      {label}
                    </span>
                  </li>
                );
              }

              return (
                <li key={label} className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => {
                      goToStep(stepNum);
                    }}
                    className={cn(
                      'w-full cursor-pointer rounded-md px-1.5 py-2 text-center text-[0.65rem] font-medium leading-tight text-brand-accent transition-colors hover:underline sm:text-xs',
                    )}
                  >
                    {label}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="flex-1">
          {step === 1 && <Step1Facility {...stepProps} />}
          {step === 2 && <Step2Inspection {...stepProps} />}
          {step === 3 && <Step3Classification {...stepProps} />}
          {step === 4 && <Step4Risk {...stepProps} />}
          {step === 5 && <Step5Signals {...stepProps} />}
          {step === 6 && <Step6Rating {...stepProps} />}
          {step === 7 && (
            <Step7Review
              scenario={scenario}
              onComplete={(s) => {
                void handleWizardComplete(s);
              }}
              isLaunchPending={createMutation.isPending}
            />
          )}
        </div>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 border-t border-brand-border bg-brand-bg/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-brand-bg/80">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
          {step > 1 ? (
            <Button type="button" variant="outline" onClick={goBack}>
              Back
            </Button>
          ) : (
            <span className="w-[72px]" aria-hidden />
          )}

          <p className="text-sm text-brand-muted">
            Step {step} of 7
          </p>

          <div className="flex w-[120px] justify-end">
            {step < 7 ? (
              <Button type="button" disabled={!canProceed()} onClick={goNext}>
                Continue
              </Button>
            ) : (
              <span className="w-[72px]" aria-hidden />
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
