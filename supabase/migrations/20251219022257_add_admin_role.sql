/*
  # Add Admin Role System

  1. Changes
    - Add `is_admin` column to `waitlist` table
      - `is_admin` (boolean, default false) - designates admin users
    
  2. Data Migration
    - Promote sachianhk@gmail.com to admin
    
  3. Security
    - Add policy for admins to view all waitlist data
    - Add policy for admins to update any waitlist entry
    
  4. Important Notes
    - Admin role provides elevated permissions to manage waitlist
    - Only admins can modify other users' data
    - Regular users can still read public leaderboard data
*/

-- Add is_admin column to waitlist table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'waitlist' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE waitlist ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
END $$;

-- Create index on is_admin for efficient admin checks
CREATE INDEX IF NOT EXISTS idx_waitlist_is_admin ON waitlist(is_admin);

-- Promote the specified account to admin
UPDATE waitlist 
SET is_admin = true 
WHERE email = 'sachianhk@gmail.com';

-- Add policy for admins to read all waitlist data
CREATE POLICY "Admins can read all waitlist data"
  ON waitlist
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM waitlist
      WHERE waitlist.is_admin = true
      AND waitlist.email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

-- Add policy for admins to update any waitlist entry
CREATE POLICY "Admins can update any waitlist entry"
  ON waitlist
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM waitlist
      WHERE waitlist.is_admin = true
      AND waitlist.email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM waitlist
      WHERE waitlist.is_admin = true
      AND waitlist.email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

-- Add policy for admins to delete waitlist entries
CREATE POLICY "Admins can delete any waitlist entry"
  ON waitlist
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM waitlist
      WHERE waitlist.is_admin = true
      AND waitlist.email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );