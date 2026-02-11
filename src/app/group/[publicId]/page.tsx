import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ publicId: string }>;
}

export default async function PublicGroupPage({ params }: PageProps) {
  const { publicId } = await params;
  redirect(`/group/${publicId}/leaderboard`);
}
