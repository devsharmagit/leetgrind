'use client';

import { ReactNode } from 'react';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LeaderboardEntry, formatRank } from './types';

interface LeaderboardTableProps {
  leaderboard: LeaderboardEntry[];
  lastSnapshotDate?: Date | null;
  emptyMessage?: string;
  /** Render extra column header(s) after the standard columns */
  extraHeaders?: ReactNode;
  /** Render extra cell(s) for each row — receives the entry and its index */
  extraCells?: (entry: LeaderboardEntry, index: number) => ReactNode;
}

export function LeaderboardTable({
  leaderboard,
  lastSnapshotDate,
  emptyMessage = 'No stats available yet.',
  extraHeaders,
  extraCells,
}: LeaderboardTableProps) {
  return (
    <Card className="border-neutral-800 bg-neutral-900">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Rankings
          </CardTitle>
          {lastSnapshotDate && (
            <p className="text-xs text-neutral-500">
              Last updated:{' '}
              {new Date(lastSnapshotDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {leaderboard.length === 0 ? (
          <p className="text-neutral-400 text-center py-4">{emptyMessage}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-neutral-800 hover:bg-transparent">
                <TableHead className="text-neutral-400 w-12">#</TableHead>
                <TableHead className="text-neutral-400">Username</TableHead>
                <TableHead className="text-neutral-400 text-right hidden md:table-cell">
                  LeetCode Rank
                </TableHead>
                <TableHead className="text-neutral-400 text-right">Total</TableHead>
                <TableHead className="text-neutral-400 text-right hidden sm:table-cell">
                  <span className="text-green-500">E</span>
                </TableHead>
                <TableHead className="text-neutral-400 text-right hidden sm:table-cell">
                  <span className="text-yellow-500">M</span>
                </TableHead>
                <TableHead className="text-neutral-400 text-right hidden sm:table-cell">
                  <span className="text-red-500">H</span>
                </TableHead>
                {extraHeaders}
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.map((entry, index) => {
                const rankBgColor =
                  index === 0
                    ? 'bg-yellow-500/10'
                    : index === 1
                      ? 'bg-gray-400/10'
                      : index === 2
                        ? 'bg-orange-600/10'
                        : '';
                return (
                  <TableRow
                    key={entry.username}
                    className={`border-neutral-800 hover:bg-neutral-800/50 ${rankBgColor}`}
                  >
                    <TableCell className="text-white font-medium">
                      {index === 0 && '🥇'}
                      {index === 1 && '🥈'}
                      {index === 2 && '🥉'}
                      {index > 2 && index + 1}
                    </TableCell>
                    <TableCell className="text-white font-mono">
                      <a
                        href={`https://leetcode.com/${entry.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline truncate block max-w-37.5 sm:max-w-none"
                      >
                        {entry.username}
                      </a>
                    </TableCell>
                    <TableCell className="text-neutral-300 text-right hidden md:table-cell">
                      {formatRank(entry.ranking)}
                    </TableCell>
                    <TableCell className="text-white font-semibold text-right">
                      {entry.totalSolved}
                    </TableCell>
                    <TableCell className="text-green-500 text-right hidden sm:table-cell">
                      {entry.easySolved}
                    </TableCell>
                    <TableCell className="text-yellow-500 text-right hidden sm:table-cell">
                      {entry.mediumSolved}
                    </TableCell>
                    <TableCell className="text-red-500 text-right hidden sm:table-cell">
                      {entry.hardSolved}
                    </TableCell>
                    {extraCells?.(entry, index)}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
