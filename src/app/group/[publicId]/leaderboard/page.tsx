import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import PublicLeaderboardClient from './public-leaderboard-client';

interface PageProps {
  params: Promise<{ publicId: string }>;
}

function PublicLeaderboardSkeleton() {
  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 bg-neutral-800" />
            <Skeleton className="h-8 w-64 bg-neutral-800" />
          </div>
          <Skeleton className="h-32 w-full bg-neutral-800" />
          <Skeleton className="h-96 w-full bg-neutral-800" />
        </div>
      </div>
    </div>
  );
}

export default async function PublicLeaderboardPage({ params }: PageProps) {
  const { publicId } = await params;

  return (
    <Suspense fallback={<PublicLeaderboardSkeleton />}>
      <PublicLeaderboardClient publicId={publicId} />
    </Suspense>
  );
}
