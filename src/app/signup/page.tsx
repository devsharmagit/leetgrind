'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Code2, Chrome, Trophy, Users, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
  const handleGoogleSignup = async () => {
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
            <CardTitle className="text-3xl font-bold text-white">Join LeetGrind</CardTitle>
            <CardDescription className="text-neutral-400 text-base">
              Start tracking your coding journey today
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleGoogleSignup}
              className="w-full bg-yellow-500 text-black hover:bg-yellow-400 py-6 text-base font-semibold group"
            >
              <Chrome className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              Sign up with Google
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-neutral-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-neutral-900 px-2 text-neutral-500">What you get</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-neutral-300">
                <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                </div>
                <span>Track your LeetCode progress and stats</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-neutral-300">
                <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                  <Users className="h-4 w-4 text-yellow-500" />
                </div>
                <span>Create groups and compete with friends</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-neutral-300">
                <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-4 w-4 text-yellow-500" />
                </div>
                <span>View historical data and leaderboards</span>
              </div>
            </div>

            <p className="text-center text-neutral-400 text-sm pt-4">
              Already have an account?{' '}
              <Link href="/login" className="text-yellow-500 hover:text-yellow-400 font-semibold">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-neutral-600 text-xs mt-6">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}