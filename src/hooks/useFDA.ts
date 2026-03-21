import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { fetchFDAData } from '@/lib/fda';
import { supabase } from '@/lib/supabase';
import type { FDAData } from '@/types/analysis';
import type { Json } from '@/types/database';
import type { Scenario } from '@/types/scenario';

function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError';
}

export async function saveToScenario(id: string, fdaData: FDAData): Promise<void> {
  const { error } = await supabase
    .from('scenarios')
    .update({
      fda_data: fdaData as unknown as Json,
      fda_pulled_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    toast.error(`Failed to save FDA data: ${error.message}`);
    throw new Error(error.message);
  }
}

export interface UseFDAResult {
  fdaData: FDAData | null;
  loading: boolean;
  pulled: boolean;
  error: string | null;
  pullFDA: (scenario: Scenario) => Promise<void>;
}

export function useFDA(
  scenario: Scenario,
  onScenarioSynced?: (patch: Partial<Scenario>) => void,
): UseFDAResult {
  const [fdaData, setFdaData] = useState<FDAData | null>(() => scenario.fdaData ?? null);
  const [loading, setLoading] = useState(false);
  const [pulled, setPulled] = useState(() => Boolean(scenario.fdaPulledAt));
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const requestSeqRef = useRef(0);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    setFdaData(scenario.fdaData ?? null);
    setPulled(Boolean(scenario.fdaPulledAt));
  }, [scenario.id, scenario.fdaData, scenario.fdaPulledAt]);

  const pullFDA = useCallback(
    async (s: Scenario) => {
      const hasCriteria =
        Boolean(s.companyName.trim()) ||
        Boolean(s.productCode.trim()) ||
        Boolean(s.feiNumber.trim());

      if (!hasCriteria) {
        setError('Enter firm name, product code, or FEI in the scenario first.');
        return;
      }

      if (!s.id) {
        setError('Scenario must be saved before pulling FDA data.');
        return;
      }

      const priorFda = fdaData;
      const priorPulled = pulled;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const seq = ++requestSeqRef.current;
      setLoading(true);
      setError(null);

      try {
        const data = await fetchFDAData(s, controller.signal);
        if (controller.signal.aborted || seq !== requestSeqRef.current) {
          return;
        }

        setFdaData(data);
        setPulled(true);

        try {
          await saveToScenario(s.id, data);
        } catch {
          setFdaData(priorFda);
          setPulled(priorPulled);
          return;
        }

        if (controller.signal.aborted || seq !== requestSeqRef.current) {
          return;
        }

        const pulledAt = new Date().toISOString();
        onScenarioSynced?.({
          fdaData: data,
          fdaPulledAt: pulledAt,
        });
      } catch (err) {
        if (controller.signal.aborted || seq !== requestSeqRef.current) {
          return;
        }
        if (isAbortError(err)) {
          return;
        }
        const message = err instanceof Error ? err.message : 'FDA data request failed.';
        setError(message);
        toast.error(message);
      } finally {
        if (seq === requestSeqRef.current && !controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [onScenarioSynced, fdaData, pulled],
  );

  return { fdaData, loading, pulled, error, pullFDA };
}
