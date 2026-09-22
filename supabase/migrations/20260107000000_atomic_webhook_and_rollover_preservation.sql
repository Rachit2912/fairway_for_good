-- Migration: Atomic Webhook Allocations and Rollover Preservation across Draw Lifecycles

-- 1. PROCESS_INVOICE_FUNDING_ALLOCATION RPC FUNCTION
-- Atomically creates invoice and upserts funding allocations in a single database transaction,
-- freezing any allocations that are already linked to a draw (draw_id IS NOT NULL).
CREATE OR REPLACE FUNCTION public.process_invoice_funding_allocation(
  p_user_id UUID,
  p_stripe_invoice_id TEXT,
  p_amount_paid INTEGER,
  p_currency TEXT,
  p_plan_type TEXT,
  p_paid_at TIMESTAMPTZ,
  p_period_start TIMESTAMPTZ
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice_id UUID;
  v_existing_amount INTEGER;
  v_existing_currency TEXT;
  v_start_year INTEGER;
  v_start_month INTEGER;
  v_profile RECORD;
  v_charity_pct INTEGER;
  v_monthly_share INTEGER;
  v_remainder INTEGER;
  v_month_total INTEGER;
  v_prize_share INTEGER;
  v_charity_share INTEGER;
  v_platform_share INTEGER;
  v_cov_date TIMESTAMPTZ;
  v_cov_year INTEGER;
  v_cov_month INTEGER;
  v_existing_draw_id UUID;
  i INTEGER;
BEGIN
  -- A. Check if invoice was previously processed
  SELECT id, amount_paid, currency INTO v_invoice_id, v_existing_amount, v_existing_currency
  FROM public.invoices
  WHERE stripe_invoice_id = p_stripe_invoice_id;

  IF v_invoice_id IS NOT NULL THEN
    -- Reject conflicting replay parameters
    IF v_existing_amount != p_amount_paid OR v_existing_currency != p_currency THEN
      RAISE EXCEPTION 'Invoice replay conflict: conflicting amount or currency for invoice %', p_stripe_invoice_id;
    END IF;

    -- Return existing invoice ID without modifying previously completed allocations or snapshots
    RETURN v_invoice_id;
  END IF;

  -- B. Record new invoice
  INSERT INTO public.invoices (
    user_id,
    stripe_invoice_id,
    amount_paid,
    currency,
    plan_type,
    paid_at
  ) VALUES (
    p_user_id,
    p_stripe_invoice_id,
    p_amount_paid,
    p_currency,
    p_plan_type,
    p_paid_at
  ) RETURNING id INTO v_invoice_id;

  -- C. Retrieve user profile charity split settings at time of payment
  SELECT selected_charity_id, charity_percentage INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id;

  v_charity_pct := COALESCE(v_profile.charity_percentage, 10);

  v_start_year := EXTRACT(YEAR FROM p_period_start);
  v_start_month := EXTRACT(MONTH FROM p_period_start);

  -- D. Upsert funding allocations atomically
  IF p_plan_type = 'annual' THEN
    v_monthly_share := FLOOR(p_amount_paid / 12);
    v_remainder := p_amount_paid - (v_monthly_share * 12);

    FOR i IN 0..11 LOOP
      v_cov_date := (p_period_start + (i || ' month')::INTERVAL);
      v_cov_year := EXTRACT(YEAR FROM v_cov_date);
      v_cov_month := EXTRACT(MONTH FROM v_cov_date);

      SELECT draw_id INTO v_existing_draw_id
      FROM public.funding_allocations
      WHERE user_id = p_user_id
        AND coverage_year = v_cov_year
        AND coverage_month = v_cov_month;

      IF v_existing_draw_id IS NOT NULL THEN
        CONTINUE;
      END IF;

      v_month_total := CASE WHEN i = 0 THEN v_monthly_share + v_remainder ELSE v_monthly_share END;
      v_prize_share := FLOOR(v_month_total * 0.20);
      v_charity_share := FLOOR(v_month_total * (v_charity_pct / 100.0));
      v_platform_share := v_month_total - v_prize_share - v_charity_share;

      INSERT INTO public.funding_allocations (
        invoice_id,
        user_id,
        coverage_year,
        coverage_month,
        total_allocated_minor,
        prize_share_minor,
        charity_share_minor,
        platform_share_minor,
        charity_id,
        charity_percentage_snapshot
      ) VALUES (
        v_invoice_id,
        p_user_id,
        v_cov_year,
        v_cov_month,
        v_month_total,
        v_prize_share,
        v_charity_share,
        v_platform_share,
        v_profile.selected_charity_id,
        v_charity_pct
      ) ON CONFLICT (user_id, coverage_year, coverage_month) DO UPDATE SET
        total_allocated_minor = EXCLUDED.total_allocated_minor,
        prize_share_minor = EXCLUDED.prize_share_minor,
        charity_share_minor = EXCLUDED.charity_share_minor,
        platform_share_minor = EXCLUDED.platform_share_minor
      WHERE public.funding_allocations.draw_id IS NULL;
    END LOOP;
  ELSE
    -- Monthly Plan
    SELECT draw_id INTO v_existing_draw_id
    FROM public.funding_allocations
    WHERE user_id = p_user_id
      AND coverage_year = v_start_year
      AND coverage_month = v_start_month;

    IF v_existing_draw_id IS NULL THEN
      v_prize_share := FLOOR(p_amount_paid * 0.20);
      v_charity_share := FLOOR(p_amount_paid * (v_charity_pct / 100.0));
      v_platform_share := p_amount_paid - v_prize_share - v_charity_share;

      INSERT INTO public.funding_allocations (
        invoice_id,
        user_id,
        coverage_year,
        coverage_month,
        total_allocated_minor,
        prize_share_minor,
        charity_share_minor,
        platform_share_minor,
        charity_id,
        charity_percentage_snapshot
      ) VALUES (
        v_invoice_id,
        p_user_id,
        v_start_year,
        v_start_month,
        p_amount_paid,
        v_prize_share,
        v_charity_share,
        v_platform_share,
        v_profile.selected_charity_id,
        v_charity_pct
      ) ON CONFLICT (user_id, coverage_year, coverage_month) DO UPDATE SET
        total_allocated_minor = EXCLUDED.total_allocated_minor,
        prize_share_minor = EXCLUDED.prize_share_minor,
        charity_share_minor = EXCLUDED.charity_share_minor,
        platform_share_minor = EXCLUDED.platform_share_minor
      WHERE public.funding_allocations.draw_id IS NULL;
    END IF;
  END IF;

  RETURN v_invoice_id;
END;
$$;

-- Security Hardening: Revoke RPC execution from untrusted roles; restrict strictly to service_role
REVOKE EXECUTE ON FUNCTION public.process_invoice_funding_allocation(UUID, TEXT, INTEGER, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_invoice_funding_allocation(UUID, TEXT, INTEGER, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_invoice_funding_allocation(UUID, TEXT, INTEGER, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.process_invoice_funding_allocation(UUID, TEXT, INTEGER, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;

-- 2. UPDATE PUBLISH_MONTHLY_DRAW PROCEDURE WITH ROLLOVER PRESERVATION
-- Carries forward the latest unconsumed published rollover across skipped months and enforces strict chronological order.
CREATE OR REPLACE FUNCTION public.publish_monthly_draw(
  p_draw_id UUID
)
RETURNS public.draws
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_draw public.draws;
  v_uncompleted_earlier_count INTEGER := 0;
  v_later_published_count INTEGER := 0;
  v_total_funded_minor INTEGER := 0;
  v_incoming_rollover_minor INTEGER := 0;
  v_base_pool_minor INTEGER := 0;
  v_entry RECORD;
  v_match_count INTEGER;
  v_val INTEGER;
  v_e_count INTEGER;
  v_d_count INTEGER;
  v_5_winners INTEGER := 0;
  v_4_winners INTEGER := 0;
  v_3_winners INTEGER := 0;
  v_t5_pool INTEGER;
  v_t4_pool INTEGER;
  v_t3_pool INTEGER;
  v_t5_payout INTEGER := 0;
  v_t4_payout INTEGER := 0;
  v_t3_payout INTEGER := 0;
  v_t5_rollover INTEGER := 0;
  v_t5_reserve INTEGER := 0;
  v_t4_reserve INTEGER := 0;
  v_t3_reserve INTEGER := 0;
  v_unawarded_reserve INTEGER := 0;
  v_rounding_reserve INTEGER := 0;
  v_award_amount INTEGER;
  v_prev_draw_id UUID;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin privileges required to publish draw';
  END IF;

  -- Acquire global publication lock to serialize publication and prevent rollover race conditions
  PERFORM pg_advisory_xact_lock(hashtext('publish_monthly_draw_global_lock'));

  SELECT * INTO v_draw FROM public.draws WHERE id = p_draw_id FOR UPDATE;
  IF v_draw.id IS NULL THEN
    RAISE EXCEPTION 'Draw not found';
  END IF;

  IF v_draw.status = 'published' THEN
    RAISE EXCEPTION 'Draw is already published';
  END IF;

  IF v_draw.status != 'generated' OR v_draw.official_numbers IS NULL THEN
    RAISE EXCEPTION 'Draw must be in generated status with official numbers before publication';
  END IF;

  -- A. Chronological Guard 1: Reject publication if ANY earlier month's draw exists in uncompleted status (draft, locked, generated)
  SELECT COUNT(*) INTO v_uncompleted_earlier_count
  FROM public.draws
  WHERE (year < v_draw.year OR (year = v_draw.year AND month < v_draw.month))
    AND status != 'published';

  IF v_uncompleted_earlier_count > 0 THEN
    RAISE EXCEPTION 'Chronological publication guard: Earlier draws must be completed and published before publishing Draw %/%', v_draw.month, v_draw.year;
  END IF;

  -- B. Chronological Guard 2: Reject publication if ANY later month's draw is already published
  SELECT COUNT(*) INTO v_later_published_count
  FROM public.draws
  WHERE (year > v_draw.year OR (year = v_draw.year AND month > v_draw.month))
    AND status = 'published';

  IF v_later_published_count > 0 THEN
    RAISE EXCEPTION 'Chronological publication guard: Cannot publish Draw %/% because a later month is already published', v_draw.month, v_draw.year;
  END IF;

  -- C. Sum total prize share funding from funding_allocations linked to this draw
  SELECT COALESCE(SUM(prize_share_minor), 0)
  INTO v_total_funded_minor
  FROM public.funding_allocations
  WHERE draw_id = p_draw_id;

  -- D. Carry forward the latest unconsumed published rollover from the most recent published draw prior to this draw
  SELECT id INTO v_prev_draw_id
  FROM public.draws
  WHERE (year < v_draw.year OR (year = v_draw.year AND month < v_draw.month))
    AND status = 'published'
  ORDER BY year DESC, month DESC
  LIMIT 1;

  IF v_prev_draw_id IS NOT NULL THEN
    SELECT COALESCE(five_match_rollover_minor, 0)
    INTO v_incoming_rollover_minor
    FROM public.draw_financials
    WHERE draw_id = v_prev_draw_id;
  END IF;

  v_base_pool_minor := v_total_funded_minor;
  v_t5_pool := FLOOR(v_base_pool_minor * 0.40) + v_incoming_rollover_minor;
  v_t4_pool := FLOOR(v_base_pool_minor * 0.35);
  v_t3_pool := v_base_pool_minor - FLOOR(v_base_pool_minor * 0.40) - FLOOR(v_base_pool_minor * 0.35);

  -- E. Count winners for 5, 4, 3 matches using multiset intersection
  FOR v_entry IN SELECT * FROM public.draw_entries WHERE draw_id = p_draw_id LOOP
    v_match_count := 0;

    FOR v_val IN SELECT DISTINCT UNNEST(v_entry.score_values) LOOP
      SELECT COUNT(*) INTO v_e_count FROM UNNEST(v_entry.score_values) val WHERE val = v_val;
      SELECT COUNT(*) INTO v_d_count FROM UNNEST(v_draw.official_numbers) val WHERE val = v_val;
      v_match_count := v_match_count + LEAST(v_e_count, v_d_count);
    END LOOP;

    IF v_match_count = 5 THEN
      v_5_winners := v_5_winners + 1;
    ELSIF v_match_count = 4 THEN
      v_4_winners := v_4_winners + 1;
    ELSIF v_match_count = 3 THEN
      v_3_winners := v_3_winners + 1;
    END IF;
  END LOOP;

  -- F. Calculate payouts and reserves
  IF v_5_winners > 0 THEN
    v_t5_payout := FLOOR(v_t5_pool / v_5_winners);
    v_t5_reserve := v_t5_pool - (v_t5_payout * v_5_winners);
  ELSE
    v_t5_rollover := v_t5_pool; -- Rollover preserved if zero 5-match winners
  END IF;

  IF v_4_winners > 0 THEN
    v_t4_payout := FLOOR(v_t4_pool / v_4_winners);
    v_t4_reserve := v_t4_pool - (v_t4_payout * v_4_winners);
  ELSE
    v_unawarded_reserve := v_unawarded_reserve + v_t4_pool;
  END IF;

  IF v_3_winners > 0 THEN
    v_t3_payout := FLOOR(v_t3_pool / v_3_winners);
    v_t3_reserve := v_t3_pool - (v_t3_payout * v_3_winners);
  ELSE
    v_unawarded_reserve := v_unawarded_reserve + v_t3_pool;
  END IF;

  v_rounding_reserve := v_t5_reserve + v_t4_reserve + v_t3_reserve;

  -- G. Record draw financials
  INSERT INTO public.draw_financials (
    draw_id,
    total_funded_minor,
    incoming_jackpot_minor,
    five_match_pool_minor,
    four_match_pool_minor,
    three_match_pool_minor,
    five_match_winners_count,
    four_match_winners_count,
    three_match_winners_count,
    five_match_payout_per_winner_minor,
    four_match_payout_per_winner_minor,
    three_match_payout_per_winner_minor,
    five_match_rollover_minor,
    unawarded_reserve_minor,
    rounding_reserve_minor
  ) VALUES (
    p_draw_id,
    v_total_funded_minor,
    v_incoming_rollover_minor,
    v_t5_pool,
    v_t4_pool,
    v_t3_pool,
    v_5_winners,
    v_4_winners,
    v_3_winners,
    v_t5_payout,
    v_t4_payout,
    v_t3_payout,
    v_t5_rollover,
    v_unawarded_reserve,
    v_rounding_reserve
  ) ON CONFLICT (draw_id) DO UPDATE SET
    total_funded_minor = EXCLUDED.total_funded_minor,
    five_match_payout_per_winner_minor = EXCLUDED.five_match_payout_per_winner_minor;

  -- H. Create draw awards for winning entries
  FOR v_entry IN SELECT * FROM public.draw_entries WHERE draw_id = p_draw_id LOOP
    v_match_count := 0;

    FOR v_val IN SELECT DISTINCT UNNEST(v_entry.score_values) LOOP
      SELECT COUNT(*) INTO v_e_count FROM UNNEST(v_entry.score_values) val WHERE val = v_val;
      SELECT COUNT(*) INTO v_d_count FROM UNNEST(v_draw.official_numbers) val WHERE val = v_val;
      v_match_count := v_match_count + LEAST(v_e_count, v_d_count);
    END LOOP;

    v_award_amount := 0;
    IF v_match_count = 5 THEN
      v_award_amount := v_t5_payout;
    ELSIF v_match_count = 4 THEN
      v_award_amount := v_t4_payout;
    ELSIF v_match_count = 3 THEN
      v_award_amount := v_t3_payout;
    END IF;

    IF v_match_count >= 3 AND v_award_amount > 0 THEN
      INSERT INTO public.draw_awards (
        draw_id,
        user_id,
        tier,
        match_count,
        amount_minor
      ) VALUES (
        p_draw_id,
        v_entry.user_id,
        v_match_count,
        v_match_count,
        v_award_amount
      ) ON CONFLICT (draw_id, user_id) DO NOTHING;
    END IF;
  END LOOP;

  -- I. Update draw status to published
  UPDATE public.draws
  SET status = 'published',
      published_at = NOW(),
      updated_at = NOW()
  WHERE id = p_draw_id
  RETURNING * INTO v_draw;

  RETURN v_draw;
END;
$$;
