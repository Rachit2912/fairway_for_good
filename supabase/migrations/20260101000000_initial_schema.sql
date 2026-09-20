-- Initial Schema for Fairway for Good

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  selected_charity_id UUID,
  charity_percentage INTEGER NOT NULL DEFAULT 10 CHECK (charity_percentage >= 10 AND charity_percentage <= 80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. USER ROLES
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helper function for RLS checks
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role = 'admin'
  );
$$;

-- 3. CHARITIES
CREATE TABLE IF NOT EXISTS public.charities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  logo_url TEXT,
  image_url TEXT,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add foreign key to profiles now that charities exists
ALTER TABLE public.profiles
  ADD CONSTRAINT fk_profiles_selected_charity
  FOREIGN KEY (selected_charity_id) REFERENCES public.charities(id) ON DELETE SET NULL;

-- 4. CHARITY EVENTS
CREATE TABLE IF NOT EXISTS public.charity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  charity_id UUID NOT NULL REFERENCES public.charities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan_type TEXT CHECK (plan_type IN ('monthly', 'annual')),
  status TEXT NOT NULL DEFAULT 'inactive',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  last_reconciled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. INVOICES
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  amount_paid INTEGER NOT NULL, -- minor currency units (e.g. INR paise)
  currency TEXT NOT NULL DEFAULT 'inr',
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'annual')),
  paid_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. DRAWS
CREATE TABLE IF NOT EXISTS public.draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  mode TEXT NOT NULL DEFAULT 'random' CHECK (mode IN ('random', 'weighted')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'locked', 'generated', 'published')),
  locked_at TIMESTAMPTZ,
  generated_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  official_numbers INTEGER[], -- 5 numbers
  algorithm_version TEXT,
  histogram_snapshot JSONB,
  financial_summary_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_year_month UNIQUE (year, month)
);

-- 8. FUNDING ALLOCATIONS
CREATE TABLE IF NOT EXISTS public.funding_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coverage_year INTEGER NOT NULL,
  coverage_month INTEGER NOT NULL CHECK (coverage_month >= 1 AND coverage_month <= 12),
  total_allocated_minor INTEGER NOT NULL,
  prize_share_minor INTEGER NOT NULL,
  charity_share_minor INTEGER NOT NULL,
  platform_share_minor INTEGER NOT NULL,
  charity_id UUID REFERENCES public.charities(id) ON DELETE SET NULL,
  charity_percentage_snapshot INTEGER NOT NULL,
  draw_id UUID REFERENCES public.draws(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_coverage_month UNIQUE (user_id, coverage_year, coverage_month)
);

-- 9. SCORES
CREATE TABLE IF NOT EXISTS public.scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  round_date DATE NOT NULL,
  value INTEGER NOT NULL CHECK (value >= 1 AND value <= 45),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_round_date UNIQUE (user_id, round_date)
);

-- 10. DRAW ENTRIES
CREATE TABLE IF NOT EXISTS public.draw_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id UUID NOT NULL REFERENCES public.draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score_values INTEGER[] NOT NULL,
  score_dates DATE[] NOT NULL,
  funding_allocation_id UUID REFERENCES public.funding_allocations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_draw_user UNIQUE (draw_id, user_id)
);

-- 11. DRAW FINANCIALS
CREATE TABLE IF NOT EXISTS public.draw_financials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id UUID UNIQUE NOT NULL REFERENCES public.draws(id) ON DELETE CASCADE,
  total_funded_minor INTEGER NOT NULL DEFAULT 0,
  incoming_jackpot_minor INTEGER NOT NULL DEFAULT 0,
  five_match_pool_minor INTEGER NOT NULL DEFAULT 0,
  four_match_pool_minor INTEGER NOT NULL DEFAULT 0,
  three_match_pool_minor INTEGER NOT NULL DEFAULT 0,
  five_match_winners_count INTEGER NOT NULL DEFAULT 0,
  four_match_winners_count INTEGER NOT NULL DEFAULT 0,
  three_match_winners_count INTEGER NOT NULL DEFAULT 0,
  five_match_payout_per_winner_minor INTEGER NOT NULL DEFAULT 0,
  four_match_payout_per_winner_minor INTEGER NOT NULL DEFAULT 0,
  three_match_payout_per_winner_minor INTEGER NOT NULL DEFAULT 0,
  five_match_rollover_minor INTEGER NOT NULL DEFAULT 0,
  unawarded_reserve_minor INTEGER NOT NULL DEFAULT 0,
  rounding_reserve_minor INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. DRAW AWARDS
CREATE TABLE IF NOT EXISTS public.draw_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id UUID NOT NULL REFERENCES public.draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier INTEGER NOT NULL CHECK (tier IN (3, 4, 5)),
  match_count INTEGER NOT NULL CHECK (match_count IN (3, 4, 5)),
  amount_minor INTEGER NOT NULL CHECK (amount_minor >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_draw_user_award UNIQUE (draw_id, user_id)
);

-- 13. WINNER SUBMISSIONS
CREATE TABLE IF NOT EXISTS public.winner_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  award_id UUID UNIQUE NOT NULL REFERENCES public.draw_awards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. PAYOUTS
CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  award_id UUID UNIQUE NOT NULL REFERENCES public.draw_awards(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  reference_note TEXT,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. DONATIONS
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  charity_id UUID NOT NULL REFERENCES public.charities(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE,
  amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
  currency TEXT NOT NULL DEFAULT 'inr',
  donor_email TEXT,
  donor_name TEXT,
  status TEXT NOT NULL DEFAULT 'succeeded',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_scores_user_date ON public.scores(user_id, round_date DESC);
CREATE INDEX IF NOT EXISTS idx_draws_status_year_month ON public.draws(status, year, month);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_funding_allocations_user_month ON public.funding_allocations(user_id, coverage_year, coverage_month);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funding_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draw_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draw_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draw_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winner_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES FOR PUBLIC / CHARITIES
CREATE POLICY "Public charities are readable by everyone" ON public.charities
  FOR SELECT USING (active = TRUE OR public.is_admin(auth.uid()));

CREATE POLICY "Admin CRUD on charities" ON public.charities
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Public charity events are readable by everyone" ON public.charity_events
  FOR SELECT USING (TRUE);

CREATE POLICY "Admin CRUD on charity events" ON public.charity_events
  FOR ALL USING (public.is_admin(auth.uid()));

-- RLS POLICIES FOR PROFILES
CREATE POLICY "Users can read own profile or admin can read all" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS POLICIES FOR USER ROLES
CREATE POLICY "Users can read own role or admin read all" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- RLS POLICIES FOR SCORES
CREATE POLICY "Users can read own scores or admin read all" ON public.scores
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can manage own scores" ON public.scores
  FOR ALL USING (auth.uid() = user_id);

-- RLS POLICIES FOR SUBSCRIPTIONS
CREATE POLICY "Users can read own subscription or admin read all" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- RLS POLICIES FOR INVOICES & FUNDING ALLOCATIONS
CREATE POLICY "Users can read own invoices" ON public.invoices
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can read own funding allocations" ON public.funding_allocations
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- RLS POLICIES FOR DRAWS
CREATE POLICY "Published draws readable by all; non-published by admin" ON public.draws
  FOR SELECT USING (status = 'published' OR public.is_admin(auth.uid()));

CREATE POLICY "Admin write draws" ON public.draws
  FOR ALL USING (public.is_admin(auth.uid()));

-- RLS POLICIES FOR DRAW ENTRIES
CREATE POLICY "Users read own entries; admin read all" ON public.draw_entries
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- RLS POLICIES FOR DRAW FINANCIALS
CREATE POLICY "Financials of published draws readable by all; admin all" ON public.draw_financials
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.draws d WHERE d.id = draw_id AND d.status = 'published')
    OR public.is_admin(auth.uid())
  );

-- RLS POLICIES FOR DRAW AWARDS
CREATE POLICY "Users read own awards; admin read all" ON public.draw_awards
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- RLS POLICIES FOR WINNER SUBMISSIONS
CREATE POLICY "Users manage own winner submission; admin manage all" ON public.winner_submissions
  FOR ALL USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- RLS POLICIES FOR PAYOUTS
CREATE POLICY "Users read own payout; admin manage all" ON public.payouts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.draw_awards a WHERE a.id = award_id AND a.user_id = auth.uid())
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Admin write payouts" ON public.payouts
  FOR ALL USING (public.is_admin(auth.uid()));

-- RLS POLICIES FOR DONATIONS
CREATE POLICY "Users read own donations; admin read all" ON public.donations
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- RLS POLICIES FOR AUDIT LOGS
CREATE POLICY "Admin read audit logs" ON public.audit_logs
  FOR SELECT USING (public.is_admin(auth.uid()));

-- TRIGGER FOR NEW USER CREATION (Profile & Role)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'role', 'member'));

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- DATABASE FUNCTION: Transactional Score Management (Retention of greatest 5 round dates)
CREATE OR REPLACE FUNCTION public.save_user_score(
  p_user_id UUID,
  p_round_date DATE,
  p_value INTEGER
)
RETURNS public.scores
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_oldest_date DATE;
  v_existing_score public.scores;
  v_result public.scores;
BEGIN
  -- 1. Validate value range
  IF p_value < 1 OR p_value > 45 THEN
    RAISE EXCEPTION 'Score value must be an integer between 1 and 45';
  END IF;

  -- 2. Validate round date is not in future
  IF p_round_date > CURRENT_DATE THEN
    RAISE EXCEPTION 'Round date cannot be in the future';
  END IF;

  -- 3. Check current user score count and oldest date
  SELECT COUNT(*), MIN(round_date)
  INTO v_count, v_oldest_date
  FROM public.scores
  WHERE user_id = p_user_id;

  -- 4. Check if editing an existing round_date
  SELECT * INTO v_existing_score
  FROM public.scores
  WHERE user_id = p_user_id AND round_date = p_round_date;

  IF v_existing_score.id IS NOT NULL THEN
    -- Update existing score
    UPDATE public.scores
    SET value = p_value, updated_at = NOW()
    WHERE id = v_existing_score.id
    RETURNING * INTO v_result;
    RETURN v_result;
  END IF;

  -- 5. If user already has 5 scores and this is a NEW round_date
  IF v_count >= 5 THEN
    IF p_round_date < v_oldest_date THEN
      RAISE EXCEPTION 'Cannot add backdated score older than current oldest round date (%)', v_oldest_date;
    END IF;
  END IF;

  -- 6. Insert new score
  INSERT INTO public.scores (user_id, round_date, value)
  VALUES (p_user_id, p_round_date, p_value)
  RETURNING * INTO v_result;

  -- 7. Prune scores if total count exceeds 5, retaining the 5 greatest round_dates
  DELETE FROM public.scores
  WHERE user_id = p_user_id
    AND id NOT IN (
      SELECT id FROM public.scores
      WHERE user_id = p_user_id
      ORDER BY round_date DESC
      LIMIT 5
    );

  RETURN v_result;
END;
$$;
