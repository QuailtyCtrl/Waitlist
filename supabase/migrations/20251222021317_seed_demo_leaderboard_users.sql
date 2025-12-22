/*
  # Seed Demo Users for Leaderboard

  1. Purpose
    - Add 16 demo users to populate the waitlist leaderboard
    - Create an active, engaging leaderboard experience
    - Distribute users across all tier levels (bronze, silver, gold, platinum)

  2. User Distribution
    - 4 Platinum users (top 10 positions with varied referral counts)
    - 3 Gold users (users with 1-3 referrals)
    - 4 Silver users (verified users with 0 referrals)
    - 5 Bronze users (email-only verified users)

  3. Data Details
    - Realistic email addresses with common names
    - Varied referral counts (0-15) for organic appearance
    - Staggered created_at timestamps (spanning last 7 days)
    - All demo users have verified email status
    - Unique referral codes for each user

  4. Important Notes
    - Demo users are marked with a special pattern for easy identification if needed
    - Uses realistic timestamps to simulate gradual signups
    - Maintains tier logic consistency with existing triggers
*/

DO $$
DECLARE
  base_time timestamptz := now() - interval '7 days';
BEGIN
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
  ) VALUES
    ('alex.thompson@example.com', '+15551234567', true, true, 'platinum', 'DEMO01', 15, base_time + interval '0 hours', base_time + interval '0 hours'),
    ('jordan.rivera@example.com', '+15551234568', true, true, 'platinum', 'DEMO02', 12, base_time + interval '3 hours', base_time + interval '3 hours'),
    ('taylor.chen@example.com', '+15551234569', true, true, 'platinum', 'DEMO03', 10, base_time + interval '8 hours', base_time + interval '8 hours'),
    ('casey.martinez@example.com', '+15551234570', true, true, 'platinum', 'DEMO04', 8, base_time + interval '12 hours', base_time + interval '12 hours'),
    
    ('morgan.jackson@example.com', '+15551234571', true, true, 'gold', 'DEMO05', 5, base_time + interval '1 day', base_time + interval '1 day'),
    ('riley.davis@example.com', '+15551234572', true, true, 'gold', 'DEMO06', 3, base_time + interval '2 days', base_time + interval '2 days'),
    ('avery.wilson@example.com', '+15551234573', true, true, 'gold', 'DEMO07', 2, base_time + interval '3 days', base_time + interval '3 days'),
    
    ('dakota.moore@example.com', '+15551234574', true, true, 'silver', 'DEMO08', 0, base_time + interval '3.5 days', base_time + interval '3.5 days'),
    ('jamie.taylor@example.com', '+15551234575', true, true, 'silver', 'DEMO09', 0, base_time + interval '4 days', base_time + interval '4 days'),
    ('parker.anderson@example.com', '+15551234576', true, true, 'silver', 'DEMO10', 0, base_time + interval '4.5 days', base_time + interval '4.5 days'),
    ('skyler.thomas@example.com', '+15551234577', true, true, 'silver', 'DEMO11', 0, base_time + interval '5 days', base_time + interval '5 days'),
    
    ('quinn.harris@example.com', '+15551234578', true, false, 'bronze', 'DEMO12', 0, base_time + interval '5.5 days', base_time + interval '5.5 days'),
    ('drew.clark@example.com', '+15551234579', true, false, 'bronze', 'DEMO13', 0, base_time + interval '6 days', base_time + interval '6 days'),
    ('sage.lewis@example.com', '+15551234580', true, false, 'bronze', 'DEMO14', 0, base_time + interval '6.3 days', base_time + interval '6.3 days'),
    ('phoenix.walker@example.com', '+15551234581', true, false, 'bronze', 'DEMO15', 0, base_time + interval '6.6 days', base_time + interval '6.6 days'),
    ('reese.hall@example.com', '+15551234582', true, false, 'bronze', 'DEMO16', 0, base_time + interval '6.9 days', base_time + interval '6.9 days')
  ON CONFLICT (email) DO NOTHING;

END $$;
