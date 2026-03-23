import { useMutation } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { scenarioToDb } from '@/lib/scenarioMapper';
import type { Scenario } from '@/types/scenario';

export async function createScenario(scenario: Scenario): Promise<{ id: string }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let userId = session?.user?.id;

  if (!userId) {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError) {
      throw new Error(`Authentication error: ${authError.message}`);
    }
    if (!user?.id) {
      throw new Error('You must be signed in to save a scenario.');
    }
    userId = user.id;
  }

  const insert = scenarioToDb(scenario);

  const { data, error } = await supabase
    .from('scenarios')
    .insert({ ...insert, user_id: userId })
    .select('id')
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to save scenario: ${error.message}`);
  }
  const rowId = data?.id;
  if (!rowId) {
    throw new Error(
      'Failed to save scenario: no row returned. If you use Row Level Security, confirm the insert policy allows returning the new row.',
    );
  }

  return { id: rowId };
}

export function useCreateScenario() {
  return useMutation({
    mutationFn: createScenario,
  });
}
