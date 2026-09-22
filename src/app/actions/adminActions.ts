'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

export async function adminCreateDrawAction(year: number, month: number, mode: 'random' | 'weighted' = 'random') {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('draws')
    .insert({
      year,
      month,
      mode,
      status: 'draft',
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/draws');
  return { success: true, data };
}

export async function adminSimulateDrawAction(drawId: string) {
  const supabase = await createClient();
  const { data: draw, error: drawErr } = await supabase
    .from('draws')
    .select('*')
    .eq('id', drawId)
    .single();

  if (drawErr || !draw) {
    return { error: 'Draw record not found' };
  }

  const numbers = Array.from({ length: 5 }, () => crypto.randomInt(1, 46));

  const { data: entries } = await supabase
    .from('draw_entries')
    .select('user_id, score_values')
    .eq('draw_id', drawId);

  let match5 = 0;
  let match4 = 0;
  let match3 = 0;

  if (entries) {
    for (const entry of entries) {
      const eCounts = new Map<number, number>();
      const dCounts = new Map<number, number>();

      for (const v of entry.score_values) eCounts.set(v, (eCounts.get(v) || 0) + 1);
      for (const v of numbers) dCounts.set(v, (dCounts.get(v) || 0) + 1);

      let m = 0;
      for (const [val, count] of eCounts.entries()) {
        m += Math.min(count, dCounts.get(val) || 0);
      }

      if (m === 5) match5++;
      else if (m === 4) match4++;
      else if (m === 3) match3++;
    }
  }

  return {
    success: true,
    simulation: {
      drawId,
      previewNumbers: numbers,
      projectedWinners: { fiveMatch: match5, fourMatch: match4, threeMatch: match3 },
      isDryRun: true,
    },
  };
}

export async function adminGenerateDrawAction(drawId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Authentication required' };
  }

  // Check admin role
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!roleData || roleData.role !== 'admin') {
    return { error: 'Admin privileges required' };
  }

  const { data: draw, error: drawErr } = await supabase
    .from('draws')
    .select('*')
    .eq('id', drawId)
    .single();

  if (drawErr || !draw) {
    return { error: 'Draw record not found' };
  }

  if (draw.status !== 'locked') {
    return { error: 'Draw must be locked before generating official numbers' };
  }

  const numbers: number[] = [];

  if (draw.mode === 'weighted') {
    const { data: entries } = await supabase
      .from('draw_entries')
      .select('score_values')
      .eq('draw_id', drawId);

    const weights = new Map<number, number>();
    for (let i = 1; i <= 45; i++) {
      weights.set(i, 1);
    }

    if (entries) {
      for (const entry of entries) {
        for (const num of entry.score_values) {
          if (num >= 1 && num <= 45) {
            weights.set(num, (weights.get(num) || 1) + 1);
          }
        }
      }
    }

    const pool: number[] = [];
    for (const [val, w] of weights.entries()) {
      for (let k = 0; k < w; k++) {
        pool.push(val);
      }
    }

    for (let i = 0; i < 5; i++) {
      const idx = crypto.randomInt(0, pool.length);
      numbers.push(pool[idx]);
    }
  } else {
    for (let i = 0; i < 5; i++) {
      numbers.push(crypto.randomInt(1, 46));
    }
  }

  // Call generate_monthly_draw using admin service-role client since RPC is restricted from public/authenticated callers
  const adminSupabase = createAdminClient();
  const { data: updatedDraw, error: genErr } = await adminSupabase.rpc('generate_monthly_draw', {
    p_draw_id: drawId,
    p_winning_numbers: numbers,
  });

  if (genErr) {
    return { error: genErr.message };
  }

  revalidatePath('/admin/draws');
  revalidatePath(`/admin/draws/${drawId}`);
  return { success: true, data: updatedDraw, numbers };
}

export async function adminPublishDrawAction(drawId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('publish_monthly_draw', {
    p_draw_id: drawId,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/draws');
  revalidatePath(`/admin/draws/${drawId}`);
  revalidatePath('/draws');
  revalidatePath(`/draws/${drawId}`);
  return { success: true, data };
}

export async function adminLockDrawAction(drawId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('lock_monthly_draw', { p_draw_id: drawId });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/draws');
  revalidatePath(`/admin/draws/${drawId}`);
  return { success: true, data };
}

export async function uploadWinnerProofAction(awardId: string, formData: FormData) {
  const file = formData.get('proof_file') as File;
  if (!file || file.size === 0) {
    return { error: 'Please select a valid scorecard image file' };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { error: 'File size exceeds maximum 5MB limit' };
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { error: 'Only JPEG, PNG, or WebP image files are allowed' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Authentication required' };
  }

  const { data: award } = await supabase
    .from('draw_awards')
    .select('id, user_id')
    .eq('id', awardId)
    .single();

  if (!award || award.user_id !== user.id) {
    return { error: 'Unauthorized: Award does not belong to user' };
  }

  const adminSupabase = createAdminClient();
  const fileExt = file.name.split('.').pop();
  const storagePath = `winner_proofs/${awardId}_${Date.now()}.${fileExt}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadErr } = await adminSupabase.storage
    .from('winner-proofs')
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadErr) {
    console.error('Storage upload error:', uploadErr);
    return { error: 'Failed to upload proof image to storage' };
  }

  const { error: subErr } = await supabase.from('winner_submissions').upsert(
    {
      award_id: awardId,
      user_id: user.id,
      storage_path: storagePath,
      review_status: 'pending',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'award_id' }
  );

  if (subErr) {
    return { error: subErr.message };
  }

  revalidatePath('/dashboard/winnings');
  return { success: true };
}

export async function getWinnerProofSignedUrlAction(storagePath: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Authentication required' };
  }

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!roleData || roleData.role !== 'admin') {
    return { error: 'Admin privileges required to view winner proof' };
  }

  const adminSupabase = createAdminClient();
  const { data, error } = await adminSupabase.storage
    .from('winner-proofs')
    .createSignedUrl(storagePath, 60);

  if (error || !data?.signedUrl) {
    return { error: 'Failed to generate signed URL for proof image' };
  }

  return { success: true, signedUrl: data.signedUrl };
}

export async function adminReviewProofAction(awardId: string, approved: boolean, reason?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Authentication required' };
  }

  const newStatus = approved ? 'approved' : 'rejected';

  const { error } = await supabase
    .from('winner_submissions')
    .update({
      review_status: newStatus,
      rejection_reason: reason || null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('award_id', awardId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/winners');
  return { success: true };
}

export async function adminProcessPayoutAction(awardId: string, referenceNote?: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('process_award_payout', {
    p_award_id: awardId,
    p_reference_note: referenceNote || 'Payout completed by admin',
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/winners');
  return { success: true, data };
}

export async function adminCreateCharityAction(formData: FormData) {
  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const tagline = formData.get('tagline') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as string;
  const featured = formData.get('featured') === 'true';

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('charities')
    .insert({
      name,
      slug,
      tagline,
      description,
      category,
      featured,
      active: true,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/charities');
  revalidatePath('/charities');
  return { success: true, data };
}

export async function adminCreateCharityEventAction(formData: FormData) {
  const charityId = formData.get('charity_id') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const eventDate = formData.get('event_date') as string;
  const location = formData.get('location') as string;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('charity_events')
    .insert({
      charity_id: charityId,
      title,
      description,
      event_date: eventDate,
      location,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/charities');
  return { success: true, data };
}

export async function adminReconcileSubscriptionAction(userId: string) {
  const adminSupabase = createAdminClient();
  const { data: sub } = await adminSupabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!sub?.stripe_subscription_id) {
    return { error: 'No Stripe subscription ID found for user' };
  }

  const { error } = await adminSupabase
    .from('subscriptions')
    .update({
      last_reconciled_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/users');
  return { success: true };
}
