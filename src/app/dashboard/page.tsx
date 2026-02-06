'use client';

import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect } from 'react';

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-black">Loading...</p>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const user = session.user;
  const initials = user.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || '??';

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-black">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-black">Dashboard</h2>
          <Button 
            onClick={handleLogout}
            variant="outline" 
            className="border-black text-black hover:bg-gray-100"
          >
            Logout
          </Button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-8 py-12">
        <h1 className="text-4xl font-bold text-black mb-8">Welcome, {user.name}!</h1>
        
        <Card className="border-black bg-white max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl text-black">User Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {user.image ? (
                <img 
                  src={user.image} 
                  alt={user.name || 'User'} 
                  className="w-16 h-16 rounded-full border-2 border-black"
                />
              ) : (
                <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-xl font-bold">
                  {initials}
                </div>
              )}
              <div>
                <p className="text-lg font-semibold text-black">{user.name}</p>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>
            
            <div className="border-t border-black pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-black font-medium">Email:</span>
                <span className="text-black">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black font-medium">Name:</span>
                <span className="text-black">{user.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black font-medium">Status:</span>
                <span className="text-black">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
