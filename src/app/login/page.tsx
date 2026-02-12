'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Code2, Sparkles, ArrowRight, Zap, Trophy, BarChart3, Shield } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    await signIn('google', { callbackUrl: '/dashboard' });
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      <div className="w-full max-w-6xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Welcome Back Message */}
          <div className="hidden lg:block space-y-8">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-12">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/50">
                <Code2 className="h-8 w-8 text-black" />
              </div>
              <span className="text-4xl font-bold">
                <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Leet</span>
                <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">Grind</span>
              </span>
            </div>

            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Welcome Back,
                </span>
                <br />
                <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                  Keep Grinding!
                </span>
              </h1>
              <p className="text-neutral-400 text-lg leading-relaxed">
                Continue your journey to becoming a better developer. Your progress is waiting for you.
              </p>
            </div>

            {/* Quick Stats/Features */}
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  icon: Trophy,
                  title: 'Your Stats',
                  description: 'Track progress',
                  color: 'from-yellow-500/20 to-orange-500/20'
                },
                {
                  icon: BarChart3,
                  title: 'Analytics',
                  description: 'View insights',
                  color: 'from-yellow-500/20 to-yellow-600/20'
                },
                {
                  icon: Zap,
                  title: 'Live Updates',
                  description: 'Real-time sync',
                  color: 'from-amber-500/20 to-yellow-500/20'
                },
                {
                  icon: Shield,
                  title: 'Secure',
                  description: 'Protected data',
                  color: 'from-yellow-600/20 to-orange-500/20'
                }
              ].map((item, i) => (
                <div 
                  key={i}
                  className="group bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-xl p-4 hover:border-yellow-500/50 transition-all duration-300 cursor-pointer hover:-translate-y-1"
                >
                  <div className={`w-10 h-10 bg-gradient-to-br ${item.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <item.icon className="h-5 w-5 text-yellow-500" />
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-1">{item.title}</h3>
                  <p className="text-neutral-500 text-xs">{item.description}</p>
                </div>
              ))}
            </div>

            {/* Testimonial/Quote */}
            <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl" />
              <div className="relative z-10">
                <Sparkles className="h-6 w-6 text-yellow-500 mb-3" />
                <p className="text-white text-lg font-medium mb-2">
                  "LeetGrind helped me stay consistent and motivated!"
                </p>
                <p className="text-neutral-400 text-sm">
                  Track your progress and compete with friends to level up faster.
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            {/* Mobile Logo */}
            <div className="flex lg:hidden justify-center mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/50">
                  <Code2 className="h-7 w-7 text-black" />
                </div>
                <span className="text-3xl font-bold">
                  <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Leet</span>
                  <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">Grind</span>
                </span>
              </div>
            </div>

            <Card className="bg-gradient-to-br from-neutral-900 to-neutral-950 border-neutral-800 shadow-2xl backdrop-blur-sm">
              <CardHeader className="text-center space-y-2 pb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-sm text-yellow-500 mx-auto mb-2">
                  <Sparkles className="h-4 w-4" />
                  <span>Secure Login</span>
                </div>
                <CardTitle className="text-3xl font-bold text-white">Welcome Back</CardTitle>
                <CardDescription className="text-neutral-400 text-base">
                  Sign in to continue your coding journey
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <Button
                  onClick={handleGoogleLogin}
                  className="w-full group bg-white text-black hover:bg-gray-100 py-7 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                >
                  <svg className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-neutral-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-gradient-to-r from-neutral-900 to-neutral-950 px-3 text-neutral-500 font-medium">
                      Why LeetGrind?
                    </span>
                  </div>
                </div>

                {/* Feature highlights for login page */}
                <div className="space-y-3">
                  {[
                    { icon: Trophy, text: 'Access your personalized dashboard' },
                    { icon: BarChart3, text: 'View your progress and analytics' },
                    { icon: Zap, text: 'Sync with LeetCode instantly' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-neutral-300 group cursor-pointer">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <item.icon className="h-4 w-4 text-yellow-500" />
                      </div>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>

                {/* Security Badge */}
                <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-white font-semibold mb-1">Secure Authentication</p>
                      <p className="text-neutral-400">
                        Your data is protected with Google's enterprise-grade security.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 text-center">
                  <p className="text-neutral-400 text-sm">
                    Don't have an account?{' '}
                    <Link href="/signup" className="text-yellow-500 hover:text-yellow-400 font-semibold transition-colors">
                      Sign up for free
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>

            <p className="text-center text-neutral-600 text-xs mt-6">
              By continuing, you agree to our{' '}
              <span className="text-neutral-500 hover:text-neutral-400 cursor-pointer">Terms of Service</span>
              {' '}and{' '}
              <span className="text-neutral-500 hover:text-neutral-400 cursor-pointer">Privacy Policy</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}