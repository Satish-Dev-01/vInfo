'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, Menu, X, ShieldCheck } from 'lucide-react';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E8E2D7] bg-[#FAF7F2]/90 backdrop-blur-xl dark:border-[#1F4533] dark:bg-[#11281E]/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1D5943] text-[#52E098] border border-[#285743]/60 shadow-xs group-hover:scale-105 transition-transform">
              <FlaskConical className="h-5 w-5 stroke-[2.2]" />
            </div>
            <span className="text-lg font-bold tracking-tight text-[#11281E] dark:text-white">
              Vaayath
            </span>
            <Badge variant="default" className="hidden sm:inline-flex text-[10px] py-0 px-1.5 font-bold">
              GMP Audits
            </Badge>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {siteConfig.mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[#4A5D54] hover:text-[#11281E] dark:text-[#A3B8AD] dark:hover:text-white transition-colors"
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-[#1D5943]/20 bg-[#EAF3EE] px-3 py-1 text-xs font-semibold text-[#1D5943] dark:bg-[#1A382B] dark:text-[#52E098]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#1D5943] dark:bg-[#52E098]"></span>
            </span>
            <ShieldCheck className="h-3.5 w-3.5" />
            Schedule M & WHO Auditable
          </div>
          {/* <a href={siteConfig.links.github} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm">
              GitHub
            </Button>
          </a> */}
          <Link href="/signup">
            <Button variant="primary" size="sm">
              Create Account
            </Button>
          </Link>
        </div>

        <div className="flex md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#4A5D54] dark:text-[#A3B8AD] hover:text-[#11281E] dark:hover:text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#E8E2D7] bg-[#FAF7F2] px-4 py-4 dark:border-[#1F4533] dark:bg-[#11281E] space-y-3">
          {siteConfig.mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-[#14281F] hover:text-[#1D5943] dark:text-[#FAF7F2] dark:hover:text-[#52E098]"
            >
              {item.title}
            </Link>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" size="sm" className="w-full">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
