import { useState } from 'react';
import { SignupForm } from './components/SignupForm';
import { VerificationFlow } from './components/VerificationFlow';
import { SuccessPage } from './components/SuccessPage';
import { Leaderboard } from './components/Leaderboard';

type Step = 'signup' | 'verification' | 'success';

function App() {
  const [step, setStep] = useState<Step>('signup');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');

  const handleSignupSuccess = (email: string, phone: string) => {
    setUserEmail(email);
    setUserPhone(phone);
    setStep('verification');
  };

  const handleVerificationComplete = () => {
    setStep('success');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            <div className="lg:col-span-1 flex flex-col justify-center">
              <div className="mb-8 lg:mb-0">
                <h1 className="text-4xl lg:text-5xl font-light tracking-tight mb-4">
                  ELEVATE
                </h1>
                <p className="text-lg text-gray-600 font-light leading-relaxed mb-6">
                  Premium streetwear. Early access. Exclusive perks.
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
                {step === 'signup' && (
                  <div className="animate-fadeIn">
                    <h2 className="text-2xl font-light mb-6">Join the Waitlist</h2>
                    <SignupForm onSuccess={handleSignupSuccess} />
                  </div>
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
                    <SuccessPage email={userEmail} />
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
        <p>© 2024 ELEVATE. All rights reserved. | Premium Streetwear</p>
      </footer>
    </div>
  );
}

export default App;
