import { supabase, WaitlistEntry } from './supabase';

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  return `+${digits}`;
}

export async function checkDuplicateEmail(email: string): Promise<boolean> {
  const { data } = await supabase
    .from('waitlist')
    .select('id')
    .eq('email', email.toLowerCase())
    .maybeSingle();
  return !!data;
}

export async function checkDuplicatePhone(phone: string): Promise<boolean> {
  const normalizedPhone = normalizePhone(phone);
  const { data } = await supabase
    .from('waitlist')
    .select('id')
    .eq('phone', normalizedPhone)
    .maybeSingle();
  return !!data;
}

export async function createWaitlistEntry(
  email: string,
  phone: string,
  emailCode: string,
  smsCode: string,
  referredByCode?: string
) {
  const referralCode = generateReferralCode();
  const normalizedPhone = normalizePhone(phone);
  const now = new Date();
  const expiresIn15Min = new Date(now.getTime() + 15 * 60000);

  const { data, error } = await supabase
    .from('waitlist')
    .insert({
      email: email.toLowerCase(),
      phone: normalizedPhone,
      email_verification_code: emailCode,
      email_verification_code_expires_at: expiresIn15Min.toISOString(),
      sms_verification_code: smsCode,
      sms_verification_code_expires_at: expiresIn15Min.toISOString(),
      referral_code: referralCode,
      referred_by_code: referredByCode || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as WaitlistEntry;
}

export async function verifyEmailCode(
  email: string,
  code: string
): Promise<{ success: boolean; message: string }> {
  const { data, error } = await supabase
    .from('waitlist')
    .select('email_verification_code, email_verification_code_expires_at')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (error || !data) {
    return { success: false, message: 'Email not found' };
  }

  if (!data.email_verification_code) {
    return { success: false, message: 'No verification code found' };
  }

  const expiresAt = new Date(data.email_verification_code_expires_at);
  if (expiresAt < new Date()) {
    return { success: false, message: 'Verification code has expired' };
  }

  if (data.email_verification_code !== code) {
    return { success: false, message: 'Invalid verification code' };
  }

  const { error: updateError } = await supabase
    .from('waitlist')
    .update({
      email_verified: true,
      email_verification_code: null,
      email_verification_code_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('email', email.toLowerCase());

  if (updateError) {
    return { success: false, message: 'Failed to update verification status' };
  }

  return { success: true, message: 'Email verified successfully' };
}

export async function verifySmsCode(
  phone: string,
  code: string
): Promise<{ success: boolean; message: string }> {
  const normalizedPhone = normalizePhone(phone);
  const { data, error } = await supabase
    .from('waitlist')
    .select('sms_verification_code, sms_verification_code_expires_at')
    .eq('phone', normalizedPhone)
    .maybeSingle();

  if (error || !data) {
    return { success: false, message: 'Phone number not found' };
  }

  if (!data.sms_verification_code) {
    return { success: false, message: 'No verification code found' };
  }

  const expiresAt = new Date(data.sms_verification_code_expires_at);
  if (expiresAt < new Date()) {
    return { success: false, message: 'Verification code has expired' };
  }

  if (data.sms_verification_code !== code) {
    return { success: false, message: 'Invalid verification code' };
  }

  const { error: updateError } = await supabase
    .from('waitlist')
    .update({
      sms_verified: true,
      sms_verification_code: null,
      sms_verification_code_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('phone', normalizedPhone);

  if (updateError) {
    return { success: false, message: 'Failed to update verification status' };
  }

  return { success: true, message: 'SMS verified successfully' };
}

export async function updateTierBasedOnVerification(email: string) {
  const { data } = await supabase
    .from('waitlist')
    .select('email_verified, sms_verified, referral_count')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (!data) return;

  let tier: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';

  if (data.email_verified && data.sms_verified) {
    if (data.referral_count >= 10) {
      tier = 'platinum';
    } else if (data.referral_count >= 5) {
      tier = 'gold';
    } else if (data.referral_count >= 2) {
      tier = 'silver';
    } else {
      tier = 'gold';
    }
  } else if (data.email_verified || data.sms_verified) {
    tier = 'silver';
  }

  await supabase
    .from('waitlist')
    .update({ tier, updated_at: new Date().toISOString() })
    .eq('email', email.toLowerCase());
}

export async function getLeaderboard(limit: number = 50) {
  const { data, error } = await supabase
    .from('waitlist')
    .select(
      'id, email, tier, referral_count, created_at',
      { count: 'exact' }
    )
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;

  return data?.map((entry, index) => ({
    ...entry,
    position: index + 1,
  })) || [];
}

export async function getUserStats(email: string) {
  const { data } = await supabase
    .from('waitlist')
    .select('*')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (!data) return null;

  const { count } = await supabase
    .from('waitlist')
    .select('id', { count: 'exact' })
    .lt('created_at', data.created_at);

  return {
    ...data,
    position: (count || 0) + 1,
  };
}
