import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  Edit3,
  FileCheck,
  FileText,
  Globe,
  Link2,
  MessageSquare,
  Paperclip,
  Plus,
  QrCode,
  Share2,
  ShieldCheck,
  Sparkles,
  Tag,
  Ticket,
  Trash2,
  UserCheck,
  Users,
  Utensils,
  Wallet,
} from 'lucide-react';
import {
  BudgetLineItem,
  ContactPerson,
  DietaryTag,
  EventSubView,
  FloorplanTable,
  FoodPackageItem,
  GuestItem,
  ItineraryItem,
  PlannerEvent,
  RsvpStatus,
  TodoTask,
  Vendor,
  VisionBoardItem,
  WeddingWebsiteConfig,
} from '../types/planner';
import {
  calculateBudgetAnalytics,
  calculateGuestAnalytics,
  calculateVendorMetrics,
  formatIDR,
} from '../utils/plannerLogic';
import { EventCircleAvatar, FoodDishThumbnail } from './VisualThumbnails';
import { FloorplanCanvas } from './FloorplanCanvas';

interface EventsWorkspaceViewProps {
  events: PlannerEvent[];
  activeEventId: string;
  subView: EventSubView;
  itineraryItems: ItineraryItem[];
  vendors: Vendor[];
  contacts: ContactPerson[];
  guests: GuestItem[];
  floorplanTables: FloorplanTable[];
  foodItems: FoodPackageItem[];
  todos: TodoTask[];
  budgetItems: BudgetLineItem[];
  visionItems: VisionBoardItem[];
  websiteConfig: WeddingWebsiteConfig;
  onSelectEvent: (eventId: string) => void;
  onChangeSubView: (subView: EventSubView) => void;
  onAddItineraryItem: (item: Omit<ItineraryItem, 'id'>, autoShiftMinutes?: number) => void;
  onShiftItinerary: (offsetMinutes: number) => void;
  onToggleItineraryExpand: (id: string) => void;
  onToggleAllItineraryExpand: (expand: boolean) => void;
  onAddVendor: (vendor: Omit<Vendor, 'id'>) => void;
  onToggleVendorInsurance: (vendorId: string) => void;
  onAddGuest: (guest: Omit<GuestItem, 'id'>) => void;
  onUpdateGuestRsvp: (guestId: string, status: RsvpStatus) => void;
  onAssignGuestToTable: (guestId: string, tableId: string | null) => void;
  onToggleGuestCheckIn: (guestId: string) => void;
  onAddFloorplanTable: (seats: number, diameterFt: number, label: string) => void;
  onAutoLayoutFloorplan: (rows: number, cols: number, seatsPerTable: number) => void;
  onResetFloorplan: () => void;
  onAddFoodItem: (item: Omit<FoodPackageItem, 'id'>) => void;
  onRemoveFoodItem: (id: string) => void;
  onPushFoodPackageToProposal: () => void;
  onUpdateEventNotes: (eventId: string, notes: string) => void;
  onToggleTodo: (todoId: string) => void;
  onImportWeddingTodoTemplate: () => void;
  onAddBudgetItem: (item: Omit<BudgetLineItem, 'id'>) => void;
  onRecordBudgetPayment: (id: string, amount: number) => void;
  onAddVisionItem: (item: Omit<VisionBoardItem, 'id'>) => void;
  onAddVisionComment: (visionId: string, text: string) => void;
  onUpdateWebsiteConfig: (cfg: WeddingWebsiteConfig) => void;
  onNotify: (msg: string) => void;
}

export const EventsWorkspaceView: React.FC<EventsWorkspaceViewProps> = ({
  events,
  activeEventId,
  subView,
  itineraryItems,
  vendors,
  contacts,
  guests,
  floorplanTables,
  foodItems,
  todos,
  budgetItems,
  visionItems,
  websiteConfig,
  onSelectEvent,
  onChangeSubView,
  onAddItineraryItem,
  onShiftItinerary,
  onToggleItineraryExpand,
  onToggleAllItineraryExpand,
  onAddVendor,
  onToggleVendorInsurance,
  onAddGuest,
  onUpdateGuestRsvp,
  onAssignGuestToTable,
  onToggleGuestCheckIn,
  onAddFloorplanTable,
  onAutoLayoutFloorplan,
  onResetFloorplan,
  onAddFoodItem,
  onRemoveFoodItem,
  onPushFoodPackageToProposal,
  onUpdateEventNotes,
  onToggleTodo,
  onImportWeddingTodoTemplate,
  onAddBudgetItem,
  onRecordBudgetPayment,
  onAddVisionItem,
  onAddVisionComment,
  onUpdateWebsiteConfig,
  onNotify,
}) => {
  const activeEvent = events.find((e) => e.id === activeEventId) || events[0];

  const [showEventSwitcher, setShowEventSwitcher] = useState(false);
  const [showToolDropdown, setShowToolDropdown] = useState(false);

  // Itinerary filters & auto-shift
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [vendorFilter, setVendorFilter] = useState<string | null>(null);
  const [contactFilter, setContactFilter] = useState<string | null>(null);
  const [selectedVendorPdfId, setSelectedVendorPdfId] = useState<string>('all');
  const [openCatDropdown, setOpenCatDropdown] = useState<string | null>(null);

  // Add Itinerary Modal
  const [showAddItineraryModal, setShowAddItineraryModal] = useState(false);
  const [itTitle, setItTitle] = useState('');
  const [itStartTime, setItStartTime] = useState('16:00 WIB');
  const [itCategory, setItCategory] = useState<'Ceremony' | 'Reception' | 'Setup/Prep'>('Ceremony');
  const [itVendorId, setItVendorId] = useState(vendors[0]?.id || 'ven-cindy');
  const [itAutoShiftMins, setItAutoShiftMins] = useState('0');
  const [itError, setItError] = useState('');

  // Vendor Modal
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [venName, setVenName] = useState('');
  const [venCompany, setVenCompany] = useState('');
  const [venCategory, setVenCategory] = useState<Vendor['category']>('Decor & Floral');
  const [venEmail, setVenEmail] = useState('');
  const [venPhone, setVenPhone] = useState('0812-3035-0899');
  const [venContractAmount, setVenContractAmount] = useState('35000000');
  const [venArrivalTime, setVenArrivalTime] = useState('10:00 WIB');
  const [venError, setVenError] = useState('');

  // Guest Modal, Door Check-In & Ticketing Mode
  const [guestMode, setGuestMode] = useState<'rsvp' | 'checkin' | 'ticketing'>('rsvp');
  const [guestRsvpFilter, setGuestRsvpFilter] = useState<'All' | RsvpStatus>('All');
  const [guestSearch, setGuestSearch] = useState('');
  const [showAddGuestModal, setShowAddGuestModal] = useState(false);
  const [gFirstName, setGFirstName] = useState('');
  const [gLastName, setGLastName] = useState('');
  const [gEmail, setGEmail] = useState('');
  const [gHousehold, setGHousehold] = useState('Keluarga Mempelai Wanita');
  const [gRsvp, setGRsvp] = useState<RsvpStatus>('Attending');
  const [gPlusOnes, setGPlusOnes] = useState('1');
  const [gMeal, setGMeal] = useState('Ayam Panggang Herba (Herb Roasted Chicken)');
  const [gDietary, setGDietary] = useState<DietaryTag>('None');
  const [gTableId, setGTableId] = useState<string>('tbl-1013');
  const [gCustomAnswer, setGCustomAnswer] = useState('');
  const [gError, setGError] = useState('');

  // Registration & Ticketing state (Point 4)
  const [ticketTiers, setTicketTiers] = useState([
    { id: 'tkt-vip', name: 'Tiket Meja VIP Gala & Jamuan Malam', price: 1500000, sold: 42, capacity: 50 },
    { id: 'tkt-reg', name: 'Tiket Masuk Reguler (General Admission)', price: 750000, sold: 89, capacity: 100 },
    { id: 'tkt-eb', name: 'Tiket Early Bird Komunitas', price: 500000, sold: 30, capacity: 30 },
  ]);

  // Floorplan client permission state
  const [clientCanEditFloorplan, setClientCanEditFloorplan] = useState(true);

  // Food Package & BEO Document state (Point 5)
  const [beoDocType, setBeoDocType] = useState<'master' | 'kitchen' | 'delivery'>('master');
  const [beoClientSigned, setBeoClientSigned] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState(activeEvent.foodPackageNotes);
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [foodName, setFoodName] = useState('');
  const [foodCategory, setFoodCategory] = useState<'Entree' | 'Side Dish'>('Entree');
  const [foodDesc, setFoodDesc] = useState('');
  const [foodPrice, setFoodPrice] = useState('450000');

  // Budget Modal state (Point 1)
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [bTitle, setBTitle] = useState('');
  const [bCat, setBCat] = useState<BudgetLineItem['category']>('Dekorasi & Florist');
  const [bEst, setBEst] = useState('25000000');
  const [bNeg, setBNeg] = useState('23500000');
  const [bAct, setBAct] = useState('23500000');
  const [bPaid, setBPaid] = useState('10000000');
  const [bDue, setBDue] = useState('2026-09-30');

  // Vision Board state (Point 1)
  const [visionCatFilter, setVisionCatFilter] = useState<string>('Semua');
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [showAddVisionModal, setShowAddVisionModal] = useState(false);
  const [vbTitle, setVbTitle] = useState('');
  const [vbCat, setVbCat] = useState<VisionBoardItem['category']>('Dekorasi & Bunga');
  const [vbDesc, setVbDesc] = useState('');

  // Wedding Website Online RSVP form state (Point 1 & 4)
  const [webGuestFirst, setWebGuestFirst] = useState('');
  const [webGuestLast, setWebGuestLast] = useState('');
  const [webGuestMeal, setWebGuestMeal] = useState('Ayam Panggang Herba (Herb Roasted Chicken)');
  const [webGuestAnswer, setWebGuestAnswer] = useState('');

  const eventItinerary = useMemo(() => {
    return itineraryItems.filter((item) => {
      if (categoryFilter && item.category !== categoryFilter) return false;
      if (vendorFilter && !item.vendorIds.includes(vendorFilter)) return false;
      if (contactFilter && !item.contactIds.includes(contactFilter)) return false;
      if (searchFilter && !item.title.toLowerCase().includes(searchFilter.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [itineraryItems, categoryFilter, vendorFilter, contactFilter, searchFilter]);

  const categoryCounts = useMemo(() => {
    return {
      Ceremony: itineraryItems.filter((i) => i.category === 'Ceremony').length,
      Reception: itineraryItems.filter((i) => i.category === 'Reception').length,
      'Setup/Prep': itineraryItems.filter((i) => i.category === 'Setup/Prep').length,
    };
  }, [itineraryItems]);

  const guestStats = useMemo(() => calculateGuestAnalytics(guests), [guests]);
  const vendorStats = useMemo(() => calculateVendorMetrics(vendors), [vendors]);
  const budgetStats = useMemo(() => calculateBudgetAnalytics(budgetItems), [budgetItems]);

  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      if (guestRsvpFilter !== 'All' && g.rsvpStatus !== guestRsvpFilter) return false;
      if (guestSearch.trim()) {
        const q = guestSearch.toLowerCase();
        const full = `${g.firstName} ${g.lastName} ${g.groupOrHousehold} ${g.mealChoice}`.toLowerCase();
        if (!full.includes(q)) return false;
      }
      return true;
    });
  }, [guests, guestRsvpFilter, guestSearch]);

  const toolLabels: Record<EventSubView, string> = {
    itinerary: 'RUNDOWN ACARA (ITINERARY)',
    vendors: 'MANAJEMEN VENDOR & KONTRAK',
    guests: 'DAFTAR TAMU, CHECK-IN & TIKET',
    floorplan: 'DENAH ACARA & KURSI (131)',
    budgets: 'ANGGARAN ACARA (BUDGET IDR)',
    'food-package': 'PAKET KATERING & DOKUMEN BEO',
    todos: 'DAFTAR TUGAS (TO-DO TIMELINE)',
    website: 'WEBSITE PERNIKAHAN & SEO',
    'vision-board': 'PAPAN VISI & INSPIRASI',
  };

  const categoryLabelID = (cat: 'Ceremony' | 'Reception' | 'Setup/Prep') => {
    if (cat === 'Ceremony') return 'Upacara / Akad';
    if (cat === 'Reception') return 'Resepsi';
    return 'Persiapan / Setup';
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
    onNotify(`Berhasil mengunduh berkas ${filename}`);
  };

  const handleDownloadVendorItinerary = () => {
    const chosenVendor = vendors.find((v) => v.id === selectedVendorPdfId);
    const items = chosenVendor
      ? itineraryItems.filter((i) => i.vendorIds.includes(chosenVendor.id))
      : itineraryItems;
    const filename = chosenVendor
      ? `rundown-vendor-${chosenVendor.company.toLowerCase().replace(/\s+/g, '-')}.csv`
      : 'rundown-lengkap-acara.csv';
    handleExportCsv(filename, [
      ['Waktu Mulai', 'Kegiatan Rundown', 'Kategori', 'Catatan'],
      ...items.map((i) => [i.startTime, i.title, categoryLabelID(i.category), i.notes || '']),
    ]);
  };

  const handleAddItinerarySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itTitle.trim()) {
      setItError('Silakan masukkan judul kegiatan rundown.');
      return;
    }
    const shiftMins = parseInt(itAutoShiftMins, 10) || 0;
    onAddItineraryItem(
      {
        eventId: activeEvent.id,
        date: activeEvent.date,
        startTime: itStartTime,
        title: itTitle.trim(),
        category: itCategory,
        vendorIds: [itVendorId],
        contactIds: ['con-camilla'],
        venueRoom: 'Ballroom Quincy & Gazebo',
        reminderText: 'Email & SMS 2 jam sebelum jadwal',
        attachmentsCount: 1,
        completed: false,
        expanded: true,
      },
      shiftMins
    );
    setItTitle('');
    setItError('');
    setShowAddItineraryModal(false);
    onNotify(
      shiftMins !== 0
        ? `Item rundown ditambahkan & jadwal berikutnya digeser otomatis ${shiftMins} menit.`
        : `Item rundown "${itTitle.trim()}" berhasil ditambahkan.`
    );
  };

  const handleAddVendorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!venName.trim() || !venCompany.trim()) {
      setVenError('Silakan lengkapi nama kontak dan nama perusahaan vendor.');
      return;
    }
    const amt = parseFloat(venContractAmount) || 25000000;
    onAddVendor({
      name: venName.trim(),
      company: venCompany.trim(),
      category: venCategory,
      email: venEmail.trim() || 'kontak@vendor.id',
      phone: venPhone.trim(),
      eventIds: [activeEvent.id],
      contractAmount: amt,
      paidAmount: Math.round(amt * 0.5),
      contractStatus: 'Signed',
      insuranceVerified: true,
      arrivalTime: venArrivalTime,
    });
    setVenName('');
    setVenCompany('');
    setVenError('');
    setShowAddVendorModal(false);
    onNotify(`Vendor "${venCompany.trim()}" berhasil ditambahkan (${formatIDR(amt)}).`);
  };

  const handleAddGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gFirstName.trim() || !gLastName.trim()) {
      setGError('Silakan masukkan nama depan dan nama belakang tamu.');
      return;
    }
    onAddGuest({
      eventId: activeEvent.id,
      firstName: gFirstName.trim(),
      lastName: gLastName.trim(),
      email: gEmail.trim() || `${gFirstName.toLowerCase()}@example.com`,
      phone: '0812-555-0911',
      groupOrHousehold: gHousehold,
      rsvpStatus: gRsvp,
      plusOnes: Math.max(0, parseInt(gPlusOnes, 10) || 0),
      mealChoice: gRsvp === 'Attending' ? gMeal : '',
      dietaryRestrictions: [gDietary],
      customQuestionResponse: gCustomAnswer.trim() || undefined,
      tableId: gRsvp === 'Attending' && gTableId ? gTableId : null,
      isVip: false,
      checkedIn: false,
    });
    setGFirstName('');
    setGLastName('');
    setGCustomAnswer('');
    setGError('');
    setShowAddGuestModal(false);
    onNotify(`Tamu "${gFirstName.trim()} ${gLastName.trim()}" ditambahkan ke Daftar Tamu & BEO.`);
  };

  const handleAddFoodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim()) return;
    onAddFoodItem({
      category: foodCategory,
      name: foodName.trim(),
      description: foodDesc.trim() || 'Disiapkan segar oleh tim kuliner eksekutif Nusa Tara Event',
      imageType: foodCategory === 'Entree' ? 'chicken' : 'salad',
      pricePerPerson: parseInt(foodPrice, 10) || 450000,
    });
    setFoodName('');
    setFoodDesc('');
    setShowAddFoodModal(false);
    onNotify(`Menu "${foodName.trim()}" ditambahkan ke Paket Katering & BEO.`);
  };

  const handleAddBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bTitle.trim()) return;
    onAddBudgetItem({
      eventId: activeEvent.id,
      category: bCat,
      title: bTitle.trim(),
      estimatedCost: parseFloat(bEst) || 0,
      negotiatedCost: parseFloat(bNeg) || 0,
      actualCost: parseFloat(bAct) || 0,
      paidAmount: parseFloat(bPaid) || 0,
      dueDate: bDue,
      vendorId: vendors[0]?.id,
      managerName: 'Alex Ramsey',
      notes: 'Tersinkronisasi dengan laporan anggaran acara',
    });
    setBTitle('');
    setShowAddBudgetModal(false);
    onNotify(`Pos anggaran "${bTitle.trim()}" berhasil ditambahkan.`);
  };

  const handleAddVisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vbTitle.trim()) return;
    onAddVisionItem({
      eventId: activeEvent.id,
      category: vbCat,
      title: vbTitle.trim(),
      description: vbDesc.trim() || 'Referensi visual dekorasi dan penataan suasana acara.',
      paletteColors: ['#3b9eae', '#f8fafc', '#fde68a', '#0f766e'],
      visualTheme: 'gazebo-floral',
      uploadedBy: 'Alex Ramsey (Planner)',
      comments: [],
    });
    setVbTitle('');
    setVbDesc('');
    setShowAddVisionModal(false);
    onNotify(`Inspirasi "${vbTitle.trim()}" ditambahkan ke Papan Visi.`);
  };

  return (
    <div
      className="p-3 sm:p-6 lg:p-8 max-w-[1440px] mx-auto space-y-6"
      onClick={() => {
        if (openCatDropdown) setOpenCatDropdown(null);
      }}
    >
      {/* Top Event Header matching image_36ccc141.png & image_3ffaa971.png */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-5">
            <EventCircleAvatar type={activeEvent.avatarUrl} size="lg" />

            <div>
              <h1 className="text-2xl font-bold text-slate-900">{activeEvent.title}</h1>
              <p className="text-xs italic text-slate-600 mt-0.5">{activeEvent.subtitle}</p>

              {/* Tool Switcher Dropdown + Switch Event */}
              <div className="mt-2 flex flex-wrap items-center gap-4">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowToolDropdown((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 text-sm font-extrabold tracking-wide text-[#2b90a0] hover:text-[#1f7482] cursor-pointer"
                  >
                    <span>{toolLabels[subView]}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {showToolDropdown && (
                    <div className="absolute left-0 mt-1.5 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-30">
                      {(Object.keys(toolLabels) as EventSubView[]).map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            onChangeSubView(key);
                            setShowToolDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center justify-between cursor-pointer ${
                            subView === key
                              ? 'bg-[#48a5b3]/10 text-[#2b90a0]'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{toolLabels[key]}</span>
                          {subView === key && <Check className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEventSwitcher((prev) => !prev)}
                    className="text-xs text-[#2b90a0] hover:underline font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ganti Acara</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {showEventSwitcher && (
                    <div className="absolute left-0 mt-1.5 w-72 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-30 max-h-64 overflow-y-auto">
                      {events.slice(0, 8).map((ev) => (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => {
                            onSelectEvent(ev.id);
                            setNotesDraft(ev.foodPackageNotes);
                            setShowEventSwitcher(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-xs cursor-pointer ${
                            ev.id === activeEvent.id
                              ? 'bg-[#48a5b3]/10 font-bold text-[#2b90a0]'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="truncate">{ev.title}</div>
                          <div className="text-[10px] text-slate-400">
                            {ev.date} · {ev.venueName}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Event Date & Countdown Divider */}
            <div className="pl-6 border-l border-slate-200 text-xs text-slate-700 space-y-0.5">
              <div className="font-bold text-slate-800">
                {activeEvent.id === 'ev-johnson-reception'
                  ? 'Senin, 16 Nov 2026'
                  : 'Sabtu, 9 Okt 2026'}
              </div>
              <div className="text-slate-600">
                {activeEvent.startTime} - {activeEvent.endTime}
              </div>
              <div className="pt-1 text-slate-500 uppercase tracking-wide text-[11px] tabular-nums">
                <strong className="text-sm text-slate-700">{activeEvent.daysUntil}</strong> HARI
                MENUJU ACARA
              </div>
            </div>
          </div>
        </div>

        {/* Complete 9-Tab Event Tool Bar covering all Planning Pod Event Modules */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl">
          {(
            [
              { id: 'itinerary', label: 'Rundown Acara' },
              { id: 'vendors', label: `Vendor (${vendorStats.vendorCount})` },
              { id: 'guests', label: `Daftar Tamu & Check-In (${guestStats.attendingHeadcount})` },
              { id: 'floorplan', label: `Denah Kursi (${floorplanTables.reduce((s, t) => s + t.seats, 0)})` },
              { id: 'budgets', label: 'Anggaran (IDR)' },
              { id: 'food-package', label: 'Katering & BEO' },
              { id: 'todos', label: `Daftar Tugas (${todos.length})` },
              { id: 'website', label: 'Website & RSVP Online' },
              { id: 'vision-board', label: `Papan Inspirasi (${visionItems.length})` },
            ] as Array<{ id: EventSubView; label: string }>
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeSubView(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                subView === tab.id
                  ? 'bg-white text-[#2b90a0] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SUB-VIEW 1: ITINERARY / RUNDOWN (Matches image_36ccc141.png)          */}
      {/* ===================================================================== */}
      {subView === 'itinerary' && (
        <div className="space-y-4">
          {/* Top Action Bar, Auto-Shift & Per-Vendor PDF Export */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddItineraryModal(true)}
                className="px-4 py-1.5 rounded-full bg-[#595959] hover:bg-[#444444] text-white text-xs font-medium cursor-pointer"
              >
                + Tambah Item Rundown
              </button>
              <button
                type="button"
                onClick={() => {
                  onShiftItinerary(30);
                  onNotify('Seluruh jadwal rundown berhasil digeser maju +30 menit.');
                }}
                className="px-3.5 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold cursor-pointer"
              >
                Geser Waktu Otomatis (+30 Menit)
              </button>
              <button
                type="button"
                onClick={() => {
                  onShiftItinerary(-30);
                  onNotify('Seluruh jadwal rundown berhasil digeser mundur -30 menit.');
                }}
                className="px-3.5 py-1.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium cursor-pointer"
              >
                Geser (-30 Menit)
              </button>

              {/* Separate Itinerary Download per Vendor/Contact (Point 1) */}
              <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-full px-2.5 py-1">
                <select
                  aria-label="Pilih Vendor untuk Unduh Rundown Terpisah"
                  value={selectedVendorPdfId}
                  onChange={(e) => setSelectedVendorPdfId(e.target.value)}
                  className="text-xs text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer"
                >
                  <option value="all">Semua Vendor (Master Rundown)</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      Khusus: {v.company}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleDownloadVendorItinerary}
                  className="px-2.5 py-0.5 rounded-full bg-[#48a5b3] text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Unduh Rundown</span>
                </button>
              </div>
            </div>

            <div className="w-full sm:w-72">
              <input
                type="text"
                aria-label="Filter Item Rundown"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Ketik untuk memfilter kegiatan..."
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#2b90a0]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Sidebar Filters: Categories, Filter by Vendor, Filter by Contact */}
            <aside className="lg:col-span-3 space-y-6">
              <div>
                <button
                  type="button"
                  onClick={() =>
                    onNotify('Tautan publik Rundown Acara berhasil disalin ke papan klip!')
                  }
                  className="text-xs text-[#2b90a0] hover:underline font-semibold mb-3 block cursor-pointer"
                >
                  Bagikan URL Rundown ▾
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter(null);
                    setVendorFilter(null);
                    setContactFilter(null);
                  }}
                  className="px-3 py-1 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium cursor-pointer"
                >
                  Tampilkan Semua
                </button>
              </div>

              {/* Categories */}
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-300">
                  <h2 className="text-sm font-bold text-slate-800">Kategori Rundown</h2>
                  <button
                    type="button"
                    onClick={() => setShowAddItineraryModal(true)}
                    className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <ul className="mt-3 space-y-2.5 text-xs">
                  {[
                    {
                      key: 'Ceremony',
                      label: 'Upacara / Akad',
                      count: categoryCounts.Ceremony,
                      color: '#a3e635',
                    },
                    {
                      key: 'Reception',
                      label: 'Resepsi',
                      count: categoryCounts.Reception,
                      color: '#9333ea',
                    },
                    {
                      key: 'Setup/Prep',
                      label: 'Persiapan / Setup',
                      count: categoryCounts['Setup/Prep'],
                      color: '#dc2626',
                    },
                  ].map((cat) => {
                    const isCatMenuOpen = openCatDropdown === cat.key;
                    return (
                      <li key={cat.key} className="relative flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() =>
                            setCategoryFilter((prev) => (prev === cat.key ? null : cat.key))
                          }
                          className={`flex items-center gap-2 cursor-pointer ${
                            categoryFilter === cat.key
                              ? 'font-bold text-slate-900'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Tag className="w-3.5 h-3.5" style={{ color: cat.color }} />
                          <span>
                            {cat.label} ({cat.count})
                          </span>
                        </button>
                        <button
                          type="button"
                          aria-label={`Opsi kategori ${cat.label}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenCatDropdown(isCatMenuOpen ? null : cat.key);
                          }}
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition cursor-pointer ${
                            isCatMenuOpen
                              ? 'bg-[#3898a6] text-white'
                              : 'bg-slate-200 hover:bg-slate-300 text-slate-600'
                          }`}
                        >
                          ▾
                        </button>
                        {isCatMenuOpen && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-6 z-30 w-52 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 text-xs space-y-1"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setCategoryFilter(cat.key);
                                setOpenCatDropdown(null);
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 cursor-pointer"
                            >
                              Tampilkan Hanya {cat.label}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setItCategory(cat.key as 'Ceremony' | 'Reception' | 'Setup/Prep');
                                setShowAddItineraryModal(true);
                                setOpenCatDropdown(null);
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 cursor-pointer"
                            >
                              + Tambah Sesi di {cat.label}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCategoryFilter(null);
                                setOpenCatDropdown(null);
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                            >
                              Reset Filter Kategori
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Filter by Vendor */}
              <div>
                <div className="pb-2 border-b border-slate-300">
                  <h2 className="text-sm font-bold text-slate-800">Filter berdasarkan Vendor</h2>
                </div>
                <ul className="mt-3 space-y-3 text-xs">
                  {vendors.map((ven) => {
                    const itemCount = itineraryItems.filter((i) =>
                      i.vendorIds.includes(ven.id)
                    ).length;
                    const isSelected = vendorFilter === ven.id;
                    return (
                      <li key={ven.id}>
                        <button
                          type="button"
                          onClick={() =>
                            setVendorFilter((prev) => (prev === ven.id ? null : ven.id))
                          }
                          className={`text-left cursor-pointer ${
                            isSelected
                              ? 'font-bold text-[#2b90a0]'
                              : 'text-slate-700 hover:text-[#2b90a0]'
                          }`}
                        >
                          <div className="font-medium">{ven.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {ven.company} ({itemCount})
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Filter by Contact */}
              <div>
                <div className="pb-2 border-b border-slate-300">
                  <h2 className="text-sm font-bold text-slate-800">Filter berdasarkan Kontak</h2>
                </div>
                <ul className="mt-3 space-y-3 text-xs">
                  {contacts.slice(0, 3).map((con) => (
                    <li key={con.id}>
                      <button
                        type="button"
                        onClick={() =>
                          setContactFilter((prev) => (prev === con.id ? null : con.id))
                        }
                        className={`text-left cursor-pointer ${
                          contactFilter === con.id
                            ? 'font-bold text-[#2b90a0]'
                            : 'text-slate-700 hover:text-[#2b90a0]'
                        }`}
                      >
                        <div className="font-medium">{con.name}</div>
                        <div className="text-[11px] text-slate-500">{con.organization} (4)</div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            {/* Right Main Itinerary Card matching image_36ccc141.png */}
            <div className="lg:col-span-9 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  <h2 className="text-base font-bold text-slate-800">
                    Semua Jadwal Rundown ({eventItinerary.length})
                  </h2>
                </div>
                <span className="text-xs text-slate-500">
                  Pengingat Email &amp; SMS/WhatsApp Aktif untuk Staf &amp; Vendor
                </span>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  aria-label="Pilih Semua Item Rundown"
                  className="rounded border-slate-300"
                />
                <button
                  type="button"
                  onClick={() => onToggleAllItineraryExpand(true)}
                  className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer"
                >
                  Buka Semua Detail ▾
                </button>
                <button
                  type="button"
                  onClick={() => onToggleAllItineraryExpand(false)}
                  className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer"
                >
                  Tutup Detail
                </button>
              </div>

              {/* Date Banner */}
              <div className="bg-slate-50 py-2.5 text-center rounded-md border border-slate-100">
                <div className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  SABTU
                </div>
                <div className="text-[11px] text-slate-500 tabular-nums">09/10/2026</div>
              </div>

              {/* Itinerary Rows */}
              <div className="divide-y divide-slate-200">
                {eventItinerary.map((item) => {
                  const itemVendors = vendors.filter((v) => item.vendorIds.includes(v.id));
                  const itemContacts = contacts.filter((c) => item.contactIds.includes(c.id));

                  const badgeBg =
                    item.category === 'Setup/Prep'
                      ? 'bg-[#dc2626] text-white'
                      : item.category === 'Ceremony'
                      ? 'bg-[#d9f99d] text-slate-800'
                      : 'bg-[#9333ea] text-white';

                  return (
                    <div key={item.id} className="py-3.5 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 cursor-move" />
                          <input
                            type="checkbox"
                            aria-label={`Pilih ${item.title}`}
                            className="rounded border-slate-300"
                          />
                          <span className="text-xs font-bold text-slate-800 w-20 text-right tabular-nums">
                            {item.startTime}
                          </span>
                          <button
                            type="button"
                            onClick={() => onToggleItineraryExpand(item.id)}
                            className={`text-left cursor-pointer hover:text-[#2b90a0] flex items-center gap-1 ${
                              item.expanded
                                ? 'text-sm font-bold text-slate-900'
                                : 'text-xs font-medium text-slate-800'
                            }`}
                          >
                            <span>{item.title}</span>
                            <span className="text-[10px] text-slate-500">
                              {item.expanded ? '▴' : '▾'}
                            </span>
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          {item.attachmentsCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs text-teal-600 tabular-nums">
                              <Paperclip className="w-3.5 h-3.5" />
                              {item.attachmentsCount}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 text-xs text-rose-700/80 tabular-nums">
                            <Building2 className="w-3.5 h-3.5" />
                            {item.vendorIds.length}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-amber-700/80 tabular-nums">
                            <Users className="w-3.5 h-3.5" />
                            {item.contactIds.length}
                          </span>
                          <span
                            className={`px-3 py-0.5 rounded-full text-[11px] font-semibold ${badgeBg}`}
                          >
                            {categoryLabelID(item.category)}
                          </span>
                          <button
                            type="button"
                            onClick={() => onToggleItineraryExpand(item.id)}
                            className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer"
                          >
                            Tindakan ▾
                          </button>
                        </div>
                      </div>

                      {item.expanded && (
                        <div className="pl-12 pt-3 pb-2 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/60 rounded-xl p-4 border border-slate-100">
                          <div className="space-y-1.5">
                            <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>VENDOR TERKAIT</span>
                            </div>
                            {itemVendors.map((v) => (
                              <div key={v.id} className="text-xs">
                                <div className="font-semibold text-slate-800">{v.name}</div>
                                <div className="text-[11px] text-slate-500">{v.company}</div>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => onChangeSubView('vendors')}
                              className="mt-2 px-3 py-1 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-medium cursor-pointer"
                            >
                              Perbarui Vendor
                            </button>
                          </div>

                          <div className="space-y-1.5">
                            <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              <span>KONTAK &amp; RUANGAN</span>
                            </div>
                            {itemContacts.map((c) => (
                              <div key={c.id} className="text-xs">
                                <div className="font-semibold text-slate-800">{c.name}</div>
                                <div className="text-[11px] text-slate-500">{c.organization}</div>
                              </div>
                            ))}
                            <div className="text-[11px] text-[#2b90a0] font-medium pt-1">
                              Lokasi: {activeEvent.venueName}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                              <Tag className="w-3.5 h-3.5 text-slate-400" />
                              <span>KATEGORI &amp; CATATAN</span>
                            </div>
                            <div>
                              <span
                                className={`inline-block px-3 py-0.5 rounded-full text-[11px] font-semibold ${badgeBg}`}
                              >
                                {categoryLabelID(item.category)}
                              </span>
                            </div>
                            {item.notes && (
                              <p className="text-xs text-slate-600 pt-1">{item.notes}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-VIEW 2: INTEGRATED VENDOR MANAGEMENT (IDR)                        */}
      {/* ===================================================================== */}
      {subView === 'vendors' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">Vendor Ditugaskan</div>
              <div className="text-2xl font-bold text-slate-800 mt-1 tabular-nums">
                {vendorStats.vendorCount}
              </div>
              <div className="text-[11px] text-[#2b90a0] mt-0.5">
                Tersinkronisasi dengan Rundown &amp; Kalender
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">Total Nilai Kontrak Vendor</div>
              <div className="text-xl font-bold text-slate-800 mt-1 tabular-nums">
                {formatIDR(vendorStats.totalContracted)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {vendorStats.signedCount} Kontrak Ditandatangani
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">DP &amp; Pembayaran Lunas</div>
              <div className="text-xl font-bold text-emerald-700 mt-1 tabular-nums">
                {formatIDR(vendorStats.totalPaid)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                Sisa Tagihan: {formatIDR(vendorStats.balanceDue)}
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">Sertifikat Asuransi (COI)</div>
              <div className="text-2xl font-bold text-slate-800 mt-1 tabular-nums">
                {vendorStats.insuranceVerifiedCount} / {vendorStats.vendorCount}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Dokumen COI Terverifikasi</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Manajemen Vendor Terintegrasi &amp; Jadwal Kedatangan (Load-In)
                </h2>
                <p className="text-xs text-slate-500">
                  Kelola kontrak vendor dalam Rupiah, jam kedatangan, kepatuhan asuransi COI, dan
                  tugas rundown
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddVendorModal(true)}
                className="px-4 py-2 rounded-full bg-[#48a5b3] hover:bg-[#3d919e] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Vendor</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                    <th className="py-3 px-3">Perusahaan Vendor / Kontak</th>
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3">Waktu Tiba</th>
                    <th className="py-3 px-3">Status Kontrak</th>
                    <th className="py-3 px-3 text-right">Nilai Kontrak</th>
                    <th className="py-3 px-3 text-right">Telah Dibayar</th>
                    <th className="py-3 px-3 text-center">Asuransi COI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {vendors.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-800">{v.company}</div>
                        <div className="text-slate-500">
                          {v.name} · {v.phone}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium">{v.category}</td>
                      <td className="py-3 px-3 tabular-nums text-slate-700">
                        {v.arrivalTime || '09:00 WIB'}
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium">
                        {v.contractStatus === 'Signed'
                          ? 'Ditandatangani'
                          : 'Menunggu Tanda Tangan'}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-800 tabular-nums">
                        {formatIDR(v.contractAmount)}
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-700 font-medium tabular-nums">
                        {formatIDR(v.paidAmount)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => onToggleVendorInsurance(v.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                            v.insuranceVerified
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>
                            {v.insuranceVerified ? 'Terverifikasi' : 'Menunggu COI'}
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-VIEW 3: GUEST LIST, MOBILE DOOR CHECK-IN & TICKETING (Point 1 & 4)*/}
      {/* ===================================================================== */}
      {subView === 'guests' && (
        <div className="space-y-5">
          {/* Guest List & Dietary KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">Total Tamu Konfirmasi Hadir</div>
              <div
                data-testid="guest-attending-headcount"
                className="text-2xl font-bold text-slate-800 mt-1 tabular-nums"
              >
                {guestStats.attendingHeadcount}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                Menunggu: {guestStats.pendingCount} · Tidak Hadir: {guestStats.declinedCount}
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">Penempatan Kursi Denah</div>
              <div className="text-2xl font-bold text-[#2b90a0] mt-1 tabular-nums">
                {guestStats.seatedGuestsCount} / 131
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                Sudah Check-In di Pintu: {guestStats.checkedInCount} tamu
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">Rekap Pilihan Hidangan BEO</div>
              <div className="text-xs font-bold text-slate-800 mt-1.5 space-y-1 tabular-nums">
                <div>
                  Ayam Panggang Herba:{' '}
                  {guestStats.mealCounts['Ayam Panggang Herba (Herb Roasted Chicken)'] || 0}
                </div>
                <div>
                  Rigatoni Bolognese: {guestStats.mealCounts['Rigatoni Bolognese'] || 0}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">Kebutuhan Diet Khusus (BEO)</div>
              <div className="text-xs font-semibold text-slate-700 mt-1.5 space-y-0.5 tabular-nums">
                <div>
                  Bebas Gluten: {guestStats.dietaryCounts['Gluten-Free']} · Vegetarian:{' '}
                  {guestStats.dietaryCounts['Vegetarian']}
                </div>
                <div>
                  Rendah Garam: {guestStats.dietaryCounts['Reduced Sodium']} · Alergi Kacang:{' '}
                  {guestStats.dietaryCounts['Nut Allergy']}
                </div>
              </div>
            </div>
          </div>

          {/* Mode Switcher: RSVP Table vs Mobile Door Check-In vs Registration & Ticketing */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setGuestMode('rsvp')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                    guestMode === 'rsvp'
                      ? 'bg-[#48a5b3] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Daftar Tamu &amp; Keluarga (RSVP)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGuestMode('checkin')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                    guestMode === 'checkin'
                      ? 'bg-[#48a5b3] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Alat Check-In Pintu (Mobile Friendly)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGuestMode('ticketing')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                    guestMode === 'ticketing'
                      ? 'bg-[#48a5b3] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Registrasi &amp; Tiket Acara Berbayar</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddGuestModal(true)}
                  className="px-4 py-1.5 rounded-full bg-[#595959] hover:bg-[#444444] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Tamu / Keluarga (+1)</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleExportCsv('daftar-tamu-rsvp.csv', [
                      ['Nama Depan', 'Nama Belakang', 'Grup/Keluarga', 'Status RSVP', 'Tambahan (+1)', 'Pilihan Menu', 'Meja'],
                      ...guests.map((g) => [
                        g.firstName,
                        g.lastName,
                        g.groupOrHousehold,
                        g.rsvpStatus,
                        String(g.plusOnes),
                        g.mealChoice,
                        g.tableId || 'Belum Diatur',
                      ]),
                    ])
                  }
                  className="px-3.5 py-1.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium cursor-pointer"
                >
                  Impor / Ekspor CSV
                </button>
              </div>
            </div>

            {guestMode === 'ticketing' ? (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Manajemen Tiket &amp; Registrasi Berbayar (Untuk Gala, Konvensi, Konser &amp; Festival)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Mendukung acara model RSVP maupun penjualan tiket online dengan pembayaran Rupiah,
                      penempatan kursi, dan check-in pintu.
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Total Pendapatan Tiket</div>
                    <div className="text-lg font-bold text-emerald-700 tabular-nums">
                      {formatIDR(
                        ticketTiers.reduce((sum, t) => sum + t.price * t.sold, 0)
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {ticketTiers.map((tier) => (
                    <div
                      key={tier.id}
                      className="p-4 rounded-xl border border-slate-200 space-y-3 flex flex-col justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">{tier.name}</div>
                        <div className="text-lg font-extrabold text-[#2b90a0] mt-1 tabular-nums">
                          {formatIDR(tier.price)} <span className="text-xs font-normal text-slate-500">/ tiket</span>
                        </div>
                        <div className="text-xs text-slate-600 mt-2 tabular-nums">
                          Terjual: <strong>{tier.sold}</strong> / {tier.capacity} kursi
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (tier.sold < tier.capacity) {
                            setTicketTiers((prev) =>
                              prev.map((t) =>
                                t.id === tier.id ? { ...t, sold: t.sold + 1 } : t
                              )
                            );
                            onNotify(`1 pesanan "${tier.name}" (${formatIDR(tier.price)}) tercatat!`);
                          }
                        }}
                        disabled={tier.sold >= tier.capacity}
                        className="w-full py-1.5 rounded-lg bg-[#48a5b3] disabled:bg-slate-300 text-white text-xs font-semibold cursor-pointer"
                      >
                        {tier.sold >= tier.capacity ? 'Habis Terjual (Sold Out)' : '+ Catat Pembelian Tiket'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : guestMode === 'checkin' ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 bg-teal-50/70 border border-teal-200 p-4 rounded-xl">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Mode Check-In Pintu Masuk (Ramah Perangkat Mobile / Tablet Penerima Tamu)
                    </h3>
                    <p className="text-xs text-slate-600">
                      Ketik nama tamu di pintu masuk, klik <strong>Check-In Hadir</strong>, dan
                      arahkan tamu langsung ke nomor meja yang tertera.
                    </p>
                  </div>
                  <div className="text-sm font-bold text-[#2b90a0] tabular-nums">
                    Sudah Check-In: {guestStats.checkedInCount} / {guestStats.attendingHeadcount}{' '}
                    Tamu
                  </div>
                </div>

                <input
                  type="text"
                  value={guestSearch}
                  onChange={(e) => setGuestSearch(e.target.value)}
                  placeholder="Cari nama tamu dengan cepat di meja penerima tamu..."
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredGuests
                    .filter((g) => g.rsvpStatus === 'Attending')
                    .map((guest) => {
                      const tableObj = floorplanTables.find((t) => t.id === guest.tableId);
                      return (
                        <div
                          key={guest.id}
                          className={`p-4 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                            guest.checkedIn
                              ? 'bg-emerald-50/60 border-emerald-300'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="text-sm font-bold text-slate-900">
                              {guest.firstName} {guest.lastName}{' '}
                              <span className="text-xs font-normal text-slate-500">
                                (+{guest.plusOnes})
                              </span>
                            </div>
                            <div className="text-xs font-bold text-[#2b90a0]">
                              Arahkan ke: {tableObj ? `Meja ${tableObj.number}` : 'Belum Ada Meja'}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                              Menu: {guest.mealChoice}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => onToggleGuestCheckIn(guest.id)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 cursor-pointer ${
                              guest.checkedIn
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-900 hover:bg-slate-700 text-white'
                            }`}
                          >
                            {guest.checkedIn ? '✓ Sudah Masuk' : 'Check-In Tamu'}
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                    {(
                      [
                        { id: 'All', label: 'Semua' },
                        { id: 'Attending', label: 'Hadir' },
                        { id: 'Pending', label: 'Menunggu' },
                        { id: 'Declined', label: 'Tidak Hadir' },
                      ] as const
                    ).map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setGuestRsvpFilter(st.id)}
                        className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer ${
                          guestRsvpFilter === st.id
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  <div className="w-full sm:w-72">
                    <input
                      type="text"
                      aria-label="Cari Tamu"
                      value={guestSearch}
                      onChange={(e) => setGuestSearch(e.target.value)}
                      placeholder="Cari tamu, keluarga, atau pilihan menu..."
                      className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:border-[#2b90a0]"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                        <th className="py-3 px-3">Nama Tamu &amp; Keluarga</th>
                        <th className="py-3 px-3">Status RSVP</th>
                        <th className="py-3 px-3 text-center">Jml (+1)</th>
                        <th className="py-3 px-3">Pilihan Menu &amp; Diet</th>
                        <th className="py-3 px-3">Meja Denah</th>
                        <th className="py-3 px-3 text-center">Check-In Pintu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                      {filteredGuests.map((guest) => (
                        <tr key={guest.id} className="hover:bg-slate-50/80">
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-800">
                              {guest.firstName} {guest.lastName}
                              {guest.isVip && (
                                <span className="ml-1.5 text-[10px] font-bold text-amber-600 uppercase">
                                  VIP
                                </span>
                              )}
                            </div>
                            <div className="text-slate-500">
                              {guest.groupOrHousehold} · {guest.email}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <select
                              aria-label={`Status RSVP untuk ${guest.firstName} ${guest.lastName}`}
                              value={guest.rsvpStatus}
                              onChange={(e) =>
                                onUpdateGuestRsvp(guest.id, e.target.value as RsvpStatus)
                              }
                              className="px-2.5 py-1 rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-700 cursor-pointer"
                            >
                              <option value="Attending">Hadir (Attending)</option>
                              <option value="Pending">Menunggu (Pending)</option>
                              <option value="Declined">Tidak Hadir</option>
                            </select>
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-slate-800 tabular-nums">
                            {1 + guest.plusOnes} org
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-medium text-slate-800">
                              {guest.mealChoice || '—'}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Diet: {guest.dietaryRestrictions.join(', ')}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <select
                              aria-label={`Meja untuk ${guest.firstName} ${guest.lastName}`}
                              value={guest.tableId || ''}
                              disabled={guest.rsvpStatus !== 'Attending'}
                              onChange={(e) =>
                                onAssignGuestToTable(guest.id, e.target.value || null)
                              }
                              className="px-2.5 py-1 rounded-md border border-slate-200 bg-white text-xs text-slate-700 cursor-pointer disabled:opacity-50"
                            >
                              <option value="">Belum Ada Meja</option>
                              {floorplanTables.map((t) => (
                                <option key={t.id} value={t.id}>
                                  Meja {t.number} ({t.seats} kursi)
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => onToggleGuestCheckIn(guest.id)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                                guest.checkedIn
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>{guest.checkedIn ? 'Sudah Hadir' : 'Check In'}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-VIEW 4: FLOORPLAN & SEATING (Matches image_661568b8.png)          */}
      {/* ===================================================================== */}
      {subView === 'floorplan' && (
        <FloorplanCanvas
          tables={floorplanTables}
          guests={guests}
          onAddTable={onAddFloorplanTable}
          onAssignGuestToTable={onAssignGuestToTable}
          onResetFloorplan={onResetFloorplan}
          onAutoLayoutGrid={(rows, cols, seats) => {
            onAutoLayoutFloorplan(rows, cols, seats);
            onNotify(
              `Denah Ballroom otomatis disusun menjadi grid ${rows}x${cols} meja (${seats} kursi/meja).`
            );
          }}
          clientCanEdit={clientCanEditFloorplan}
          onToggleClientCanEdit={() => {
            setClientCanEditFloorplan((prev) => !prev);
            onNotify(
              !clientCanEditFloorplan
                ? 'Portal Klien diizinkan mengedit denah & menempatkan kursi tamu.'
                : 'Portal Klien diatur ke mode Hanya Lihat (View-Only).'
            );
          }}
        />
      )}

      {/* ===================================================================== */}
      {/* SUB-VIEW 5: EVENT BUDGETS / ANGGARAN ACARA (Point 1 — Rupiah IDR)     */}
      {/* ===================================================================== */}
      {subView === 'budgets' && (
        <div className="space-y-5">
          {/* Budget Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">Total Estimasi Anggaran</div>
              <div className="text-lg font-bold text-slate-800 mt-1 tabular-nums">
                {formatIDR(budgetStats.totalEstimated)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Pagu awal perencanaan</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">Biaya Hasil Negosiasi</div>
              <div className="text-lg font-bold text-[#2b90a0] mt-1 tabular-nums">
                {formatIDR(budgetStats.totalNegotiated)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Kesepakatan harga vendor</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">Total Biaya Aktual</div>
              <div className="text-lg font-bold text-slate-900 mt-1 tabular-nums">
                {formatIDR(budgetStats.totalActual)}
              </div>
              <div
                className={`text-[11px] font-semibold mt-0.5 ${
                  budgetStats.isOverBudget ? 'text-red-600' : 'text-emerald-700'
                }`}
              >
                {budgetStats.isOverBudget
                  ? `Melebihi Anggaran (${formatIDR(Math.abs(budgetStats.varianceAmount))})`
                  : `Hemat / Di Bawah Anggaran (${formatIDR(budgetStats.varianceAmount)})`}
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">Total Telah Dibayar</div>
              <div className="text-lg font-bold text-emerald-700 mt-1 tabular-nums">
                {formatIDR(budgetStats.totalPaid)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Progres pelunasan: {budgetStats.paidPercentage}%
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">Sisa Tagihan (Remaining Due)</div>
              <div className="text-lg font-bold text-amber-700 mt-1 tabular-nums">
                {formatIDR(budgetStats.totalRemainingDue)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Tersinkronisasi dengan Faktur</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Manajemen Anggaran Acara Terpadu (Estimasi, Negosiasi, Aktual &amp; Jatuh Tempo)
                </h2>
                <p className="text-xs text-slate-500">
                  Pantau progres anggaran, tugaskan manajer &amp; vendor (florist, katering, venue,
                  fotografer), dan bagikan dengan klien di Portal Klien.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddBudgetModal(true)}
                  className="px-4 py-2 rounded-full bg-[#48a5b3] hover:bg-[#3d919e] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Item Anggaran</span>
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>
                  Progres Pembayaran Aktual ({budgetStats.paidPercentage}% Lunas)
                </span>
                <span>
                  {formatIDR(budgetStats.totalPaid)} dari {formatIDR(budgetStats.totalActual)}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#48a5b3] transition-all"
                  style={{ width: `${budgetStats.paidPercentage}%` }}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                    <th className="py-3 px-3">Pos Anggaran &amp; Kategori</th>
                    <th className="py-3 px-3">Vendor &amp; PIC</th>
                    <th className="py-3 px-3 text-right">Estimasi</th>
                    <th className="py-3 px-3 text-right">Negosiasi</th>
                    <th className="py-3 px-3 text-right">Aktual</th>
                    <th className="py-3 px-3 text-right">Dibayar</th>
                    <th className="py-3 px-3 text-right">Sisa Tagihan</th>
                    <th className="py-3 px-3 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {budgetItems.map((b) => {
                    const rem = Math.max(0, b.actualCost - b.paidAmount);
                    const linkedVen = vendors.find((v) => v.id === b.vendorId);
                    return (
                      <tr key={b.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-800">{b.title}</div>
                          <div className="text-[11px] text-slate-500">
                            {b.category} · Jatuh Tempo: {b.dueDate}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-700">
                            {linkedVen ? linkedVen.company : 'Internal Venue'}
                          </div>
                          <div className="text-[11px] text-slate-500">PIC: {b.managerName}</div>
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums text-slate-600">
                          {formatIDR(b.estimatedCost)}
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums text-slate-700">
                          {formatIDR(b.negotiatedCost)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold tabular-nums text-slate-900">
                          {formatIDR(b.actualCost)}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold tabular-nums text-emerald-700">
                          {formatIDR(b.paidAmount)}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold tabular-nums text-amber-700">
                          {formatIDR(rem)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {rem > 0 ? (
                            <button
                              type="button"
                              onClick={() => {
                                const pay = Math.min(rem, 15000000);
                                onRecordBudgetPayment(b.id, pay);
                                onNotify(
                                  `Pembayaran anggaran ${formatIDR(pay)} untuk "${b.title}" tercatat.`
                                );
                              }}
                              className="px-2.5 py-1 rounded-full bg-[#48a5b3] text-white text-[11px] font-semibold cursor-pointer whitespace-nowrap"
                            >
                              + Bayar Termin
                            </button>
                          ) : (
                            <span className="text-emerald-700 font-bold text-[11px]">✓ Lunas</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-VIEW 6: FOOD PACKAGE & BEO DOCUMENTS (Matches image_3ffaa971.png) */}
      {/* ===================================================================== */}
      {subView === 'food-package' && (
        <div className="space-y-5">
          <div className="text-xs text-[#2b90a0] font-medium flex items-center gap-1">
            <button
              type="button"
              onClick={() => onChangeSubView('itinerary')}
              className="hover:underline cursor-pointer"
            >
              ← Kembali ke Daftar Paket Katering
            </button>
          </div>

          {/* Action Buttons Row + BEO Document Switcher (Point 5) */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddFoodModal(true)}
                className="px-4 py-1.5 rounded-full bg-[#595959] hover:bg-[#444444] text-white text-xs font-medium cursor-pointer"
              >
                + Tambah Menu Hidangan
              </button>
              <button
                type="button"
                onClick={() => {
                  onPushFoodPackageToProposal();
                  onNotify(
                    'Paket Makan Malam Platinum berhasil ditambahkan ke Proposal & Faktur (IDR)!'
                  );
                }}
                className="px-3.5 py-1.5 rounded-full bg-[#48a5b3] hover:bg-[#3d919e] text-white text-xs font-semibold cursor-pointer"
              >
                + Masukkan Paket ke Proposal &amp; Faktur
              </button>
              <button
                type="button"
                onClick={() => {
                  setBeoClientSigned(true);
                  onNotify('Dokumen BEO telah ditandatangani & disetujui secara elektronik!');
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
                  beoClientSigned
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {beoClientSigned
                  ? '✓ BEO Disetujui & Ditandatangani Klien'
                  : 'Tanda Tangani Persetujuan BEO'}
              </button>
            </div>

            {/* BEO Document Mode Switcher: Master BEO, Kitchen Sheet, Delivery Order */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
              {(
                [
                  { id: 'master', label: 'Master BEO' },
                  { id: 'kitchen', label: 'Lembar Dapur (Kitchen Sheet)' },
                  { id: 'delivery', label: 'Surat Jalan (Delivery Order)' },
                ] as const
              ).map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setBeoDocType(doc.id)}
                  className={`px-3 py-1 rounded-lg font-semibold cursor-pointer ${
                    beoDocType === doc.id
                      ? 'bg-[#48a5b3] text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {doc.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">{activeEvent.foodPackageName}</h2>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium mt-1">
              <Link2 className="w-3.5 h-3.5" />
              <span>
                Terhubung Otomatis ke Banquet Event Order (BEO) · {guestStats.attendingHeadcount}{' '}
                Porsi Tamu Terkonfirmasi
              </span>
            </div>
          </div>

          {beoDocType !== 'master' && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs text-slate-700 space-y-1">
              <div className="font-bold text-slate-900">
                {beoDocType === 'kitchen'
                  ? 'LEMBAR KERJA DAPUR (KITCHEN SHEET) — INSTRUKSI CHEF & KOMPOSISI RESEP'
                  : 'SURAT JALAN PENGIRIMAN & PERALATAN SAJI (DELIVERY ORDER)'}
              </div>
              <p>
                Data ditarik otomatis dari Acara <strong>{activeEvent.title}</strong> ({activeEvent.date}
                , Jam Saji Utama: 18:15 WIB di {activeEvent.venueName}) tanpa perlu input ulang.
              </p>
            </div>
          )}

          {/* 2-Column Layout: Left Menu Items Card + Right Additional Notes Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-6">
              {/* Entree Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-[#2b90a0]" />
                    <h3 className="text-base font-bold text-slate-800">Hidangan Utama (Entree)</h3>
                  </div>
                  <span className="text-xs text-slate-500">Waktu Penyajian: 18:15 WIB</span>
                </div>

                <div className="divide-y divide-slate-200">
                  {foodItems
                    .filter((f) => f.category === 'Entree')
                    .map((item) => (
                      <div key={item.id} className="py-4 flex items-start gap-4">
                        <FoodDishThumbnail type={item.imageType} />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-bold text-slate-900">{item.name}</div>
                            <span className="text-xs font-bold text-[#2b90a0] tabular-nums">
                              {formatIDR(item.pricePerPerson)} / porsi
                            </span>
                          </div>
                          <div className="text-xs italic text-slate-500">{item.description}</div>
                          {beoDocType === 'kitchen' && (
                            <div className="text-[11px] bg-slate-50 p-2 rounded border border-slate-200 text-slate-700">
                              <strong>Resep &amp; Porsi Dapur:</strong>{' '}
                              {guestStats.mealCounts[item.name] || 8} porsi pesanan tamu ·{' '}
                              {item.dietaryNotes || 'Standar BEO'}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => onRemoveFoodItem(item.id)}
                            className="text-xs text-[#2b90a0] hover:underline font-medium pt-0.5 inline-block cursor-pointer"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Side Dish Section */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-rose-500" />
                    <h3 className="text-base font-bold text-slate-800">
                      Hidangan Pendamping (Side Dish)
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500">Disajikan bersama Hidangan Utama</span>
                </div>

                <div className="divide-y divide-slate-200">
                  {foodItems
                    .filter((f) => f.category === 'Side Dish')
                    .map((item) => (
                      <div key={item.id} className="py-4 flex items-start gap-4">
                        <FoodDishThumbnail type={item.imageType} />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-bold text-slate-900">{item.name}</div>
                            <span className="text-xs font-bold text-[#2b90a0] tabular-nums">
                              {formatIDR(item.pricePerPerson)} / porsi
                            </span>
                          </div>
                          <div className="text-xs italic text-slate-500">{item.description}</div>
                          <button
                            type="button"
                            onClick={() => onRemoveFoodItem(item.id)}
                            className="text-xs text-[#2b90a0] hover:underline font-medium pt-0.5 inline-block cursor-pointer"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Right Additional Notes Card matching image_3ffaa971.png */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-600" />
                  <h3 className="text-sm font-bold text-slate-800">Catatan Tambahan &amp; BEO</h3>
                </div>
                <button
                  type="button"
                  aria-label="Edit Catatan Paket Makanan"
                  onClick={() => setEditingNotes((e) => !e)}
                  className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>

              {editingNotes ? (
                <div className="space-y-2">
                  <textarea
                    rows={5}
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#2b90a0]"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingNotes(false)}
                      className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateEventNotes(activeEvent.id, notesDraft);
                        setEditingNotes(false);
                      }}
                      className="px-3 py-1 rounded-full bg-[#48a5b3] text-white text-xs font-medium"
                    >
                      Simpan Catatan
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-700 leading-relaxed">
                  {activeEvent.foodPackageNotes}
                </p>
              )}

              {/* Live Synced Count Box from Guest List */}
              <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                <div className="font-bold text-slate-800">
                  Jumlah Porsi RSVP Tersinkronisasi Langsung:
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Bebas Gluten (Gluten-Free):</span>
                  <span className="font-bold text-slate-800 tabular-nums">
                    {guestStats.dietaryCounts['Gluten-Free']} tamu
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Vegetarian:</span>
                  <span className="font-bold text-slate-800 tabular-nums">
                    {guestStats.dietaryCounts['Vegetarian']} tamu
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Rendah Garam (Reduced Sodium):</span>
                  <span className="font-bold text-slate-800 tabular-nums">
                    {guestStats.dietaryCounts['Reduced Sodium']} tamu
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-VIEW 7: TO-DO'S / MANAJEMEN TUGAS (Point 1)                       */}
      {/* ===================================================================== */}
      {subView === 'todos' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Daftar Tugas Acara &amp; Linimasa Mundur Otomatis ({todos.length})
              </h2>
              <p className="text-xs text-slate-500">
                Tenggat waktu dihitung mundur otomatis dari tanggal pernikahan · Pengingat Email/SMS
                &amp; lampiran berkas · Tersedia juga di Portal Klien
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onImportWeddingTodoTemplate();
                onNotify(
                  'Templat Ceklis Tugas Pernikahan berhasil diimpor dengan tenggat waktu mundur otomatis!'
                );
              }}
              className="px-4 py-2 rounded-full bg-[#48a5b3] hover:bg-[#3d919e] text-white text-xs font-semibold cursor-pointer"
            >
              + Impor Templat Tugas Pernikahan
            </button>
          </div>
          <div className="divide-y divide-slate-200">
            {todos.map((td) => (
              <div
                key={td.id}
                className="py-4 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    aria-label={`Tandai ${td.title} selesai`}
                    checked={td.completed}
                    onChange={() => onToggleTodo(td.id)}
                    className="mt-1 rounded border-slate-300 text-[#2b90a0]"
                  />
                  <div>
                    <div
                      className={`text-sm font-bold ${
                        td.completed ? 'line-through text-slate-400' : 'text-slate-800'
                      }`}
                    >
                      {td.title}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{td.description}</p>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Ditugaskan kepada: {td.contactNames.join(', ')} · Pengingat: {td.reminderText}
                    </div>
                    {td.fileName && (
                      <div className="text-[11px] text-[#2b90a0] font-semibold mt-1 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>Lampiran: {td.fileName}</span>
                      </div>
                    )}
                  </div>
                </div>
                <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                  {td.dueRule} ({td.dueDate})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-VIEW 8: WEDDING WEBSITE, ONLINE RSVP & SEO TOOLS (Point 1 & 4)    */}
      {/* ===================================================================== */}
      {subView === 'website' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Live Preview of Couple's Wedding Website */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div
              className="p-8 text-white text-center space-y-3"
              style={{ backgroundColor: websiteConfig.themeColor || '#3b9eae' }}
            >
              <div className="text-xs uppercase tracking-[0.25em] opacity-90">
                WEBSITE PERNIKAHAN RESMI &amp; RSVP ONLINE
              </div>
              <h2 className="text-3xl font-bold">{websiteConfig.heroTitle}</h2>
              <p className="text-xs max-w-xl mx-auto opacity-95 leading-relaxed">
                {websiteConfig.welcomeMessage}
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-2 text-[11px]">
                <span className="px-3 py-1 rounded-full bg-white/20">
                  {websiteConfig.ceremonyTimeLocation}
                </span>
                <span className="px-3 py-1 rounded-full bg-white/20">
                  {websiteConfig.receptionTimeLocation}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="font-bold text-slate-800">
                  Kode Busana (Dress Code): {websiteConfig.dressCode}
                </div>
                <div className="text-slate-600">
                  Batas Konfirmasi RSVP: <strong>{websiteConfig.rsvpDeadline}</strong>
                </div>
              </div>

              {/* Online Guest RSVP Form */}
              <div className="border border-slate-200 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-800">
                  Formulir RSVP Online Tamu (Langsung Masuk ke Daftar Tamu &amp; BEO)
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <input
                    type="text"
                    value={webGuestFirst}
                    onChange={(e) => setWebGuestFirst(e.target.value)}
                    placeholder="Nama Depan Anda"
                    className="px-3 py-2 border border-slate-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={webGuestLast}
                    onChange={(e) => setWebGuestLast(e.target.value)}
                    placeholder="Nama Belakang"
                    className="px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="text-xs">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Pilihan Hidangan Utama (Paket Makan Malam Platinum)
                  </label>
                  <select
                    value={webGuestMeal}
                    onChange={(e) => setWebGuestMeal(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Ayam Panggang Herba (Herb Roasted Chicken)">
                      Ayam Panggang Herba (Herb Roasted Chicken)
                    </option>
                    <option value="Rigatoni Bolognese">Rigatoni Bolognese</option>
                  </select>
                </div>
                <div className="text-xs">
                  <label className="block font-semibold text-slate-700 mb-1">
                    {websiteConfig.customRsvpQuestion}
                  </label>
                  <input
                    type="text"
                    value={webGuestAnswer}
                    onChange={(e) => setWebGuestAnswer(e.target.value)}
                    placeholder="Tulis jawaban Anda..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!webGuestFirst.trim()) return;
                    onAddGuest({
                      eventId: activeEvent.id,
                      firstName: webGuestFirst.trim(),
                      lastName: webGuestLast.trim() || 'Tamu',
                      email: `${webGuestFirst.toLowerCase()}@tamu.id`,
                      phone: '0812-8888-9999',
                      groupOrHousehold: 'RSVP Website Online',
                      rsvpStatus: 'Attending',
                      plusOnes: 0,
                      mealChoice: webGuestMeal,
                      dietaryRestrictions: ['None'],
                      customQuestionResponse: webGuestAnswer,
                      tableId: 'tbl-1014',
                      isVip: false,
                      checkedIn: false,
                    });
                    setWebGuestFirst('');
                    setWebGuestLast('');
                    setWebGuestAnswer('');
                    onNotify('Konfirmasi RSVP Online berhasil dikirim dan masuk ke Daftar Tamu!');
                  }}
                  className="px-4 py-2 rounded-full bg-[#48a5b3] text-white text-xs font-semibold cursor-pointer"
                >
                  Kirim Konfirmasi Kehadiran (RSVP Online)
                </button>
              </div>

              {/* Social Media Sharing Buttons */}
              {websiteConfig.socialSharingEnabled && (
                <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-[#2b90a0]" />
                    <span>Bagikan Halaman Acara ke Media Sosial:</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {['Facebook', 'X (Twitter)', 'LinkedIn', 'WhatsApp'].map((net) => (
                      <button
                        key={net}
                        type="button"
                        onClick={() =>
                          onNotify(`Membagikan tautan website acara ke ${net}!`)
                        }
                        className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium cursor-pointer"
                      >
                        {net}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right SEO Tools & Website Settings */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <Globe className="w-5 h-5 text-[#2b90a0]" />
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Pengaturan Website Acara, SEO &amp; Berbagi Sosial
                </h3>
                <p className="text-[11px] text-slate-500">
                  URL: https://acara.healplanning.id/{websiteConfig.slug}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Judul Utama Website Acara
                </label>
                <input
                  type="text"
                  value={websiteConfig.heroTitle}
                  onChange={(e) =>
                    onUpdateWebsiteConfig({ ...websiteConfig, heroTitle: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Judul Meta SEO (Search Engine Optimization)
                </label>
                <input
                  type="text"
                  value={websiteConfig.seoTitle}
                  onChange={(e) =>
                    onUpdateWebsiteConfig({ ...websiteConfig, seoTitle: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Deskripsi Meta SEO
                </label>
                <textarea
                  rows={3}
                  value={websiteConfig.seoDescription}
                  onChange={(e) =>
                    onUpdateWebsiteConfig({ ...websiteConfig, seoDescription: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pertanyaan Kustom RSVP Online
                </label>
                <input
                  type="text"
                  value={websiteConfig.customRsvpQuestion}
                  onChange={(e) =>
                    onUpdateWebsiteConfig({
                      ...websiteConfig,
                      customRsvpQuestion: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  onNotify('Pengaturan SEO & Website Pernikahan berhasil disimpan!')
                }
                className="w-full py-2 rounded-full bg-[#48a5b3] text-white font-semibold cursor-pointer"
              >
                Simpan Pengaturan Website &amp; SEO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-VIEW 9: VISION / INSPIRATION BOARDS (Point 1)                     */}
      {/* ===================================================================== */}
      {subView === 'vision-board' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#2b90a0]" />
                <span>Papan Visi &amp; Inspirasi Kolaboratif (Vision Board)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Brainstorming visual bersama tim dan klien · Kelompokkan berdasarkan kategori dan
                tambahkan komentar langsung pada setiap foto konsep.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {['Semua', 'Dekorasi & Bunga', 'Busana & Rias', 'Kue & Katering', 'Pencahayaan & Panggung'].map(
                (cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setVisionCatFilter(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
                      visionCatFilter === cat
                        ? 'bg-[#48a5b3] text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => setShowAddVisionModal(true)}
                className="px-4 py-1.5 rounded-full bg-[#595959] text-white text-xs font-semibold cursor-pointer"
              >
                + Unggah Inspirasi Baru
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visionItems
              .filter((v) => visionCatFilter === 'Semua' || v.category === visionCatFilter)
              .map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* Visual Moodboard Header Banner */}
                    <div className="h-36 bg-gradient-to-r from-slate-800 via-[#2b90a0] to-teal-700 p-5 flex flex-col justify-between text-white">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-semibold">
                          {item.category}
                        </span>
                        <span className="text-[11px] opacity-85">Oleh: {item.uploadedBy}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold">{item.title}</h3>
                        <div className="flex items-center gap-1">
                          {item.paletteColors.map((col, idx) => (
                            <span
                              key={idx}
                              className="w-5 h-5 rounded-full border border-white/60 shadow-2xs"
                              style={{ backgroundColor: col }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>

                      {/* Comments Section */}
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Komentar Tim &amp; Klien ({item.comments.length})</span>
                        </div>
                        {item.comments.map((c) => (
                          <div
                            key={c.id}
                            className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800">
                                {c.author} ({c.role})
                              </span>
                              <span className="text-[10px] text-slate-400">{c.timestamp}</span>
                            </div>
                            <p className="text-slate-600 mt-1">{c.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Add Comment Bar */}
                  <div className="px-5 pb-5 pt-2 flex items-center gap-2">
                    <input
                      type="text"
                      value={commentDrafts[item.id] || ''}
                      onChange={(e) =>
                        setCommentDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      placeholder="Tulis komentar atau catatan revisi desain..."
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-full"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const txt = (commentDrafts[item.id] || '').trim();
                        if (!txt) return;
                        onAddVisionComment(item.id, txt);
                        setCommentDrafts((prev) => ({ ...prev, [item.id]: '' }));
                      }}
                      className="px-3.5 py-1.5 rounded-full bg-[#48a5b3] text-white text-xs font-semibold cursor-pointer"
                    >
                      Kirim
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODALS                                                                */}
      {/* ===================================================================== */}
      {showAddItineraryModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-itinerary-modal-title"
          className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 id="add-itinerary-modal-title" className="text-base font-bold text-slate-800">
              Tambah Item Rundown &amp; Pergeseran Waktu Otomatis
            </h3>
            <form onSubmit={handleAddItinerarySubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Judul Kegiatan Rundown
                </label>
                <input
                  type="text"
                  value={itTitle}
                  onChange={(e) => setItTitle(e.target.value)}
                  placeholder="Misal: Sesi Foto Keluarga Inti di Gazebo"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Waktu Mulai
                  </label>
                  <input
                    type="text"
                    value={itStartTime}
                    onChange={(e) => setItStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori
                  </label>
                  <select
                    value={itCategory}
                    onChange={(e) =>
                      setItCategory(e.target.value as 'Ceremony' | 'Reception' | 'Setup/Prep')
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Ceremony">Upacara / Akad</option>
                    <option value="Reception">Resepsi</option>
                    <option value="Setup/Prep">Persiapan / Setup</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tugaskan Vendor
                  </label>
                  <select
                    value={itVendorId}
                    onChange={(e) => setItVendorId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} — {v.company}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Geser Jadwal Berikutnya
                  </label>
                  <select
                    value={itAutoShiftMins}
                    onChange={(e) => setItAutoShiftMins(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="0">Tanpa Geser (0 mnt)</option>
                    <option value="15">Maju +15 Menit</option>
                    <option value="30">Maju +30 Menit</option>
                    <option value="-15">Mundur -15 Menit</option>
                  </select>
                </div>
              </div>
              {itError && <p className="text-xs text-red-600">{itError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddItineraryModal(false)}
                  className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-full bg-[#48a5b3] text-white text-xs font-medium cursor-pointer"
                >
                  Simpan ke Rundown
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddVendorModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-vendor-modal-title"
          className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 id="add-vendor-modal-title" className="text-base font-bold text-slate-800">
              Tambah Vendor Acara &amp; Kontrak (IDR)
            </h3>
            <form onSubmit={handleAddVendorSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Perusahaan Vendor
                </label>
                <input
                  type="text"
                  value={venCompany}
                  onChange={(e) => setVenCompany(e.target.value)}
                  placeholder="Misal: Nusantara Sound & Lighting"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Kontak Utama
                </label>
                <input
                  type="text"
                  value={venName}
                  onChange={(e) => setVenName(e.target.value)}
                  placeholder="Misal: Hendra Wijaya"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori Layanan
                  </label>
                  <select
                    value={venCategory}
                    onChange={(e) => setVenCategory(e.target.value as Vendor['category'])}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Decor & Floral">Dekorasi &amp; Bunga</option>
                    <option value="Catering">Katering</option>
                    <option value="Rentals">Sewa Peralatan</option>
                    <option value="Photography">Fotografi &amp; Video</option>
                    <option value="Entertainment">Hiburan &amp; Musik</option>
                    <option value="Transport">Transportasi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nilai Kontrak (Rp)
                  </label>
                  <input
                    type="number"
                    value={venContractAmount}
                    onChange={(e) => setVenContractAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Waktu Tiba (Load-In)
                  </label>
                  <input
                    type="text"
                    value={venArrivalTime}
                    onChange={(e) => setVenArrivalTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Vendor
                  </label>
                  <input
                    type="email"
                    value={venEmail}
                    onChange={(e) => setVenEmail(e.target.value)}
                    placeholder="vendor@example.com"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              {venError && <p className="text-xs text-red-600">{venError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddVendorModal(false)}
                  className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-full bg-[#48a5b3] text-white text-xs font-medium cursor-pointer"
                >
                  Simpan Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddGuestModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-guest-modal-title"
          className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 id="add-guest-modal-title" className="text-base font-bold text-slate-800">
              Tambah Tamu / Grup Keluarga ke Daftar RSVP
            </h3>
            <form onSubmit={handleAddGuestSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Depan
                  </label>
                  <input
                    type="text"
                    value={gFirstName}
                    onChange={(e) => setGFirstName(e.target.value)}
                    placeholder="Misal: Budi"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Belakang
                  </label>
                  <input
                    type="text"
                    value={gLastName}
                    onChange={(e) => setGLastName(e.target.value)}
                    placeholder="Misal: Santoso"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status RSVP
                  </label>
                  <select
                    value={gRsvp}
                    onChange={(e) => setGRsvp(e.target.value as RsvpStatus)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Attending">Hadir (Attending)</option>
                    <option value="Pending">Menunggu (Pending)</option>
                    <option value="Declined">Tidak Hadir</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tambahan Tamu (+1)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="6"
                    value={gPlusOnes}
                    onChange={(e) => setGPlusOnes(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pilihan Menu BEO
                  </label>
                  <select
                    value={gMeal}
                    onChange={(e) => setGMeal(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Ayam Panggang Herba (Herb Roasted Chicken)">
                      Ayam Panggang Herba
                    </option>
                    <option value="Rigatoni Bolognese">Rigatoni Bolognese</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kebutuhan Diet Khusus
                  </label>
                  <select
                    value={gDietary}
                    onChange={(e) => setGDietary(e.target.value as DietaryTag)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="None">Tidak Ada</option>
                    <option value="Gluten-Free">Bebas Gluten</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Reduced Sodium">Rendah Garam</option>
                    <option value="Nut Allergy">Alergi Kacang</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tempatkan di Meja Denah
                </label>
                <select
                  value={gTableId}
                  onChange={(e) => setGTableId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  {floorplanTables.map((t) => (
                    <option key={t.id} value={t.id}>
                      Meja {t.number} ({t.seats} kursi)
                    </option>
                  ))}
                </select>
              </div>
              {gError && <p className="text-xs text-red-600">{gError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddGuestModal(false)}
                  className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-full bg-[#48a5b3] text-white text-xs font-medium cursor-pointer"
                >
                  Simpan Tamu &amp; Sinkronkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddFoodModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-food-modal-title"
          className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 id="add-food-modal-title" className="text-base font-bold text-slate-800">
              Tambah Hidangan ke Paket Katering &amp; BEO
            </h3>
            <form onSubmit={handleAddFoodSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Hidangan
                </label>
                <input
                  type="text"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  placeholder="Misal: Salmon Panggang Saus Lemon Butter"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori
                  </label>
                  <select
                    value={foodCategory}
                    onChange={(e) => setFoodCategory(e.target.value as 'Entree' | 'Side Dish')}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Entree">Hidangan Utama (Entree)</option>
                    <option value="Side Dish">Hidangan Pendamping (Side Dish)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Harga per Porsi (Rp)
                  </label>
                  <input
                    type="number"
                    value={foodPrice}
                    onChange={(e) => setFoodPrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi &amp; Komposisi Bahan
                </label>
                <input
                  type="text"
                  value={foodDesc}
                  onChange={(e) => setFoodDesc(e.target.value)}
                  placeholder="Fillet salmon Norwegia dengan saus mentega lemon herba"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddFoodModal(false)}
                  className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-full bg-[#48a5b3] text-white text-xs font-medium cursor-pointer"
                >
                  Tambahkan ke Paket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddBudgetModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-budget-modal-title"
          className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 id="add-budget-modal-title" className="text-base font-bold text-slate-800">
              Tambah Pos Anggaran Acara (IDR)
            </h3>
            <form onSubmit={handleAddBudgetSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Item Anggaran</label>
                <input
                  type="text"
                  value={bTitle}
                  onChange={(e) => setBTitle(e.target.value)}
                  placeholder="Misal: Sewa Kuartet Musik Akustik & Sound System"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={bCat}
                    onChange={(e) => setBCat(e.target.value as BudgetLineItem['category'])}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Venue & Katering">Venue &amp; Katering</option>
                    <option value="Dekorasi & Florist">Dekorasi &amp; Florist</option>
                    <option value="Dokumentasi & Hiburan">Dokumentasi &amp; Hiburan</option>
                    <option value="Busana & Rias">Busana &amp; Rias</option>
                    <option value="Koordinasi & Logistik">Koordinasi &amp; Logistik</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jatuh Tempo</label>
                  <input
                    type="date"
                    value={bDue}
                    onChange={(e) => setBDue(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Biaya Estimasi (Rp)</label>
                  <input
                    type="number"
                    value={bEst}
                    onChange={(e) => setBEst(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Biaya Negosiasi (Rp)</label>
                  <input
                    type="number"
                    value={bNeg}
                    onChange={(e) => setBNeg(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Biaya Aktual (Rp)</label>
                  <input
                    type="number"
                    value={bAct}
                    onChange={(e) => setBAct(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sudah Dibayar (Rp)</label>
                  <input
                    type="number"
                    value={bPaid}
                    onChange={(e) => setBPaid(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBudgetModal(false)}
                  className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-full bg-[#48a5b3] text-white font-medium cursor-pointer"
                >
                  Simpan Anggaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddVisionModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-vision-modal-title"
          className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 id="add-vision-modal-title" className="text-base font-bold text-slate-800">
              Unggah Kartu Inspirasi Baru (Vision Board)
            </h3>
            <form onSubmit={handleAddVisionSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Judul Konsep Visual</label>
                <input
                  type="text"
                  value={vbTitle}
                  onChange={(e) => setVbTitle(e.target.value)}
                  placeholder="Misal: Dekorasi Lorong Masuk dengan Lilin Lentera"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                <select
                  value={vbCat}
                  onChange={(e) => setVbCat(e.target.value as VisionBoardItem['category'])}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Dekorasi & Bunga">Dekorasi &amp; Bunga</option>
                  <option value="Busana & Rias">Busana &amp; Rias</option>
                  <option value="Kue & Katering">Kue &amp; Katering</option>
                  <option value="Pencahayaan & Panggung">Pencahayaan &amp; Panggung</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deskripsi Konsep</label>
                <textarea
                  rows={3}
                  value={vbDesc}
                  onChange={(e) => setVbDesc(e.target.value)}
                  placeholder="Jelaskan detail warna, bunga, atau pencahayaan yang diinginkan..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddVisionModal(false)}
                  className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-full bg-[#48a5b3] text-white font-medium cursor-pointer"
                >
                  Simpan ke Papan Visi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
