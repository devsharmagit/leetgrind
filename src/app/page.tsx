import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Code2, Trophy, Users, TrendingUp, Zap, Shield, BarChart3, ArrowRight, Check, Sparkles, ChevronDown } from 'lucide-react';
import AnimatedLeaderboard from '@/components/animated-leaderboard';
import { FAQSection } from '@/components/faq-section';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-4rem)]">
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left — Copy */}
              <div className="space-y-8">
                {/* Logo */}
                <div className="animate-hero-logo flex items-center gap-3" style={{ animationDelay: '0ms' }}>
                  <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/50">
                    <Code2 className="h-8 w-8 text-black" />
                  </div>
                  <span className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Leet<span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text">Grind</span>
                  </span>
                </div>

                {/* Pill */}
                <div className="animate-hero-fade-in" style={{ animationDelay: '150ms' }}>
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-sm text-yellow-500">
                    <Sparkles className="h-4 w-4" />
                    Compete with your friends on LeetCode
                  </span>
                </div>

                {/* Heading */}
                <h1 className="animate-hero-fade-in text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1]" style={{ animationDelay: '300ms' }}>
                  <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                    Rank your friends.
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent">
                    Grind together.
                  </span>
                </h1>

                {/* Sub */}
                <p className="animate-hero-fade-in text-lg md:text-xl text-neutral-400 max-w-lg leading-relaxed" style={{ animationDelay: '450ms' }}>
                  Create a group, add your friends&apos; LeetCode handles, and instantly see 
                  who&apos;s solving the most problems. Daily leaderboards, live rankings, 
                  zero&nbsp;effort.
                </p>

                {/* CTA */}
                <div className="animate-hero-fade-in flex flex-col sm:flex-row gap-4 pt-2" style={{ animationDelay: '600ms' }}>
                  <Link href="/signup">
                    <Button
                      size="lg"
                      className="group bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:from-yellow-500 hover:to-yellow-700 font-semibold px-10 py-7 text-lg shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 transition-all duration-300 hover:scale-105"
                    >
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button
                      size="lg"
                      variant="outline"
                      className="hover:text-white border-2 border-neutral-700 bg-black/50 backdrop-blur-sm text-white hover:bg-neutral-900 hover:border-yellow-500/50 px-10 py-7 text-lg transition-all duration-300 hover:scale-105"
                    >
                      Sign In
                    </Button>
                  </Link>
                </div>

                {/* Mini stats */}
                <div className="animate-hero-fade-in grid grid-cols-3 gap-6 pt-4 max-w-sm" style={{ animationDelay: '750ms' }}>
                  {[
                    { value: '200+', label: 'Per Group', icon: Users },
                    { value: '∞', label: 'History', icon: BarChart3 },
                    { value: '24/7', label: 'Auto Sync', icon: Zap },
                  ].map((s) => (
                    <div key={s.label} className="group cursor-default">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <s.icon className="h-4 w-4 text-yellow-500 group-hover:scale-110 transition-transform" />
                        <span className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                          {s.value}
                        </span>
                      </div>
                      <span className="text-xs text-neutral-500">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — Animated Leaderboard */}
              <div className="animate-hero-fade-in animate-float lg:pl-8" style={{ animationDelay: '500ms' }}>
                <AnimatedLeaderboard />
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce hidden md:block">
          <div className="w-6 h-10 border-2 border-neutral-700 rounded-full flex justify-center p-2">
            <div className="w-1 h-3 bg-yellow-500 rounded-full" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-black via-neutral-950 to-black relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-sm text-yellow-500 mb-6">
              <Sparkles className="h-4 w-4" />
              <span>Powerful Features</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                Excel
              </span>
            </h2>
            <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
              Built for developers who want to track progress and stay motivated
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {[
              {
                icon: Trophy,
                title: 'Live Leaderboards',
                description: 'Real-time rankings based on LeetCode stats. See where you stand among your peers.',
                gradient: 'from-yellow-500/20 to-orange-500/20'
              },
              {
                icon: Users,
                title: 'Group Competitions',
                description: 'Create or join groups. Track up to 200 members and compete together.',
                gradient: 'from-yellow-500/20 to-amber-500/20'
              },
              {
                icon: BarChart3,
                title: 'Historical Analytics',
                description: 'View daily snapshots, progress charts, and identify top performers over time.',
                gradient: 'from-yellow-500/20 to-yellow-600/20'
              },
              {
                icon: TrendingUp,
                title: 'Progress Tracking',
                description: 'Monitor solved problems, rank improvements, and contest ratings automatically.',
                gradient: 'from-amber-500/20 to-yellow-500/20'
              },
              {
                icon: Zap,
                title: 'Instant Updates',
                description: 'Refresh stats on-demand to get the latest data from LeetCode instantly.',
                gradient: 'from-yellow-600/20 to-yellow-500/20'
              },
              {
                icon: Shield,
                title: 'Secure & Private',
                description: 'Your data is safe with Google OAuth authentication and secure storage.',
                gradient: 'from-yellow-500/20 to-orange-600/20'
              }
            ].map((feature, i) => (
              <Card 
                key={i}
                className="group bg-gradient-to-br from-neutral-900 to-neutral-950 border-neutral-800 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/10 hover:-translate-y-1 cursor-pointer overflow-hidden relative"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <CardContent className="pt-6 relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-7 w-7 text-yellow-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-neutral-400 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 bg-black relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-8 md:p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                      <Check className="h-5 w-5 text-black" />
                    </div>
                  ))}
                </div>
                
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  Join thousands of developers leveling up their skills
                </h3>
                <p className="text-neutral-400 text-lg mb-8">
                  Track your progress, compete with peers, and achieve your coding goals with LeetGrind.
                </p>
                
                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    'Free to start',
                    'No credit card required',
                    'Cancel anytime'
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-neutral-300">
                      <Check className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection />

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-b from-black to-neutral-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-900/20 via-black to-black" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Start Your{' '}
              <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                Journey?
              </span>
            </h2>
            <p className="text-neutral-400 text-xl mb-10 max-w-2xl mx-auto">
              Join developers who are leveling up their coding skills every day.
            </p>
            <Link href="/signup">
              <Button 
                size="lg"
                className="group bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:from-yellow-500 hover:to-yellow-700 font-semibold px-14 py-8 text-xl shadow-2xl shadow-yellow-500/40 hover:shadow-yellow-500/60 transition-all duration-300 hover:scale-105"
              >
                Create Free Account
                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <p className="text-neutral-500 text-sm mt-6">
              No credit card required • Free forever
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}