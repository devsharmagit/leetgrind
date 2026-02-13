'use client';

import { Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { GainerEntry } from './types';

interface GainersTableProps {
  gainers: GainerEntry[];
  /** Maximum number of entries to display (default: 10) */
  maxEntries?: number;
}

export function GainersTable({ gainers, maxEntries = 10 }: GainersTableProps) {
  if (gainers.length <= 1) return null;

  return (
    <Card className="border-neutral-800 bg-neutral-900">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          All Gainers (Last 7 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-neutral-800 hover:bg-transparent">
              <TableHead className="text-neutral-400">#</TableHead>
              <TableHead className="text-neutral-400">Username</TableHead>
              <TableHead className="text-neutral-400 text-right">Problems Solved</TableHead>
              <TableHead className="text-neutral-400 text-right">Rank Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gainers.slice(0, maxEntries).map((entry, index) => (
              <TableRow
                key={entry.username}
                className="border-neutral-800 hover:bg-neutral-800/50"
              >
                <TableCell className="text-white font-medium">{index + 1}</TableCell>
                <TableCell className="text-white font-mono">{entry.username}</TableCell>
                <TableCell className="text-green-500 text-right font-semibold">
                  +{entry.problemsGained}
                </TableCell>
                <TableCell
                  className={`text-right ${entry.rankImproved > 0 ? 'text-green-500' : 'text-neutral-400'}`}
                >
                  {entry.rankImproved > 0
                    ? `↑ ${entry.rankImproved.toLocaleString()}`
                    : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
