'use client';

import { useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';

const faqs = [
  {
    question: 'What is LeetGrind?',
    answer:
      'LeetGrind is a free platform that lets you create groups, add your friends\' LeetCode usernames, and track everyone\'s progress on a live leaderboard. Think of it as a private scoreboard for your coding crew.',
  },
  {
    question: 'How does the leaderboard work?',
    answer:
      'We fetch each member\'s LeetCode stats (total solved, easy/medium/hard breakdown, contest rating) and rank everyone in your group. Stats are synced automatically every day, and you can also trigger a manual refresh anytime.',
  },
  {
    question: 'Is LeetGrind free to use?',
    answer:
      'Yes, LeetGrind is completely free. There are no paid tiers, no credit card required, and no hidden limits. Create as many groups as you want.',
  },
  {
    question: 'Do I need a LeetCode account?',
    answer:
      'You sign in to LeetGrind with Google. To appear on a leaderboard, you (or someone in your group) just need to add a valid LeetCode username. The LeetCode profile must be public so we can read the stats.',
  },
  {
    question: 'How many members can a group have?',
    answer:
      'Each group supports up to 200 members. You can create multiple groups for different friend circles, college batches, or office teams.',
  },
  {
    question: 'Can I share my group\'s leaderboard publicly?',
    answer:
      'Yes! Every group has a public leaderboard link you can share with anyone — they don\'t need an account to view it. Great for embedding in Discord servers or college notice boards.',
  },
  {
    question: 'How often are stats updated?',
    answer:
      'Stats are automatically refreshed once every 24 hours via a daily cron job. You can also hit the refresh button on the leaderboard page to pull the latest data on demand.',
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-24 bg-gradient-to-b from-black via-neutral-950 to-black relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-sm text-yellow-500 mb-6">
            <Sparkles className="h-4 w-4" />
            <span>FAQ</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Frequently Asked{' '}
            <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
            Everything you need to know about LeetGrind
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className={`group border rounded-xl transition-all duration-300 ${
                  isOpen
                    ? 'bg-gradient-to-br from-neutral-900 to-neutral-950 border-yellow-500/40 shadow-lg shadow-yellow-500/5'
                    : 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer"
                >
                  <span className={`font-semibold transition-colors ${isOpen ? 'text-yellow-500' : 'text-white'}`}>
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 flex-shrink-0 text-neutral-500 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-yellow-500' : ''
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="px-6 pb-5 text-neutral-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
