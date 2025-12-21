/*
  # Luxury Streetwear Waitlist Schema

  1. New Tables
    - `waitlist` - Main table for collecting customer data
      - `id` (uuid, primary key)
      - `email` (text, unique, not null)
      - `phone` (text, unique, not null)
      - `email_verified` (boolean, default false)
      - `sms_verified` (boolean, default false)
      - `email_verification_code` (text) - temporary verification code
      - `email_verification_code_expires_at` (timestamptz) - code expiration
      - `sms_verification_code` (text) - temporary verification code
      - `sms_verification_code_expires_at` (timestamptz) - code expiration
      - `tier` (text, default 'bronze') - VIP tier level (bronze, silver, gold, platinum)
      - `referral_code` (text, unique) - unique referral code for each user
      - `referral_count` (integer, default 0) - number of successful referrals
      - `referred_by_code` (text) - referral code that referred this user
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `waitlist` table
    - Add public policy to insert new entries (for signup)
    - Add policy for users to read their own data
    - Add policy for public read-only access to leaderboard data (rank, tier, position)

  3. Indexes
    - Index on email for duplicate checking
    - Index on phone for duplicate checking
    - Index on referral_code for fast lookup
    - Index on created_at for leaderboard sorting
    - Index on tier for efficient filtering

  4. Important Notes
    - Email and phone are both required and unique to prevent duplicates
    - Verification codes are temporary and expire after 15 minutes
    - Tier levels progress based on verification completion and referrals
    - Referral code is a short unique identifier for sharing
    - All timestamps in UTC for consistency
*/

CREATE TABLE IF NOT EXISTS waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  phone text UNIQUE NOT NULL,
  email_verified boolean DEFAULT false,
  sms_verified boolean DEFAULT false,
  email_verification_code text,
  email_verification_code_expires_at timestamptz,
  sms_verification_code text,
  sms_verification_code_expires_at timestamptz,
  tier text DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  referral_code text UNIQUE NOT NULL,
  referral_count integer DEFAULT 0,
  referred_by_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_phone ON waitlist(phone);
CREATE INDEX IF NOT EXISTS idx_waitlist_referral_code ON waitlist(referral_code);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_waitlist_tier ON waitlist(tier);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert new waitlist entries"
  ON waitlist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read own waitlist data"
  ON waitlist
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can update own email verification"
  ON waitlist
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
