'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function saveScoreAction(formData: FormData) {
  const roundDate = formData.get('round_date') as string;
  const value = parseInt(formData.get('value') as string, 10);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('save_user_score', {
    p_round_date: roundDate,
    p_value: value,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/scores');
  revalidatePath('/dashboard');
  return { success: true, data };
}

export async function deleteScoreAction(scoreId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Authentication required' };
  }

  const { error } = await supabase
    .from('scores')
    .delete()
    .eq('id', scoreId)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/scores');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function updateCharitySettingsAction(formData: FormData) {
  const charityId = formData.get('charity_id') as string;
  const percentage = parseInt(formData.get('charity_percentage') as string, 10);

  if (percentage < 10 || percentage > 80) {
    return { error: 'Charity percentage must be between 10% and 80%' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Authentication required' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      selected_charity_id: charityId || null,
      charity_percentage: percentage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/charity');
  revalidatePath('/dashboard');
  return { success: true };
}
