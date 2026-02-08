import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getGroups } from "@/app/actions/groups"
import DashboardClient from '@/components/dashboard/dashboard-client';
import { Skeleton } from '@/components/ui/skeleton';

async function DashboardContent() {
  const session = await auth();
  
  if (!session?.user?.email) {
    redirect('/login');
  }

  const result = await getGroups();

  if (!result.success) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-red-500">Failed to load groups</p>
      </div>
    );
  }

  return <DashboardClient groups={result.data || []} userId={result.currentUserId ?? null} />;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-64 bg-neutral-800" />
        <Skeleton className="h-10 w-32 bg-neutral-800" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full bg-neutral-800" />
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent />
        </Suspense>
      </div>
    </div>
  );
}