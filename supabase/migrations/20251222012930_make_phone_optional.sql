/*
  # Make Phone Number Optional

  1. Changes
    - Remove NOT NULL constraint from phone field
    - Allow phone to be nullable for email-only signups
    - Update unique constraint to handle null values properly

  2. Security
    - No changes to RLS policies needed
    - Phone verification remains optional based on user choice

  3. Important Notes
    - Users can now sign up with only email
    - SMS verification becomes optional enhancement
    - Tier calculation updated to handle email-only users
*/

ALTER TABLE waitlist
  ALTER COLUMN phone DROP NOT NULL;

DROP INDEX IF EXISTS idx_waitlist_phone;

CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_phone_unique
  ON waitlist(phone)
  WHERE phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_waitlist_phone_lookup
  ON waitlist(phone)
  WHERE phone IS NOT NULL;
