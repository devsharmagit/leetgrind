'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Code2, Trophy, LogOut, User, Menu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

export default function Navbar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-neutral-800 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
              <Code2 className="h-5 w-5 text-black" />
            </div>
            <span className="text-xl font-bold text-white hidden sm:block">
              Leet<span className="text-yellow-500">Grind</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-neutral-300 hover:text-yellow-500 transition-colors flex items-center gap-2"
                >
                  <Trophy className="h-4 w-4" />
                  Dashboard
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 text-neutral-300 hover:text-yellow-500 hover:bg-neutral-900"
                    >
                      <User className="h-4 w-4" />
                      {session.user?.name || 'Account'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 bg-neutral-900 border-neutral-800"
                  >
                    <div className="px-2 py-1.5 text-sm font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium text-white">{session.user?.name}</p>
                        <p className="text-xs text-neutral-400">{session.user?.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator className="bg-neutral-800" />
                    <DropdownMenuItem
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="text-neutral-300 hover:text-yellow-500 hover:bg-neutral-900"
                  >
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-yellow-500 text-black hover:bg-yellow-400 font-semibold">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-neutral-300 hover:text-yellow-500 hover:bg-neutral-900"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 bg-neutral-900 border-neutral-800">
                <div className="flex flex-col gap-4 mt-8">
                  {session ? (
                    <>
                      <div className="px-2 py-3 border-b border-neutral-800">
                        <p className="text-sm font-medium text-white">{session.user?.name}</p>
                        <p className="text-xs text-neutral-400 mt-1">{session.user?.email}</p>
                      </div>
                      <Link
                        href="/dashboard"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 px-2 py-2 text-neutral-300 hover:text-yellow-500 transition-colors"
                      >
                        <Trophy className="h-4 w-4" />
                        Dashboard
                      </Link>
                      <Button
                        onClick={() => {
                          setMobileOpen(false);
                          signOut({ callbackUrl: '/' });
                        }}
                        variant="ghost"
                        className="justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" onClick={() => setMobileOpen(false)}>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-neutral-300 hover:text-yellow-500 hover:bg-neutral-800"
                        >
                          Login
                        </Button>
                      </Link>
                      <Link href="/signup" onClick={() => setMobileOpen(false)}>
                        <Button className="w-full bg-yellow-500 text-black hover:bg-yellow-400 font-semibold">
                          Sign Up
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
