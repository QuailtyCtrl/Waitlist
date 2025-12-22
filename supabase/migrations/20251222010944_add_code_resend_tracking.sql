/*
  # Add Code Resend Tracking

  1. Changes
    - Add `email_code_last_sent_at` column to track when email verification code was last sent
    - Add `sms_code_last_sent_at` column to track when SMS verification code was last sent
  
  2. Purpose
    - Enable rate limiting on code resends (60 second cooldown)
    - Prevent abuse of verification code sending
    - Track last send time for both email and SMS codes
  
  3. Notes
    - Columns are nullable (NULL means never sent)
    - Timestamps are in UTC
    - Used for both initial send and resend operations
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'waitlist' AND column_name = 'email_code_last_sent_at'
  ) THEN
    ALTER TABLE waitlist ADD COLUMN email_code_last_sent_at timestamptz;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'waitlist' AND column_name = 'sms_code_last_sent_at'
  ) THEN
    ALTER TABLE waitlist ADD COLUMN sms_code_last_sent_at timestamptz;
  END IF;
END $$;