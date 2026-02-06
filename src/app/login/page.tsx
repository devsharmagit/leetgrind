'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    await signIn('google', { callbackUrl: '/dashboard' });
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-black mb-8 text-center">Login</h1>
        
        <Button 
          onClick={handleGoogleLogin}
          className="w-full bg-black text-white hover:bg-gray-800 py-6"
        >
          Login with Google
        </Button>
        
        <p className="text-center text-black mt-4 text-sm">
          Don't have an account? <a href="/signup" className="font-bold underline hover:text-gray-600">Sign up</a>
        </p>
      </div>
    </div>
  );
}

