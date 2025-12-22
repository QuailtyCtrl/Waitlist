import { useState } from 'react';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { getUserByEmail } from '../lib/verification';

interface LoginFormProps {
  onLoginSuccess: (email: string, phone: string, emailVerified: boolean, smsVerified: boolean) => void;
  onBackToSignup: () => void;
}

export function LoginForm({ onLoginSuccess, onBackToSignup }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
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

      const user = await getUserByEmail(email);

      if (!user) {
        setError('Email not found. Please sign up first.');
        setLoading(false);
        return;
      }

      onLoginSuccess(user.email, user.phone || '', user.email_verified, user.sms_verified);
    } catch (err) {
      setError('Failed to log in. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <h2 className="text-2xl font-light mb-6">Welcome Back</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-xs uppercase tracking-widest text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            placeholder="your@email.com"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-colors text-sm"
            disabled={loading}
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md animate-slideDown">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-black text-white text-sm font-medium uppercase tracking-widest hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 group"
        >
          {loading ? 'Logging in...' : 'Log In'}
          {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
        </button>

        <button
          type="button"
          onClick={onBackToSignup}
          className="w-full text-center text-sm text-gray-600 hover:text-black transition-colors"
        >
          Don't have an account? Sign up
        </button>
      </form>
    </div>
  );
}
