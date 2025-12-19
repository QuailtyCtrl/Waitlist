import { useState, useEffect } from 'react';
import { Crown, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getLeaderboard } from '../lib/verification';
import { LoadingSpinner } from './shared/LoadingSpinner';

interface LeaderboardEntry {
  id: string;
  email: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  referral_count: number;
  created_at: string;
  position: number;
}

interface LeaderboardProps {
  userEmail?: string;
  userPosition?: number;
}

const tierColors = {
  bronze: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  silver: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
  gold: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  platinum: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
};

const tierBadges = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '👑',
};

export function Leaderboard({ userEmail, userPosition }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadLeaderboard();

    const subscription = supabase
      .channel('waitlist_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'waitlist',
        },
        () => {
          loadLeaderboard();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadLeaderboard = async () => {
    try {
      const data = await getLeaderboard(50);
      setEntries(data);

      const { count } = await supabase
        .from('waitlist')
        .select('id', { count: 'exact' });
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Waitlist Leaderboard</h3>
          <p className="text-xs text-gray-600 mt-1">{totalCount} members on the waitlist</p>
        </div>
        {userPosition && (
          <div className="text-right">
            <p className="text-xs text-gray-600">Your Position</p>
            <p className="text-2xl font-light text-black">#{userPosition}</p>
          </div>
        )}
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
        {entries.map((entry, index) => {
          const colors = tierColors[entry.tier];
          const badge = tierBadges[entry.tier];
          const isUserEntry = userEmail && entry.email.toLowerCase() === userEmail.toLowerCase();

          return (
            <div
              key={entry.id}
              className={`p-3 rounded border transition-all ${colors.bg} ${colors.border} ${
                isUserEntry ? 'border-2 border-black bg-gray-50' : 'border'
              } animate-slideDown`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="text-lg font-light text-gray-600 w-8 text-right">
                    {index + 1 === 1 ? <Crown className="w-5 h-5 text-yellow-600" /> : `#${index + 1}`}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {entry.email.split('@')[0]}
                    </p>
                    <p className="text-xs text-gray-600">Joined recently</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {entry.referral_count > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-700">
                      <Zap className="w-3 h-3" />
                      <span>{entry.referral_count}</span>
                    </div>
                  )}
                  <span className="text-lg">{badge}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-600 text-center">
          Complete verification to climb the ranks
        </p>
      </div>
    </div>
  );
}
