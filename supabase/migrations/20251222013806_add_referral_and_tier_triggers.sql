/*
  # Add Referral and Tier Management Triggers

  This migration implements automatic referral tracking and tier updates:

  1. Referral Handling
    - When a new user signs up with a referral code, automatically increment the referrer's count
    - Update the referrer's tier if they reach 1+ referrals (Bronze/Silver → Gold)
  
  2. Tier Recalculation on New Users
    - When a new user joins, recalculate tiers for the top 15 users
    - Ensures top 10 users always have Platinum tier
    - Users who drop out of top 10 get appropriate tier based on their stats
  
  3. Tier Rules
    - Platinum: Top 10 users (by created_at, earliest first)
    - Gold: 1+ referrals
    - Silver: Email AND SMS verified
    - Bronze: Email verified only
*/

-- Function to update tier based on verification and referrals
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

-- Function to recalculate tiers for top 15 users
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

-- Trigger function to handle referral increments
CREATE OR REPLACE FUNCTION handle_referral_increment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create trigger for new waitlist entries
DROP TRIGGER IF EXISTS on_waitlist_insert ON waitlist;
CREATE TRIGGER on_waitlist_insert
  AFTER INSERT ON waitlist
  FOR EACH ROW
  EXECUTE FUNCTION handle_referral_increment();

-- Trigger function to recalculate tiers when verification status changes
CREATE OR REPLACE FUNCTION handle_verification_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (NEW.email_verified != OLD.email_verified OR NEW.sms_verified != OLD.sms_verified) THEN
    PERFORM update_user_tier(NEW.email);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for verification updates
DROP TRIGGER IF EXISTS on_verification_update ON waitlist;
CREATE TRIGGER on_verification_update
  AFTER UPDATE ON waitlist
  FOR EACH ROW
  EXECUTE FUNCTION handle_verification_update();