'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Bell,
  Plus,
  MoreHorizontal,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import {
  DEFAULT_LEARNING_DASHBOARD_RESPONSE,
  mapDtoToLearningModules,
  mapDtoToRequests,
  mapDtoToTrainings,
} from '@/config/learning-data';
import {
  LearningModuleItem,
  ModuleStatus,
  ModuleRequestItem,
  TrainingReminderItem,
  LearningDashboardMetricsDto,
  LearningDashboardResponseDto,
} from '@/types/learning';

interface LearningDashboardViewProps {
  userName?: string;
  onOpenCreateWizard: (step?: number, moduleTitle?: string) => void;
  onRaiseRequest?: () => void;
}

export function LearningDashboardView({
  userName = 'Sneha',
  onOpenCreateWizard,
  onRaiseRequest,
}: LearningDashboardViewProps) {
  // Live state from API
  const [metrics, setMetrics] = useState<LearningDashboardMetricsDto>(
    DEFAULT_LEARNING_DASHBOARD_RESPONSE.metrics
  );
  const [modules, setModules] = useState<LearningModuleItem[]>(() =>
    mapDtoToLearningModules(DEFAULT_LEARNING_DASHBOARD_RESPONSE.myLearningModules)
  );
  const [requests, setRequests] = useState<ModuleRequestItem[]>(() =>
    mapDtoToRequests(DEFAULT_LEARNING_DASHBOARD_RESPONSE.requestsForYou)
  );
  const [trainings, setTrainings] = useState<TrainingReminderItem[]>(() =>
    mapDtoToTrainings(DEFAULT_LEARNING_DASHBOARD_RESPONSE.myTrainings)
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('Live');

  // Fetch live learning dashboard data from Next.js proxy route /api/learning/dashboard
  const fetchLiveDashboard = useCallback(async (isManual = false) => {
    if (isManual) {
      setIsRefreshing(true);
    }
    try {
      const res = await fetch('/api/learning/dashboard', {
        method: 'GET',
        headers: {
          accept: '*/*',
        },
        cache: 'no-store',
      });

      if (res.ok) {
        const data: LearningDashboardResponseDto = await res.json();
        if (data?.metrics) {
          setMetrics(data.metrics);
        }
        if (Array.isArray(data?.myLearningModules)) {
          setModules(mapDtoToLearningModules(data.myLearningModules));
        }
        if (Array.isArray(data?.requestsForYou)) {
          setRequests(mapDtoToRequests(data.requestsForYou));
        }
        if (Array.isArray(data?.myTrainings)) {
          setTrainings(mapDtoToTrainings(data.myTrainings));
        }
        setLastSyncedTime(
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        );
      }
    } catch (err) {
      console.warn('Failed to fetch live learning dashboard, using fallback:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      fetchLiveDashboard();
    });
  }, [fetchLiveDashboard]);

  // Status badge styling helper
  const renderStatusBadge = (status: ModuleStatus) => {
    switch (status) {
      case 'Pending objections':
        return (
          <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FDE8E8] text-[#9B1C1C]">
            Pending objections
          </span>
        );
      case 'Review pending':
        return (
          <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#EBF5FF] text-[#1E429F]">
            Review pending
          </span>
        );
      case 'Approval pending':
        return (
          <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FEF3C7] text-[#92400E]">
            Approval pending
          </span>
        );
      case 'Approved · Live':
        return (
          <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#DEF7EC] text-[#03543F]">
            Approved · Live
          </span>
        );
      case 'Draft':
        return (
          <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#F3F4F6] text-[#4B5563]">
            Draft
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#1F2937] text-white">
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-700">
            {status}
          </span>
        );
    }
  };

  const filteredModules = modules.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 min-h-screen bg-[#FBF9F5] text-[#1E2320] flex flex-col font-sans">
      {/* ─────────────────────────────────────────────────────────────
          TOP NAVBAR: Breadcrumb & Search & Sync
      ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-[#FBF9F5]/90 backdrop-blur-md border-b border-[#EAE2D4] px-6 sm:px-10 py-3.5 flex items-center justify-between">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-medium text-[#726A5D]">
          <span>Learning</span>
          <span className="text-[#9A9184]">/</span>
          <span className="text-[#1E2320] font-semibold">Home</span>
        </div>

        {/* Right Search, Live Refresh & Bell */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative w-56 sm:w-80">
            <Search className="w-4 h-4 text-[#9A9184] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search modules or SOP numbers"
              className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-[#EAE2D4] bg-white text-xs text-[#1E2320] placeholder:text-[#9A9184] focus:outline-none focus:ring-1 focus:ring-[#1F6E5B] focus:border-[#1F6E5B] shadow-2xs transition-all"
            />
          </div>

          {/* Live Sync Button */}
          <button
            type="button"
            onClick={() => fetchLiveDashboard(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#EAE2D4] bg-white hover:bg-[#FAF8F5] text-xs font-medium text-[#5C5346] transition-colors cursor-pointer disabled:opacity-60 shadow-2xs"
            title={`Synced at ${lastSyncedTime}. Click to refresh live data.`}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#1F6E5B] ${isRefreshing ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline text-[11px]">
              {isRefreshing ? 'Syncing...' : 'Sync live'}
            </span>
          </button>

          <button
            type="button"
            className="relative p-2 rounded-xl text-[#726A5D] hover:text-[#1E2320] hover:bg-white border border-transparent hover:border-[#EAE2D4] transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E5484D] ring-2 ring-white" />
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          MAIN CONTENT DASHBOARD BODY
      ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-[1240px] w-full mx-auto px-6 sm:px-10 py-8 space-y-7">
        {/* Header Greeting & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-[36px] font-serif font-normal text-[#1E2320] tracking-tight">
              Good morning, {userName}
            </h1>
            <p className="text-xs sm:text-[13px] text-[#726A5D]">
              {metrics.pendingObjections > 0
                ? `${metrics.pendingObjections} module${
                    metrics.pendingObjections > 1 ? 's need' : ' needs'
                  } your attention — a reviewer raised an objection.`
                : 'All modules are on track. No active objections at this time.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onRaiseRequest}
              className="px-4 py-2 text-xs font-semibold text-[#1E2320] bg-white border border-[#EAE2D4] hover:bg-[#FAF8F5] rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              Raise a request
            </button>

            <button
              type="button"
              onClick={() => onOpenCreateWizard(1, 'Batch record review')}
              className="px-4 py-2 text-xs font-bold text-white bg-[#0E3D31] hover:bg-[#165544] rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-[0.99]"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Create learning module</span>
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            ROW OF 5 KPI SUMMARY METRICS CARDS (LIVE METRICS)
        ───────────────────────────────────────────────────────────── */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="bg-white rounded-2xl p-5 border border-[#EAE2D4] shadow-2xs transition-all hover:border-[#1F6E5B]/40">
            <span className="block text-3xl font-bold font-serif text-[#1E2320]">
              {metrics.drafts}
            </span>
            <span className="block text-xs font-medium text-[#726A5D] mt-1">Drafts</span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[#EAE2D4] shadow-2xs transition-all hover:border-[#1F6E5B]/40">
            <span className="block text-3xl font-bold font-serif text-[#1E2320]">
              {metrics.reviewPending}
            </span>
            <span className="block text-xs font-medium text-[#726A5D] mt-1">
              Review pending
            </span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[#EAE2D4] shadow-2xs transition-all hover:border-[#1F6E5B]/40">
            <span className="block text-3xl font-bold font-serif text-[#1E2320]">
              {metrics.pendingObjections}
            </span>
            <span className="block text-xs font-medium text-[#726A5D] mt-1">
              Pending objections
            </span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[#EAE2D4] shadow-2xs transition-all hover:border-[#1F6E5B]/40">
            <span className="block text-3xl font-bold font-serif text-[#1E2320]">
              {metrics.approvalPending}
            </span>
            <span className="block text-xs font-medium text-[#726A5D] mt-1">
              Approval pending
            </span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[#EAE2D4] shadow-2xs transition-all hover:border-[#1F6E5B]/40">
            <span className="block text-3xl font-bold font-serif text-[#1E2320]">
              {metrics.liveModules}
            </span>
            <span className="block text-xs font-medium text-[#726A5D] mt-1">
              Live modules
            </span>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            2-COLUMN SECTION: My learning modules & Requests sidebar
        ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_310px] gap-6 items-start">
          {/* Left: My learning modules Table */}
          <section className="bg-white border border-[#EAE2D4] rounded-2xl p-6 shadow-2xs space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 pb-2 border-b border-[#F2ECE1]">
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-[#1E2320]">My learning modules</h2>
                <span className="text-xs text-[#726A5D] font-medium">
                  ({filteredModules.length})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenCreateWizard(1, 'Operation of tablet compression machine')}
                  className="px-3 py-1.5 text-xs font-semibold text-[#1E2320] bg-white border border-[#EAE2D4] rounded-xl hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                >
                  Revise a module
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs font-semibold text-[#1E2320] bg-white border border-[#EAE2D4] rounded-xl hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                >
                  Remove a module
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#F2ECE1] text-[10px] font-bold uppercase tracking-wider text-[#726A5D]">
                    <th className="py-2.5 pr-4">MODULE</th>
                    <th className="py-2.5 px-3">STATUS</th>
                    <th className="py-2.5 px-3">PROGRESS</th>
                    <th className="py-2.5 px-3">UPDATED</th>
                    <th className="py-2.5 pl-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2ECE1]">
                  {filteredModules.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-[#726A5D]">
                        No learning modules match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredModules.map((item) => (
                      <tr
                        key={item.id}
                        className="group hover:bg-[#FAF8F5] transition-colors"
                      >
                        {/* Module Details */}
                        <td className="py-3.5 pr-4 max-w-[260px]">
                          <p className="font-bold text-[#1E2320] truncate text-xs sm:text-[13px]">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-[#726A5D] mt-0.5 truncate">
                            {item.code} · {item.version} · {item.department}
                          </p>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          {renderStatusBadge(item.status)}
                        </td>

                        {/* Progress */}
                        <td className="py-3.5 px-3 min-w-[140px]">
                          <span className="block text-[11px] font-medium text-[#1E2320] mb-1">
                            {item.progressText}
                          </span>
                          {item.progressPercent > 0 && (
                            <div className="w-28 h-1 bg-[#EAE2D4] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${item.progressColor || 'bg-[#1F6E5B]'}`}
                                style={{ width: `${item.progressPercent}%` }}
                              />
                            </div>
                          )}
                        </td>

                        {/* Updated Date */}
                        <td className="py-3.5 px-3 whitespace-nowrap text-[#726A5D] text-xs">
                          {item.updated}
                        </td>

                        {/* Action Button */}
                        <td className="py-3.5 pl-3 text-right whitespace-nowrap">
                          {item.actionText === 'Resume' ? (
                            <button
                              type="button"
                              onClick={() => onOpenCreateWizard(2, item.name)}
                              className="font-bold text-[#0E3D31] hover:underline cursor-pointer"
                            >
                              Resume
                            </button>
                          ) : item.actionText === 'Open' ? (
                            <button
                              type="button"
                              onClick={() => onOpenCreateWizard(1, item.name)}
                              className="font-semibold text-[#1F6E5B] hover:underline cursor-pointer"
                            >
                              Open
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onOpenCreateWizard(1, item.name)}
                              className="p-1 text-[#9A9184] hover:text-[#1E2320] rounded-lg hover:bg-white transition-colors cursor-pointer"
                              title="Open module"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Right Column: Requests & My Trainings */}
          <div className="space-y-6">
            {/* Card: Requests for you */}
            <div className="bg-white border border-[#EAE2D4] rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#F2ECE1]">
                <h3 className="text-xs font-bold text-[#1E2320]">Requests for you</h3>
                <span className="text-[10px] font-bold text-[#92400E] bg-[#FEF3C7] px-2 py-0.5 rounded-full">
                  {requests.length} new
                </span>
              </div>

              {requests.length === 0 ? (
                <p className="text-xs text-[#726A5D] py-2">No pending requests at this time.</p>
              ) : (
                requests.map((req, idx) => (
                  <div
                    key={req.id}
                    className={`space-y-2 ${idx > 0 ? 'border-t border-[#F2ECE1] pt-3' : ''}`}
                  >
                    <span
                      className={`block text-[10px] font-bold uppercase tracking-wider ${
                        req.type.includes('NEW') ? 'text-[#03543F]' : 'text-[#92400E]'
                      }`}
                    >
                      {req.type}
                    </span>
                    <h4 className="text-xs font-bold text-[#1E2320]">{req.title}</h4>
                    <p className="text-[11px] text-[#726A5D]">
                      From {req.requester} · {req.department} · {req.timeAgo}
                    </p>
                    {req.notes && (
                      <p className="text-[11px] text-[#5C5346] bg-[#FAF8F5] p-2 rounded-lg italic border border-[#EAE2D4]">
                        &ldquo;{req.notes}&rdquo;
                      </p>
                    )}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => onOpenCreateWizard(1, req.title)}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer ${
                          req.type.includes('NEW')
                            ? 'text-white bg-[#0E3D31] hover:bg-[#165544]'
                            : 'text-[#1E2320] bg-white border border-[#EAE2D4] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        {req.actionText}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Card: My trainings */}
            <div className="bg-white border border-[#EAE2D4] rounded-2xl p-5 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-[#1E2320]">My trainings</h3>

              {trainings.length === 0 ? (
                <div className="py-2 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#1F6E5B]">
                    <CheckCircle2 className="w-4 h-4 text-[#1F6E5B]" />
                    <span>All trainings completed</span>
                  </div>
                  <p className="text-[11px] text-[#726A5D]">
                    No overdue trainings assigned to your profile right now.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 text-xs">
                  {trainings.map((tr) => (
                    <div key={tr.id} className="flex items-center justify-between">
                      <span className="text-[#1E2320] font-medium">{tr.title}</span>
                      <span
                        className={`text-[11px] font-bold ${
                          tr.isUrgent ? 'text-[#9B1C1C]' : 'text-[#726A5D]'
                        }`}
                      >
                        {tr.dueText}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-[#F2ECE1]">
                <button
                  type="button"
                  className="text-xs font-semibold text-[#1F6E5B] hover:underline cursor-pointer"
                >
                  View all trainings
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
