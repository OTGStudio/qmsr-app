import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from 'react';
import { toast } from 'sonner';

import {
  dbToScenario,
  mergeScenarioPatch,
  scenarioToDb,
} from '@/lib/scenarioMapper';
import { supabase } from '@/lib/supabase';
import type { Scenario } from '@/types/scenario';

const DEBOUNCE_MS = 800;

export interface UseScenarioResult {
  scenario: Scenario | null;
  loading: boolean;
  error: string | null;
  update: (patch: Partial<Scenario>) => void;
}

async function persistScenario(id: string, scenario: Scenario): Promise<void> {
  const row = scenarioToDb(scenario);
  const { error } = await supabase.from('scenarios').update(row).eq('id', id);
  if (error) {
    toast.error(`Failed to save scenario: ${error.message}`);
    throw new Error(error.message);
  }
}

function clearSaveTimer(
  saveTimerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>,
): void {
  if (saveTimerRef.current) {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = null;
  }
}

export function useScenario(id: string | undefined): UseScenarioResult {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingScenarioRef = useRef<Scenario | null>(null);
  const idRef = useRef(id);
  idRef.current = id;

  useEffect(() => {
    if (!id) {
      setScenario(null);
      setError(null);
      setLoading(false);
      return () => {
        clearSaveTimer(saveTimerRef);
        const latest = pendingScenarioRef.current;
        if (latest?.id) {
          void persistScenario(latest.id, latest).catch(() => {
            /* toast already shown */
          });
        }
      };
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void supabase
      .from('scenarios')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error: fetchError }) => {
        if (cancelled) return;
        if (fetchError) {
          const notFound =
            fetchError.code === 'PGRST116' ||
            fetchError.message.toLowerCase().includes('no rows');
          setError(notFound ? 'not_found' : fetchError.message);
          setScenario(null);
          setLoading(false);
          return;
        }
        if (!data) {
          setError('not_found');
          setScenario(null);
          setLoading(false);
          return;
        }
        const mapped = dbToScenario(data);
        setScenario(mapped);
        pendingScenarioRef.current = mapped;
        setLoading(false);
      });

    return () => {
      cancelled = true;
      clearSaveTimer(saveTimerRef);
      const latest = pendingScenarioRef.current;
      if (latest?.id === id && id) {
        void persistScenario(id, latest).catch(() => {
          /* toast already shown */
        });
      }
    };
  }, [id]);

  const update = useCallback((patch: Partial<Scenario>) => {
    setScenario((prev) => {
      if (!prev?.id) return prev;
      const next = mergeScenarioPatch(prev, patch);
      pendingScenarioRef.current = next;

      clearSaveTimer(saveTimerRef);
      saveTimerRef.current = setTimeout(() => {
        const latest = pendingScenarioRef.current;
        const targetId = idRef.current;
        if (!latest?.id || !targetId || latest.id !== targetId) {
          return;
        }
        void persistScenario(targetId, latest).catch(() => {
          /* toast already shown */
        });
      }, DEBOUNCE_MS);

      return next;
    });
  }, []);

  return { scenario, loading, error, update };
}
