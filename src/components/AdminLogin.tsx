import { useState } from 'react';
import { AlertCircle, Lock, Mail, Shield, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdminLoginProps {
  onSuccess: (email: string) => void;
  onBack: () => void;
}

export function AdminLogin({ onSuccess, onBack }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

      if (authError) {
        console.error('Auth error:', authError);
        if (authError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password');
        } else {
          setError(authError.message || 'Authentication failed');
        }
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError('Login failed - no user returned');
        setLoading(false);
        return;
      }

      const { data: adminUser, error: dbError } = await supabase
        .from('waitlist')
        .select('is_admin')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (dbError) {
        console.error('Database error:', dbError);
        await supabase.auth.signOut();
        setError('Error checking admin status');
        setLoading(false);
        return;
      }

      if (!adminUser?.is_admin) {
        await supabase.auth.signOut();
        setError('This account does not have admin privileges');
        setLoading(false);
        return;
      }

      onSuccess(email.toLowerCase());
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-6 h-6 text-gray-900" />
        <h2 className="text-2xl font-light">Admin Login</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="admin-email" className="block text-sm font-medium text-gray-900 mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-colors"
              placeholder="admin@nervont.com"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label htmlFor="admin-password" className="block text-sm font-medium text-gray-900 mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="admin-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-colors"
              placeholder="••••••••"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              disabled={loading}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
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
          <Shield className="w-4 h-4" />
          {loading ? 'Logging in...' : 'Admin Login'}
        </button>

        <button
          type="button"
          onClick={onBack}
          className="w-full py-2 text-sm text-gray-600 hover:text-black transition-colors"
        >
          Back to regular login
        </button>
      </form>
    </div>
  );
}
