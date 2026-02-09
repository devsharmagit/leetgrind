'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Code2, Chrome, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    await signIn('google', { callbackUrl: '/dashboard' });
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl" />
      </div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
              <Code2 className="h-7 w-7 text-black" />
            </div>
            <span className="text-3xl font-bold text-white">
              Leet<span className="text-yellow-500">Grind</span>
            </span>
          </div>
        </div>

        <Card className="bg-neutral-900 border-neutral-800 shadow-2xl">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-3xl font-bold text-white">Welcome Back</CardTitle>
            <CardDescription className="text-neutral-400 text-base">
              Sign in to track your LeetCode progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleGoogleLogin}
              className="w-full bg-white text-black hover:bg-neutral-200 py-6 text-base font-semibold group"
            >
              <Chrome className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              Continue with Google
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-neutral-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-neutral-900 px-2 text-neutral-500">Secure Login</span>
              </div>
            </div>

            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4 flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-neutral-300">
                <span className="font-semibold text-white">Pro Tip:</span> Track your coding progress,
                compete with friends, and view historical stats!
              </div>
            </div>

            <p className="text-center text-neutral-400 text-sm pt-4">
              Don't have an account?{' '}
              <Link href="/signup" className="text-yellow-500 hover:text-yellow-400 font-semibold">
                Sign up for free
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-neutral-600 text-xs mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

