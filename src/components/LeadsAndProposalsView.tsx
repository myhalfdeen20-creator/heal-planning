import React, { useMemo, useState } from 'react';
import {
  Archive,
  ArrowUpDown,
  BarChart3,
  Building2,
  CalendarCheck,
  CheckCircle2,
  Copy,
  CreditCard,
  Download,
  Edit3,
  FileSignature,
  Filter,
  FolderOpen,
  Globe,
  Hourglass,
  LayoutGrid,
  List,
  Mail,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import {
  BudgetLineItem,
  EventStatus,
  EventSubView,
  GuestItem,
  NavSection,
  PlannerEvent,
  ProposalLineItem,
  Vendor,
} from '../types/planner';
import {
  calculateBudgetAnalytics,
  calculateGuestAnalytics,
  calculateLineItemTotal,
  calculateProposalSummary,
  calculateVendorMetrics,
  formatIDR,
} from '../utils/plannerLogic';
import { EventCircleAvatar, ProposalItemThumbnail } from './VisualThumbnails';

interface LeadsAndProposalsViewProps {
  mode: 'leads' | 'proposals' | 'invoices' | 'contracts' | 'reports';
  events: PlannerEvent[];
  proposalItems: ProposalLineItem[];
  budgetItems: BudgetLineItem[];
  vendors: Vendor[];
  guests: GuestItem[];
  serviceCharge: number;
  onAddLead: (lead: Omit<PlannerEvent, 'id'>) => void;
  onConvertLeadStatus: (eventId: string, status: EventStatus) => void;
  onLaunchEvent: (eventId: string) => void;
  onAddProposalItem: (item: Omit<ProposalLineItem, 'id'>) => void;
  onUpdateProposalItem: (id: string, updated: Partial<ProposalLineItem>) => void;
  onDeleteProposalItem: (id: string) => void;
  onDuplicateProposalItem: (id: string) => void;
  onUpdateServiceCharge: (fee: number) => void;
  onSignVendorContract: (vendorId: string) => void;
  onRecordVendorPayment: (vendorId: string, amount: number) => void;
  onToggleVendorInsurance: (vendorId: string) => void;
  onSendQuickEmail: (recipient: string, subject: string, body: string) => void;
  onNavigate: (section: NavSection, subView?: EventSubView) => void;
  onNotify: (msg: string) => void;
}

export const LeadsAndProposalsView: React.FC<LeadsAndProposalsViewProps> = ({
  mode,
  events,
  proposalItems,
  budgetItems,
  vendors,
  guests,
  serviceCharge,
  onAddLead,
  onConvertLeadStatus,
  onLaunchEvent,
  onAddProposalItem,
  onUpdateProposalItem,
  onDeleteProposalItem,
  onDuplicateProposalItem,
  onUpdateServiceCharge,
  onSignVendorContract,
  onRecordVendorPayment,
  onToggleVendorInsurance,
  onSendQuickEmail,
  onNavigate,
  onNotify,
}) => {
  // Leads state
  const [leadFilterMode, setLeadFilterMode] = useState<
    'open-holds' | 'open' | 'holds' | 'booked' | 'closed' | 'all'
  >('open-holds');
  const [leadSearch, setLeadSearch] = useState('');
  const [leadViewStyle, setLeadViewStyle] = useState<'table' | 'grid'>('table');
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showWebformModal, setShowWebformModal] = useState(false);
  const [newLeadTitle, setNewLeadTitle] = useState('');
  const [newLeadDate, setNewLeadDate] = useState('2026-10-28');
  const [newLeadStatus, setNewLeadStatus] = useState<EventStatus>('Open Lead');
  const [leadError, setLeadError] = useState('');

  // Proposals & Invoices state
  const [showAddLineModal, setShowAddLineModal] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [openActionRowId, setOpenActionRowId] = useState<string | null>(null);
  const [liTitle, setLiTitle] = useState('');
  const [liSubtitle, setLiSubtitle] = useState('');
  const [liQty, setLiQty] = useState('10');
  const [liUnitCost, setLiUnitCost] = useState('1500000');
  const [liTax, setLiTax] = useState('1650000');
  const [liDisc, setLiDisc] = useState('0');
  const [liError, setLiError] = useState('');

  const [proposalSignedByClient, setProposalSignedByClient] = useState(false);
  const [changeOrderCount, setChangeOrderCount] = useState(1);
  const [invoiceAmountPaid, setInvoiceAmountPaid] = useState<number>(125000000);
  const [autoPayEnabled, setAutoPayEnabled] = useState(true);
  const [masterContractSigned, setMasterContractSigned] = useState(true);

  // Reports tab state
  const [reportTab, setReportTab] = useState<
    'financial' | 'vendors' | 'guests' | 'venues' | 'budgets'
  >('financial');

  const openLeadsCount = events.filter((e) => e.status === 'Open Lead').length;
  const holdsCount = events.filter((e) => e.status === 'Hold').length;
  const bookedCount = events.filter((e) => e.status === 'Booked Event').length;
  const closedCount = events.filter((e) => e.status === 'Closed').length;

  const filteredLeads = useMemo(() => {
    return events.filter((ev) => {
      if (
        leadFilterMode === 'open-holds' &&
        ev.status !== 'Open Lead' &&
        ev.status !== 'Hold'
      ) {
        return false;
      }
      if (leadFilterMode === 'open' && ev.status !== 'Open Lead') return false;
      if (leadFilterMode === 'holds' && ev.status !== 'Hold') return false;
      if (leadFilterMode === 'booked' && ev.status !== 'Booked Event') return false;
      if (leadFilterMode === 'closed' && ev.status !== 'Closed') return false;
      if (
        leadSearch.trim() &&
        !ev.title.toLowerCase().includes(leadSearch.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [events, leadFilterMode, leadSearch]);

  const proposalSummary = useMemo(
    () => calculateProposalSummary(proposalItems, serviceCharge),
    [proposalItems, serviceCharge]
  );

  const vendorStats = useMemo(() => calculateVendorMetrics(vendors), [vendors]);
  const guestStats = useMemo(() => calculateGuestAnalytics(guests), [guests]);
  const budgetStats = useMemo(() => calculateBudgetAnalytics(budgetItems), [budgetItems]);

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadTitle.trim()) {
      setLeadError('Silakan masukkan nama Prospek / Acara.');
      return;
    }
    onAddLead({
      title: newLeadTitle.trim(),
      subtitle: 'Prospek Acara Baru dari CRM',
      date: newLeadDate,
      endDate: newLeadDate,
      startTime: '16:00 WIB',
      endTime: '22:30 WIB',
      daysUntil: 35,
      status: newLeadStatus,
      venueSpaceId: 'ven-ch-quincy',
      venueName: 'Coach House Convention Center - Ballroom Quincy',
      calendarOwnerId: 'cal-alex',
      capturedDate: '14/10/2026 14:15',
      avatarUrl: 'default-lead',
      budgetTotal: 145000000,
      serviceCharge: 17400000,
      foodPackageName: 'Paket Makan Malam Platinum',
      foodPackageNotes: '',
      linkedToBeo: false,
    });
    setNewLeadTitle('');
    setLeadError('');
    setShowAddLeadModal(false);
    onNotify(`Prospek "${newLeadTitle.trim()}" berhasil ditambahkan & disinkronkan ke Kalender Master.`);
  };

  const handleCreateOrUpdateLineItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liTitle.trim()) {
      setLiError('Silakan masukkan judul item layanan.');
      return;
    }
    if (editingItemId) {
      onUpdateProposalItem(editingItemId, {
        title: liTitle.trim(),
        subtitle: liSubtitle.trim() || 'Termasuk fasilitas dan dukungan staf acara penuh:',
        qty: parseFloat(liQty) || 1,
        unitCost: parseFloat(liUnitCost) || 1000000,
        tax: parseFloat(liTax) || 0,
        markupOrDiscount: parseFloat(liDisc) || 0,
      });
      onNotify(`Item "${liTitle.trim()}" berhasil diperbarui.`);
    } else {
      onAddProposalItem({
        eventId: 'ev-johnson-wedding',
        title: liTitle.trim(),
        subtitle: liSubtitle.trim() || 'Termasuk fasilitas dan dukungan staf acara penuh:',
        bullets: [
          'Instalasi penuh dan pembongkaran pasca-acara',
          'Pendampingan teknisi & spesialis acara di lokasi',
        ],
        imageType: 'catering',
        qty: parseFloat(liQty) || 1,
        unitCost: parseFloat(liUnitCost) || 1000000,
        tax: parseFloat(liTax) || 0,
        markupOrDiscount: parseFloat(liDisc) || 0,
      });
      onNotify(`Item "${liTitle.trim()}" ditambahkan ke Proposal & Faktur.`);
    }
    setEditingItemId(null);
    setLiTitle('');
    setLiSubtitle('');
    setLiError('');
    setShowAddLineModal(false);
  };

  const handleExportCsv = (filename: string, rows: string[][]) => {
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    onNotify(`Berhasil mengekspor berkas ${filename}.`);
  };

  // =========================================================================
  // VIEW A: LEADS / PROSPEK (Matches image_86c5eb51.png)
  // =========================================================================
  if (mode === 'leads') {
    return (
      <div className="p-6 lg:p-8 max-w-[1440px] mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-normal text-[#3b9eae]">Prospek (Leads Pipeline)</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola seluruh prospek acara, rujukan formulir web, penjadwalan janji temu, dan
              konversi 1-klik menjadi Acara Terkonfirmasi
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowWebformModal(true)}
            className="px-4 py-2 rounded-full bg-[#48a5b3] hover:bg-[#3d919e] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Formulir Web Prospek &amp; Booking Janji Temu</span>
          </button>
        </div>

        {/* Top Action & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddLeadModal(true)}
              className="px-4 py-1.5 rounded-full bg-[#595959] hover:bg-[#444444] text-white text-xs font-medium cursor-pointer"
            >
              + Tambah Prospek
            </button>
            <button
              type="button"
              onClick={() =>
                handleExportCsv('heal-planning-prospek.csv', [
                  ['Nama Acara', 'Tanggal', 'Jam Mulai', 'Status', 'Venue', 'Estimasi Anggaran'],
                  ...filteredLeads.map((l) => [
                    l.title,
                    l.date,
                    l.startTime,
                    l.status,
                    l.venueName,
                    formatIDR(l.budgetTotal),
                  ]),
                ])
              }
              className="px-4 py-1.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium cursor-pointer"
            >
              Ekspor CSV ▾
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              aria-label="Filter Daftar Prospek"
              value={leadSearch}
              onChange={(e) => setLeadSearch(e.target.value)}
              placeholder="Ketik untuk memfilter tampilan saat ini..."
              className="w-full sm:w-72 px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-l-md focus:outline-none focus:border-[#2b90a0]"
            />
            <button
              type="button"
              onClick={() => {
                setLeadFilterMode('all');
                setLeadSearch('');
              }}
              className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium rounded-r-md whitespace-nowrap cursor-pointer"
            >
              Tampilkan Semua ({events.length})
            </button>
          </div>
        </div>

        {/* 5 Top Summary Cards matching image_86c5eb51.png */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <button
            type="button"
            onClick={() => setLeadFilterMode('all')}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 flex items-center gap-3.5 text-left hover:border-[#2b90a0] cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-[#facc15] text-white flex items-center justify-center shrink-0">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">
                Tertangkap <span className="font-normal text-slate-500 tabular-nums">2</span>
              </div>
              <div className="text-xs text-[#2b90a0] font-medium">60 hari terakhir ▾</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setLeadFilterMode('closed')}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 flex items-center gap-3.5 text-left hover:border-[#2b90a0] cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-[#dc2626] text-white flex items-center justify-center shrink-0">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">
                Ditutup{' '}
                <span className="font-normal text-slate-500 tabular-nums">{closedCount}</span>
              </div>
              <div className="text-xs text-[#2b90a0] font-medium">3 hari terakhir ▾</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setLeadFilterMode('booked')}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 flex items-center gap-3.5 text-left hover:border-[#2b90a0] cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-[#4f46e5] text-white flex items-center justify-center shrink-0">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">
                Terkonfirmasi{' '}
                <span className="font-normal text-slate-500 tabular-nums">{bookedCount}</span>
              </div>
              <div className="text-xs text-[#2b90a0] font-medium">60 hari terakhir ▾</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setLeadFilterMode('open')}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 flex items-center gap-3.5 text-left hover:border-[#2b90a0] cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-[#22c55e] text-white flex items-center justify-center shrink-0">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">
                Terbuka{' '}
                <span className="font-normal text-slate-500 tabular-nums">{openLeadsCount}</span>
              </div>
              <div className="text-xs text-[#2b90a0] font-medium">Lihat</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setLeadFilterMode('holds')}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 flex items-center gap-3.5 text-left hover:border-[#2b90a0] cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-[#f59e0b] text-white flex items-center justify-center shrink-0">
              <Hourglass className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">
                Hold <span className="font-normal text-slate-500 tabular-nums">{holdsCount}</span>
              </div>
              <div className="text-xs text-[#2b90a0] font-medium">Lihat</div>
            </div>
          </button>
        </div>

        {/* Main Leads Layout: Left Quick Views + Right Table */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <aside className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-300">
              <h2 className="text-sm font-bold text-slate-800">Tampilan Cepat</h2>
              <Search className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <ul className="space-y-2 text-xs">
              {[
                { id: 'all', label: `Semua (${events.length})` },
                { id: 'open-holds', label: `Terbuka + Hold (${openLeadsCount + holdsCount})` },
                { id: 'open', label: `Terbuka (${openLeadsCount})` },
                { id: 'holds', label: `Hold Sementara (${holdsCount})` },
                { id: 'booked', label: `Terkonfirmasi (${bookedCount})` },
                { id: 'closed', label: `Ditutup (${closedCount})` },
              ].map((qv) => (
                <li key={qv.id}>
                  <button
                    type="button"
                    onClick={() => setLeadFilterMode(qv.id as typeof leadFilterMode)}
                    className={`flex items-center gap-2 cursor-pointer ${
                      leadFilterMode === qv.id
                        ? 'font-bold text-[#2b90a0]'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Filter className="w-3 h-3" />
                    <span>{qv.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <div className="lg:col-span-10 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 uppercase font-semibold text-[11px]">
                  MEMFILTER BERDASARKAN:
                </span>
                <button
                  type="button"
                  onClick={() => setLeadFilterMode('open-holds')}
                  className="px-3 py-0.5 rounded-full bg-[#0284c7] text-white text-[11px] font-medium cursor-pointer"
                >
                  {leadFilterMode === 'open-holds'
                    ? 'Terbuka + Hold'
                    : leadFilterMode.toUpperCase()}
                </button>
                <span className="px-3 py-0.5 rounded-full bg-[#0284c7] text-white text-[11px] font-medium">
                  Semua Tanggal Acara
                </span>
              </div>

              <div className="inline-flex rounded-md border border-slate-200 bg-slate-100 p-0.5">
                <button
                  type="button"
                  aria-label="Tampilan Grid"
                  onClick={() => setLeadViewStyle('grid')}
                  className={`p-1.5 rounded cursor-pointer ${
                    leadViewStyle === 'grid'
                      ? 'bg-white text-slate-800 shadow-2xs'
                      : 'text-slate-600 hover:bg-white'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Tampilan Tabel"
                  onClick={() => setLeadViewStyle('table')}
                  className={`p-1.5 rounded cursor-pointer ${
                    leadViewStyle === 'table'
                      ? 'bg-white text-slate-800 shadow-2xs'
                      : 'text-slate-600 hover:bg-white'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {leadViewStyle === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between gap-4 shadow-2xs"
                  >
                    <div className="flex items-center gap-3.5">
                      <EventCircleAvatar type={lead.avatarUrl} size="sm" />
                      <div>
                        <div className="text-sm font-bold text-slate-800">{lead.title}</div>
                        <div className="text-xs text-slate-500">
                          {lead.date} · {lead.venueName}
                        </div>
                        <div className="text-xs font-semibold text-[#2b90a0] mt-0.5">
                          Estimasi: {formatIDR(lead.budgetTotal)}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onLaunchEvent(lead.id)}
                      className="px-3 py-1 rounded-full bg-[#48a5b3] text-white text-xs font-medium cursor-pointer"
                    >
                      Buka ›
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-bold text-slate-800">
                        <th className="py-3.5 pl-6 pr-3 w-14" />
                        <th className="py-3.5 px-3">Prospek (Acara) ▴</th>
                        <th className="py-3.5 px-3">Mulai Acara ▴</th>
                        <th className="py-3.5 px-3">Selesai ▴</th>
                        <th className="py-3.5 px-3">Estimasi Nilai ▴</th>
                        <th className="py-3.5 px-3">Status ▴</th>
                        <th className="py-3.5 px-4 text-right">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                      {filteredLeads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-slate-50/80">
                          <td className="py-3 pl-6 pr-3">
                            <EventCircleAvatar type={lead.avatarUrl} size="sm" />
                          </td>
                          <td className="py-3 px-3">
                            <button
                              type="button"
                              onClick={() => onLaunchEvent(lead.id)}
                              className="font-bold text-slate-800 hover:text-[#2b90a0] text-left cursor-pointer"
                            >
                              {lead.title}
                            </button>
                            <div className="text-[11px] text-slate-400">{lead.venueName}</div>
                          </td>
                          <td className="py-3 px-3 tabular-nums">
                            <div className="text-slate-700">{lead.date}</div>
                            <div className="text-[11px] text-slate-400">{lead.startTime}</div>
                          </td>
                          <td className="py-3 px-3 tabular-nums">
                            <div className="text-slate-700">{lead.endDate}</div>
                            <div className="text-[11px] text-slate-400">{lead.endTime}</div>
                          </td>
                          <td className="py-3 px-3 tabular-nums font-semibold text-slate-800">
                            {formatIDR(lead.budgetTotal)}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`font-semibold ${
                                lead.status === 'Hold'
                                  ? 'text-amber-600'
                                  : lead.status === 'Booked Event'
                                  ? 'text-indigo-600'
                                  : 'text-emerald-600'
                              }`}
                            >
                              ●{' '}
                              {lead.status === 'Open Lead'
                                ? 'Terbuka'
                                : lead.status === 'Booked Event'
                                ? 'Terkonfirmasi'
                                : lead.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {lead.status !== 'Booked Event' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onConvertLeadStatus(lead.id, 'Booked Event');
                                    onNotify(
                                      `Prospek "${lead.title}" dikonversi menjadi Acara Terkonfirmasi (Booked)!`
                                    );
                                  }}
                                  className="px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold cursor-pointer whitespace-nowrap"
                                >
                                  Konfirmasi Acara
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => onLaunchEvent(lead.id)}
                                className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer whitespace-nowrap"
                              >
                                Buka Acara ▾
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Webform & Online Appointment Scheduler Modal (Point 2 & 5) */}
        {showWebformModal && (
          <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-800">
                  Formulir Web Prospek (Embed Website) &amp; Penjadwalan Survei Venue
                </h3>
                <button
                  type="button"
                  onClick={() => setShowWebformModal(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Tutup
                </button>
              </div>
              <p className="text-xs text-slate-600">
                Pasang formulir ini di situs web bisnis Anda untuk menangkap prospek otomatis,
                memicu daftar tugas prospek baru, dan menjadwalkan janji temu survei lokasi di
                Kalender Master.
              </p>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-700">
                &lt;iframe src=&quot;https://crm.healplanning.id/webform/nusa-tara-event&quot;
                width=&quot;100%&quot; height=&quot;480&quot;&gt;&lt;/iframe&gt;
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowWebformModal(false);
                    setShowAddLeadModal(true);
                  }}
                  className="px-4 py-1.5 rounded-full bg-[#48a5b3] text-white text-xs font-semibold cursor-pointer"
                >
                  Simulasikan Input Prospek Webform
                </button>
              </div>
            </div>
          </div>
        )}

        {showAddLeadModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-lead-modal-title"
            className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <h3 id="add-lead-modal-title" className="text-base font-bold text-slate-800">
                Catat Prospek Acara Baru (Lead Capture)
              </h3>
              <form onSubmit={handleCreateLead} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Prospek / Acara
                  </label>
                  <input
                    type="text"
                    value={newLeadTitle}
                    onChange={(e) => setNewLeadTitle(e.target.value)}
                    placeholder="Misal: Resepsi Pernikahan Pratama & Wijaya"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Target Tanggal Acara
                    </label>
                    <input
                      type="date"
                      value={newLeadDate}
                      onChange={(e) => setNewLeadDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Status Awal
                    </label>
                    <select
                      value={newLeadStatus}
                      onChange={(e) => setNewLeadStatus(e.target.value as EventStatus)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="Open Lead">Prospek Terbuka (Open Lead)</option>
                      <option value="Hold">Hold Sementara</option>
                    </select>
                  </div>
                </div>
                {leadError && <p className="text-xs text-red-600">{leadError}</p>}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddLeadModal(false)}
                    className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-full bg-[#48a5b3] text-white text-xs font-medium cursor-pointer"
                  >
                    Simpan Prospek &amp; Sinkronkan Kalender
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW B: PROPOSALS & INVOICES IN RUPIAH (Matches image_c7dd0dc7.png)
  // =========================================================================
  if (mode === 'proposals' || mode === 'invoices') {
    const remainingBalance = Math.max(0, proposalSummary.grandTotal - invoiceAmountPaid);
    return (
      <div className="p-6 lg:p-8 max-w-[1440px] mx-auto space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {mode === 'proposals'
                ? 'Proposal Penawaran — Pernikahan & Resepsi Johnson / Murphy'
                : 'Faktur Tagihan #INV-2026-109 — Pernikahan Johnson / Murphy'}
            </h1>
            <p className="text-xs text-slate-500">
              Rincian item layanan koordinasi hari-H, manajemen pra-acara, dan sewa gedung dalam
              Rupiah (Tersinkronisasi dengan Anggaran &amp; BEO)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingItemId(null);
                setLiTitle('');
                setLiSubtitle('');
                setShowAddLineModal(true);
              }}
              className="px-4 py-1.5 rounded-full bg-[#595959] hover:bg-[#444444] text-white text-xs font-medium cursor-pointer"
            >
              + Tambah Item Baris
            </button>
            {mode === 'proposals' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('invoices');
                    onNotify(
                      'Faktur #INV-2026-109 berhasil dibuat dalam 1-klik dari rincian Proposal!'
                    );
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-[#48a5b3] hover:bg-[#3d919e] text-white text-xs font-semibold cursor-pointer"
                >
                  Buat Faktur 1-Klik dari Proposal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProposalSignedByClient(true);
                    onNotify('Proposal telah ditandatangani secara elektronik oleh klien!');
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
                    proposalSignedByClient
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-50 text-amber-800 border border-amber-300'
                  }`}
                >
                  {proposalSignedByClient
                    ? '✓ Proposal Ditandatangani Klien'
                    : 'Tanda Tangani Elektronik'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setChangeOrderCount((c) => c + 1);
                    onNotify(
                      `Dokumen Change Order / Adendum #${changeOrderCount} berhasil dibuat.`
                    );
                  }}
                  className="px-3 py-1.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium cursor-pointer"
                >
                  + Change Order (#{changeOrderCount})
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => {
                onSendQuickEmail(
                  'Laura Finch <laura.finch@gmail.com>',
                  mode === 'proposals'
                    ? 'Dokumen Proposal Resmi — Pernikahan Johnson / Murphy'
                    : 'Faktur Tagihan #INV-2026-109 — Pernikahan Johnson / Murphy',
                  `Halo Laura,\n\nTerlampir rincian ${
                    mode === 'proposals' ? 'Proposal' : 'Faktur'
                  } terbaru senilai ${formatIDR(
                    proposalSummary.grandTotal
                  )}. Anda juga dapat meninjau dan menandatanganinya melalui Portal Klien.\n\nSalam,\nAlex Ramsey`
                );
              }}
              className="px-3.5 py-1.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium flex items-center gap-1 cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Kirim via Email</span>
            </button>
            <button
              type="button"
              onClick={() =>
                handleExportCsv('heal-planning-rincian-proposal-idr.csv', [
                  ['Item Layanan', 'Kuantitas/Jam', 'Harga Satuan', 'Pajak', 'Markup/Diskon', 'Total'],
                  ...proposalItems.map((i) => [
                    i.title,
                    String(i.qty),
                    formatIDR(i.unitCost),
                    formatIDR(i.tax),
                    formatIDR(i.markupOrDiscount),
                    formatIDR(calculateLineItemTotal(i)),
                  ]),
                ])
              }
              className="px-3.5 py-1.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium cursor-pointer"
            >
              Impor/Ekspor CSV
            </button>
          </div>
        </div>

        {/* Invoice Payment Status Bar when in Invoices mode */}
        {mode === 'invoices' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <div className="text-xs text-slate-500">Total Tagihan Faktur</div>
                  <div className="text-xl font-bold text-slate-900 tabular-nums">
                    {formatIDR(proposalSummary.grandTotal)}
                  </div>
                </div>
                <div className="pl-6 border-l border-slate-200">
                  <div className="text-xs text-slate-500">Telah Dibayar Klien</div>
                  <div className="text-xl font-bold text-emerald-700 tabular-nums">
                    {formatIDR(invoiceAmountPaid)}
                  </div>
                </div>
                <div className="pl-6 border-l border-slate-200">
                  <div className="text-xs text-slate-500">Sisa Tagihan (Balance Due)</div>
                  <div className="text-xl font-bold text-amber-700 tabular-nums">
                    {formatIDR(remainingBalance)}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const payment = Math.min(remainingBalance, 25000000);
                    if (payment > 0) {
                      setInvoiceAmountPaid((p) => p + payment);
                      onNotify(
                        `Pembayaran cicilan klien sebesar ${formatIDR(payment)} berhasil dicatat!`
                      );
                    } else {
                      onNotify('Faktur ini sudah lunas sepenuhnya!');
                    }
                  }}
                  className="px-4 py-2 rounded-full bg-[#48a5b3] hover:bg-[#3d919e] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>+ Catat Cicilan (Rp 25.000.000)</span>
                </button>
                {remainingBalance > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setInvoiceAmountPaid(proposalSummary.grandTotal);
                      onNotify('Seluruh sisa tagihan faktur telah dilunasi 100%!');
                    }}
                    className="px-3.5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    Lunasi Semua
                  </button>
                )}
              </div>
            </div>

            {/* Auto-Pay & QuickBooks / Xero Integration Strip (Point 2 & 3) */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
              <label className="flex items-center gap-2 text-slate-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPayEnabled}
                  onChange={(e) => {
                    setAutoPayEnabled(e.target.checked);
                    onNotify(
                      e.target.checked
                        ? 'Jadwal Pembayaran Otomatis (Auto-Pay) & Pengingat Jatuh Tempo diaktifkan.'
                        : 'Pembayaran Otomatis dinonaktifkan.'
                    );
                  }}
                  className="rounded border-slate-300 text-[#2b90a0]"
                />
                <span>
                  Aktifkan Jadwal Pendebitan Cicilan Otomatis (Auto-Payments) &amp; Pengingat Email
                </span>
              </label>
              <button
                type="button"
                onClick={() =>
                  onNotify(
                    'Data faktur & pajak PPN berhasil disinkronkan ke QuickBooks Online & Xero via Zapier!'
                  )
                }
                className="text-[#2b90a0] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sinkronkan Pembukuan ke QuickBooks / Xero / FreshBooks (via Zapier)</span>
              </button>
            </div>
          </div>
        )}

        {/* Proposal Line Items Table Card matching image_c7dd0dc7.png */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-visible">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-800">
                  <th className="py-3 pl-5 pr-2 w-16">
                    <input
                      type="checkbox"
                      aria-label="Pilih Semua Item Baris"
                      className="rounded border-slate-300"
                    />
                  </th>
                  <th className="py-3 px-2 w-12">Tgl</th>
                  <th className="py-3 px-3">Rincian Item Layanan</th>
                  <th className="py-3 px-3 text-right">Kuantitas/Jam</th>
                  <th className="py-3 px-3 text-right">Biaya Satuan</th>
                  <th className="py-3 px-3 text-right">Pajak</th>
                  <th className="py-3 px-3 text-right">Markup/Diskon</th>
                  <th className="py-3 px-3 text-right">Total</th>
                  <th className="py-3 pr-5 pl-2 w-28" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                <tr className="bg-slate-50">
                  <td colSpan={9} className="py-2.5 px-5 font-bold text-sm text-slate-800">
                    Daftar Item Layanan ({proposalItems.length})
                  </td>
                </tr>
                {proposalItems.map((item) => {
                  const rowTotal = calculateLineItemTotal(item);
                  const isMenuOpen = openActionRowId === item.id;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 align-top">
                      <td className="py-6 pl-5 pr-2">
                        <div className="flex items-center gap-2.5 pt-2">
                          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="checkbox"
                            aria-label={`Pilih ${item.title}`}
                            className="rounded border-slate-300"
                          />
                        </div>
                      </td>
                      <td className="py-6 px-2 text-slate-400">
                        <div className="flex items-center gap-3">
                          <span>-</span>
                          <ProposalItemThumbnail type={item.imageType} />
                        </div>
                      </td>
                      <td className="py-5 px-3 max-w-md space-y-1.5">
                        <div className="font-bold text-slate-900">{item.title}</div>
                        <div className="text-slate-700">{item.subtitle}</div>
                        <ul className="list-disc pl-5 space-y-0.5 text-slate-700">
                          {item.bullets.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                        {item.importantNote && (
                          <p className="pt-1 italic text-slate-800">{item.importantNote}</p>
                        )}
                      </td>
                      <td className="py-8 px-3 text-right tabular-nums text-slate-800">
                        {item.qty.toFixed(2)}
                      </td>
                      <td className="py-8 px-3 text-right tabular-nums text-slate-800">
                        {formatIDR(item.unitCost)}
                      </td>
                      <td className="py-8 px-3 text-right tabular-nums text-slate-800">
                        {formatIDR(item.tax)} <span className="text-[#0284c7] font-bold">●</span>
                      </td>
                      <td className="py-8 px-3 text-right tabular-nums text-slate-800">
                        {item.markupOrDiscount === 0 ? (
                          '--'
                        ) : (
                          <>
                            {formatIDR(item.markupOrDiscount)}{' '}
                            <span className="text-[#0284c7] font-bold">●</span>
                          </>
                        )}
                      </td>
                      <td className="py-8 px-3 text-right font-bold tabular-nums text-slate-900">
                        {formatIDR(rowTotal)}
                      </td>
                      <td className="py-7 pr-5 pl-2 text-right relative">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenActionRowId((prev) => (prev === item.id ? null : item.id))
                          }
                          className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Tindakan ▾
                        </button>

                        {isMenuOpen && (
                          <div className="absolute right-5 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 text-left">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingItemId(item.id);
                                setLiTitle(item.title);
                                setLiSubtitle(item.subtitle);
                                setLiQty(String(item.qty));
                                setLiUnitCost(String(item.unitCost));
                                setLiTax(String(item.tax));
                                setLiDisc(String(item.markupOrDiscount));
                                setOpenActionRowId(null);
                                setShowAddLineModal(true);
                              }}
                              className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit Rincian Item</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onDuplicateProposalItem(item.id);
                                setOpenActionRowId(null);
                                onNotify(`Item "${item.title}" berhasil digandakan.`);
                              }}
                              className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Gandakan Item</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteProposalItem(item.id);
                                setOpenActionRowId(null);
                                onNotify(`Item "${item.title}" dihapus dari Proposal.`);
                              }}
                              className="w-full px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus Item</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom-Right PROPOSAL TOTAL Box in Rupiah matching image_c7dd0dc7.png */}
        <div className="flex justify-end pb-12">
          <div className="w-full sm:w-96 bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-200 flex flex-col items-end gap-2">
              <div className="font-bold text-slate-800 uppercase tracking-wide text-[11px]">
                TOTAL PROPOSAL (IDR)
              </div>
              <button
                type="button"
                onClick={() => {
                  onUpdateServiceCharge(serviceCharge + 2500000);
                  onNotify('Biaya layanan tambahan Rp 2.500.000 ditambahkan ke Total Proposal.');
                }}
                className="px-3.5 py-1.5 rounded-full bg-[#595959] hover:bg-[#444444] text-white text-[11px] font-medium cursor-pointer"
              >
                + Tambah Biaya Layanan ▾
              </button>
            </div>

            <div className="divide-y divide-slate-200">
              <div className="px-4 py-2.5 flex justify-between items-center">
                <span className="font-bold text-slate-800">Biaya Pokok (Subtotal)</span>
                <span className="tabular-nums text-slate-800">
                  {formatIDR(proposalSummary.subtotalCost)}
                </span>
              </div>
              <div className="px-4 py-2.5 flex justify-between items-center">
                <span className="font-bold text-slate-800">Pajak (PPN)</span>
                <span className="tabular-nums text-slate-800">
                  {formatIDR(proposalSummary.totalTax)}
                </span>
              </div>
              <div className="px-4 py-2.5 flex justify-between items-center">
                <span className="font-bold text-slate-800">Markup / Diskon</span>
                <span className="tabular-nums text-slate-800">
                  {formatIDR(proposalSummary.totalMarkupOrDiscount)}
                </span>
              </div>
              <div className="px-4 py-2.5 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-800">Biaya Layanan (Service Charge)</div>
                  <button
                    type="button"
                    onClick={() => onUpdateServiceCharge(36138700)}
                    className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] cursor-pointer"
                  >
                    Reset Biaya
                  </button>
                </div>
                <span className="tabular-nums text-slate-800">
                  {formatIDR(proposalSummary.serviceCharge)}
                </span>
              </div>
              <div className="px-4 py-3 bg-[#e0f2fe] flex justify-between items-center font-bold text-slate-900 text-sm">
                <span>Total Akhir</span>
                <span data-testid="proposal-grand-total" className="tabular-nums">
                  {formatIDR(proposalSummary.grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {showAddLineModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-line-item-title"
            className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <h3 id="add-line-item-title" className="text-base font-bold text-slate-800">
                {editingItemId
                  ? 'Edit Item Baris Proposal / Faktur'
                  : 'Tambah Item Baris Proposal / Faktur (IDR)'}
              </h3>
              <form onSubmit={handleCreateOrUpdateLineItem} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Layanan / Paket
                  </label>
                  <input
                    type="text"
                    value={liTitle}
                    onChange={(e) => setLiTitle(e.target.value)}
                    placeholder="Misal: Paket Tata Cahaya Panggung & LED"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kuantitas / Jam
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={liQty}
                      onChange={(e) => setLiQty(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Biaya Satuan (Rp)
                    </label>
                    <input
                      type="number"
                      value={liUnitCost}
                      onChange={(e) => setLiUnitCost(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Pajak PPN (Rp)
                    </label>
                    <input
                      type="number"
                      value={liTax}
                      onChange={(e) => setLiTax(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Markup (+) / Diskon (-) (Rp)
                    </label>
                    <input
                      type="number"
                      value={liDisc}
                      onChange={(e) => setLiDisc(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
                {liError && <p className="text-xs text-red-600">{liError}</p>}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddLineModal(false)}
                    className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-full bg-[#48a5b3] text-white text-xs font-medium cursor-pointer"
                  >
                    Simpan ke Proposal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW C: CONTRACTS / KONTRAK ELEKTRONIK
  // =========================================================================
  if (mode === 'contracts') {
    return (
      <div className="p-6 lg:p-8 max-w-[1440px] mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-normal text-[#3b9eae]">
              Kontrak &amp; Tanda Tangan Elektronik
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Kelola templat syarat &amp; ketentuan standar, tanda tangan elektronik klien,
              kontrak vendor, dan riwayat audit dokumen
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onSendQuickEmail(
                  'Laura Finch <laura.finch@gmail.com>',
                  'Kontrak Perjanjian Layanan Acara — Pernikahan Johnson / Murphy',
                  'Halo Laura,\n\nSilakan meninjau dan menandatangani Kontrak Perjanjian Acara melalui Portal Klien.\n\nSalam,\nAlex Ramsey'
                );
              }}
              className="px-4 py-2 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Kirim Kontrak via Email</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('events', 'vendors')}
              className="px-4 py-2 rounded-full bg-[#48a5b3] text-white text-xs font-semibold cursor-pointer"
            >
              Kelola Jadwal Kedatangan Vendor
            </button>
          </div>
        </div>

        {/* Client Master Contract Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-[#2b90a0] uppercase">
                KONTRAK UTAMA KLIEN &amp; SEWA VENUE
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">
                Perjanjian Manajemen Acara &amp; Sewa Ballroom Quincy — Pernikahan Johnson / Murphy
              </h2>
              <p className="text-xs text-slate-500">
                Klien: Laura Finch &amp; Bill Murphy · Nilai Kontrak:{' '}
                <strong>{formatIDR(proposalSummary.grandTotal)}</strong> · Riwayat Dokumen: Dikirim
                10/06/2026, Dilihat 3x
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setMasterContractSigned((s) => !s);
                onNotify('Status tanda tangan elektronik Kontrak Utama Klien diperbarui!');
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold cursor-pointer ${
                masterContractSigned
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {masterContractSigned
                ? '✓ Ditandatangani Elektronik (Laura Finch & Alex Ramsey)'
                : 'Tanda Tangani Sekarang'}
            </button>
          </div>
        </div>

        {/* Vendor Contracts Table */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-800">
            Daftar Kontrak Vendor, Pembayaran Termin &amp; Asuransi (COI)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                  <th className="py-3 px-3">Perusahaan Vendor</th>
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-3">Status e-Signature</th>
                  <th className="py-3 px-3 text-center">Asuransi COI</th>
                  <th className="py-3 px-3 text-right">Nilai Kontrak</th>
                  <th className="py-3 px-3 text-right">Dibayar</th>
                  <th className="py-3 px-3 text-right">Sisa Tagihan</th>
                  <th className="py-3 px-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {vendors.map((v) => {
                  const balance = Math.max(0, v.contractAmount - v.paidAmount);
                  return (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-3 font-bold text-slate-800">
                        <div>{v.company}</div>
                        <div className="text-[11px] font-normal text-slate-500">{v.name}</div>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600">{v.category}</td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            v.contractStatus === 'Signed'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          <FileSignature className="w-3 h-3" />
                          {v.contractStatus === 'Signed'
                            ? 'Ditandatangani'
                            : 'Menunggu Tanda Tangan'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            onToggleVendorInsurance(v.id);
                            onNotify(`Status asuransi COI ${v.company} diperbarui.`);
                          }}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold cursor-pointer ${
                            v.insuranceVerified
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {v.insuranceVerified ? 'COI Aktif' : 'Verifikasi COI'}
                        </button>
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold tabular-nums">
                        {formatIDR(v.contractAmount)}
                      </td>
                      <td className="py-3.5 px-3 text-right text-emerald-700 font-medium tabular-nums">
                        {formatIDR(v.paidAmount)}
                      </td>
                      <td className="py-3.5 px-3 text-right text-amber-700 font-medium tabular-nums">
                        {formatIDR(balance)}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {v.contractStatus !== 'Signed' && (
                            <button
                              type="button"
                              onClick={() => {
                                onSignVendorContract(v.id);
                                onNotify(
                                  `Kontrak e-Signature untuk ${v.company} telah ditandatangani!`
                                );
                              }}
                              className="px-2.5 py-1 rounded-full bg-[#48a5b3] text-white text-[11px] font-semibold cursor-pointer whitespace-nowrap"
                            >
                              Tanda Tangani
                            </button>
                          )}
                          {balance > 0 ? (
                            <button
                              type="button"
                              onClick={() => {
                                const payAmt = Math.min(balance, 10000000);
                                onRecordVendorPayment(v.id, payAmt);
                                onNotify(
                                  `Pembayaran termin ${formatIDR(payAmt)} ke ${v.company} berhasil dicatat.`
                                );
                              }}
                              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold cursor-pointer whitespace-nowrap"
                            >
                              + Bayar Termin
                            </button>
                          ) : (
                            <span className="text-[11px] text-emerald-600 font-semibold px-2">
                              Lunas
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW D: REPORTS / LAPORAN ANALITIK LENGKAP (Point 2)
  // =========================================================================
  return (
    <div className="p-6 lg:p-8 max-w-[1440px] mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-normal text-[#3b9eae]">
            Laporan Bisnis &amp; Analitik Acara (IDR)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Laporan mendalam mencakup Pemesanan &amp; Prospek, Faktur &amp; Pajak Penjualan (PPN),
            Anggaran Lintas-Acara, Kepatuhan Vendor, dan RSVP Tamu
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            handleExportCsv('heal-planning-laporan-eksekutif-idr.csv', [
              ['Kategori Laporan', 'Metrik', 'Nilai'],
              ['Proposal & Faktur', 'Total Nilai Proposal', formatIDR(proposalSummary.grandTotal)],
              ['Proposal & Faktur', 'Total Pajak PPN', formatIDR(proposalSummary.totalTax)],
              ['Anggaran Acara', 'Total Estimasi Anggaran', formatIDR(budgetStats.totalEstimated)],
              ['Anggaran Acara', 'Total Aktual Anggaran', formatIDR(budgetStats.totalActual)],
              ['Manajemen Vendor', 'Total Kontrak Vendor', formatIDR(vendorStats.totalContracted)],
              ['Manajemen Vendor', 'Total Dibayar ke Vendor', formatIDR(vendorStats.totalPaid)],
              ['Daftar Tamu RSVP', 'Total Tamu Hadir', String(guestStats.attendingHeadcount)],
            ])
          }
          className="px-4 py-2 rounded-full bg-[#48a5b3] hover:bg-[#3d919e] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Ekspor Laporan Lengkap (CSV)</span>
        </button>
      </div>

      {/* Report Category Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200 w-fit">
        {(
          [
            { id: 'financial', label: '1. Faktur, Pembayaran & Pajak PPN' },
            { id: 'budgets', label: '2. Anggaran Lintas-Acara' },
            { id: 'vendors', label: '3. Vendor & Asuransi COI' },
            { id: 'guests', label: '4. RSVP Tamu & Diet BEO' },
            { id: 'venues', label: '5. Pemesanan Venue & Prospek' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setReportTab(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              reportTab === tab.id
                ? 'bg-[#48a5b3] text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {reportTab === 'financial' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase">
              Total Pendapatan Proposal &amp; Faktur
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {formatIDR(proposalSummary.grandTotal)}
            </div>
            <p className="text-xs text-slate-500">
              Biaya Pokok: {formatIDR(proposalSummary.subtotalCost)} · Biaya Layanan:{' '}
              {formatIDR(proposalSummary.serviceCharge)}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase">
              Laporan Pajak Penjualan (PPN Terkumpul)
            </div>
            <div className="text-2xl font-bold text-[#2b90a0] tabular-nums">
              {formatIDR(proposalSummary.totalTax)}
            </div>
            <p className="text-xs text-slate-500">
              Siap diekspor ke QuickBooks, Xero, dan FreshBooks untuk pelaporan pajak bulanan
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase">
              Total Nilai Seluruh Acara Terkonfirmasi ({bookedCount} Acara)
            </div>
            <div className="text-2xl font-bold text-emerald-700 tabular-nums">
              {formatIDR(
                events
                  .filter((e) => e.status === 'Booked Event')
                  .reduce((sum, e) => sum + e.budgetTotal, 0)
              )}
            </div>
            <p className="text-xs text-slate-500">
              Akumulasi kontrak seluruh acara aktif di Coach House &amp; Centennial Park
            </p>
          </div>
        </div>
      )}

      {reportTab === 'budgets' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase">
              Total Estimasi vs Aktual Anggaran
            </div>
            <div className="text-xl font-bold text-slate-900 tabular-nums">
              Aktual: {formatIDR(budgetStats.totalActual)}
            </div>
            <p className="text-xs text-emerald-700 font-semibold">
              Selisih Hemat: {formatIDR(budgetStats.varianceAmount)} dari Estimasi{' '}
              {formatIDR(budgetStats.totalEstimated)}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase">
              Total Pembayaran Anggaran Terealisasi
            </div>
            <div className="text-2xl font-bold text-emerald-700 tabular-nums">
              {formatIDR(budgetStats.totalPaid)} ({budgetStats.paidPercentage}%)
            </div>
            <p className="text-xs text-slate-500">
              Sisa tagihan pos anggaran: {formatIDR(budgetStats.totalRemainingDue)}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase">
              Tindakan Cepat Anggaran
            </div>
            <button
              type="button"
              onClick={() => onNavigate('events', 'budgets')}
              className="mt-2 px-4 py-2 rounded-full bg-[#48a5b3] text-white text-xs font-semibold cursor-pointer"
            >
              Buka Rincian Anggaran Acara ›
            </button>
          </div>
        </div>
      )}

      {reportTab === 'vendors' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-800">
            Ringkasan Kepatuhan Asuransi COI &amp; Pembayaran Vendor ({vendorStats.vendorCount}{' '}
            Vendor)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-slate-500">Kontrak Ditandatangani</div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {vendorStats.signedCount} / {vendorStats.vendorCount}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-slate-500">Sertifikat Asuransi (COI) Terverifikasi</div>
              <div className="text-xl font-bold text-emerald-700 mt-1">
                {vendorStats.insuranceVerifiedCount} / {vendorStats.vendorCount}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-slate-500">Sisa Saldo Tagihan Vendor</div>
              <div className="text-xl font-bold text-amber-700 mt-1 tabular-nums">
                {formatIDR(vendorStats.balanceDue)}
              </div>
            </div>
          </div>
        </div>
      )}

      {reportTab === 'guests' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-800">
            Rekap Kehadiran RSVP Tamu, Penempatan Kursi &amp; Kebutuhan Diet BEO
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-slate-500">Tamu Konfirmasi Hadir</div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {guestStats.attendingHeadcount} orang
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-slate-500">Mendapat Kursi di Denah</div>
              <div className="text-xl font-bold text-[#2b90a0] mt-1">
                {guestStats.seatedGuestsCount} / 131 kursi
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-slate-500">Bebas Gluten &amp; Vegetarian</div>
              <div className="text-xl font-bold text-emerald-700 mt-1">
                {guestStats.dietaryCounts['Gluten-Free'] + guestStats.dietaryCounts['Vegetarian']}{' '}
                porsi khusus
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-slate-500">Sudah Check-In di Pintu</div>
              <div className="text-xl font-bold text-indigo-700 mt-1">
                {guestStats.checkedInCount} tamu
              </div>
            </div>
          </div>
        </div>
      )}

      {reportTab === 'venues' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-800">
            Distribusi Pemesanan Ruangan Venue &amp; Konversi Prospek ({events.length} Total Acara)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-slate-500">Acara Terkonfirmasi (Booked Events)</div>
              <div className="text-xl font-bold text-indigo-700 mt-1">{bookedCount} Acara</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-slate-500">Prospek Terbuka (Open Leads)</div>
              <div className="text-xl font-bold text-emerald-700 mt-1">
                {openLeadsCount} Prospek
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-slate-500">Hold Sementara</div>
              <div className="text-xl font-bold text-amber-700 mt-1">{holdsCount} Hold</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
