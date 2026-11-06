'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/stores/app.store';
import { getStoredAuthToken, handleUnauthorizedSession } from '@/lib/auth-helpers';
import { LearningSidebar } from '@/components/dashboard/learning-sidebar';
import { LearningDashboardView } from '@/components/dashboard/learning-dashboard-view';
import { CreateModuleWizard } from '@/components/dashboard/create-module-wizard';

export default function LearningDashboardPage() {
  const router = useRouter();
  const addNotification = useAppStore((state) => state.addNotification);

  // User profile state
  const [userName, setUserName] = useState('Sneha');
  const [userFullName, setUserFullName] = useState('Sneha Iyer');
  const [userRole, setUserRole] = useState('Production · L3 · Creator, Reviewer');
  const [userInitials, setUserInitials] = useState('SI');
  const [activeTab, setActiveTab] = useState('home');

  // Module Wizard Modal State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardInitialStep, setWizardInitialStep] = useState(1);
  const [wizardModuleTitle, setWizardModuleTitle] = useState('Batch record review');

  useEffect(() => {
    const loadUserData = () => {
      try {
        if (typeof window !== 'undefined') {
          const token = getStoredAuthToken();
          if (!token) {
            handleUnauthorizedSession({
              router,
              redirectUrl: '/login?redirect=/dashboard/learning',
              message: 'You must be logged in with a valid access token to access the learning suite.',
            });
            return;
          }

          const userStr = localStorage.getItem('user');
          if (userStr) {
            const u = JSON.parse(userStr);
            if (u.fullName || u.name) {
              const full = (u.fullName || u.name).trim();
              setUserFullName(full);
              const firstName = full.split(/\s+/)[0];
              setUserName(firstName);

              const parts = full.split(/\s+/);
              const inits =
                parts.length >= 2
                  ? `${parts[0][0]}${parts[1][0]}`
                  : parts[0].slice(0, 2);
              setUserInitials(inits.toUpperCase());
            }

            if (u.department || u.designation) {
              const dept = u.department || 'Production';
              const desig = u.designation || u.jobTitle || 'L3';
              setUserRole(`${dept} · ${desig} · Creator, Reviewer`);
            }
          }
        }
      } catch {
        // Fallback to default Sneha Iyer
      }
    };

    loadUserData();
  }, [router]);

  const handleOpenCreateWizard = (step: number = 1, moduleTitle?: string) => {
    setWizardInitialStep(step);
    if (moduleTitle) {
      setWizardModuleTitle(moduleTitle);
    }
    setIsWizardOpen(true);
  };

  const handleCloseWizard = () => {
    setIsWizardOpen(false);
  };

  const handleRaiseRequest = () => {
    addNotification({
      type: 'info',
      title: 'Raise a Request',
      message: 'New SOP training request form opened. Fill in standard module details.',
    });
    handleOpenCreateWizard(1, 'New SOP training module');
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex flex-row">
      {/* Learning Left Sidebar */}
      <LearningSidebar
        currentTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'modules') {
            handleOpenCreateWizard(1, 'Batch record review');
          } else if (tab !== 'home') {
            addNotification({
              type: 'info',
              title: `${tab.charAt(0).toUpperCase() + tab.slice(1)} view`,
              message: `Navigating to ${tab} section.`,
            });
          }
        }}
        onCreateModule={() => handleOpenCreateWizard(1, 'Batch record review')}
        userName={userFullName}
        userRole={userRole}
        userInitials={userInitials}
      />

      {/* Main Dashboard Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar with back to main dashboard link */}
        <div className="bg-[#FAF7F2] border-b border-[#EAE4D9] px-6 py-2 flex items-center justify-between text-xs">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-[#0D4036] hover:text-[#165B4C] font-semibold transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Main Dashboard</span>
          </Link>
          <span className="text-[#8A8175] font-medium hidden sm:inline">
            Vaayath Learning Suite · GMP SOP Training &amp; Assessment
          </span>
        </div>

        <LearningDashboardView
          userName={userName}
          onOpenCreateWizard={handleOpenCreateWizard}
          onRaiseRequest={handleRaiseRequest}
        />
      </div>

      {/* 4-Step Module Creation & Review Wizard Modal */}
      <CreateModuleWizard
        isOpen={isWizardOpen}
        initialStep={wizardInitialStep}
        initialTitle={wizardModuleTitle}
        onClose={handleCloseWizard}
        onSuccess={() => {
          addNotification({
            type: 'success',
            title: 'Module Submitted',
            message: 'Your learning module was successfully submitted for review.',
          });
        }}
      />
    </div>
  );
}
