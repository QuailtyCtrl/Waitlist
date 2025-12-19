import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface WaitlistEntry {
  id: string;
  email: string;
  phone: string;
  email_verified: boolean;
  sms_verified: boolean;
  email_verification_code: string | null;
  email_verification_code_expires_at: string | null;
  sms_verification_code: string | null;
  sms_verification_code_expires_at: string | null;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  referral_code: string;
  referral_count: number;
  referred_by_code: string | null;
  created_at: string;
  updated_at: string;
}
