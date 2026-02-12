'use client';

import { useEffect, useState } from 'react';
import { Trophy, TrendingUp, Crown, Medal, Award } from 'lucide-react';

const MEMBERS = [
  { rank: 1, name: 'Alex Chen',    solved: 847, delta: '+12', rating: 2145, avatar: 'AC' },
  { rank: 2, name: 'Priya Sharma', solved: 792, delta: '+9',  rating: 2038, avatar: 'PS' },
  { rank: 3, name: 'Marcus Kim',   solved: 756, delta: '+7',  rating: 1987, avatar: 'MK' },
  { rank: 4, name: 'Sara Johnson', solved: 701, delta: '+11', rating: 1920, avatar: 'SJ' },
  { rank: 5, name: 'You',          solved: 683, delta: '+15', rating: 1876, avatar: 'YO' },
];

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="h-4 w-4 text-yellow-400" />;
  if (rank === 2) return <Medal className="h-4 w-4 text-gray-300" />;
  if (rank === 3) return <Award className="h-4 w-4 text-amber-600" />;
  return <span className="text-xs text-neutral-500 font-mono w-4 text-center">{rank}</span>;
}

export default function AnimatedLeaderboard() {
  const [activeRow, setActiveRow] = useState(-1);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    // small initial delay before the first cycle
    const delay = cycle === 0 ? 400 : 0;
    let step = -1;

    const timers: ReturnType<typeof setTimeout>[] = [];

    // stagger each row reveal
    for (let i = 0; i < MEMBERS.length; i++) {
      timers.push(
        setTimeout(() => {
          step = i;
          setActiveRow(i);
        }, delay + i * 220)
      );
    }

    // after all rows are shown, hold for 3s then reset & trigger next cycle
    timers.push(
      setTimeout(() => {
        setActiveRow(-1);
        // brief pause before restarting
        timers.push(
          setTimeout(() => setCycle((c) => c + 1), 1500)
        );
      }, delay + MEMBERS.length * 220 + 3000)
    );

    return () => timers.forEach(clearTimeout);
  }, [cycle]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Card */}
      <div className="relative bg-neutral-900/90 backdrop-blur-xl border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl shadow-yellow-500/10">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800/80 bg-neutral-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
              <Trophy className="h-4 w-4 text-black" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Friends Group</p>
              <p className="text-[11px] text-neutral-500">5 members &middot; Updated just now</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
            <TrendingUp className="h-3 w-3" />
            <span>Live</span>
          </div>
        </div>

        {/* Column labels */}
        <div className="grid grid-cols-[2.5rem_1fr_4.5rem_4.5rem] gap-2 px-5 py-2 text-[10px] uppercase tracking-wider text-neutral-600 border-b border-neutral-800/40">
          <span>#</span>
          <span>Member</span>
          <span className="text-right">Solved</span>
          <span className="text-right">Rating</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-neutral-800/40">
          {MEMBERS.map((m, i) => {
            const isVisible = i <= activeRow;
            const isYou = m.name === 'You';
            return (
              <div
                key={m.rank}
                className={`
                  grid grid-cols-[2.5rem_1fr_4.5rem_4.5rem] gap-2 items-center px-5 py-3
                  transition-all duration-500
                  ${isVisible ? 'animate-lb-row' : 'opacity-0'}
                  ${isYou ? 'bg-yellow-500/5' : 'hover:bg-neutral-800/30'}
                `}
                style={{ animationDelay: `${i * 120}ms` }}
              >
                {/* Rank */}
                <div
                  className={`flex items-center justify-center ${isVisible ? 'animate-rank-badge' : ''}`}
                  style={{ animationDelay: `${i * 120 + 200}ms` }}
                >
                  <RankIcon rank={m.rank} />
                </div>

                {/* Name + Avatar */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0
                      ${isYou
                        ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black ring-2 ring-yellow-500/40'
                        : 'bg-neutral-800 text-neutral-300'
                      }`}
                  >
                    {m.avatar}
                  </div>
                  <span className={`text-sm truncate ${isYou ? 'text-yellow-400 font-semibold' : 'text-neutral-200'}`}>
                    {m.name}
                  </span>
                  {isYou && (
                    <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full flex-shrink-0">
                      you
                    </span>
                  )}
                </div>

                {/* Solved */}
                <div className="text-right">
                  <span className="text-sm font-mono text-white">{m.solved}</span>
                  <span className="text-[10px] text-emerald-400 ml-1">{m.delta}</span>
                </div>

                {/* Rating */}
                <div className="text-right text-sm font-mono text-neutral-400">
                  {m.rating}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800/40 bg-neutral-950/30 flex items-center justify-between">
          <p className="text-[11px] text-neutral-500">Daily stats refresh at midnight UTC</p>
          <div className="flex -space-x-1.5">
            {MEMBERS.slice(0, 3).map((m) => (
              <div
                key={m.name}
                className="w-5 h-5 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[8px] text-neutral-400"
              >
                {m.avatar}
              </div>
            ))}
            <div className="w-5 h-5 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[8px] text-neutral-400">
              +2
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
