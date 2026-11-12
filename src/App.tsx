import React, { useState, useEffect } from 'react';
import {
  Home, Calendar, CalendarDays, Users, Mail, Compass, FileText,
  DollarSign, FileSignature, PieChart, Layers, ChevronLeft, ChevronRight,
  HelpCircle, RotateCcw, ExternalLink, Bell, Menu, X, Settings, UserCheck
} from 'lucide-react';
import {
  NavSection, EventSubView, PlannerEvent, EventStatus, Vendor, GuestItem, RsvpStatus,
  ItineraryItem, FloorplanTable, FoodPackageItem, ProposalLineItem,
  TodoTask, CommunicationMessage, VenueSpace, PersonalCalendar,
  BudgetLineItem, VisionBoardItem, WeddingWebsiteConfig, ContactPerson
} from './types/planner';
import {
  INITIAL_EVENTS, INITIAL_VENDORS, INITIAL_CONTACTS, INITIAL_GUESTS,
  INITIAL_ITINERARY_ITEMS, INITIAL_FLOORPLAN_TABLES, INITIAL_FOOD_PACKAGE_ITEMS,
  INITIAL_PROPOSAL_ITEMS, INITIAL_TODOS, INITIAL_MESSAGES,
  INITIAL_VENUE_SPACES, INITIAL_PERSONAL_CALENDARS,
  INITIAL_BUDGET_ITEMS, INITIAL_VISION_BOARD_ITEMS, INITIAL_WEBSITE_CONFIG
} from './data/seedData';
import { HomeDashboardView } from './components/HomeDashboardView';
import { CalendarsView } from './components/CalendarsView';
import { EventsWorkspaceView } from './components/EventsWorkspaceView';
import { LeadsAndProposalsView } from './components/LeadsAndProposalsView';
import { CommsTemplatesPortalView } from './components/CommsTemplatesPortalView';
import { shiftItineraryTimes, generateAutoGridFloorplan, formatIDR } from './utils/plannerLogic';

const STORAGE_KEY = 'heal_planning_nusa_tara_v5';

export function App() {
  // Navigation state
  const [activeNav, setActiveNav] = useState<NavSection>('home');
  const [eventSubView, setEventSubView] = useState<EventSubView>('itinerary');
  const [selectedEventId, setSelectedEventId] = useState<string>(INITIAL_EVENTS[0]?.id || 'ev-johnson-wedding');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Core interconnected state
  const [events, setEvents] = useState<PlannerEvent[]>(INITIAL_EVENTS);
  const [vendors, setVendors] = useState<Vendor[]>(INITIAL_VENDORS);
  const [contacts, setContacts] = useState<ContactPerson[]>(INITIAL_CONTACTS);
  const [guests, setGuests] = useState<GuestItem[]>(INITIAL_GUESTS);
  const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>(INITIAL_ITINERARY_ITEMS);
  const [floorplanTables, setFloorplanTables] = useState<FloorplanTable[]>(INITIAL_FLOORPLAN_TABLES);
  const [foodItems, setFoodItems] = useState<FoodPackageItem[]>(INITIAL_FOOD_PACKAGE_ITEMS);
  const [proposalItems, setProposalItems] = useState<ProposalLineItem[]>(INITIAL_PROPOSAL_ITEMS);
  const [serviceCharge, setServiceCharge] = useState<number>(36138700);
  const [todos, setTodos] = useState<TodoTask[]>(INITIAL_TODOS);
  const [messages, setMessages] = useState<CommunicationMessage[]>(INITIAL_MESSAGES);
  const [venues, setVenues] = useState<VenueSpace[]>(INITIAL_VENUE_SPACES);
  const [personalCalendars, setPersonalCalendars] = useState<PersonalCalendar[]>(INITIAL_PERSONAL_CALENDARS);
  const [budgetItems, setBudgetItems] = useState<BudgetLineItem[]>(INITIAL_BUDGET_ITEMS);
  const [visionItems, setVisionItems] = useState<VisionBoardItem[]>(INITIAL_VISION_BOARD_ITEMS);
  const [websiteConfig, setWebsiteConfig] = useState<WeddingWebsiteConfig>(INITIAL_WEBSITE_CONFIG);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Baru saja (Real-Time)');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load persisted state from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.events) setEvents(parsed.events);
        if (parsed.vendors) setVendors(parsed.vendors);
        if (parsed.contacts) setContacts(parsed.contacts);
        if (parsed.guests) setGuests(parsed.guests);
        if (parsed.itineraryItems) setItineraryItems(parsed.itineraryItems);
        if (parsed.floorplanTables) setFloorplanTables(parsed.floorplanTables);
        if (parsed.foodItems) setFoodItems(parsed.foodItems);
        if (parsed.proposalItems) setProposalItems(parsed.proposalItems);
        if (typeof parsed.serviceCharge === 'number') setServiceCharge(parsed.serviceCharge);
        if (parsed.todos) setTodos(parsed.todos);
        if (parsed.messages) setMessages(parsed.messages);
        if (parsed.budgetItems) setBudgetItems(parsed.budgetItems);
        if (parsed.visionItems) setVisionItems(parsed.visionItems);
        if (parsed.websiteConfig) setWebsiteConfig(parsed.websiteConfig);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Save state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          events,
          vendors,
          contacts,
          guests,
          itineraryItems,
          floorplanTables,
          foodItems,
          proposalItems,
          serviceCharge,
          todos,
          messages,
          budgetItems,
          visionItems,
          websiteConfig,
        })
      );
    } catch {
      // Ignore storage errors
    }
  }, [
    events,
    vendors,
    contacts,
    guests,
    itineraryItems,
    floorplanTables,
    foodItems,
    proposalItems,
    serviceCharge,
    todos,
    messages,
    budgetItems,
    visionItems,
    websiteConfig,
  ]);

  const handleNavigate = (section: NavSection, subView?: EventSubView) => {
    setActiveNav(section);
    if (subView) {
      setEventSubView(subView);
    }
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  };

  const handleResetDemo = () => {
    localStorage.removeItem(STORAGE_KEY);
    setEvents(INITIAL_EVENTS);
    setVendors(INITIAL_VENDORS);
    setContacts(INITIAL_CONTACTS);
    setGuests(INITIAL_GUESTS);
    setItineraryItems(INITIAL_ITINERARY_ITEMS);
    setFloorplanTables(INITIAL_FLOORPLAN_TABLES);
    setFoodItems(INITIAL_FOOD_PACKAGE_ITEMS);
    setProposalItems(INITIAL_PROPOSAL_ITEMS);
    setServiceCharge(36138700);
    setTodos(INITIAL_TODOS);
    setMessages(INITIAL_MESSAGES);
    setVenues(INITIAL_VENUE_SPACES);
    setPersonalCalendars(INITIAL_PERSONAL_CALENDARS);
    setBudgetItems(INITIAL_BUDGET_ITEMS);
    setVisionItems(INITIAL_VISION_BOARD_ITEMS);
    setWebsiteConfig(INITIAL_WEBSITE_CONFIG);
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
    showToast('Data demo berbahasa Indonesia & Rupiah (IDR) berhasil direset!');
  };

  // State mutation handlers
  const handleAddItineraryItem = (item: Omit<ItineraryItem, 'id'>, autoShiftMinutes?: number) => {
    setItineraryItems(prev => {
      const next = [...prev, { ...item, id: `itin-${Date.now()}` }];
      if (autoShiftMinutes && autoShiftMinutes !== 0) {
        return shiftItineraryTimes(next, 0, autoShiftMinutes, 'all');
      }
      return next;
    });
    showToast(`Agenda "${item.title}" ditambahkan ke Rundown & Kalender.`);
  };

  const handleShiftItinerary = (offsetMinutes: number) => {
    setItineraryItems(prev => shiftItineraryTimes(prev, 0, offsetMinutes, 'all'));
    showToast(`Seluruh jadwal rundown digeser ${offsetMinutes > 0 ? `+${offsetMinutes}` : offsetMinutes} menit.`);
  };

  const handleToggleItineraryExpand = (id: string) => {
    setItineraryItems(prev => prev.map(i => (i.id === id ? { ...i, expanded: !i.expanded } : i)));
  };

  const handleToggleAllItineraryExpand = (expand: boolean) => {
    setItineraryItems(prev => prev.map(i => ({ ...i, expanded: expand })));
  };

  const handleAddGuest = (guest: Omit<GuestItem, 'id'>) => {
    setGuests(prev => [{ ...guest, id: `g-${Date.now()}` }, ...prev]);
    showToast(`Tamu "${guest.firstName} ${guest.lastName}" berhasil ditambahkan.`);
  };

  const handleUpdateGuestRsvp = (guestId: string, rsvpStatus: RsvpStatus) => {
    setGuests(prev => prev.map(g => (g.id === guestId ? { ...g, rsvpStatus } : g)));
  };

  const handleToggleGuestCheckIn = (guestId: string) => {
    setGuests(prev =>
      prev.map(g => (g.id === guestId ? { ...g, checkedIn: !g.checkedIn } : g))
    );
  };

  const handleAssignGuestToTable = (guestId: string, tableId: string | null) => {
    setGuests(prev => prev.map(g => (g.id === guestId ? { ...g, tableId } : g)));
  };

  const handleAddVendor = (vendor: Omit<Vendor, 'id'>) => {
    setVendors(prev => [{ ...vendor, id: `v-${Date.now()}` }, ...prev]);
    showToast(`Vendor "${vendor.company}" ditambahkan ke Direktori & Acara.`);
  };

  const handleToggleVendorInsurance = (vendorId: string) => {
    setVendors(prev =>
      prev.map(v => (v.id === vendorId ? { ...v, insuranceVerified: !v.insuranceVerified } : v))
    );
  };

  const handleSignVendorContract = (vendorId: string) => {
    setVendors(prev =>
      prev.map(v => (v.id === vendorId ? { ...v, contractStatus: 'Signed' } : v))
    );
    showToast('Kontrak vendor berhasil ditandatangani secara digital!');
  };

  const handleRecordVendorPayment = (vendorId: string, amount: number) => {
    setVendors(prev =>
      prev.map(v =>
        v.id === vendorId ? { ...v, paidAmount: Math.min(v.contractAmount, v.paidAmount + amount) } : v
      )
    );
    showToast(`Pembayaran vendor sebesar ${formatIDR(amount)} berhasil dicatat.`);
  };

  const handleAddContact = (contact: Omit<ContactPerson, 'id'>) => {
    setContacts(prev => [{ ...contact, id: `c-${Date.now()}` }, ...prev]);
    showToast(`Kontak "${contact.name}" berhasil disimpan ke CRM.`);
  };

  const handleAddFloorplanTable = (seats: number, diameterFt: number, label: string) => {
    const nextNum = String(1010 + floorplanTables.length);
    const newTable: FloorplanTable = {
      id: `tbl-${Date.now()}`,
      eventId: selectedEventId,
      number: nextNum,
      label: label || `Meja ${nextNum}`,
      type: seats >= 10 ? 'round-10' : 'round-8',
      seats,
      x: 45,
      y: 50,
      diameterFt,
    };
    setFloorplanTables(prev => [...prev, newTable]);
  };

  const handleAutoLayoutFloorplan = (rows: number, cols: number, seatsPerTable: number) => {
    const generated = generateAutoGridFloorplan(floorplanTables, rows, cols, seatsPerTable, selectedEventId);
    setFloorplanTables(generated);
    showToast(`Denah otomatis berhasil disusun (${rows}x${cols} meja, ${seatsPerTable} kursi/meja)!`);
  };

  const handleAddFoodItem = (item: Omit<FoodPackageItem, 'id'>) => {
    setFoodItems(prev => [...prev, { ...item, id: `fp-${Date.now()}` }]);
    showToast(`Menu "${item.name}" ditambahkan ke Paket Katering & BEO.`);
  };

  const handleRemoveFoodItem = (id: string) => {
    setFoodItems(prev => prev.filter(f => f.id !== id));
  };

  const handlePushFoodPackageToProposal = () => {
    const totalPerGuest = foodItems.reduce((sum, i) => sum + (i.pricePerPerson || 250000), 0);
    const baseCost = 131 * totalPerGuest;
    const newItem: ProposalLineItem = {
      id: `prop-beo-${Date.now()}`,
      eventId: selectedEventId,
      title: 'Paket Katering & BEO: Makan Malam Platinum (131 Pax)',
      subtitle: 'Tersinkronisasi otomatis dari dokumen Banquet Event Order (BEO):',
      bullets: foodItems.map(f => `${f.name} (${f.category}) - ${formatIDR(f.pricePerPerson || 0)}/pax`),
      imageType: 'catering',
      qty: 131,
      unitCost: totalPerGuest,
      tax: Math.round(baseCost * 0.1),
      markupOrDiscount: 0,
    };
    setProposalItems(prev => [...prev, newItem]);
    showToast('Paket Katering & BEO berhasil dikirim ke baris item Proposal!');
  };

  const handleUpdateEventNotes = (eventId: string, notes: string) => {
    setEvents(prev => prev.map(e => (e.id === eventId ? { ...e, foodPackageNotes: notes } : e)));
  };

  const handleToggleTodo = (id: string) => {
    setTodos(prev => prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const handleAddTodo = (todo: Omit<TodoTask, 'id'>) => {
    setTodos(prev => [{ ...todo, id: `td-${Date.now()}` }, ...prev]);
    showToast(`Tugas "${todo.title}" berhasil ditambahkan.`);
  };

  const handleDeleteTodo = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  const handleImportWeddingTodoTemplate = () => {
    const imported: TodoTask = {
      id: `td-imp-${Date.now()}`,
      eventId: selectedEventId,
      title: 'Finalisasi Denah Kursi & Konfirmasi Jumlah Porsi BEO Katering',
      description: 'Diimpor dari Templat 32 Checklist Pernikahan Standar Heal Planning.',
      dueRule: '14 hari SEBELUM tanggal acara',
      dueDate: '2026-09-25',
      contactNames: ['Alex Ramsey', 'Laura Finch'],
      organization: 'Coach House Events',
      reminderText: '3 hari sebelum jatuh tempo 09:00 WIB Via Email & SMS',
      completed: false,
    };
    setTodos(prev => [imported, ...prev]);
    showToast('Templat Checklist Pernikahan berhasil diimpor ke acara!');
  };

  const handleAddBudgetItem = (item: Omit<BudgetLineItem, 'id'>) => {
    setBudgetItems(prev => [...prev, { ...item, id: `b-${Date.now()}` }]);
    showToast(`Pos anggaran "${item.title}" ditambahkan.`);
  };

  const handleRecordBudgetPayment = (id: string, amount: number) => {
    setBudgetItems(prev =>
      prev.map(b => (b.id === id ? { ...b, paidAmount: b.paidAmount + amount } : b))
    );
    showToast(`Pembayaran anggaran sebesar ${formatIDR(amount)} berhasil dicatat.`);
  };

  const handleAddVisionItem = (item: Omit<VisionBoardItem, 'id'>) => {
    setVisionItems(prev => [{ ...item, id: `vb-${Date.now()}` }, ...prev]);
    showToast(`Inspirasi "${item.title}" ditambahkan ke Papan Inspirasi.`);
  };

  const handleAddVisionComment = (id: string, text: string) => {
    setVisionItems(prev =>
      prev.map(v =>
        v.id === id
          ? {
              ...v,
              comments: [
                ...v.comments,
                {
                  id: `vc-${Date.now()}`,
                  author: 'Alex Ramsey',
                  role: 'Planner',
                  text,
                  timestamp: 'Baru saja',
                },
              ],
            }
          : v
      )
    );
  };

  // Calendar venue & personal calendar handlers
  const handleToggleVenue = (venueId: string) => {
    setVenues(prev =>
      prev.map(v => (v.id === venueId ? { ...v, selected: !v.selected } : v))
    );
  };

  const handleSetAllVenuesSelected = (selected: boolean, groupName?: string) => {
    setVenues(prev =>
      prev.map(v => (!groupName || v.groupName === groupName ? { ...v, selected } : v))
    );
    showToast(
      groupName
        ? `Ruangan di "${groupName}" ${selected ? 'ditampilkan' : 'disembunyikan'}.`
        : `Semua ruangan venue ${selected ? 'ditampilkan' : 'disembunyikan'}.`
    );
  };

  const handleSoloVenue = (venueId: string) => {
    const target = venues.find(v => v.id === venueId);
    setVenues(prev => prev.map(v => ({ ...v, selected: v.id === venueId })));
    if (target) {
      showToast(`Menampilkan khusus ruangan: ${target.name}`);
    }
  };

  const handleUpdateVenueColor = (venueId: string, color: string) => {
    setVenues(prev => prev.map(v => (v.id === venueId ? { ...v, color } : v)));
    showToast('Warna label ruangan venue berhasil diperbarui!');
  };

  const handleTogglePersonalCalendar = (calId: string) => {
    setPersonalCalendars(prev =>
      prev.map(c => (c.id === calId ? { ...c, selected: !c.selected } : c))
    );
  };

  const handleSoloPersonalCalendar = (calId: string) => {
    const target = personalCalendars.find(c => c.id === calId);
    setPersonalCalendars(prev => prev.map(c => ({ ...c, selected: c.id === calId })));
    if (target) {
      showToast(`Menampilkan khusus kalender: ${target.name}`);
    }
  };

  const handleSetAllPersonalCalendarsSelected = (selected: boolean) => {
    setPersonalCalendars(prev => prev.map(c => ({ ...c, selected })));
  };

  const handleUpdatePersonalCalendarColor = (calId: string, color: string) => {
    setPersonalCalendars(prev => prev.map(c => (c.id === calId ? { ...c, color } : c)));
    showToast('Warna label kalender personal berhasil diperbarui!');
  };

  const handleCreateEvent = (newEv: Omit<PlannerEvent, 'id'>) => {
    const created: PlannerEvent = { ...newEv, id: `ev-${Date.now()}` };
    setEvents(prev => [created, ...prev]);
    showToast(`Acara / Prospek "${created.title}" berhasil dibuat!`);
  };

  const handleUpdateEventStatus = (eventId: string, status: EventStatus) => {
    setEvents(prev => prev.map(e => (e.id === eventId ? { ...e, status } : e)));
    showToast(`Status acara diperbarui menjadi ${status}.`);
  };

  const handleUpdateProposalItem = (id: string, patch: Partial<ProposalLineItem>) => {
    setProposalItems(prev => prev.map(item => (item.id === id ? { ...item, ...patch } : item)));
  };

  const handleAddProposalItem = (item: Omit<ProposalLineItem, 'id'>) => {
    setProposalItems(prev => [...prev, { ...item, id: `prop-${Date.now()}` }]);
    showToast(`Item "${item.title}" ditambahkan ke Proposal.`);
  };

  const handleDeleteProposalItem = (id: string) => {
    setProposalItems(prev => prev.filter(i => i.id !== id));
  };

  const handleDuplicateProposalItem = (id: string) => {
    const found = proposalItems.find(i => i.id === id);
    if (!found) return;
    setProposalItems(prev => [
      ...prev,
      { ...found, id: `prop-copy-${Date.now()}`, title: `${found.title} (Salinan)` },
    ]);
    showToast(`Item "${found.title}" berhasil diduplikasi.`);
  };

  const handleSendMessage = (
    msg: Omit<CommunicationMessage, 'id' | 'timestamp' | 'dateFormatted' | 'timeFormatted' | 'unread'>
  ) => {
    const now = new Date();
    const dateFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const timeFormatted = `${now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })} WIB`;
    setMessages(prev => [
      {
        ...msg,
        id: `msg-${Date.now()}`,
        timestamp: now.toISOString(),
        dateFormatted,
        timeFormatted,
        unread: false,
      },
      ...prev,
    ]);
    showToast(`Email "${msg.subject}" berhasil dikirim!`);
  };

  const handleToggleStarMessage = (id: string) => {
    setMessages(prev => prev.map(m => (m.id === id ? { ...m, starred: !m.starred } : m)));
  };

  const handleMarkMessageRead = (id: string) => {
    setMessages(prev => prev.map(m => (m.id === id ? { ...m, unread: false } : m)));
  };

  const navItems: { id: NavSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'Beranda', icon: Home },
    { id: 'events', label: 'Acara', icon: Calendar },
    { id: 'calendars', label: 'Kalender', icon: CalendarDays },
    { id: 'contacts', label: 'Kontak & Vendor', icon: Users },
    { id: 'communications', label: 'Komunikasi', icon: Mail },
    { id: 'leads', label: 'Prospek', icon: Compass },
    { id: 'proposals', label: 'Proposal', icon: FileText },
    { id: 'invoices', label: 'Faktur (IDR)', icon: DollarSign },
    { id: 'contracts', label: 'Kontrak', icon: FileSignature },
    { id: 'reports', label: 'Laporan', icon: PieChart },
    { id: 'templates', label: 'Templat & Otomasi', icon: Layers },
    { id: 'client-portal', label: 'Portal Klien', icon: ExternalLink },
  ];

  const activeNavLabel = navItems.find(n => n.id === activeNav)?.label || 'Beranda';

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row bg-[#f4f6f8] text-slate-800"
      onClick={() => {
        if (profileDropdownOpen) setProfileDropdownOpen(false);
      }}
    >
      {/* Mobile Top Header Bar (< md) for comfortable Smartphone usage */}
      <header className="md:hidden sticky top-0 z-40 h-14 bg-[#439aa7] text-white px-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Buka Menu Navigasi"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={() => handleNavigate('home')}
            className="text-xl text-white cursor-pointer"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 700 }}
          >
            Heal Planning
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-white/20 text-[11px] font-semibold truncate max-w-[130px]">
            {activeNavLabel}
          </span>
          <button
            type="button"
            onClick={() => handleNavigate('client-portal')}
            className="w-8 h-8 rounded-full bg-slate-800 border-2 border-white/80 flex items-center justify-center font-bold text-[11px] cursor-pointer"
            title="Buka Portal Klien"
          >
            AR
          </button>
        </div>
      </header>

      {/* Mobile Slide-Over Navigation Drawer (< md) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[82vw] bg-[#439aa7] text-white h-full flex flex-col justify-between z-10 shadow-2xl overflow-y-auto">
            <div>
              <div className="h-14 px-4 flex items-center justify-between border-b border-white/15">
                <span
                  className="text-2xl text-white"
                  style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 700 }}
                >
                  Heal Planning
                </span>
                <button
                  type="button"
                  aria-label="Tutup Menu"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-4 py-3 flex items-center gap-3 border-b border-white/15 bg-black/10">
                <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-white/80 flex items-center justify-center font-bold text-xs shrink-0">
                  AR
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-white truncate">Alex Ramsey</div>
                  <div className="text-[10px] text-white/80 truncate">Perencana Utama (IDR)</div>
                </div>
              </div>

              <nav className="py-3 px-2.5 space-y-1">
                {navItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activeNav === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavigate(item.id)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                        isActive
                          ? 'bg-white text-[#35828e] font-bold shadow-xs'
                          : 'text-white/90 hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-3 border-t border-white/15">
              <button
                type="button"
                onClick={handleResetDemo}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold text-white cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                <span>Reset Data Demo</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Left Persistent Planning Pod Teal Sidebar on Tablet/Desktop (md:flex) */}
      <aside
        className={`hidden md:flex ${
          sidebarCollapsed ? 'w-16' : 'w-56'
        } bg-[#439aa7] text-white shrink-0 flex-col justify-between transition-all duration-200 select-none z-30 shadow-md sticky top-0 h-screen`}
      >
        <div>
          {/* Top Brand & Collapse Button */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-white/15">
            {!sidebarCollapsed && (
              <button
                type="button"
                onClick={() => setActiveNav('home')}
                className="font-script text-2xl tracking-wide text-white hover:opacity-90 transition cursor-pointer"
                style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 700 }}
              >
                Heal Planning
              </button>
            )}
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-6 h-6 rounded-full bg-white text-[#439aa7] flex items-center justify-center shadow-xs hover:bg-slate-100 transition cursor-pointer mx-auto sm:mx-0"
              title={sidebarCollapsed ? 'Perluas menu' : 'Ciutkan menu'}
            >
              {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Logged-in Planner Profile with Interactive Dropdown */}
          <div className="relative px-4 py-3.5 border-b border-white/15">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setProfileDropdownOpen(prev => !prev);
              }}
              className="w-full flex items-center gap-3 text-left hover:opacity-95 cursor-pointer"
              title="Menu Profil & Akun"
            >
              <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-white/80 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                AR
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-white truncate flex items-center justify-between">
                    <span>Alex Ramsey</span>
                    <span className="text-[10px] opacity-80">▾</span>
                  </div>
                  <div className="text-[10px] text-white/75 truncate">Perencana Utama (IDR)</div>
                </div>
              )}
            </button>

            {profileDropdownOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute left-3 top-16 z-50 w-56 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 p-1.5 text-xs space-y-1"
              >
                <div className="px-2.5 py-1.5 border-b border-slate-100">
                  <div className="font-bold text-slate-800">Alex Ramsey</div>
                  <div className="text-[10px] text-slate-500">Nusa Tara Event • Akun Pro IDR</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleNavigate('client-portal')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5 text-[#3898a6]" />
                  <span>Pratinjau Portal Klien (Laura)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('templates')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  <span>Pengaturan Branding &amp; Otomasi</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetDemo}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-50 text-rose-600 flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Data Demo</span>
                </button>
              </div>
            )}
          </div>

          {/* Primary Navigation Items */}
          <nav className="py-3 px-2 space-y-0.5 overflow-y-auto max-h-[calc(100vh-11rem)]">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveNav(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                    isActive
                      ? 'bg-white/20 text-white font-semibold shadow-2xs'
                      : 'text-white/85 hover:bg-white/10 hover:text-white'
                  }`}
                  title={item.label}
                >
                  <Icon className="w-4 h-4 shrink-0 opacity-90" />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Reset Demo Button */}
        <div className="p-3 border-t border-white/15">
          <button
            type="button"
            onClick={handleResetDemo}
            className="w-full flex items-center justify-center gap-2 px-2.5 py-1.5 rounded bg-white/10 hover:bg-white/20 text-[11px] text-white/90 transition cursor-pointer"
            title="Reset seluruh data ke pengaturan awal"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            {!sidebarCollapsed && <span>Reset Data Demo</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Global Toast Feedback Banner */}
        {toastMessage && (
          <div className="fixed top-16 md:top-4 right-4 md:right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2.5 text-xs font-medium animate-fade-in max-w-[92vw]">
            <Bell className="w-4 h-4 text-[#439aa7] shrink-0" />
            <span className="truncate">{toastMessage}</span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        <main className="flex-1 pb-12 md:pb-16">
          {activeNav === 'home' && (
            <HomeDashboardView
              events={events}
              vendors={vendors}
              guests={guests}
              itineraryItems={itineraryItems}
              floorplanTables={floorplanTables}
              proposalItems={proposalItems}
              todos={todos}
              messagesCount={messages.length}
              lastSyncTime={lastSyncTime}
              onNavigate={handleNavigate}
            />
          )}

          {activeNav === 'events' && (
            <EventsWorkspaceView
              events={events}
              activeEventId={selectedEventId}
              subView={eventSubView}
              itineraryItems={itineraryItems}
              vendors={vendors}
              contacts={contacts}
              guests={guests}
              floorplanTables={floorplanTables}
              foodItems={foodItems}
              todos={todos}
              budgetItems={budgetItems}
              visionItems={visionItems}
              websiteConfig={websiteConfig}
              onSelectEvent={setSelectedEventId}
              onChangeSubView={setEventSubView}
              onAddItineraryItem={handleAddItineraryItem}
              onShiftItinerary={handleShiftItinerary}
              onToggleItineraryExpand={handleToggleItineraryExpand}
              onToggleAllItineraryExpand={handleToggleAllItineraryExpand}
              onAddVendor={handleAddVendor}
              onToggleVendorInsurance={handleToggleVendorInsurance}
              onAddGuest={handleAddGuest}
              onUpdateGuestRsvp={handleUpdateGuestRsvp}
              onAssignGuestToTable={handleAssignGuestToTable}
              onToggleGuestCheckIn={handleToggleGuestCheckIn}
              onAddFloorplanTable={handleAddFloorplanTable}
              onAutoLayoutFloorplan={handleAutoLayoutFloorplan}
              onResetFloorplan={() => setFloorplanTables(INITIAL_FLOORPLAN_TABLES)}
              onAddFoodItem={handleAddFoodItem}
              onRemoveFoodItem={handleRemoveFoodItem}
              onPushFoodPackageToProposal={handlePushFoodPackageToProposal}
              onUpdateEventNotes={handleUpdateEventNotes}
              onToggleTodo={handleToggleTodo}
              onImportWeddingTodoTemplate={handleImportWeddingTodoTemplate}
              onAddBudgetItem={handleAddBudgetItem}
              onRecordBudgetPayment={handleRecordBudgetPayment}
              onAddVisionItem={handleAddVisionItem}
              onAddVisionComment={handleAddVisionComment}
              onUpdateWebsiteConfig={setWebsiteConfig}
              onNotify={showToast}
            />
          )}

          {activeNav === 'calendars' && (
            <CalendarsView
              events={events}
              itineraryItems={itineraryItems}
              vendors={vendors}
              venues={venues}
              personalCalendars={personalCalendars}
              todos={todos}
              lastSyncTime={lastSyncTime}
              onToggleVenue={handleToggleVenue}
              onTogglePersonalCalendar={handleTogglePersonalCalendar}
              onSetAllVenuesSelected={handleSetAllVenuesSelected}
              onSoloVenue={handleSoloVenue}
              onUpdateVenueColor={handleUpdateVenueColor}
              onSoloPersonalCalendar={handleSoloPersonalCalendar}
              onSetAllPersonalCalendarsSelected={handleSetAllPersonalCalendarsSelected}
              onUpdatePersonalCalendarColor={handleUpdatePersonalCalendarColor}
              onAddEvent={handleCreateEvent}
              onSelectEvent={(eventId: string) => {
                setSelectedEventId(eventId);
                setActiveNav('events');
              }}
              onTriggerSync={() => {
                setLastSyncTime(
                  `Tersinkronisasi ${new Date().toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })} WIB`
                );
                showToast('Kalender Master berhasil disinkronkan secara real-time!');
              }}
            />
          )}

          {(activeNav === 'leads' ||
            activeNav === 'proposals' ||
            activeNav === 'invoices' ||
            activeNav === 'contracts' ||
            activeNav === 'reports') && (
            <LeadsAndProposalsView
              mode={activeNav}
              events={events}
              proposalItems={proposalItems}
              budgetItems={budgetItems}
              vendors={vendors}
              guests={guests}
              serviceCharge={serviceCharge}
              onAddLead={handleCreateEvent}
              onConvertLeadStatus={handleUpdateEventStatus}
              onLaunchEvent={(eventId: string) => {
                setSelectedEventId(eventId);
                setActiveNav('events');
              }}
              onAddProposalItem={handleAddProposalItem}
              onUpdateProposalItem={handleUpdateProposalItem}
              onDeleteProposalItem={handleDeleteProposalItem}
              onDuplicateProposalItem={handleDuplicateProposalItem}
              onUpdateServiceCharge={setServiceCharge}
              onSignVendorContract={handleSignVendorContract}
              onRecordVendorPayment={handleRecordVendorPayment}
              onToggleVendorInsurance={handleToggleVendorInsurance}
              onSendQuickEmail={(recipient: string, subject: string, body: string) =>
                handleSendMessage({
                  senderName: 'Alex Ramsey',
                  senderEmail: 'alex.ramsey@healplanning.co.id',
                  recipientName: recipient,
                  subject,
                  preview: body.slice(0, 90),
                  body,
                  starred: false,
                  folder: 'sent',
                  associatedEventId: selectedEventId,
                  associatedEventLabel: 'Resepsi Johnson & Murphy',
                  associatedEventColor: '#3898a6',
                })
              }
              onNavigate={handleNavigate}
              onNotify={showToast}
            />
          )}

          {(activeNav === 'communications' ||
            activeNav === 'templates' ||
            activeNav === 'contacts' ||
            activeNav === 'client-portal') && (
            <CommsTemplatesPortalView
              mode={activeNav}
              messages={messages}
              todos={todos}
              tables={floorplanTables}
              guests={guests}
              vendors={vendors}
              contacts={contacts}
              events={events}
              proposalItems={proposalItems}
              foodItems={foodItems}
              budgetItems={budgetItems}
              onSendMessage={handleSendMessage}
              onToggleStarMessage={handleToggleStarMessage}
              onMarkMessageRead={handleMarkMessageRead}
              onAddTodo={handleAddTodo}
              onToggleTodo={handleToggleTodo}
              onDeleteTodo={handleDeleteTodo}
              onAddFloorplanTable={handleAddFloorplanTable}
              onResetFloorplan={() => setFloorplanTables(INITIAL_FLOORPLAN_TABLES)}
              onAssignGuestToTable={handleAssignGuestToTable}
              onAutoLayoutFloorplan={handleAutoLayoutFloorplan}
              onAddContact={handleAddContact}
              onNavigate={handleNavigate}
            />
          )}
        </main>

        {/* Floating Help Pill matching Planning Pod bottom-right UI (Desktop) */}
        <div className="hidden md:block fixed bottom-4 right-5 z-40">
          <button
            type="button"
            onClick={() => setActiveNav('client-portal')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#439aa7] hover:bg-[#35828e] text-white text-xs font-semibold shadow-md transition cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Bantuan &amp; Portal Klien</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
