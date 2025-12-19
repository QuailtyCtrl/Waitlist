import { useEffect, useState } from 'react';
import { CheckCircle, LogOut, Crown, Gift, Sparkles } from 'lucide-react';
import { getUserStats } from '../lib/verification';
import { Leaderboard } from './Leaderboard';
import { LoadingSpinner } from './shared/LoadingSpinner';

interface SuccessPageProps {
  email: string;
  onLogout: () => void;
}

export function SuccessPage({ email, onLogout }: SuccessPageProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const userStats = await getUserStats(email);
        setStats(userStats);
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [email]);

  if (loading || !stats) {
    return <LoadingSpinner />;
  }

  const tierInfo = {
    bronze: {
      title: 'Bronze',
      icon: Sparkles,
      color: 'text-amber-700',
      perks: ['Early access to drops', 'Launch notifications']
    },
    silver: {
      title: 'Silver',
      icon: Sparkles,
      color: 'text-gray-500',
      perks: ['Early access to drops', 'Launch notifications', '5% member discount']
    },
    gold: {
      title: 'Gold',
      icon: Crown,
      color: 'text-yellow-500',
      perks: ['Priority early access', 'Launch notifications', '10% member discount', 'Exclusive collections']
    },
    platinum: {
      title: 'Platinum',
      icon: Crown,
      color: 'text-slate-700',
      perks: ['First access to all drops', 'Launch notifications', '15% member discount', 'Exclusive collections', 'VIP events']
    },
  };

  const currentTier = tierInfo[stats.tier];
  const TierIcon = currentTier.icon;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
            <h2 className="text-3xl font-light">Welcome Back</h2>
          </div>
          <p className="text-gray-600">You're on the Nervont waitlist</p>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-black border border-gray-300 hover:border-black rounded transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
        <div className="text-center">
          <p className="text-gray-600 text-sm mb-2">Your Position</p>
          <p className="text-4xl font-light">#{stats.position}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-600 text-sm mb-2">Member Tier</p>
          <div className="flex items-center justify-center gap-2">
            <TierIcon className={`w-6 h-6 ${currentTier.color}`} />
            <p className="text-2xl font-medium">{currentTier.title}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <TierIcon className={`w-5 h-5 ${currentTier.color}`} />
          {currentTier.title} Member Benefits
        </h3>
        <div className="space-y-2">
          {currentTier.perks.map((perk, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <Gift className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-800">{perk}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <Leaderboard userEmail={email} userPosition={stats.position} />
      </div>

      <div className="p-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-900">What's Next?</p>
            <ul className="text-sm text-gray-700 space-y-1.5">
              <li>• Watch your email for launch announcements</li>
              <li>• Get ready for exclusive early access drops</li>
              <li>• Enjoy your member benefits when we launch</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
