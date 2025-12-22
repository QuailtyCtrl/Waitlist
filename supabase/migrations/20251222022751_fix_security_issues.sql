/*
  # Fix Security Issues
  
  This migration addresses multiple security concerns identified in the database audit:
  
  1. Unused Index Cleanup
    - Drop `idx_waitlist_phone_lookup` index which is not being used by any queries
    - The unique index `idx_waitlist_phone_unique` already handles phone lookups efficiently
  
  2. Multiple Permissive Policies Resolution
    - Remove redundant admin SELECT and UPDATE policies for authenticated users
    - The "Anyone can read/update waitlist data" policies already provide necessary access
    - Keep admin DELETE policy as it's the only DELETE policy
    - This eliminates policy conflicts while maintaining the same access patterns
  
  3. Function Search Path Security
    - Add `SET search_path = public` to all functions to prevent search path attacks
    - Functions affected:
      - handle_referral_increment()
      - handle_verification_update()
      - update_user_tier()
      - recalculate_top_tiers()
    - This ensures functions only access objects in the public schema
  
  4. Security Model
    - Anonymous users: Can SELECT and UPDATE (for signup/verification)
    - Authenticated users: Can SELECT and UPDATE (for leaderboard/verification)
    - Admins: Additional DELETE privileges
*/

-- 1. Drop unused phone lookup index
DROP INDEX IF EXISTS idx_waitlist_phone_lookup;

-- 2. Remove redundant permissive policies that conflict
-- The "Anyone can read/update waitlist data" policies already cover all users (anon + authenticated)
-- Admin policies for SELECT and UPDATE are redundant since anyone can already do these actions
DROP POLICY IF EXISTS "Admins can read all waitlist data" ON waitlist;
DROP POLICY IF EXISTS "Admins can update any waitlist entry" ON waitlist;

-- Keep the admin DELETE policy as it's the only DELETE policy and provides actual admin-only access

-- 3. Fix function search paths to prevent search path attacks
-- Recreate all functions with secure search_path

CREATE OR REPLACE FUNCTION update_user_tier(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_position integer;
  v_email_verified boolean;
  v_sms_verified boolean;
  v_referral_count integer;
  v_created_at timestamptz;
  v_new_tier text;
BEGIN
  SELECT email_verified, sms_verified, referral_count, created_at
  INTO v_email_verified, v_sms_verified, v_referral_count, v_created_at
  FROM waitlist
  WHERE email = user_email;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT COUNT(*) + 1
  INTO v_position
  FROM waitlist
  WHERE created_at < v_created_at;

  IF v_position <= 10 THEN
    v_new_tier := 'platinum';
  ELSIF v_referral_count >= 1 THEN
    v_new_tier := 'gold';
  ELSIF v_email_verified AND v_sms_verified THEN
    v_new_tier := 'silver';
  ELSIF v_email_verified THEN
    v_new_tier := 'bronze';
  ELSE
    v_new_tier := 'bronze';
  END IF;

  UPDATE waitlist
  SET tier = v_new_tier, updated_at = now()
  WHERE email = user_email;
END;
$$;

CREATE OR REPLACE FUNCTION recalculate_top_tiers()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_record RECORD;
  position_counter integer := 0;
  new_tier text;
BEGIN
  FOR user_record IN
    SELECT email, email_verified, sms_verified, referral_count
    FROM waitlist
    ORDER BY created_at ASC
    LIMIT 15
  LOOP
    position_counter := position_counter + 1;
    
    IF position_counter <= 10 THEN
      new_tier := 'platinum';
    ELSIF user_record.referral_count >= 1 THEN
      new_tier := 'gold';
    ELSIF user_record.email_verified AND user_record.sms_verified THEN
      new_tier := 'silver';
    ELSIF user_record.email_verified THEN
      new_tier := 'bronze';
    ELSE
      new_tier := 'bronze';
    END IF;

    UPDATE waitlist
    SET tier = new_tier, updated_at = now()
    WHERE email = user_record.email;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION handle_referral_increment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referred_by_code IS NOT NULL THEN
    UPDATE waitlist
    SET referral_count = referral_count + 1,
        updated_at = now()
    WHERE referral_code = NEW.referred_by_code;
    
    PERFORM update_user_tier(
      (SELECT email FROM waitlist WHERE referral_code = NEW.referred_by_code)
    );
  END IF;

  PERFORM recalculate_top_tiers();
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION handle_verification_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.email_verified != OLD.email_verified OR NEW.sms_verified != OLD.sms_verified) THEN
    PERFORM update_user_tier(NEW.email);
  END IF;
  
  RETURN NEW;
END;
$$;
