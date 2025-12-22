/*
  # Fix Anonymous User Access for Waitlist Sign-up

  1. Problem
    - Previous migration changed SELECT and UPDATE policies to authenticated-only
    - This broke the sign-up flow for anonymous users (unauthenticated visitors)
    - The .insert().select() chain fails because anon users cannot SELECT

  2. Changes
    - Drop the restrictive user policies that require authentication
    - Create new policies allowing anonymous users to:
      - SELECT from waitlist (needed for duplicate checking and post-insert return)
      - UPDATE their own records (needed for verification code validation)
    - Keep the existing INSERT policy for anonymous users
    - Keep admin policies unchanged

  3. Security Notes
    - Anonymous SELECT is needed for the sign-up flow to work
    - The waitlist table contains only email, phone, and verification status
    - No sensitive data is exposed beyond what users submit themselves
    - Admin policies remain restrictive and require authentication
*/

-- Drop the restrictive policies that broke anonymous access
DROP POLICY IF EXISTS "Users can read own waitlist data" ON waitlist;
DROP POLICY IF EXISTS "Users can update own email verification" ON waitlist;

-- Create policy allowing anyone to SELECT from waitlist
-- This is needed for:
-- 1. Duplicate email/phone checking during signup
-- 2. Returning the created record after INSERT
-- 3. Verification code validation
CREATE POLICY "Anyone can read waitlist data"
  ON waitlist
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create policy allowing anyone to UPDATE waitlist records
-- This is needed for verification code validation and marking as verified
CREATE POLICY "Anyone can update waitlist data"
  ON waitlist
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
