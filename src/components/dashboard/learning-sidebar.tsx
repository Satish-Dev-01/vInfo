'use client';

import React from 'react';
import Link from 'next/link';
import {
  Home,
  GraduationCap,
  FileText,
  Inbox,
  AlertCircle,
  CheckSquare,
  ChevronDown,
  LayoutGrid,
} from 'lucide-react';

interface LearningSidebarProps {
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
  onCreateModule?: () => void;
  userName?: string;
  userRole?: string;
  userInitials?: string;
}

export function LearningSidebar({
  currentTab = 'home',
  onSelectTab,
  onCreateModule,
  userName = 'Sneha Iyer',
  userRole = 'Production · L3 · Creator, Reviewer',
  userInitials = 'SI',
}: LearningSidebarProps) {
  return (
    <aside className="w-64 shrink-0 bg-[#083329] text-white flex flex-col justify-between h-screen sticky top-0 border-r border-[#0D4036] select-none z-30">
      <div className="flex flex-col p-4 space-y-6">
        {/* Brand Header */}
        <Link href="/dashboard" className="flex items-center gap-3 px-2 pt-1 group">
          <div className="w-8 h-8 rounded-lg bg-[#E5B563] text-[#083329] flex items-center justify-center font-serif font-extrabold text-base shadow-sm group-hover:scale-105 transition-transform">
            V
          </div>
          <span className="font-serif font-bold text-xl tracking-tight text-white">
            Vaayath
          </span>
        </Link>

        {/* Workspace Suite Switcher */}
        <div className="px-1">
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#0D4036]/60 hover:bg-[#0D4036] text-white/90 text-xs font-semibold border border-white/5 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-[#8BAFA3]" />
              <span>Learning</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-[#8BAFA3] group-hover:text-white">
              <span>All tools</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8BAFA3]" />
            </div>
          </Link>
        </div>

        {/* Navigation Sections */}
        <div className="space-y-5 px-1">
          {/* OVERVIEW */}
          <div className="space-y-1">
            <span className="block px-3 text-[10px] font-bold uppercase tracking-wider text-[#6E9C8F]">
              OVERVIEW
            </span>

            <button
              type="button"
              onClick={() => onSelectTab?.('home')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'home'
                  ? 'bg-[#E5B563] text-[#1E232A] font-bold shadow-xs'
                  : 'text-[#B3D4C9] hover:bg-[#0D4036] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Home className="w-4 h-4" />
                <span>Home</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab?.('trainings')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'trainings'
                  ? 'bg-[#E5B563] text-[#1E232A] font-bold shadow-xs'
                  : 'text-[#B3D4C9] hover:bg-[#0D4036] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <GraduationCap className="w-4 h-4" />
                <span>My trainings</span>
              </div>
              <span className="w-4 h-4 rounded-full bg-[#134B3E] text-[#B3D4C9] text-[10px] flex items-center justify-center font-bold">
                2
              </span>
            </button>
          </div>

          {/* CREATE */}
          <div className="space-y-1">
            <span className="block px-3 text-[10px] font-bold uppercase tracking-wider text-[#6E9C8F]">
              CREATE
            </span>

            <button
              type="button"
              onClick={() => {
                onSelectTab?.('modules');
                onCreateModule?.();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'modules'
                  ? 'bg-[#E5B563] text-[#1E232A] font-bold shadow-xs'
                  : 'text-[#B3D4C9] hover:bg-[#0D4036] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4" />
                <span>Learning modules</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab?.('requests')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'requests'
                  ? 'bg-[#E5B563] text-[#1E232A] font-bold shadow-xs'
                  : 'text-[#B3D4C9] hover:bg-[#0D4036] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Inbox className="w-4 h-4" />
                <span>Requests</span>
              </div>
              <span className="w-4 h-4 rounded-full bg-[#134B3E] text-[#B3D4C9] text-[10px] flex items-center justify-center font-bold">
                2
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab?.('objections')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'objections'
                  ? 'bg-[#E5B563] text-[#1E232A] font-bold shadow-xs'
                  : 'text-[#B3D4C9] hover:bg-[#0D4036] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4" />
                <span>Objections</span>
              </div>
              <span className="w-4 h-4 rounded-full bg-[#134B3E] text-[#B3D4C9] text-[10px] flex items-center justify-center font-bold">
                1
              </span>
            </button>
          </div>

          {/* REVIEW */}
          <div className="space-y-1">
            <span className="block px-3 text-[10px] font-bold uppercase tracking-wider text-[#6E9C8F]">
              REVIEW
            </span>

            <button
              type="button"
              onClick={() => onSelectTab?.('reviews')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'reviews'
                  ? 'bg-[#E5B563] text-[#1E232A] font-bold shadow-xs'
                  : 'text-[#B3D4C9] hover:bg-[#0D4036] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CheckSquare className="w-4 h-4" />
                <span>Reviews</span>
              </div>
              <span className="w-4 h-4 rounded-full bg-[#134B3E] text-[#B3D4C9] text-[10px] flex items-center justify-center font-bold">
                3
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* User Footer Profile Card */}
      <div className="p-4 border-t border-[#0D4036]">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-[#0B3A2F] border border-white/5">
          <div className="w-9 h-9 rounded-full bg-[#E5B563] text-[#1E232A] font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
            {userInitials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">{userName}</p>
            <p className="text-[10px] text-[#8BAFA3] truncate mt-0.5">{userRole}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
