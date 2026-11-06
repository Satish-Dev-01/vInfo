import React from 'react';
import Link from 'next/link';
import { FlaskConical } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-[#E8E2D7] bg-[#F5F0E6] dark:border-[#1F4533] dark:bg-[#0C1E16]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1D5943] text-[#52E098]">
              <FlaskConical className="h-4 w-4" />
            </div>
            <span className="text-base font-bold text-[#11281E] dark:text-white">
              Vaayath
            </span>
            <span className="text-xs text-[#6C7E76] dark:text-[#8D9F97]">
              © {new Date().getFullYear()} Auditable GMP Intelligence. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm text-[#4A5D54] dark:text-[#A3B8AD]">
            <Link href="/signup" className="hover:text-[#11281E] dark:hover:text-white font-medium transition-colors">
              Sign Up
            </Link>
            <Link href="#architecture" className="hover:text-[#11281E] dark:hover:text-white transition-colors">
              Architecture
            </Link>
            <Link href="#services" className="hover:text-[#11281E] dark:hover:text-white transition-colors">
              Features
            </Link>
            <Link href="#health" className="hover:text-[#11281E] dark:hover:text-white transition-colors">
              Health Status
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
