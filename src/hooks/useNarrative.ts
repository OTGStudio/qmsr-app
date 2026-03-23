import { useCallback, useMemo, useState } from 'react';

import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'qmsr_narrative_uses' as const;
export const RATE_LIMIT = 3;

function readUsesFromStorage(): number {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const n = parseInt(raw ?? '0', 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

function writeUsesToStorage(count: number): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, String(count));
  } catch {
    /* sessionStorage unavailable */
  }
}

function isFunctionsHttpError(
  error: unknown,
): error is { name: 'FunctionsHttpError'; message: string; context: Response } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'FunctionsHttpError' &&
    'context' in error &&
    error.context instanceof Response
  );
}

function isFunctionsFetchError(error: unknown): error is { name: 'FunctionsFetchError' } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'FunctionsFetchError'
  );
}

function messageFromErrorBody(parsed: unknown): string | null {
  if (!parsed || typeof parsed !== 'object') return null;
  if ('error' in parsed && typeof parsed.error === 'string') return parsed.error;
  if ('message' in parsed && typeof parsed.message === 'string') return parsed.message;
  if ('msg' in parsed && typeof parsed.msg === 'string') return parsed.msg;
  return null;
}

async function narrativeErrorMessage(error: unknown): Promise<string> {
  if (isFunctionsHttpError(error)) {
    const parsed = (await error.context.json().catch(() => null)) as unknown;
    const fromBody = messageFromErrorBody(parsed);
    const status = error.context.status;

    if (status === 401) {
      if (fromBody) {
        const lower = fromBody.toLowerCase();
        const isGeneric = fromBody === 'Unauthorized' || lower === 'unauthorized';
        if (!isGeneric) {
          return fromBody;
        }
      }
      return 'Session was rejected by the narrative service (often an expired login). Sign out, sign in again, then retry.';
    }

    if (fromBody) {
      return fromBody;
    }
    return error.message;
  }
  if (isFunctionsFetchError(error)) {
    return 'Could not reach the narrative service. Deploy the narrative Edge Function to your Supabase project (supabase functions deploy narrative) and confirm VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your app build.';
  }
  return error instanceof Error ? error.message : 'Narrative request failed.';
}

export interface UseNarrativeResult {
  narrative: string;
  loading: boolean;
  error: string | null;
  usesThisSession: number;
  usesLeft: number;
  generate: (prompt: string) => Promise<void>;
}

/**
 * @param storedNarrative - Narrative text loaded from the scenario (persists across navigation).
 * @param onPersist - Called with new text after a successful generation so it can be saved on the scenario row.
 */
export function useNarrative(
  storedNarrative: string,
  onPersist: (text: string) => void,
): UseNarrativeResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usesThisSession, setUsesThisSession] = useState(readUsesFromStorage);

  const usesLeft = useMemo(
    () => Math.max(0, RATE_LIMIT - usesThisSession),
    [usesThisSession],
  );

  const generate = useCallback(
    async (prompt: string) => {
      const currentUses = readUsesFromStorage();
      if (currentUses >= RATE_LIMIT) {
        setError('Session limit reached');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          setError(sessionError.message);
          return;
        }
        if (!session?.access_token) {
          setError('Sign in to generate a narrative.');
          return;
        }

        const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
        const activeSession = refreshed.session ?? session;
        if (!activeSession?.access_token) {
          setError(
            refreshError?.message ??
              'Your session could not be refreshed. Sign out, sign in again, then try again.',
          );
          return;
        }

        const { data, error: fnError } = await supabase.functions.invoke<{ text?: string; error?: string }>(
          'narrative',
          {
            body: { prompt },
            headers: {
              Authorization: `Bearer ${activeSession.access_token}`,
            },
          },
        );

        if (fnError) {
          setError(await narrativeErrorMessage(fnError));
          return;
        }

        if (!data || typeof data.text !== 'string') {
          setError('Invalid response from narrative service.');
          return;
        }

        onPersist(data.text);
        const next = currentUses + 1;
        writeUsesToStorage(next);
        setUsesThisSession(next);
      } catch (err) {
        setError(await narrativeErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [onPersist],
  );

  return {
    narrative: storedNarrative,
    loading,
    error,
    usesThisSession,
    usesLeft,
    generate,
  };
}
