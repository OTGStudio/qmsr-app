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

export interface UseNarrativeResult {
  narrative: string;
  loading: boolean;
  error: string | null;
  usesThisSession: number;
  usesLeft: number;
  generate: (prompt: string) => Promise<void>;
}

export function useNarrative(): UseNarrativeResult {
  const [narrative, setNarrative] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usesThisSession, setUsesThisSession] = useState(readUsesFromStorage);

  const usesLeft = useMemo(
    () => Math.max(0, RATE_LIMIT - usesThisSession),
    [usesThisSession],
  );

  const generate = useCallback(async (prompt: string) => {
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

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const res = await fetch(`${supabaseUrl}/functions/v1/narrative`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          apikey: anonKey,
        },
        body: JSON.stringify({ prompt }),
      });

      const body = (await res.json()) as { text?: string; error?: string };

      if (!res.ok) {
        setError(body.error ?? `Request failed (${res.status})`);
        return;
      }

      if (typeof body.text !== 'string') {
        setError('Invalid response from narrative service.');
        return;
      }

      setNarrative(body.text);
      const next = currentUses + 1;
      writeUsesToStorage(next);
      setUsesThisSession(next);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Narrative request failed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    narrative,
    loading,
    error,
    usesThisSession,
    usesLeft,
    generate,
  };
}
