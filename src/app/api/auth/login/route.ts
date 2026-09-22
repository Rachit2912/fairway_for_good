import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const action = formData.get('action') as string;
    const supabase = await createClient();

    if (action === 'signup') {
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      const fullName = formData.get('full_name') as string;
      const charityPercentage = parseInt((formData.get('charity_percentage') as string) || '10', 10);

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
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.redirect(new URL('/dashboard', req.url));
    } else {
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
