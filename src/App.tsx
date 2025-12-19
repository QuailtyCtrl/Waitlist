import { useState, useEffect } from 'react';
import { SignupForm } from './components/SignupForm';
import { LoginForm } from './components/LoginForm';
import { AdminLogin } from './components/AdminLogin';
import { VerificationFlow } from './components/VerificationFlow';
import { SuccessPage } from './components/SuccessPage';
import { Leaderboard } from './components/Leaderboard';

type Step = 'signup' | 'verification' | 'success';
type Mode = 'signup' | 'login' | 'admin';

function App() {
  const [step, setStep] = useState<Step>('signup');
  const [mode, setMode] = useState<Mode>('signup');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');

  useEffect(() => {
    const savedEmail = localStorage.getItem('nervont_user_email');
    if (savedEmail) {
      setUserEmail(savedEmail);
      setStep('success');
    }
  }, []);

  useEffect(() => {
    const titles = ['Offical Waitlist', 'Nervont: Limited Collections'];
    let index = 0;

    const interval = setInterval(() => {
      index = (index + 1) % titles.length;
      document.title = titles[index];
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleSignupSuccess = (email: string, phone: string) => {
    setUserEmail(email);
    setUserPhone(phone);
    setStep('verification');
  };

  const handleVerificationComplete = () => {
    localStorage.setItem('nervont_user_email', userEmail);
    setStep('success');
  };

  const handleLoginSuccess = (email: string) => {
    setUserEmail(email);
    localStorage.setItem('nervont_user_email', email);
    setStep('success');
  };

  const handleLogout = () => {
    localStorage.removeItem('nervont_user_email');
    setUserEmail('');
    setUserPhone('');
    setStep('signup');
    setMode('signup');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-20">
            <div className="lg:col-span-1 flex flex-col">
              <div>
                <h1 className="text-5xl">
                  Nervont
                </h1>
                <p className="text-lg text-gray-600 font-light leading-relaxed mb-6">
                  Luxury Lifestyle. Early Access. Exclusive Perks.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">📦</span>
                    <div>
                      <p className="font-medium text-sm">Early Access</p>
                      <p className="text-xs text-gray-600">Launch drops first</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-xl">🎁</span>
                    <div>
                      <p className="font-medium text-sm">VIP Discounts</p>
                      <p className="text-xs text-gray-600">Up to 20% off</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-xl">👑</span>
                    <div>
                      <p className="font-medium text-sm">Exclusive Status</p>
                      <p className="text-xs text-gray-600">Premium member benefits</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 flex flex-col gap-8">
              <div className="bg-white">
                {step === 'signup' && mode === 'signup' && (
                  <div className="animate-fadeIn">
                    <h2 className="text-2xl font-light mb-6">Join the Waitlist</h2>
                    <SignupForm onSuccess={handleSignupSuccess} />
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => setMode('login')}
                        className="text-sm text-gray-600 hover:text-black transition-colors"
                      >
                        Already verified? <span className="underline">Login here</span>
                      </button>
                    </div>
                  </div>
                )}

                {step === 'signup' && mode === 'login' && (
                  <div className="animate-fadeIn">
                    <h2 className="text-2xl font-light mb-6">Welcome Back</h2>
                    <LoginForm onSuccess={handleLoginSuccess} />
                    <div className="mt-4 text-center space-y-2">
                      <button
                        onClick={() => setMode('signup')}
                        className="text-sm text-gray-600 hover:text-black transition-colors block w-full"
                      >
                        Need to sign up? <span className="underline">Join here</span>
                      </button>
                      <button
                        onClick={() => setMode('admin')}
                        className="text-sm text-gray-600 hover:text-black transition-colors block w-full"
                      >
                        Admin? <span className="underline">Login here</span>
                      </button>
                    </div>
                  </div>
                )}

                {step === 'signup' && mode === 'admin' && (
                  <AdminLogin
                    onSuccess={handleLoginSuccess}
                    onBack={() => setMode('login')}
                  />
                )}

                {step === 'verification' && (
                  <div className="animate-fadeIn">
                    <h2 className="text-2xl font-light mb-6">Verify Your Details</h2>
                    <VerificationFlow
                      email={userEmail}
                      phone={userPhone}
                      onComplete={handleVerificationComplete}
                    />
                  </div>
                )}

                {step === 'success' && (
                  <div className="animate-fadeIn">
                    <SuccessPage email={userEmail} onLogout={handleLogout} />
                  </div>
                )}
              </div>

              {step === 'success' && (
                <div className="bg-gray-50 rounded border border-gray-200 p-6 animate-slideUp">
                  <Leaderboard userEmail={userEmail} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-gray-200 py-6 px-4 text-center text-xs text-gray-600">
        <p>© 2025 NERVONT APPAREL. All rights reserved. | Nervont LC</p>
      </footer>
    </div>
  );
}

export default App;
