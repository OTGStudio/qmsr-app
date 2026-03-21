import { useMutation } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { scenarioToDb } from '@/lib/scenarioMapper';
import type { Scenario } from '@/types/scenario';

export async function createScenario(scenario: Scenario): Promise<{ id: string }> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(`Authentication error: ${authError.message}`);
  }
  if (!user) {
    throw new Error('You must be signed in to save a scenario.');
  }

  const insert = scenarioToDb(scenario);

  const { data, error } = await supabase
    .from('scenarios')
    .insert({ ...insert, user_id: user.id })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to save scenario: ${error.message}`);
  }
  if (!data?.id) {
    throw new Error('Failed to save scenario: no row returned from database.');
  }

  return { id: data.id };
}

export function useCreateScenario() {
  return useMutation({
    mutationFn: createScenario,
  });
}
