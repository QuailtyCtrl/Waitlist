/*
  # Fix RLS Policy Conflicts

  1. Changes
    - Drop and recreate admin policies with proper authentication checks
    - Ensure admin policies only evaluate for authenticated users
    - Prevent JWT claim access errors for anonymous users
    
  2. Security Improvements
    - Admin policies now properly check authentication status first
    - Anonymous users can still read public leaderboard data
    - Anonymous users can insert new waitlist entries (signup)
    - Authenticated admins can perform privileged operations
    
  3. Important Notes
    - The admin policies now use a subquery to check if the current authenticated user is an admin
    - This prevents errors when anonymous users query the waitlist table
    - All policies are now role-specific and won't conflict
*/

-- Drop the problematic admin policies
DROP POLICY IF EXISTS "Admins can read all waitlist data" ON waitlist;
DROP POLICY IF EXISTS "Admins can update any waitlist entry" ON waitlist;
DROP POLICY IF EXISTS "Admins can delete any waitlist entry" ON waitlist;

-- Recreate admin policies with proper authentication checks
-- These policies only apply to authenticated users and check admin status properly
CREATE POLICY "Admins can read all waitlist data"
  ON waitlist
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM waitlist AS admin_check
      WHERE admin_check.is_admin = true
      AND admin_check.id = auth.uid()::text::uuid
    )
  );

CREATE POLICY "Admins can update any waitlist entry"
  ON waitlist
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM waitlist AS admin_check
      WHERE admin_check.is_admin = true
      AND admin_check.id = auth.uid()::text::uuid
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM waitlist AS admin_check
      WHERE admin_check.is_admin = true
      AND admin_check.id = auth.uid()::text::uuid
    )
  );

CREATE POLICY "Admins can delete any waitlist entry"
  ON waitlist
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM waitlist AS admin_check
      WHERE admin_check.is_admin = true
      AND admin_check.id = auth.uid()::text::uuid
    )
  );
