'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/dashboard');
}

export async function signupAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('full_name') as string;
  const charityPercentage = parseInt((formData.get('charity_percentage') as string) || '10', 10);
  const selectedCharityId = formData.get('selected_charity_id') as string;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        charity_percentage: charityPercentage,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    // Update profile selected charity if provided
    if (selectedCharityId) {
      await supabase
        .from('profiles')
        .update({
          selected_charity_id: selectedCharityId,
          charity_percentage: charityPercentage,
        })
        .eq('id', data.user.id);
    }
  }

  redirect('/dashboard');
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
