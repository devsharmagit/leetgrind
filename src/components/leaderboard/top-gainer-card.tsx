'use client';

import { Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NoGainerData } from '@/components/no-gainer-data';
import type { GainerEntry } from './types';

interface TopGainerCardProps {
  gainers: GainerEntry[];
}

export function TopGainerCard({ gainers }: TopGainerCardProps) {
  return (
    <Card className="border-neutral-800 bg-neutral-900">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Top Gainer (Last 7 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {gainers.length > 0 ? (
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
              <span className="text-2xl">🔥</span>
            </div>
            <div className="flex-1 min-w-0">
              <a
                href={`https://leetcode.com/${gainers[0].username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xl font-bold text-white hover:underline font-mono"
              >
                {gainers[0].username}
              </a>
              <div className="flex items-center gap-4 mt-1 text-sm">
                <span className="text-green-400 font-semibold">
                  +{gainers[0].problemsGained} problems solved
                </span>
                {gainers[0].rankImproved > 0 && (
                  <span className="text-green-400">
                    ↑ {gainers[0].rankImproved.toLocaleString()} rank
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <NoGainerData />
        )}
      </CardContent>
    </Card>
  );
}
