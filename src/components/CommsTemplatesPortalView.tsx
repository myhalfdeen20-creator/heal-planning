import React, { useState, useMemo } from 'react';
import {
  Mail, Star, Send, Archive, Search, Plus,
  FileSpreadsheet, FileSignature, LayoutGrid,
  Clock, ClipboardList, CheckSquare, Download, Sparkles,
  FileText, Zap, Palette, Share2
} from 'lucide-react';
import {
  CommunicationMessage, TodoTask, FloorplanTable, GuestItem, Vendor, ContactPerson,
  PlannerEvent, NavSection, EventSubView, ProposalLineItem, FoodPackageItem,
  BudgetLineItem
} from '../types/planner';
import { FloorplanCanvas } from './FloorplanCanvas';
import { formatIDR, calculateProposalSummary } from '../utils/plannerLogic';

interface CommsTemplatesPortalViewProps {
  mode: 'communications' | 'templates' | 'contacts' | 'client-portal';
  messages: CommunicationMessage[];
  todos: TodoTask[];
  tables: FloorplanTable[];
  guests: GuestItem[];
  vendors: Vendor[];
  contacts: ContactPerson[];
  events: PlannerEvent[];
  proposalItems?: ProposalLineItem[];
  foodItems?: FoodPackageItem[];
  budgetItems?: BudgetLineItem[];
  onSendMessage: (msg: Omit<CommunicationMessage, 'id' | 'timestamp' | 'dateFormatted' | 'timeFormatted' | 'unread'>) => void;
  onToggleStarMessage: (id: string) => void;
  onMarkMessageRead: (id: string) => void;
  onAddTodo: (todo: Omit<TodoTask, 'id'>) => void;
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onAddFloorplanTable: (seats: number, diameterFt: number, label: string) => void;
  onResetFloorplan: () => void;
  onAssignGuestToTable: (guestId: string, tableId: string | null) => void;
  onAutoLayoutFloorplan?: (rows: number, cols: number, seatsPerTable: number) => void;
  onAddContact?: (contact: Omit<ContactPerson, 'id'>) => void;
  onNavigate: (section: NavSection, subView?: EventSubView) => void;
}

export const CommsTemplatesPortalView: React.FC<CommsTemplatesPortalViewProps> = ({
  mode,
  messages,
  todos,
  tables,
  guests,
  vendors,
  contacts,
  events,
  proposalItems = [],
  foodItems = [],
  onSendMessage,
  onToggleStarMessage,
  onMarkMessageRead,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
  onAddFloorplanTable,
  onResetFloorplan,
  onAssignGuestToTable,
  onAutoLayoutFloorplan,
  onAddContact,
  onNavigate,
}) => {
  // Communications state
  const [commFolder, setCommFolder] = useState<'inbox' | 'starred' | 'sent' | 'all'>('inbox');
  const [commEventFilter, setCommEventFilter] = useState<string>('ALL');
  const [commSearch, setCommSearch] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [newMsgRecipient, setNewMsgRecipient] = useState('Laura Finch (laura.finch@client.co.id)');
  const [newMsgSubject, setNewMsgSubject] = useState('');
  const [newMsgSnippet, setNewMsgSnippet] = useState('');
  const [newMsgEventTag, setNewMsgEventTag] = useState('Resepsi Johnson & Murphy');
  const [newMsgAttachment, setNewMsgAttachment] = useState<string>('Proposal_Johnson_Murphy_IDR.pdf');

  // Templates state
  const [templateSubTab, setTemplateSubTab] = useState<'todo-template' | 'floorplan-template' | 'worksheets-forms' | 'automations-branding'>('todo-template');
  const [todoContactFilter, setTodoContactFilter] = useState<string>('ALL');
  const [showAddTodoModal, setShowAddTodoModal] = useState(false);
  const [todoTitle, setTodoTitle] = useState('');
  const [todoDesc, setTodoDesc] = useState('');
  const [todoRule, setTodoRule] = useState('Tambahkan jatuh tempo 30 hari SEBELUM tanggal acara');
  const [todoReminder, setTodoReminder] = useState('3 hari sebelum jatuh tempo 10:00 WIB Via Email & WhatsApp');
  const [templateNotice, setTemplateNotice] = useState<string | null>(null);

  // Automations & Branding state
  const [autoLeadEmail, setAutoLeadEmail] = useState(true);
  const [autoTaskAssign, setAutoTaskAssign] = useState(true);
  const [autoInvoiceRemind, setAutoInvoiceRemind] = useState(true);
  const [autoScheduledPay, setAutoScheduledPay] = useState(true);
  const [brandCompanyName, setBrandCompanyName] = useState('NUSA TARA EVENT INDONESIA');
  const [brandColor, setBrandColor] = useState('#3898a6');
  const [zapierTriggers, setZapierTriggers] = useState({
    quickbooks: true,
    googleDrive: true,
    mailchimp: true,
    slack: false,
  });

  // Contacts state
  const [contactSearch, setContactSearch] = useState('');
  const [contactTab, setContactTab] = useState<'all' | 'vendors' | 'clients'>('all');
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactOrg, setNewContactOrg] = useState('');
  const [newContactRole, setNewContactRole] = useState<'Client' | 'Venue Manager' | 'Planner' | 'VIP Guest' | 'Sponsor'>('Client');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  // Client portal state
  const [portalDrawer, setPortalDrawer] = useState<null | 'beos' | 'contracts' | 'proposals' | 'questionnaires' | 'todos' | 'payment'>(null);
  const [portalSignedContract, setPortalSignedContract] = useState(false);
  const [portalSignedProposal, setPortalSignedProposal] = useState(false);
  const [portalSignedBeo, setPortalSignedBeo] = useState(false);
  const [portalPaidInvoice, setPortalPaidInvoice] = useState(false);
  const [portalQ1, setPortalQ1] = useState('3-5 tamu memerlukan menu bebas gluten, 9 vegetarian, dan 2 rendah garam.');
  const [portalQ2, setPortalQ2] = useState('Acoustic Jazz Trio saat Cocktail Hour & Band Top 40 saat Resepsi.');
  const [portalQ3, setPortalQ3] = useState('Gazebo Outdoor (Rencana Cadangan: Ballroom Quincy jika hujan).');
  const [portalQuestionnaireSaved, setPortalQuestionnaireSaved] = useState(false);

  const proposalSummary = useMemo(() => calculateProposalSummary(proposalItems, 36138700), [proposalItems]);

  const showTempNotice = (msg: string) => {
    setTemplateNotice(msg);
    setTimeout(() => setTemplateNotice(null), 4000);
  };

  // ============================================================================
  // 1. COMMUNICATIONS VIEW (Matches Image 4)
  // ============================================================================
  if (mode === 'communications') {
    const associatedEvents = [
      'Resepsi Pembukaan Klien',
      'Konferensi Regional Mountain 2026',
      'Resepsi Adams Industries',
      'Gala Relawan Tahunan',
      'Open House Musim Gugur',
      'Gala Amal Tahunan',
      'Grand Opening Party - Creative',
      'Resepsi Johnson & Murphy',
      'Pernikahan Johnson / Murphy',
      'Festival Bunga Matahari',
      'Pesta Promo Vino+Art',
    ];

    const filteredMessages = messages.filter(m => {
      if (commFolder === 'starred' && !m.starred) return false;
      if (commFolder === 'sent' && m.folder !== 'sent') return false;
      if (commEventFilter !== 'ALL' && !m.associatedEventLabel?.toLowerCase().includes(commEventFilter.toLowerCase().slice(0, 10))) return false;
      if (commSearch.trim()) {
        const q = commSearch.toLowerCase();
        return (
          m.senderName.toLowerCase().includes(q) ||
          m.subject.toLowerCase().includes(q) ||
          m.preview.toLowerCase().includes(q)
        );
      }
      return true;
    });

    const selectedMsg = messages.find(m => m.id === selectedMessageId) || null;

    const handleSend = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMsgSubject.trim()) return;
      onSendMessage({
        senderName: 'Alex Ramsey',
        senderEmail: 'alex.ramsey@healplanning.co.id',
        recipientName: newMsgRecipient,
        subject: newMsgSubject.trim() + (newMsgAttachment ? ` [Lampiran: ${newMsgAttachment}]` : ''),
        preview: newMsgSnippet.trim() || 'Pesan terkirim melalui pusat Komunikasi Heal Planning.',
        body: newMsgSnippet.trim() || 'Pesan terkirim melalui pusat Komunikasi Heal Planning beserta lampiran dokumen resmi.',
        starred: false,
        folder: 'sent',
        associatedEventId: events[0]?.id || 'ev-johnson-wedding',
        associatedEventLabel: newMsgEventTag,
        associatedEventColor: '#3898a6',
      });
      setNewMsgSubject('');
      setNewMsgSnippet('');
      setShowComposeModal(false);
    };

    return (
      <div className="p-6 max-w-[1440px] mx-auto">
        <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
          <span>Beranda</span>
          <span>/</span>
          <span className="text-slate-600">Komunikasi Terpadu</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <h1 className="text-3xl font-normal text-[#3898a6] tracking-tight">Komunikasi Email & Dokumen</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Semua pesan email klien & vendor tersinkronisasi dengan acara, lengkap dengan lampiran PDF Proposal, Kontrak, Faktur & BEO
            </p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowComposeModal(true)}
              className="px-4 py-1.5 rounded-full bg-[#5a5a5a] hover:bg-[#454545] text-white text-xs font-medium transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Tulis Email & Lampirkan PDF
            </button>
            <button
              onClick={() => {
                setCommFolder('inbox');
                setCommEventFilter('ALL');
                setCommSearch('');
              }}
              className="px-3.5 py-1.5 rounded-full bg-[#e6e6e6] hover:bg-[#d8d8d8] text-slate-700 text-xs font-medium transition cursor-pointer"
            >
              Segarkan Kotak Masuk
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={commSearch}
                onChange={e => setCommSearch(e.target.value)}
                placeholder="Ketik untuk memfilter pesan..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-700 focus:outline-none focus:border-[#3898a6]"
              />
            </div>
          </div>
        </div>

        {/* Main Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Rail */}
          <div className="lg:col-span-3 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-200 mb-2">
                Tampilan Cepat
              </h3>
              <div className="space-y-1 text-xs">
                {[
                  { id: 'inbox', label: `Kotak Masuk (${messages.filter(m => m.unread).length})`, icon: Mail },
                  { id: 'starred', label: 'Berbintang', icon: Star },
                  { id: 'sent', label: 'Terkirim', icon: Send },
                  { id: 'all', label: 'Semua Pesan', icon: Archive },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCommFolder(item.id as 'inbox' | 'starred' | 'sent' | 'all')}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left cursor-pointer transition ${
                        commFolder === item.id
                          ? 'bg-[#3898a6]/10 text-[#3898a6] font-semibold'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2">
                <h3 className="text-sm font-bold text-slate-800">Acara Terkait</h3>
                {commEventFilter !== 'ALL' && (
                  <button
                    onClick={() => setCommEventFilter('ALL')}
                    className="text-[11px] text-[#3898a6] hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="space-y-1 text-xs max-h-80 overflow-y-auto pr-1">
                {associatedEvents.map(evName => (
                  <button
                    key={evName}
                    onClick={() => setCommEventFilter(evName === commEventFilter ? 'ALL' : evName)}
                    className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-left truncate cursor-pointer ${
                      commEventFilter === evName
                        ? 'bg-[#3898a6]/10 text-[#3898a6] font-semibold'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-slate-400">▽</span>
                    <span className="truncate">{evName}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Inbox Card */}
          <div className="lg:col-span-9 bg-white rounded-xl border border-slate-200/90 shadow-xs p-6">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-slate-500" />
                <h2 className="text-base font-bold text-slate-800">Daftar Email Terintegrasi</h2>
                <span className="text-xs text-slate-400 ml-2">
                  Menampilkan 1 - {filteredMessages.length} dari {filteredMessages.length}
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredMessages.map(msg => (
                <div
                  key={msg.id}
                  onClick={() => {
                    setSelectedMessageId(msg.id);
                    onMarkMessageRead(msg.id);
                  }}
                  className={`py-3 px-2 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 hover:bg-slate-50/90 transition cursor-pointer ${
                    selectedMessageId === msg.id ? 'bg-[#3898a6]/5' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-[210px]">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        msg.unread ? 'bg-[#2b6cb0]' : 'bg-transparent'
                      }`}
                    />
                    <input
                      type="checkbox"
                      onClick={e => e.stopPropagation()}
                      className="rounded border-slate-300"
                    />
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onToggleStarMessage(msg.id);
                      }}
                      className={`cursor-pointer ${
                        msg.starred ? 'text-amber-400' : 'text-slate-300 hover:text-amber-400'
                      }`}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                    <div className="min-w-0">
                      <div className={`text-xs ${msg.unread ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'} truncate`}>
                        {msg.senderName}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{msg.recipientName}</div>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 text-xs text-slate-600 truncate">
                    <span className={msg.unread ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}>
                      {msg.subject}
                    </span>{' '}
                    <span className="text-slate-400">- {msg.preview}</span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {msg.associatedEventLabel && (
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 max-w-[130px] truncate"
                      >
                        #{msg.associatedEventLabel}
                      </span>
                    )}
                    <div className="text-right text-[11px] text-slate-500 leading-tight w-24">
                      <div>{msg.dateFormatted}</div>
                      <div className="text-[10px] text-slate-400">{msg.timeFormatted}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Email Reader Pane */}
            {selectedMsg && (
              <div className="mt-6 pt-5 border-t border-slate-200 bg-slate-50/70 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{selectedMsg.subject}</h4>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Dari: <span className="font-semibold text-slate-700">{selectedMsg.senderName}</span> ({selectedMsg.senderEmail})
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedMsg.associatedEventLabel && (
                      <button
                        onClick={() => onNavigate('events', 'itinerary')}
                        className="px-2.5 py-1 rounded bg-[#3898a6]/10 text-[#3898a6] text-xs font-semibold hover:bg-[#3898a6]/20 cursor-pointer"
                      >
                        Buka Acara: {selectedMsg.associatedEventLabel}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setNewMsgRecipient(selectedMsg.senderName);
                        setNewMsgSubject(`Re: ${selectedMsg.subject}`);
                        setShowComposeModal(true);
                      }}
                      className="px-3 py-1 rounded bg-[#3898a6] text-white text-xs font-medium hover:bg-[#2d7f8b] cursor-pointer"
                    >
                      Balas + Lampirkan PDF
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed bg-white p-3.5 rounded border border-slate-200">
                  {selectedMsg.body}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Compose Modal with PDF Event Document Attachment */}
        {showComposeModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
              <h3 className="text-base font-bold text-slate-800 mb-3">Kirim Email & Dokumen PDF Acara</h3>
              <form onSubmit={handleSend} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Kepada (Klien / Vendor)</label>
                  <input
                    type="text"
                    value={newMsgRecipient}
                    onChange={e => setNewMsgRecipient(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Tautkan ke Acara</label>
                    <select
                      value={newMsgEventTag}
                      onChange={e => setNewMsgEventTag(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-xs"
                    >
                      <option value="Resepsi Johnson & Murphy">Resepsi Johnson & Murphy</option>
                      <option value="Pernikahan Johnson / Murphy">Pernikahan Johnson / Murphy</option>
                      <option value="Festival Bunga Matahari">Festival Bunga Matahari</option>
                      <option value="Gala Relawan Tahunan">Gala Relawan Tahunan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Lampirkan PDF Otomatis</label>
                    <select
                      value={newMsgAttachment}
                      onChange={e => setNewMsgAttachment(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-xs"
                    >
                      <option value="Proposal_Johnson_Murphy_IDR.pdf">PDF Proposal ({formatIDR(proposalSummary.grandTotal)})</option>
                      <option value="Master_BEO_Platinum_Dinner.pdf">PDF Master BEO & Lembar Dapur</option>
                      <option value="Kontrak_Resmi_Venue.pdf">PDF Kontrak & Syarat Layanan</option>
                      <option value="Rundown_Acara_Lengkap.pdf">PDF Rundown & Denah Kursi</option>
                      <option value="">Tanpa Lampiran</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Subjek Email</label>
                  <input
                    type="text"
                    required
                    value={newMsgSubject}
                    onChange={e => setNewMsgSubject(e.target.value)}
                    placeholder="Contoh: Pembaruan Proposal & Konfirmasi Menu BEO"
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Isi Pesan (Mendukung Smart Fields)</label>
                  <textarea
                    rows={3}
                    value={newMsgSnippet}
                    onChange={e => setNewMsgSnippet(e.target.value)}
                    placeholder="Halo {{Nama_Klien}}, terlampir dokumen resmi untuk acara Anda pada {{Tanggal_Acara}}..."
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowComposeModal(false)}
                    className="px-4 py-1.5 rounded bg-slate-100 text-slate-600 text-xs font-medium cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded bg-[#3898a6] text-white text-xs font-medium cursor-pointer"
                  >
                    Kirim Pesan Sekarang
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // 2. TEMPLATES, WORKSHEETS, FORMS & AUTOMATIONS VIEW (Matches Images 2 & 9 + Strength #3)
  // ============================================================================
  if (mode === 'templates') {
    const filteredTodos = todos.filter(t => {
      if (todoContactFilter === 'ALL') return true;
      return t.contactNames.some((c: string) => c.toLowerCase().includes(todoContactFilter.toLowerCase()));
    });

    const handleCreateTodo = (e: React.FormEvent) => {
      e.preventDefault();
      if (!todoTitle.trim()) return;
      onAddTodo({
        eventId: events[0]?.id || 'ev-johnson-wedding',
        title: todoTitle.trim(),
        description: todoDesc.trim() || 'Item checklist ditambahkan ke templat standar.',
        dueRule: todoRule,
        dueDate: '2026-09-15',
        contactNames: ['Alex Ramsey', 'Laura Finch'],
        organization: 'Coach House Events',
        reminderText: todoReminder,
        completed: false,
      });
      setTodoTitle('');
      setTodoDesc('');
      setShowAddTodoModal(false);
    };

    const worksheetsList = [
      { id: 'ws1', title: 'Perencana Anggaran Acara (Event Budget Planner)', cat: 'Keuangan', fields: 28, lastUsed: 'Hari ini' },
      { id: 'ws2', title: 'Rencana Pemasaran & Promosi Acara', cat: 'Pemasaran', fields: 19, lastUsed: '2 hari lalu' },
      { id: 'ws3', title: 'Checklist Penilaian & Inspeksi Venue', cat: 'Venue & Logistik', fields: 34, lastUsed: 'Kemarin' },
      { id: 'ws4', title: 'Daftar Lagu Pernikahan & Pantangan Musik DJ', cat: 'Hiburan', fields: 22, lastUsed: '3 hari lalu' },
      { id: 'ws5', title: 'Lembar Kebutuhan Audio/Visual & Pencahayaan', cat: 'Teknis', fields: 16, lastUsed: 'Minggu lalu' },
      { id: 'ws6', title: 'Formulir Kuesioner Menu & Alergi Tamu VIP', cat: 'Katering & BEO', fields: 24, lastUsed: 'Hari ini' },
    ];

    return (
      <div className="p-6 max-w-[1440px] mx-auto">
        <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
          <span>Beranda</span>
          <span>/</span>
          <span className="text-slate-600">32 Templat Siap Pakai, Kuesioner & Otomasi</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <h1 className="text-3xl font-normal text-[#3898a6] tracking-tight">
              Templat, Kuesioner & Otomasi Kerja
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              32 Templat standar siap pakai & otomatisasi alur kerja untuk menghemat 62+ jam/bulan
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
            <button
              onClick={() => setTemplateSubTab('todo-template')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                templateSubTab === 'todo-template'
                  ? 'bg-[#3898a6] text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Templat Tugas (To-Do)
            </button>
            <button
              onClick={() => setTemplateSubTab('floorplan-template')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                templateSubTab === 'floorplan-template'
                  ? 'bg-[#3898a6] text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Templat Denah (131 Kursi)
            </button>
            <button
              onClick={() => setTemplateSubTab('worksheets-forms')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                templateSubTab === 'worksheets-forms'
                  ? 'bg-[#3898a6] text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              20+ Lembar Kerja & Kuesioner
            </button>
            <button
              onClick={() => setTemplateSubTab('automations-branding')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                templateSubTab === 'automations-branding'
                  ? 'bg-[#3898a6] text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Otomasi, Branding & Zapier
            </button>
          </div>
        </div>

        {templateNotice && (
          <div className="mb-4 px-4 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
            <span>{templateNotice}</span>
            <button onClick={() => setTemplateNotice(null)} className="text-emerald-700 font-bold cursor-pointer">✕</button>
          </div>
        )}

        {templateSubTab === 'todo-template' && (
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-3">Templat Daftar Tugas (Tanggal Mundur Otomatis dari Hari-H)</h2>
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <button
                onClick={() => setShowAddTodoModal(true)}
                className="px-4 py-1.5 rounded-full bg-[#5a5a5a] hover:bg-[#444] text-white text-xs font-medium transition cursor-pointer"
              >
                + Tambah Item Tugas
              </button>
              <button
                onClick={() => showTempNotice('Templat "Tugas Prospek & Persiapan Pernikahan" berhasil diterapkan ke acara aktif!')}
                className="px-3.5 py-1.5 rounded-full bg-[#3898a6] hover:bg-[#2d7f8b] text-white text-xs font-medium transition cursor-pointer"
              >
                Impor Templat ke Acara Aktif
              </button>
            </div>

            <h3 className="text-base font-bold text-slate-800 mb-4">Tugas Prospek Baru & Persiapan Pernikahan</h3>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Filter by Contact */}
              <div className="lg:col-span-3 space-y-4">
                <button
                  onClick={() => setTodoContactFilter('ALL')}
                  className="px-3 py-1 rounded-full bg-[#e6e6e6] hover:bg-[#d8d8d8] text-slate-700 text-xs font-medium cursor-pointer"
                >
                  Tampilkan Semua
                </button>

                <div>
                  <h4 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-200 mb-2">
                    Filter berdasarkan Kontak
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    {[
                      { name: 'Jane Babbit', count: 1 },
                      { name: 'Laura Finch', count: 2 },
                      { name: 'Alex Ramsey', subtitle: 'Coach House Events (4)' },
                    ].map(c => (
                      <button
                        key={c.name}
                        onClick={() => setTodoContactFilter(todoContactFilter === c.name ? 'ALL' : c.name)}
                        className={`w-full text-left py-1 px-1.5 rounded transition cursor-pointer ${
                          todoContactFilter === c.name ? 'bg-[#3898a6]/10 text-[#3898a6] font-semibold' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div>{c.name} {c.count ? `(${c.count})` : ''}</div>
                        {c.subtitle && <div className="text-[11px] text-slate-400">{c.subtitle}</div>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right To-Do List Card */}
              <div className="lg:col-span-9 bg-white rounded-xl border border-slate-200/90 shadow-xs p-6">
                <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-200">
                  <CheckSquare className="w-4 h-4 text-slate-600" />
                  <h3 className="text-sm font-bold text-slate-800">Semua Item Templat ({filteredTodos.length})</h3>
                </div>

                <div className="divide-y divide-slate-200">
                  {filteredTodos.map(todo => (
                    <div key={todo.id} className="py-5 flex flex-col md:flex-row items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className="text-slate-300 text-xs mt-2 select-none">↕</span>
                        <div className="bg-slate-100 border border-slate-200 rounded-lg px-4 py-3 text-center min-w-[190px]">
                          <div className="text-[11px] font-semibold text-slate-700 leading-snug">
                            📅 {todo.dueRule}
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={todo.completed}
                            onChange={() => onToggleTodo(todo.id)}
                            className="rounded border-slate-300 text-[#3898a6]"
                          />
                          <h4 className={`text-sm font-bold ${todo.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {todo.title}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 mb-3">{todo.description}</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                              👤 PENANGGUNG JAWAB
                            </div>
                            {todo.contactNames.map((c: string, idx: number) => (
                              <div key={idx} className="text-slate-700 font-medium leading-tight">
                                {c}
                              </div>
                            ))}
                            <div className="text-[11px] text-slate-400">{todo.organization}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                              🔔 PENGINGAT OTOMATIS
                            </div>
                            <div className="text-slate-700 whitespace-pre-line leading-tight">
                              {todo.reminderText}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                            📎 LAMPIRAN FILE
                          </div>
                          {todo.fileName ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3898a6]">
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                              {todo.fileName}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Tidak ada file</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <button
                          onClick={() => onDeleteTodo(todo.id)}
                          className="px-3 py-1 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-medium cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {showAddTodoModal && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
                  <h3 className="text-base font-bold text-slate-800 mb-3">Tambah Tugas ke Templat</h3>
                  <form onSubmit={handleCreateTodo} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Judul Tugas</label>
                      <input
                        type="text"
                        required
                        value={todoTitle}
                        onChange={e => setTodoTitle(e.target.value)}
                        placeholder="Contoh: Konfirmasi jumlah akhir katering H-14"
                        className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Aturan Tanggal Jatuh Tempo Mundur</label>
                      <input
                        type="text"
                        value={todoRule}
                        onChange={e => setTodoRule(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Deskripsi</label>
                      <textarea
                        rows={2}
                        value={todoDesc}
                        onChange={e => setTodoDesc(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddTodoModal(false)}
                        className="px-4 py-1.5 rounded bg-slate-100 text-slate-600 text-xs font-medium cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded bg-[#3898a6] text-white text-xs font-medium cursor-pointer"
                      >
                        Simpan Tugas
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {templateSubTab === 'floorplan-template' && (
          <FloorplanCanvas
            tables={tables}
            guests={guests}
            onAddTable={onAddFloorplanTable}
            onResetFloorplan={onResetFloorplan}
            onAssignGuestToTable={onAssignGuestToTable}
            onAutoLayoutGrid={onAutoLayoutFloorplan}
          />
        )}

        {templateSubTab === 'worksheets-forms' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800">20+ Lembar Kerja Digital (Worksheets) & Kuesioner Klien</h3>
                  <p className="text-xs text-slate-500">
                    Kumpulkan detail acara dari klien atau staf menggunakan formulir drag-and-drop & lembar kerja standar industri
                  </p>
                </div>
                <button
                  onClick={() => showTempNotice('Pembuat Formulir Kustom baru telah ditambahkan dan siap dibagikan ke Portal Klien!')}
                  className="px-4 py-2 rounded-lg bg-[#3898a6] text-white text-xs font-semibold hover:bg-[#2d7f8b] cursor-pointer"
                >
                  + Buat Formulir / Kuesioner Baru
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {worksheetsList.map(ws => (
                  <div key={ws.id} className="p-4 rounded-xl border border-slate-200 hover:border-[#3898a6] transition bg-slate-50/50 flex flex-col justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-[#3898a6]/10 text-[#3898a6] text-[10px] font-bold">
                        {ws.cat}
                      </span>
                      <h4 className="text-sm font-bold text-slate-800 mt-2">{ws.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">{ws.fields} kolom isian terstruktur • Digunakan: {ws.lastUsed}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between">
                      <button
                        onClick={() => showTempNotice(`Lembar kerja "${ws.title}" berhasil disalin ke Acara Resepsi Johnson & Murphy!`)}
                        className="text-xs font-semibold text-[#3898a6] hover:underline cursor-pointer"
                      >
                        Gunakan di Acara →
                      </button>
                      <button
                        onClick={() => showTempNotice(`Tautan kuesioner "${ws.title}" dikirim ke Portal Klien Laura Finch!`)}
                        className="px-2.5 py-1 rounded bg-white border border-slate-200 text-[11px] font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        Kirim ke Klien
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {templateSubTab === 'automations-branding' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Automations & Smart Fields */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" /> Otomasi Alur Kerja (Hemat 62+ Jam/Bulan)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Otomatisasi tindakan berulang mulai dari prospek masuk hingga pengingat cicilan faktur
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                  4 Otomasi Aktif
                </span>
              </div>

              <div className="space-y-3">
                {[
                  {
                    label: 'Balasan Email & Brosur Paket Otomatis Saat Prospek Masuk dari Webform',
                    desc: 'Mengirim email sambutan dengan Smart Fields {{Nama_Klien}} dan PDF Daftar Harga Rupiah',
                    checked: autoLeadEmail,
                    toggle: () => setAutoLeadEmail(!autoLeadEmail),
                  },
                  {
                    label: 'Lampiran Otomatis 32 Checklist Tugas Mundur Saat Acara Dikonfirmasi',
                    desc: 'Menghitung tanggal jatuh tempo tugas H-180, H-90, H-30, dan H-7 dari tanggal acara',
                    checked: autoTaskAssign,
                    toggle: () => setAutoTaskAssign(!autoTaskAssign),
                  },
                  {
                    label: 'Pengingat Otomatis Jatuh Tempo Tugas & Cicilan Faktur (H-3 Via Email/WA)',
                    desc: 'Mengirim pengingat pembayaran Rp kepada klien sebelum tanggal jatuh tempo',
                    checked: autoInvoiceRemind,
                    toggle: () => setAutoInvoiceRemind(!autoInvoiceRemind),
                  },
                  {
                    label: 'Auto-Pay Terjadwal untuk Termin Faktur Klien',
                    desc: 'Mendebit kartu kredit/virtual account klien sesuai jadwal cicilan kontrak',
                    checked: autoScheduledPay,
                    toggle: () => setAutoScheduledPay(!autoScheduledPay),
                  },
                ].map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-lg border border-slate-200 flex items-center justify-between gap-4 bg-slate-50/50">
                    <div>
                      <div className="text-xs font-bold text-slate-800">{item.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={item.toggle}
                      className="w-4 h-4 accent-[#3898a6] cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-lg bg-[#3898a6]/5 border border-[#3898a6]/20">
                <div className="text-xs font-bold text-[#3898a6] mb-1">Token Smart Fields (Auto-Fill Dokumen & Email)</div>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {['{{Nama_Klien}}', '{{Tanggal_Acara}}', '{{Nama_Venue}}', '{{Total_Proposal_IDR}}', '{{Sisa_Tagihan_IDR}}', '{{Tautan_Portal_Klien}}'].map(tok => (
                    <span key={tok} className="px-2 py-0.5 rounded bg-white border border-slate-200 font-mono text-slate-700">
                      {tok}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Custom Branding & Zapier Integrations */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#3898a6]" /> Kustomisasi Branding Akun & PDF
                </h3>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nama Bisnis / Venue di Header & PDF</label>
                  <input
                    type="text"
                    value={brandCompanyName}
                    onChange={e => setBrandCompanyName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-xs font-semibold"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Warna Aksen Utama Portal & PDF</span>
                  <input
                    type="color"
                    value={brandColor}
                    onChange={e => setBrandColor(e.target.value)}
                    className="w-10 h-7 rounded border border-slate-300 cursor-pointer"
                  />
                </div>
                <button
                  onClick={() => showTempNotice(`Branding "${brandCompanyName}" berhasil disimpan ke seluruh Proposal, BEO, dan Portal Klien!`)}
                  className="w-full py-2 rounded-lg bg-[#3898a6] text-white text-xs font-semibold hover:bg-[#2d7f8b] cursor-pointer"
                >
                  Simpan Branding Akun
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-emerald-600" /> Integrasi Zapier (5.000+ Aplikasi)
                </h3>
                {[
                  { key: 'quickbooks', name: 'QuickBooks / Xero / FreshBooks', desc: 'Sinkronisasi faktur & pembayaran Rupiah otomatis' },
                  { key: 'googleDrive', name: 'Google Drive & Dropbox', desc: 'Cadangkan PDF Kontrak, BEO & Denah Kursi' },
                  { key: 'mailchimp', name: 'Mailchimp / Constant Contact', desc: 'Sinkronisasi email prospek & tamu VIP' },
                  { key: 'slack', name: 'Slack / Microsoft Teams', desc: 'Notifikasi tim saat klien menandatangani proposal' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div>
                      <div className="text-xs font-bold text-slate-800">{item.name}</div>
                      <div className="text-[11px] text-slate-500">{item.desc}</div>
                    </div>
                    <button
                      onClick={() => {
                        setZapierTriggers(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }));
                        showTempNotice(`Status integrasi ${item.name} diperbarui.`);
                      }}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                        zapierTriggers[item.key as keyof typeof zapierTriggers]
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {zapierTriggers[item.key as keyof typeof zapierTriggers] ? 'Terhubung' : 'Hubungkan'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // 3. CONTACTS DIRECTORY VIEW (Integrated Vendor & Client CRM)
  // ============================================================================
  if (mode === 'contacts') {
    const filteredVendors = vendors.filter(
      v =>
        v.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
        v.company.toLowerCase().includes(contactSearch.toLowerCase()) ||
        v.category.toLowerCase().includes(contactSearch.toLowerCase())
    );
    const filteredContacts = contacts.filter(
      c =>
        c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
        c.organization.toLowerCase().includes(contactSearch.toLowerCase()) ||
        c.role.toLowerCase().includes(contactSearch.toLowerCase())
    );

    const handleCreateContact = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newContactName.trim() || !onAddContact) return;
      onAddContact({
        name: newContactName.trim(),
        organization: newContactOrg.trim() || 'Klien Pribadi',
        role: newContactRole,
        email: newContactEmail.trim() || 'kontak@klien.co.id',
        phone: newContactPhone.trim() || '0812-0000-0000',
        eventIds: [events[0]?.id || 'ev-johnson-wedding'],
      });
      setNewContactName('');
      setNewContactOrg('');
      setNewContactEmail('');
      setNewContactPhone('');
      setShowAddContactModal(false);
    };

    const handleExportContactsCsv = () => {
      const rows = [
        ['Nama', 'Perusahaan/Organisasi', 'Peran/Kategori', 'Email', 'Telepon'],
        ...vendors.map(v => [v.name, v.company, `Vendor - ${v.category}`, v.email, v.phone]),
        ...contacts.map(c => [c.name, c.organization, c.role, c.email, c.phone]),
      ];
      const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'direktori-kontak-vendor-healplanning.csv';
      a.click();
      URL.revokeObjectURL(url);
    };

    return (
      <div className="p-6 max-w-[1440px] mx-auto">
        <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
          <span>Beranda</span>
          <span>/</span>
          <span className="text-slate-600">Buku Alamat & CRM Kontak</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-normal text-[#3898a6] tracking-tight">Kontak & Direktori Vendor</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              CRM Terpusat untuk mengelola profil klien, vendor pernikahan, koordinator venue, dan riwayat kontrak (Rp)
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onAddContact && (
              <button
                onClick={() => setShowAddContactModal(true)}
                className="px-4 py-1.5 rounded-full bg-[#5a5a5a] hover:bg-[#444] text-white text-xs font-medium cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Kontak CRM
              </button>
            )}
            <button
              onClick={handleExportContactsCsv}
              className="px-3.5 py-1.5 rounded-full bg-[#e6e6e6] hover:bg-[#d8d8d8] text-slate-700 text-xs font-medium cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Ekspor CSV
            </button>
            <button
              onClick={() => onNavigate('events', 'vendors')}
              className="px-4 py-1.5 rounded-full bg-[#3898a6] text-white text-xs font-medium hover:bg-[#2d7f8b] cursor-pointer"
            >
              Kelola Kontrak Vendor Acara →
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: `Semua Kontak (${vendors.length + contacts.length})` },
              { id: 'vendors', label: `Mitra Vendor (${vendors.length})` },
              { id: 'clients', label: `Klien & Koordinator (${contacts.length})` },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setContactTab(t.id as 'all' | 'vendors' | 'clients')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition ${
                  contactTab === t.id
                    ? 'bg-[#5a5a5a] text-white'
                    : 'bg-[#e6e6e6] text-slate-700 hover:bg-[#dcdcdc]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={contactSearch}
              onChange={e => setContactSearch(e.target.value)}
              placeholder="Cari nama, perusahaan, atau peran..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(contactTab === 'all' || contactTab === 'vendors') &&
            filteredVendors.map(v => (
              <div key={v.id} className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-[#3898a6]/10 text-[#3898a6] text-[10px] font-bold uppercase">
                        Vendor • {v.category}
                      </span>
                      <h3 className="text-sm font-bold text-slate-800 mt-1.5">{v.name}</h3>
                      <div className="text-xs text-slate-500">{v.company}</div>
                    </div>
                    <span className="text-xs font-bold text-slate-700">
                      {formatIDR(v.contractAmount)}
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                    <div>✉️ {v.email}</div>
                    <div>📞 {v.phone}</div>
                    <div>📋 Terhubung ke {v.eventIds.length} acara aktif</div>
                  </div>
                </div>
                <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-700">
                    {v.contractStatus === 'Signed' ? 'Kontrak Ditandatangani' : v.contractStatus}
                  </span>
                  <button
                    onClick={() => onNavigate('events', 'itinerary')}
                    className="text-xs text-[#3898a6] font-semibold hover:underline cursor-pointer"
                  >
                    Lihat Rundown →
                  </button>
                </div>
              </div>
            ))}

          {(contactTab === 'all' || contactTab === 'clients') &&
            filteredContacts.map(c => (
              <div key={c.id} className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-bold uppercase">
                    {c.role}
                  </span>
                  <h3 className="text-sm font-bold text-slate-800 mt-1.5">{c.name}</h3>
                  <div className="text-xs text-slate-500">{c.organization}</div>
                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                    <div>✉️ {c.email}</div>
                    <div>📞 {c.phone}</div>
                    <div>🗓️ Terkait dengan {c.eventIds.length} acara aktif</div>
                  </div>
                </div>
                <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => onNavigate('communications')}
                    className="text-xs text-[#3898a6] font-semibold hover:underline cursor-pointer"
                  >
                    Kirim Pesan →
                  </button>
                </div>
              </div>
            ))}
        </div>

        {showAddContactModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
              <h3 className="text-base font-bold text-slate-800 mb-3">Tambah Kontak CRM Baru</h3>
              <form onSubmit={handleCreateContact} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={newContactName}
                    onChange={e => setNewContactName(e.target.value)}
                    placeholder="Contoh: Hendra Wijaya"
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Organisasi / Perusahaan</label>
                    <input
                      type="text"
                      value={newContactOrg}
                      onChange={e => setNewContactOrg(e.target.value)}
                      placeholder="PT Nusantara Indah"
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Peran</label>
                    <select
                      value={newContactRole}
                      onChange={e => setNewContactRole(e.target.value as 'Client' | 'Venue Manager' | 'Planner' | 'VIP Guest' | 'Sponsor')}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                    >
                      <option value="Client">Klien</option>
                      <option value="Planner">Perencana (Planner)</option>
                      <option value="Venue Manager">Manajer Venue</option>
                      <option value="VIP Guest">Tamu VIP</option>
                      <option value="Sponsor">Sponsor</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                    <input
                      type="email"
                      value={newContactEmail}
                      onChange={e => setNewContactEmail(e.target.value)}
                      placeholder="hendra@perusahaan.co.id"
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Telepon / WhatsApp</label>
                    <input
                      type="text"
                      value={newContactPhone}
                      onChange={e => setNewContactPhone(e.target.value)}
                      placeholder="0811-2345-6789"
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddContactModal(false)}
                    className="px-4 py-1.5 rounded bg-slate-100 text-slate-600 text-xs font-medium cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded bg-[#3898a6] text-white text-xs font-medium cursor-pointer"
                  >
                    Simpan Kontak
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // 4. CLIENT PORTAL VIEW (Matches Image 3: "Welcome to your Client Portal!" in Bahasa Indonesia & Rupiah)
  // ============================================================================
  return (
    <div className="p-6 max-w-[1440px] mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#3898a6]/10 text-[#3898a6] text-xs font-semibold mb-2">
            <span>Mode Pratinjau Portal Klien Aktif • Masuk sebagai: Laura Finch (Pasangan Pengantin)</span>
          </div>
          <h1 className="text-3xl font-normal text-[#3898a6] tracking-tight">
            Selamat Datang di Portal Klien Anda!
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pantau progres pernikahan Anda, tanda tangani Proposal/Kontrak/BEO, bayar tagihan Rupiah, dan kelola daftar tamu & papan inspirasi
          </p>
        </div>

        {/* Branded Venue Header */}
        <div className="text-right select-none">
          <div className="text-2xl font-black tracking-tight text-[#3898a6] leading-none">
            NUSA
          </div>
          <div className="text-2xl font-black tracking-tight text-[#3898a6] leading-none">
            TARA
          </div>
          <div className="text-[10px] tracking-[0.28em] text-[#3898a6]/80 font-semibold mt-0.5">
            EVENT
          </div>
        </div>
      </div>

      {/* Main Client Portal Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Quick Links Column */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-100/90 p-2.5 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setPortalDrawer('payment')}
              className="w-full bg-white hover:bg-slate-50 rounded-lg p-3.5 border border-slate-200/90 shadow-2xs flex items-center gap-2.5 text-xs font-semibold text-[#2b6cb0] transition cursor-pointer"
            >
              <span>🏛️</span>
              <span>Metode Pembayaran & Auto-Pay</span>
            </button>
          </div>

          <div className="bg-slate-100/90 p-2.5 rounded-xl border border-slate-200/80 space-y-2.5">
            {[
              { label: 'Kontak Acara', icon: '👥', action: () => onNavigate('contacts') },
              { label: 'Vendor Pernikahan', icon: '🪪', action: () => onNavigate('events', 'vendors') },
              { label: 'Anggaran (Rp)', icon: '💰', action: () => onNavigate('events', 'budgets') },
              { label: 'Website & RSVP Tamu', icon: '🌐', action: () => onNavigate('events', 'website') },
              { label: 'Papan Inspirasi (Vision Board)', icon: '🎨', action: () => onNavigate('events', 'vision-board') },
            ].map(item => (
              <button
                key={item.label}
                onClick={item.action}
                className="w-full bg-white hover:bg-slate-50 rounded-lg p-3.5 border border-slate-200/90 shadow-2xs flex items-center gap-2.5 text-xs font-semibold text-[#2b6cb0] transition cursor-pointer"
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right 2x4 Feature Cards Grid */}
        <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Banquet Event Orders (BEO's) */}
          <div className="bg-slate-100/90 p-3 rounded-xl border border-slate-200/80">
            <div className="bg-white rounded-lg p-5 border border-slate-200/90 shadow-2xs flex items-start gap-4 min-h-[125px]">
              <div className="w-10 h-10 rounded-full bg-[#5a32a3] text-white flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-slate-800">
                  Banquet Event Orders (BEO) <span className="font-normal text-slate-400 ml-1">5</span>
                </div>
                {portalSignedBeo && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                    ✓ Disetujui Klien
                  </span>
                )}
                <button
                  onClick={() => setPortalDrawer('beos')}
                  className="text-xs text-[#2b6cb0] hover:underline font-medium mt-1.5 inline-flex items-center gap-0.5 cursor-pointer block"
                >
                  Lihat & Tanda Tangani BEO ›
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Contract */}
          <div className="bg-slate-100/90 p-3 rounded-xl border border-slate-200/80">
            <div className="bg-white rounded-lg p-5 border border-slate-200/90 shadow-2xs flex items-start gap-4 min-h-[125px]">
              <div className="w-10 h-10 rounded-full bg-[#d4e157] text-slate-800 flex items-center justify-center shrink-0">
                <FileSignature className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-slate-800">
                  Kontrak Resmi <span className="font-normal text-slate-400 ml-1">1</span>
                </div>
                {portalSignedContract && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                    ✓ Ditandatangani Laura Finch
                  </span>
                )}
                <button
                  onClick={() => setPortalDrawer('contracts')}
                  className="text-xs text-[#2b6cb0] hover:underline font-medium mt-1.5 inline-flex items-center gap-0.5 cursor-pointer block"
                >
                  Lihat & Tanda Tangani ›
                </button>
              </div>
            </div>
          </div>

          {/* Card 3: Vision Board & Files */}
          <div className="bg-slate-100/90 p-3 rounded-xl border border-slate-200/80">
            <div className="bg-white rounded-lg p-5 border border-slate-200/90 shadow-2xs flex items-start gap-4 min-h-[125px]">
              <div className="w-10 h-10 rounded-full bg-[#29b6f6] text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">
                  Berkas & Papan Inspirasi <span className="font-normal text-slate-400 ml-1">4</span>
                </div>
                <button
                  onClick={() => onNavigate('events', 'vision-board')}
                  className="text-xs text-[#2b6cb0] hover:underline font-medium mt-1.5 inline-flex items-center gap-0.5 cursor-pointer"
                >
                  Buka Papan Inspirasi ›
                </button>
              </div>
            </div>
          </div>

          {/* Card 4: Floorplans */}
          <div className="bg-slate-100/90 p-3 rounded-xl border border-slate-200/80">
            <div className="bg-white rounded-lg p-5 border border-slate-200/90 shadow-2xs flex items-start gap-4 min-h-[125px]">
              <div className="w-10 h-10 rounded-full bg-[#ffa726] text-white flex items-center justify-center shrink-0">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">
                  Denah Meja & Kursi Tamu <span className="font-normal text-slate-400 ml-1">{tables.length}</span>
                </div>
                <button
                  onClick={() => onNavigate('events', 'floorplan')}
                  className="text-xs text-[#2b6cb0] hover:underline font-medium mt-1.5 inline-flex items-center gap-0.5 cursor-pointer"
                >
                  Lihat & Atur Kursi Tamu ›
                </button>
              </div>
            </div>
          </div>

          {/* Card 5: Itineraries */}
          <div className="bg-slate-100/90 p-3 rounded-xl border border-slate-200/80">
            <div className="bg-white rounded-lg p-5 border border-slate-200/90 shadow-2xs flex items-start gap-4 min-h-[125px]">
              <div className="w-10 h-10 rounded-full bg-[#d81b60] text-white flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">
                  Rundown Acara <span className="font-normal text-slate-400 ml-1">2</span>
                </div>
                <button
                  onClick={() => onNavigate('events', 'itinerary')}
                  className="text-xs text-[#2b6cb0] hover:underline font-medium mt-1.5 inline-flex items-center gap-0.5 cursor-pointer"
                >
                  Lihat Rundown ›
                </button>
              </div>
            </div>
          </div>

          {/* Card 6: Proposals & Invoices */}
          <div className="bg-slate-100/90 p-3 rounded-xl border border-slate-200/80">
            <div className="bg-white rounded-lg p-5 border border-slate-200/90 shadow-2xs flex items-start gap-4 min-h-[125px]">
              <div className="w-10 h-10 rounded-full bg-[#ec407a] text-white flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-slate-800">
                  Proposal & Faktur (IDR) <span className="font-normal text-slate-400 ml-1">2</span>
                </div>
                <div className="text-[11px] font-semibold text-slate-600 mt-0.5">
                  Total: {formatIDR(proposalSummary.grandTotal)}
                </div>
                <button
                  onClick={() => setPortalDrawer('proposals')}
                  className="text-xs text-[#2b6cb0] hover:underline font-medium mt-1 inline-flex items-center gap-0.5 cursor-pointer"
                >
                  Lihat & Bayar Faktur ›
                </button>
              </div>
            </div>
          </div>

          {/* Card 7: Questionnaire */}
          <div className="bg-slate-100/90 p-3 rounded-xl border border-slate-200/80">
            <div className="bg-white rounded-lg p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between min-h-[125px]">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#78909c] text-white flex items-center justify-center shrink-0">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">
                    Kuesioner Klien <span className="font-normal text-slate-400 ml-1">1</span>
                  </div>
                  <button
                    onClick={() => setPortalDrawer('questionnaires')}
                    className="text-xs text-[#2b6cb0] hover:underline font-medium mt-1.5 inline-flex items-center gap-0.5 cursor-pointer"
                  >
                    Isi Kuesioner ›
                  </button>
                </div>
              </div>
              <div className="flex justify-end mt-2">
                <span className={`px-3 py-0.5 rounded-full text-white text-[10px] font-semibold ${portalQuestionnaireSaved ? 'bg-emerald-600' : 'bg-[#d9534f]'}`}>
                  {portalQuestionnaireSaved ? '✓ Kuesioner Terkirim' : '1 item butuh perhatian'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 8: To-Do's */}
          <div className="bg-slate-100/90 p-3 rounded-xl border border-slate-200/80">
            <div className="bg-white rounded-lg p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between min-h-[125px]">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#29b6f6] text-white flex items-center justify-center shrink-0">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">
                    Daftar Tugas Klien <span className="font-normal text-slate-400 ml-1">{todos.length}</span>
                  </div>
                  <button
                    onClick={() => setPortalDrawer('todos')}
                    className="text-xs text-[#2b6cb0] hover:underline font-medium mt-1.5 inline-flex items-center gap-0.5 cursor-pointer"
                  >
                    Lihat & Selesaikan Tugas ›
                  </button>
                </div>
              </div>
              <div className="flex justify-end mt-2">
                <span className="px-3 py-0.5 rounded-full bg-[#d9534f] text-white text-[10px] font-semibold">
                  {todos.filter(t => !t.completed).length} belum selesai
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Client Portal Modal Drawer */}
      {portalDrawer && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-800">
                {portalDrawer === 'beos' && 'Portal Klien — Persetujuan Banquet Event Order (BEO)'}
                {portalDrawer === 'contracts' && 'Portal Klien — Tanda Tangan Kontrak Digital'}
                {portalDrawer === 'proposals' && 'Portal Klien — Proposal & Pembayaran Faktur (IDR)'}
                {portalDrawer === 'questionnaires' && 'Portal Klien — Kuesioner Pra-Acara & Preferensi Diet'}
                {portalDrawer === 'todos' && 'Portal Klien — Checklist Tugas Bersama'}
                {portalDrawer === 'payment' && 'Portal Klien — Metode Pembayaran Tersimpan'}
              </h3>
              <button
                onClick={() => setPortalDrawer(null)}
                className="px-2.5 py-1 rounded bg-slate-100 text-slate-600 text-xs font-semibold cursor-pointer"
              >
                Tutup ✕
              </button>
            </div>

            {portalDrawer === 'beos' && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-[#3898a6] uppercase">BEO #BEO-2026-09 • Paket Makan Malam Platinum</div>
                  <div className="text-sm font-bold text-slate-800 mt-1">Resepsi Johnson & Murphy — 131 Tamu Terkonfirmasi</div>
                  <ul className="mt-2 space-y-1 text-xs text-slate-600 list-disc pl-4">
                    {foodItems.map(item => (
                      <li key={item.id}>
                        <span className="font-semibold text-slate-800">{item.name}</span> ({item.category}) — {formatIDR(item.pricePerPerson || 0)}/pax
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => onNavigate('events', 'food-package')}
                    className="text-xs text-[#3898a6] font-semibold hover:underline cursor-pointer"
                  >
                    Buka Dokumen BEO Lengkap →
                  </button>
                  <button
                    onClick={() => setPortalSignedBeo(true)}
                    className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 cursor-pointer"
                  >
                    {portalSignedBeo ? '✓ BEO Telah Disetujui Klien' : 'Setujui & Tanda Tangani BEO'}
                  </button>
                </div>
              </div>
            )}

            {portalDrawer === 'contracts' && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2 leading-relaxed">
                  <div className="font-bold text-slate-900 text-sm">Perjanjian Sewa Venue & Layanan Manajemen Acara</div>
                  <p>
                    Kontrak ini mencakup penggunaan penuh Ballroom Quincy & Overlook Gazebo, layanan katering Paket Platinum untuk 131 tamu, serta koordinasi Hari-H senilai total <strong>{formatIDR(proposalSummary.grandTotal)}</strong>.
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Status: {portalSignedContract ? 'Telah ditandatangani secara elektronik oleh Laura Finch' : 'Menunggu tanda tangan klien'}
                  </span>
                  <button
                    onClick={() => setPortalSignedContract(true)}
                    className="px-4 py-2 rounded-lg bg-[#3898a6] text-white text-xs font-semibold hover:bg-[#2d7f8b] cursor-pointer"
                  >
                    {portalSignedContract ? '✓ Kontrak Ditandatangani' : 'Tanda Tangani Kontrak Secara Digital'}
                  </button>
                </div>
              </div>
            )}

            {portalDrawer === 'proposals' && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-600">Total Proposal Disetujui:</span>
                    <span className="font-bold text-slate-900">{formatIDR(proposalSummary.grandTotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-600">Deposit Awal (Lunas):</span>
                    <span className="font-bold text-emerald-700">{formatIDR(100000000)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                    <span className="font-bold text-slate-800">Sisa Tagihan Jatuh Tempo:</span>
                    <span className="font-bold text-[#3898a6]">
                      {portalPaidInvoice ? formatIDR(0) : formatIDR(Math.max(0, proposalSummary.grandTotal - 100000000))}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => setPortalSignedProposal(true)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-semibold cursor-pointer"
                  >
                    {portalSignedProposal ? '✓ Proposal Disetujui' : 'Tanda Tangani Proposal'}
                  </button>
                  <button
                    onClick={() => setPortalPaidInvoice(true)}
                    className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 cursor-pointer"
                  >
                    {portalPaidInvoice ? '✓ Pembayaran Lunas Terverifikasi' : 'Bayar Sisa Tagihan Sekarang (IDR)'}
                  </button>
                </div>
              </div>
            )}

            {portalDrawer === 'questionnaires' && (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  setPortalQuestionnaireSaved(true);
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    1. Catatan Alergi Makanan & Kebutuhan Diet Tamu
                  </label>
                  <textarea
                    rows={2}
                    value={portalQ1}
                    onChange={e => setPortalQ1(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    2. Preferensi Hiburan Musik & Lagu Masuk Pengantin
                  </label>
                  <input
                    type="text"
                    value={portalQ2}
                    onChange={e => setPortalQ2(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    3. Rencana Cadangan Cuaca (Indoor / Outdoor)
                  </label>
                  <input
                    type="text"
                    value={portalQ3}
                    onChange={e => setPortalQ3(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-xs"
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#3898a6] text-white text-xs font-semibold cursor-pointer"
                  >
                    {portalQuestionnaireSaved ? '✓ Jawaban Tersimpan' : 'Kirim Jawaban Kuesioner'}
                  </button>
                </div>
              </form>
            )}

            {portalDrawer === 'todos' && (
              <div className="space-y-2.5">
                {todos.map(t => (
                  <div key={t.id} className="p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={t.completed}
                        onChange={() => onToggleTodo(t.id)}
                        className="rounded border-slate-300 text-[#3898a6]"
                      />
                      <div>
                        <div className={`text-xs font-bold ${t.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {t.title}
                        </div>
                        <div className="text-[11px] text-slate-500">{t.dueRule}</div>
                      </div>
                    </label>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.completed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {t.completed ? 'Selesai' : 'Aktif'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {portalDrawer === 'payment' && (
              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">Kartu Kredit Visa Corporate •••• 4829</div>
                    <div className="text-slate-500">Terhubung untuk pendebitan cicilan otomatis (Auto-Pay IDR)</div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-bold">Utama</span>
                </div>
                <div className="p-4 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">Virtual Account BCA / Mandiri Corporate</div>
                    <div className="text-slate-500">Rekonsiliasi pembayaran faktur otomatis real-time</div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-semibold">Aktif</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
