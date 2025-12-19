import { useState } from 'react';
import { CodeInput } from './shared/CodeInput';
import { ErrorAlert } from './shared/ErrorAlert';

interface EmailVerificationProps {
  email: string;
  onVerify: (code: string) => Promise<boolean>;
}

export function EmailVerification({ email, onVerify }: EmailVerificationProps) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async (code: string) => {
    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    try {
      const success = await onVerify(code);
      if (!success) {
        setError('Invalid verification code');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 animate-slideDown">
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Enter code from your email
        </label>
        <p className="text-sm text-gray-600 mb-4">
          We sent a 6-digit code to {email}
        </p>

        <div className="mb-4">
          <CodeInput
            onComplete={handleVerify}
            loading={loading}
            error={error}
            onErrorChange={setError}
          />
        </div>

        <ErrorAlert message={error} />

        <button
          onClick={() => handleVerify('')}
          disabled={loading}
          className="w-full py-2 bg-black text-white text-sm font-medium uppercase tracking-widest hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors mt-4"
        >
          {loading ? 'Verifying...' : 'Verify Email'}
        </button>
      </div>
    </div>
  );
}
