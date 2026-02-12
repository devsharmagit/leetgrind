import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Code2, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_110%)]" />
      </div>

      <div className="relative z-10 text-center max-w-lg mx-auto">
        {/* 404 Number */}
        <div className="mb-8">
          <h1 className="text-[10rem] sm:text-[12rem] font-black leading-none bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-600/20 bg-clip-text text-transparent select-none">
            404
          </h1>
        </div>

        {/* Message */}
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          Page Not Found
        </h2>
        <p className="text-neutral-400 text-lg mb-10 max-w-md mx-auto">
          Looks like this page doesn&apos;t exist. Maybe it got solved already — like an easy on LeetCode.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/">
            <Button
              size="lg"
              className="group bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:from-yellow-500 hover:to-yellow-700 font-semibold px-8 py-6 text-base shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 transition-all duration-300 hover:scale-105"
            >
              <Home className="mr-2 h-5 w-5" />
              Back to Home
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button
              size="lg"
              variant="outline"
              className="hover:text-white border-2 border-neutral-700 bg-black/50 text-white hover:bg-neutral-900 hover:border-yellow-500/50 px-8 py-6 text-base transition-all duration-300 hover:scale-105"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Go to Dashboard
            </Button>
          </Link>
        </div>

        {/* Little branding */}
        <div className="mt-16 flex items-center justify-center gap-2 text-neutral-600">
          <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
            <Code2 className="h-4 w-4 text-black" />
          </div>
          <span className="text-sm font-semibold">LeetGrind</span>
        </div>
      </div>
    </div>
  );
}
