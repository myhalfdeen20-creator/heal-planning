import React, { useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Calendar,
  ChevronDown,
  Clock,
  SlidersHorizontal,
  Users,
  Briefcase,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import {
  FloorplanTable,
  GuestItem,
  ItineraryItem,
  NavSection,
  PlannerEvent,
  ProposalLineItem,
  TodoTask,
  Vendor,
  EventSubView,
} from '../types/planner';
import {
  calculateGuestAnalytics,
  calculateProposalSummary,
  calculateVendorMetrics,
  formatIDR,
} from '../utils/plannerLogic';

interface HomeDashboardViewProps {
  events: PlannerEvent[];
  vendors: Vendor[];
  guests: GuestItem[];
  itineraryItems: ItineraryItem[];
  floorplanTables: FloorplanTable[];
  proposalItems: ProposalLineItem[];
  todos: TodoTask[];
  messagesCount: number;
  lastSyncTime: string;
  onNavigate: (section: NavSection, subView?: EventSubView) => void;
}

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({
  events,
  vendors,
  guests,
  itineraryItems,
  floorplanTables,
  proposalItems,
  todos,
  messagesCount,
  lastSyncTime,
  onNavigate,
}) => {
  const [activityTimeframe, setActivityTimeframe] = useState<'3d' | '7d' | '30d'>('3d');
  const [upcomingWindow, setUpcomingWindow] = useState<'60d' | '90d'>('60d');
  const [activeQuickModal, setActiveQuickModal] = useState<string | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [includeHoldMetrics, setIncludeHoldMetrics] = useState(true);

  const multiplier = activityTimeframe === '3d' ? 1 : activityTimeframe === '7d' ? 2 : 4;
  const leadsCount = events.filter((e) => e.status === 'Open Lead').length;
  const holdsCount = events.filter((e) => e.status === 'Hold').length;
  const overdueTodos = todos.filter((t) => !t.completed && t.overdue).length;
  const pendingTodos = todos.filter((t) => !t.completed).length;

  const guestStats = calculateGuestAnalytics(guests);
  const vendorStats = calculateVendorMetrics(vendors);
  const proposalStats = calculateProposalSummary(proposalItems, 36138700);

  const keyActivityBars = [
    {
      id: 'leads',
      label: 'Prospek',
      legendText: 'Prospek Baru Tercatat',
      count: Math.max(2, Math.round((leadsCount - 7) * multiplier)),
      color: '#dc2626',
      target: 'leads' as NavSection,
    },
    {
      id: 'fb',
      label: 'Katering',
      legendText: 'Paket Makanan/Minuman Dibuat',
      count: 4 * multiplier,
      color: '#be123c',
      target: 'events' as NavSection,
      subView: 'food-package' as EventSubView,
    },
    {
      id: 'inv',
      label: 'Faktur',
      legendText: 'Pembayaran Faktur Masuk',
      count: 1 * multiplier,
      color: '#f59e0b',
      target: 'invoices' as NavSection,
    },
    {
      id: 'files',
      label: 'Berkas',
      legendText: 'Berkas & Dokumen Diunggah',
      count: 3 * multiplier,
      color: '#ea580c',
      target: 'client-portal' as NavSection,
    },
    {
      id: 'notes',
      label: 'Catatan',
      legendText: 'Catatan Acara Dibuat',
      count: 3 * multiplier,
      color: '#1e3a8a',
      target: 'events' as NavSection,
      subView: 'itinerary' as EventSubView,
    },
    {
      id: 'forms',
      label: 'RSVP',
      legendText: 'Respons Formulir & RSVP Terkumpul',
      count: (12 + Math.max(0, guests.length - 9)) * multiplier,
      color: '#15803d',
      target: 'events' as NavSection,
      subView: 'guests' as EventSubView,
    },
    {
      id: 'itinerary',
      label: 'Rundown',
      legendText: 'Item Rundown Acara Dibuat',
      count: (14 + Math.max(0, itineraryItems.length - 7)) * multiplier,
      color: '#312e81',
      target: 'events' as NavSection,
      subView: 'itinerary' as EventSubView,
    },
    {
      id: 'floorplans',
      label: 'Denah',
      legendText: 'Denah Meja (Floorplan) Dibuat',
      count: (3 + Math.max(0, floorplanTables.length - 17)) * multiplier,
      color: '#84cc16',
      target: 'events' as NavSection,
      subView: 'floorplan' as EventSubView,
    },
    {
      id: 'messages',
      label: 'Pesan',
      legendText: 'Pesan Komunikasi Terkirim',
      count: (6 + Math.max(0, messagesCount - 10)) * multiplier,
      color: '#581c87',
      target: 'communications' as NavSection,
    },
  ];

  const totalKeyActivities = keyActivityBars.reduce((sum, b) => sum + b.count, 0);
  const maxBarValue = Math.max(15, ...keyActivityBars.map((b) => b.count));

  const upcomingTotal =
    (includeHoldMetrics ? holdsCount : 0) + 1 + 1 + 3 + Math.max(8, pendingTodos + 4) + 14;
  const overdueTotal = 1 + Math.max(5, overdueTodos + 4);
  const waitingTotal = 1 + 4 + 3;

  return (
    <div className="p-6 lg:p-8 max-w-[1440px] mx-auto space-y-6">
      {/* Top Organization Header matching image_e2c1c77d.png */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="leading-none select-none">
            <div className="text-2xl font-extrabold tracking-wider text-[#3b9eae]">NUSA</div>
            <div className="text-2xl font-extrabold tracking-wider text-[#3b9eae]">TARA</div>
            <div className="text-[11px] font-medium tracking-[0.28em] text-slate-400 mt-0.5">
              E V E N T
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4 pl-6 border-l border-slate-200 text-xs text-slate-600">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <RefreshCw className="w-3.5 h-3.5 text-[#3b9eae]" />
              Sinkronisasi Kalender &amp; CRM Real-Time Aktif ({lastSyncTime})
            </span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => onNavigate('events', 'vendors')}
              className="text-[#2b90a0] hover:underline font-medium cursor-pointer"
            >
              {vendorStats.vendorCount} Vendor Aktif ({formatIDR(vendorStats.totalContracted)}{' '}
              terkontrak)
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => onNavigate('events', 'guests')}
              className="text-[#2b90a0] hover:underline font-medium cursor-pointer"
            >
              {guestStats.attendingHeadcount} Tamu Hadir ({guestStats.seatedGuestsCount} mendapat
              kursi)
            </button>
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowFilterPanel((prev) => !prev)}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#595959] hover:bg-[#454545] text-white text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter Tampilan</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {showFilterPanel && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 p-4 z-30 space-y-3">
              <div className="text-xs font-semibold text-slate-800">Filter Dasbor Analitik</div>
              <label className="flex items-center justify-between text-xs text-slate-600 cursor-pointer">
                <span>Sertakan Status Hold di Akan Datang</span>
                <input
                  type="checkbox"
                  checked={includeHoldMetrics}
                  onChange={(e) => setIncludeHoldMetrics(e.target.checked)}
                  className="rounded border-slate-300 text-[#3b9eae]"
                />
              </label>
              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowFilterPanel(false)}
                  className="px-3 py-1 bg-[#3b9eae] text-white text-xs rounded-md font-medium cursor-pointer"
                >
                  Terapkan Filter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Key Activities Card matching image_e2c1c77d.png */}
      <section
        aria-label="Analitik Aktivitas Utama"
        className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#48a5b3] text-white flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <h2 className="text-lg font-bold text-slate-800">Aktivitas Utama</h2>
                <span className="text-lg font-normal text-slate-500 tabular-nums">
                  {totalKeyActivities}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <select
                  aria-label="Pilih Rentang Waktu Aktivitas Utama"
                  value={activityTimeframe}
                  onChange={(e) => setActivityTimeframe(e.target.value as '3d' | '7d' | '30d')}
                  className="text-xs text-[#2b90a0] font-medium bg-transparent border-none p-0 focus:ring-0 cursor-pointer hover:underline"
                >
                  <option value="3d">3 hari terakhir</option>
                  <option value="7d">7 hari terakhir</option>
                  <option value="30d">30 hari terakhir</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Bar Chart Area */}
          <div className="lg:col-span-8 min-w-0">
            {(() => {
              const yMax = Math.ceil(maxBarValue / 5) * 5;
              const yTicks = [yMax, Math.round((yMax * 2) / 3), Math.round(yMax / 3), 0];
              return (
                <div className="pt-6 pb-2 px-1 sm:px-3">
                  <div className="flex items-stretch gap-2 sm:gap-3">
                    {/* Y-Axis Labels aligned strictly with horizontal grid lines */}
                    <div className="h-44 flex flex-col justify-between text-[11px] text-slate-400 tabular-nums select-none w-6 text-right shrink-0">
                      {yTicks.map((val) => (
                        <span key={val} className="leading-none -translate-y-1">
                          {val}
                        </span>
                      ))}
                    </div>

                    {/* Plot Box where bottom border IS the exact 0 baseline */}
                    <div className="relative flex-1 h-44 min-w-0">
                      {/* Horizontal Grid Lines (top=15, 33%=10, 66%=5, bottom=0) */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                        {yTicks.map((val) => (
                          <div
                            key={val}
                            className={`w-full h-px ${
                              val === 0 ? 'bg-slate-400' : 'bg-slate-200/80'
                            }`}
                          />
                        ))}
                      </div>

                      {/* 9 Bars sitting directly on the bottom (0) baseline with labels uniformly above each bar */}
                      <div className="relative z-10 h-full w-full grid grid-cols-9 gap-1 sm:gap-2.5 items-end px-1">
                        {keyActivityBars.map((bar) => {
                          const heightPct = Math.min(100, Math.max(8, (bar.count / yMax) * 100));
                          return (
                            <button
                              key={bar.id}
                              type="button"
                              onClick={() => onNavigate(bar.target, bar.subView)}
                              className="h-full w-full min-w-0 flex flex-col items-center justify-end group cursor-pointer focus:outline-none"
                              title={`${bar.legendText}: ${bar.count}`}
                            >
                              <div
                                className="relative w-full rounded-t-xs transition-opacity group-hover:opacity-90"
                                style={{
                                  height: `${heightPct}%`,
                                  backgroundColor: bar.color,
                                }}
                              >
                                <span
                                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-[9.5px] font-bold leading-tight text-center whitespace-nowrap tabular-nums"
                                  style={{ color: bar.color }}
                                >
                                  <span className="hidden sm:inline">{bar.label} </span>
                                  {bar.count}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Right Breakdown List */}
          <div className="lg:col-span-4 flex flex-col justify-between">
            <ul className="space-y-1.5 text-xs text-slate-700">
              {keyActivityBars.map((bar) => (
                <li key={bar.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate(bar.target, bar.subView)}
                    className="flex items-center gap-2.5 hover:text-[#2b90a0] transition-colors w-full text-left py-0.5 cursor-pointer"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: bar.color }}
                    />
                    <span className="font-bold text-slate-800 tabular-nums">{bar.count}</span>
                    <span className="text-slate-600 truncate">{bar.legendText}</span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => onNavigate('reports')}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
              >
                <span>Lihat Detail Laporan</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Donut Cards Row: Akan Datang, Terlambat, Menunggu */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Akan Datang */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#48a5b3] text-white flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-lg font-bold text-slate-800">Akan Datang</h3>
                  <span className="text-lg text-slate-500 tabular-nums">{upcomingTotal}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setUpcomingWindow((w) => (w === '60d' ? '90d' : '60d'))}
                  className="text-xs text-[#2b90a0] hover:underline font-medium flex items-center gap-1 cursor-pointer"
                >
                  <span>{upcomingWindow === '60d' ? '60' : '90'} hari ke depan</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* SVG Donut Chart (Blue tones) */}
            <div className="my-6 flex justify-center">
              <svg viewBox="0 0 160 160" className="w-40 h-40">
                <circle
                  cx="80"
                  cy="80"
                  r="54"
                  fill="none"
                  stroke="#3898ec"
                  strokeWidth="26"
                  strokeDasharray="175 340"
                  strokeDashoffset="0"
                  transform="rotate(-90 80 80)"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="54"
                  fill="none"
                  stroke="#1d4ed8"
                  strokeWidth="26"
                  strokeDasharray="95 340"
                  strokeDashoffset="-176"
                  transform="rotate(-90 80 80)"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="54"
                  fill="none"
                  stroke="#93c5fd"
                  strokeWidth="26"
                  strokeDasharray="45 340"
                  strokeDashoffset="-272"
                  transform="rotate(-90 80 80)"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="54"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="26"
                  strokeDasharray="24 340"
                  strokeDashoffset="-318"
                  transform="rotate(-90 80 80)"
                />
                <text x="40" y="84" className="text-[10px] fill-white font-bold">
                  14
                </text>
                <text x="108" y="106" className="text-[10px] fill-white font-bold">
                  8
                </text>
              </svg>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            {[
              {
                label: 'Hold Segera Berakhir',
                count: holdsCount,
                color: '#0369a1',
                action: () => onNavigate('leads'),
              },
              {
                label: 'Faktur Jatuh Tempo',
                count: 1,
                color: '#1e3a8a',
                action: () => onNavigate('invoices'),
              },
              {
                label: 'Jadwal Pembayaran Cicilan',
                count: 1,
                color: '#0284c7',
                action: () => onNavigate('invoices'),
              },
              {
                label: 'Janji Temu & Survei Venue',
                count: 3,
                color: '#93c5fd',
                action: () => onNavigate('calendars'),
              },
              {
                label: 'Daftar Tugas (To-Do)',
                count: Math.max(8, pendingTodos + 4),
                color: '#1d4ed8',
                action: () => onNavigate('templates'),
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-[#f5f7f9] text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: row.color }}
                  />
                  <span className="font-bold text-slate-800 tabular-nums">{row.count}</span>
                  <span className="text-slate-700">{row.label}</span>
                </div>
                <button
                  type="button"
                  onClick={row.action}
                  className="text-[#2b90a0] hover:underline font-medium flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Lihat Cepat</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Terlambat */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#dc2626] text-white flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-lg font-bold text-slate-800">Terlambat</h3>
                  <span className="text-lg text-slate-500 tabular-nums">{overdueTotal}</span>
                </div>
                <span className="text-xs text-[#2b90a0] font-medium">180 hari terakhir</span>
              </div>
            </div>

            {/* SVG Donut Chart (Coral/Rose tones) */}
            <div className="my-6 flex justify-center">
              <svg viewBox="0 0 160 160" className="w-40 h-40">
                <circle
                  cx="80"
                  cy="80"
                  r="54"
                  fill="none"
                  stroke="#f08080"
                  strokeWidth="26"
                  strokeDasharray="280 340"
                  strokeDashoffset="-55"
                  transform="rotate(-90 80 80)"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="54"
                  fill="none"
                  stroke="#f8a5a5"
                  strokeWidth="26"
                  strokeDasharray="54 340"
                  strokeDashoffset="0"
                  transform="rotate(-90 80 80)"
                />
                <text x="98" y="34" className="text-[10px] fill-white font-bold">
                  1
                </text>
                <text x="62" y="130" className="text-[10px] fill-white font-bold">
                  5
                </text>
              </svg>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-[#f5f7f9] text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f8a5a5] shrink-0" />
                <span className="font-bold text-slate-800 tabular-nums">1</span>
                <span className="text-slate-700">Faktur Belum Lunas</span>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('invoices')}
                className="text-[#2b90a0] hover:underline font-medium flex items-center gap-0.5 cursor-pointer"
              >
                <span>Lihat Cepat</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-[#f5f7f9] text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f08080] shrink-0" />
                <span className="font-bold text-slate-800 tabular-nums">
                  {Math.max(5, overdueTodos + 4)}
                </span>
                <span className="text-slate-700">Tugas Melewati Tenggat</span>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('templates')}
                className="text-[#2b90a0] hover:underline font-medium flex items-center gap-0.5 cursor-pointer"
              >
                <span>Lihat Cepat</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: Menunggu */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#facc15] text-white flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-lg font-bold text-slate-800">Menunggu</h3>
                  <span className="text-lg text-slate-500 tabular-nums">{waitingTotal}</span>
                </div>
                <span className="text-xs text-[#2b90a0] font-medium">180 hari terakhir</span>
              </div>
            </div>

            {/* SVG Donut Chart (Amber/Orange tones) */}
            <div className="my-6 flex justify-center">
              <svg viewBox="0 0 160 160" className="w-40 h-40">
                <circle
                  cx="80"
                  cy="80"
                  r="54"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="26"
                  strokeDasharray="170 340"
                  strokeDashoffset="-42"
                  transform="rotate(-90 80 80)"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="54"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="26"
                  strokeDasharray="127 340"
                  strokeDashoffset="-212"
                  transform="rotate(-90 80 80)"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="54"
                  fill="none"
                  stroke="#eab308"
                  strokeWidth="26"
                  strokeDasharray="41 340"
                  strokeDashoffset="0"
                  transform="rotate(-90 80 80)"
                />
                <text x="95" y="32" className="text-[10px] fill-white font-bold">
                  1
                </text>
                <text x="118" y="114" className="text-[10px] fill-white font-bold">
                  4
                </text>
                <text x="30" y="72" className="text-[10px] fill-white font-bold">
                  3
                </text>
              </svg>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            {[
              {
                label: 'Tanda Tangan Kontrak',
                count: 1,
                color: '#eab308',
                action: () => onNavigate('contracts'),
              },
              {
                label: 'Tanda Tangan Proposal',
                count: 4,
                color: '#f97316',
                action: () => onNavigate('proposals'),
              },
              {
                label: 'Tanda Tangan BEO Katering',
                count: 3,
                color: '#f59e0b',
                action: () => onNavigate('events', 'food-package'),
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-[#f5f7f9] text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: row.color }}
                  />
                  <span className="font-bold text-slate-800 tabular-nums">{row.count}</span>
                  <span className="text-slate-700">{row.label}</span>
                </div>
                <button
                  type="button"
                  onClick={row.action}
                  className="text-[#2b90a0] hover:underline font-medium flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Lihat Cepat</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Integrated Executive Summary Strip: Vendor Management, Guest RSVP & Financial Analytics */}
      <section
        aria-label="Ringkasan Operasional Acara Terpadu"
        className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Operasional Acara Terpadu — Manajemen Vendor, Daftar Tamu RSVP &amp; Keuangan (IDR)
            </h3>
            <p className="text-xs text-slate-500">
              Analitik lintas-modul tersinkronisasi langsung antara Pernikahan Johnson / Murphy,
              Resepsi, Anggaran &amp; Venue Aktif
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('events', 'vendors')}
              className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
            >
              Kelola Vendor ({vendorStats.vendorCount})
            </button>
            <button
              type="button"
              onClick={() => onNavigate('events', 'guests')}
              className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
            >
              Kelola Daftar Tamu ({guestStats.attendingHeadcount})
            </button>
            <button
              type="button"
              onClick={() => onNavigate('events', 'budgets')}
              className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
            >
              Buka Anggaran Acara
            </button>
            <button
              type="button"
              onClick={() => onNavigate('calendars')}
              className="px-3.5 py-1.5 rounded-full bg-[#48a5b3] hover:bg-[#3d919e] text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Buka Kalender Master
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 border-t border-slate-100">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Briefcase className="w-4 h-4 text-[#3b9eae]" />
              <span>Kontrak Vendor &amp; Kepatuhan Asuransi (COI)</span>
            </div>
            <div className="text-2xl font-bold text-slate-800 tabular-nums">
              {formatIDR(vendorStats.totalContracted)}
            </div>
            <div className="text-xs text-slate-500 tabular-nums">
              Dibayar: {formatIDR(vendorStats.totalPaid)} · Sisa:{' '}
              {formatIDR(vendorStats.balanceDue)} · {vendorStats.insuranceVerifiedCount}/
              {vendorStats.vendorCount} COI Terverifikasi
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Users className="w-4 h-4 text-[#3b9eae]" />
              <span>Daftar Tamu Terintegrasi &amp; Diet BEO</span>
            </div>
            <div className="text-2xl font-bold text-slate-800 tabular-nums">
              {guestStats.attendingHeadcount} Hadir{' '}
              <span className="text-sm font-normal text-slate-500">
                ({guestStats.seatedGuestsCount}/131 Kursi Denah)
              </span>
            </div>
            <div className="text-xs text-slate-500 tabular-nums">
              Bebas Gluten: {guestStats.dietaryCounts['Gluten-Free']} · Vegetarian:{' '}
              {guestStats.dietaryCounts['Vegetarian']} · Rendah Garam:{' '}
              {guestStats.dietaryCounts['Reduced Sodium']}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-[#3b9eae]" />
              <span>Nilai Proposal &amp; Pendapatan Aktif</span>
            </div>
            <div className="text-2xl font-bold text-slate-800 tabular-nums">
              {formatIDR(proposalStats.grandTotal)}
            </div>
            <div className="text-xs text-slate-500 tabular-nums">
              Subtotal: {formatIDR(proposalStats.subtotalCost)} · Pajak:{' '}
              {formatIDR(proposalStats.totalTax)} · Biaya Layanan:{' '}
              {formatIDR(proposalStats.serviceCharge)}
            </div>
          </div>
        </div>
      </section>

      {activeQuickModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h4 className="font-bold text-slate-800 text-base mb-2">{activeQuickModal}</h4>
            <button
              type="button"
              onClick={() => setActiveQuickModal(null)}
              className="mt-4 px-4 py-1.5 bg-slate-800 text-white text-xs rounded-full cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
