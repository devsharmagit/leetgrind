import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Code2, Trophy, Users, TrendingUp, Zap, Shield, BarChart3 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <Code2 className="h-9 w-9 text-black" />
                </div>
                <span className="text-5xl font-bold text-white">
                  Leet<span className="text-yellow-500">Grind</span>
                </span>
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
              Track. Compete. <span className="text-yellow-500">Dominate</span> LeetCode.
            </h1>
            
            <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
              Level up your coding journey with real-time tracking, 
              group competitions, and comprehensive analytics.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/signup">
                <Button 
                  size="lg"
                  className="bg-yellow-500 text-black hover:bg-yellow-400 font-semibold px-8 py-6 text-lg"
                >
                  Get Started Free
                </Button>
              </Link>
              <Link href="/login">
                <Button 
                  size="lg"
                  variant="outline" 
                  className="border-neutral-700 bg-transparent text-white hover:bg-neutral-900 px-8 py-6 text-lg"
                >
                  Sign In
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-12 max-w-2xl mx-auto">
              <div>
                <div className="text-3xl font-bold text-yellow-500">200+</div>
                <div className="text-sm text-neutral-500">Members per Group</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-yellow-500">∞</div>
                <div className="text-sm text-neutral-500">History Tracking</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-yellow-500">24/7</div>
                <div className="text-sm text-neutral-500">Auto Updates</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-neutral-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything You Need to <span className="text-yellow-500">Excel</span>
            </h2>
            <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
              Powerful features to help you track progress and stay motivated
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card className="bg-neutral-900 border-neutral-800 hover:border-yellow-500/50 transition-colors">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Live Leaderboards</h3>
                <p className="text-neutral-400">
                  Real-time rankings based on LeetCode stats. See where you stand among your peers.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800 hover:border-yellow-500/50 transition-colors">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-yellow-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Group Competitions</h3>
                <p className="text-neutral-400">
                  Create or join groups. Track up to 200 members and compete together.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800 hover:border-yellow-500/50 transition-colors">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-yellow-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Historical Analytics</h3>
                <p className="text-neutral-400">
                  View daily snapshots, progress charts, and identify top performers over time.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800 hover:border-yellow-500/50 transition-colors">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-yellow-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Progress Tracking</h3>
                <p className="text-neutral-400">
                  Monitor solved problems, rank improvements, and contest ratings automatically.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800 hover:border-yellow-500/50 transition-colors">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-yellow-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Instant Updates</h3>
                <p className="text-neutral-400">
                  Refresh stats on-demand to get the latest data from LeetCode instantly.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800 hover:border-yellow-500/50 transition-colors">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-yellow-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Secure & Private</h3>
                <p className="text-neutral-400">
                  Your data is safe with Google OAuth authentication and secure storage.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Start Your Journey?
            </h2>
            <p className="text-neutral-400 text-lg mb-8">
              Join developers who are leveling up their coding skills every day.
            </p>
            <Link href="/signup">
              <Button 
                size="lg"
                className="bg-yellow-500 text-black hover:bg-yellow-400 font-semibold px-12 py-6 text-lg"
              >
                Create Free Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-900 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Code2 className="h-5 w-5 text-yellow-500" />
              <span className="text-neutral-400 text-sm">
                © 2026 LeetGrind. All rights reserved.
              </span>
            </div>
            <div className="text-neutral-500 text-sm">
              Made with ❤️ for coding enthusiasts
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
