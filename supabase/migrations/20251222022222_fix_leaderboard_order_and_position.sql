/*
  # Fix Leaderboard Order and Make sachianhk@gmail #1

  1. Changes to Tier Calculation Logic
    - Update position calculation to use DESC order (latest signups first)
    - Top 10 is now based on most recent signups (created_at DESC)
    - Update trigger functions to reflect new ordering

  2. Update sachianhk@gmail.com Position
    - Set created_at to current timestamp to make them #1
    - Ensures they appear at the top of the leaderboard

  3. Important Notes
    - Leaderboard now shows newest members first
    - Position #1 is the most recent signup
    - All tier calculations updated accordingly
*/

-- Update tier calculation function to use DESC ordering (latest first)
CREATE OR REPLACE FUNCTION update_user_tier(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

  -- Count users with MORE RECENT created_at (DESC order)
  SELECT COUNT(*) + 1
  INTO v_position
  FROM waitlist
  WHERE created_at > v_created_at;

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

-- Update recalculate function to use DESC ordering (latest first)
CREATE OR REPLACE FUNCTION recalculate_top_tiers()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  position_counter integer := 0;
  new_tier text;
BEGIN
  FOR user_record IN
    SELECT email, email_verified, sms_verified, referral_count
    FROM waitlist
    ORDER BY created_at DESC
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

-- Update sachianhk@gmail.com to have the most recent timestamp
DO $$
BEGIN
  -- Check if the user exists, if so update their created_at to now
  IF EXISTS (SELECT 1 FROM waitlist WHERE email = 'sachianhk@gmail.com') THEN
    UPDATE waitlist
    SET created_at = now(),
        updated_at = now()
    WHERE email = 'sachianhk@gmail.com';
  ELSE
    -- If user doesn't exist, insert them as #1
    INSERT INTO waitlist (
      email,
      phone,
      email_verified,
      sms_verified,
      tier,
      referral_code,
      referral_count,
      created_at,
      updated_at
    ) VALUES (
      'sachianhk@gmail.com',
      '+15559999999',
      true,
      true,
      'platinum',
      'ADMIN1',
      0,
      now(),
      now()
    )
    ON CONFLICT (email) DO UPDATE
    SET created_at = now(),
        updated_at = now();
  END IF;
END $$;

-- Recalculate all tiers based on new ordering
SELECT recalculate_top_tiers();
