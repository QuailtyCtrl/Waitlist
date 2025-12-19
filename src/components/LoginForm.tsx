import { useState, useRef } from 'react';
import { AlertCircle, LogIn, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateVerificationCode, verifyEmailCode } from '../lib/verification';

interface LoginFormProps {
  onSuccess: (email: string) => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [step, setStep] = useState<'email' | 'verify'>('email');
  const [email, setEmail] = useState('');
  const [codes, setCodes] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: user } = await supabase
        .from('waitlist')
        .select('email_verified, sms_verified')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (!user) {
        setError('No account found with this email');
        setLoading(false);
        return;
      }

      if (!user.email_verified || !user.sms_verified) {
        setError('Your account is not fully verified yet');
        setLoading(false);
        return;
      }

      const verificationCode = generateVerificationCode();
      const expiresIn15Min = new Date(Date.now() + 15 * 60000);

      await supabase
        .from('waitlist')
        .update({
          email_verification_code: verificationCode,
          email_verification_code_expires_at: expiresIn15Min.toISOString(),
        })
        .eq('email', email.toLowerCase());

      const { error: sendError } = await supabase.functions.invoke(
        'send_email_verification',
        {
          body: { email: email.toLowerCase(), code: verificationCode },
        }
      );

      if (sendError) {
        setError('Failed to send verification code');
        setLoading(false);
        return;
      }

      setStep('verify');
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCodes = [...codes];
    newCodes[index] = value.slice(-1);
    setCodes(newCodes);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !codes[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCodes = text.split('').concat(['', '', '', '', '', '']).slice(0, 6) as string[];
    setCodes(newCodes);
    if (text.length === 6) {
      handleVerify(newCodes.join(''));
    }
  };

  const handleVerify = async (fullCode?: string) => {
    const code = fullCode || codes.join('');

    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyEmailCode(email, code);
      if (result.success) {
        onSuccess(email);
      } else {
        setError('Invalid verification code');
        setCodes(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } finally {
      setLoading(false);
    }
  };

  if (step === 'verify') {
    return (
      <div className="space-y-4 animate-slideDown">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Enter verification code
          </label>
          <p className="text-sm text-gray-600 mb-4">
            We sent a 6-digit code to {email}
          </p>

          <div className="flex gap-2 mb-4" onPaste={handlePaste}>
            {codes.map((code, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={code}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-10 h-12 text-center text-lg font-semibold border border-gray-300 rounded focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-colors"
                disabled={loading}
                placeholder="-"
              />
            ))}
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded mb-4 animate-slideDown">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            onClick={() => handleVerify()}
            disabled={loading || codes.join('').length !== 6}
            className="w-full py-2 bg-black text-white text-sm font-medium uppercase tracking-widest hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Verifying...' : 'Login'}
          </button>

          <button
            onClick={() => {
              setStep('email');
              setCodes(['', '', '', '', '', '']);
              setError('');
            }}
            className="w-full mt-2 py-2 text-sm text-gray-600 hover:text-black transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleEmailSubmit} className="space-y-4">
      <div>
        <label htmlFor="login-email" className="block text-sm font-medium text-gray-900 mb-2">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-colors"
            placeholder="your@email.com"
            required
            disabled={loading}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded animate-slideDown">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2 bg-black text-white text-sm font-medium uppercase tracking-widest hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        <LogIn className="w-4 h-4" />
        {loading ? 'Sending Code...' : 'Send Login Code'}
      </button>
    </form>
  );
}
