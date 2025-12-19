/*
  # Fix Admin Policies Properly

  1. Changes
    - Drop and recreate admin policies with JWT-based admin checks
    - Use safe JWT claim extraction that won't error for anonymous users
    - Add null checks before accessing JWT claims
    
  2. Security Improvements
    - Admin policies check auth.uid() is not null first
    - Then safely extract email from JWT claims
    - Match email against waitlist.is_admin flag
    
  3. Important Notes
    - The TO authenticated clause ensures these only apply to logged-in users
    - Safe JWT extraction prevents errors when policies are evaluated
    - Anonymous users can still use the basic read/write policies
*/

-- Drop the current admin policies
DROP POLICY IF EXISTS "Admins can read all waitlist data" ON waitlist;
DROP POLICY IF EXISTS "Admins can update any waitlist entry" ON waitlist;
DROP POLICY IF EXISTS "Admins can delete any waitlist entry" ON waitlist;

-- Recreate admin policies with safe JWT claim extraction
CREATE POLICY "Admins can read all waitlist data"
  ON waitlist
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM waitlist AS admin_check
      WHERE admin_check.is_admin = true
      AND admin_check.email = COALESCE(
        (auth.jwt() -> 'email')::text,
        ''
      )
    )
  );

CREATE POLICY "Admins can update any waitlist entry"
  ON waitlist
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM waitlist AS admin_check
      WHERE admin_check.is_admin = true
      AND admin_check.email = COALESCE(
        (auth.jwt() -> 'email')::text,
        ''
      )
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM waitlist AS admin_check
      WHERE admin_check.is_admin = true
      AND admin_check.email = COALESCE(
        (auth.jwt() -> 'email')::text,
        ''
      )
    )
  );

CREATE POLICY "Admins can delete any waitlist entry"
  ON waitlist
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM waitlist AS admin_check
      WHERE admin_check.is_admin = true
      AND admin_check.email = COALESCE(
        (auth.jwt() -> 'email')::text,
        ''
      )
    )
  );
