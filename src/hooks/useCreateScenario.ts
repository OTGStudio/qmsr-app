import { useMutation } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { scenarioToDb } from '@/lib/scenarioMapper';
import type { Scenario } from '@/types/scenario';

/** Insert a new scenario or update an existing row when `scenario.id` is set. */
export async function saveScenario(scenario: Scenario): Promise<{ id: string }> {
  const existingId = scenario.id?.trim();
  if (existingId) {
    const row = scenarioToDb(scenario);
    const { error } = await supabase.from('scenarios').update(row).eq('id', existingId);
    if (error) {
      throw new Error(`Failed to save scenario: ${error.message}`);
    }
    return { id: existingId };
  }
  return createScenario(scenario);
}

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
    mutationFn: saveScenario,
  });
}
