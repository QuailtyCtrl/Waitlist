import { useState } from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { createWaitlistEntry, checkDuplicateEmail, checkDuplicatePhone, generateVerificationCode } from '../lib/verification';
import { validateEmail, validatePhone, formatPhone, normalizePhoneForStorage } from '../lib/validation';
import { ErrorAlert } from './shared/ErrorAlert';

interface SignupFormProps {
  onSuccess: (email: string, phone: string) => void;
}

export function SignupForm({ onSuccess }: SignupFormProps) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
    setError('');
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!validateEmail(email)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      if (!validatePhone(phone)) {
        setError('Please enter a valid phone number');
        setLoading(false);
        return;
      }

      const emailExists = await checkDuplicateEmail(email);
      if (emailExists) {
        setError('This email is already on the waitlist');
        setLoading(false);
        return;
      }

      const phoneExists = await checkDuplicatePhone(phone);
      if (phoneExists) {
        setError('This phone number is already on the waitlist');
        setLoading(false);
        return;
      }

      const emailCode = generateVerificationCode();
      const smsCode = generateVerificationCode();

      await createWaitlistEntry(email, phone, emailCode, smsCode);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const phoneWithCountry = normalizePhoneForStorage(phone);

      await Promise.all([
        fetch(`${supabaseUrl}/functions/v1/send_email_verification`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, code: emailCode }),
        }),
        fetch(`${supabaseUrl}/functions/v1/send_sms_verification`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phone: phoneWithCountry, code: smsCode }),
        }),
      ]);

      setSuccess(true);
      onSuccess(email, phone);
    } catch (err) {
      setError('Failed to sign up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="animate-fadeIn">
        <div className="flex justify-center mb-4">
          <CheckCircle className="w-12 h-12 text-emerald-600" />
        </div>
        <h3 className="text-xl font-light text-center mb-2">Welcome to ELEVATE</h3>
        <p className="text-gray-600 text-center text-sm">
          Check your email and text message for verification codes. You're almost there!
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="block text-xs uppercase tracking-widest text-gray-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={handleEmailChange}
          placeholder="your@email.com"
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-colors text-sm"
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="phone" className="block text-xs uppercase tracking-widest text-gray-700">
          Phone
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={handlePhoneChange}
          placeholder="(123) 456-7890"
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-colors text-sm"
          disabled={loading}
        />
      </div>

      <ErrorAlert message={error} />

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-black text-white text-sm font-medium uppercase tracking-widest hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 group"
      >
        {loading ? 'Joining...' : 'Join Waitlist'}
        {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
      </button>

      <p className="text-center text-xs text-gray-500">
        We'll send verification codes to both email and phone
      </p>
    </form>
  );
}
