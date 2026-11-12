import React, { useMemo, useState } from 'react';
import {
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Plus,
  RefreshCw,
  AlertCircle,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Palette,
  SlidersHorizontal,
  Clock,
} from 'lucide-react';
import {
  EventStatus,
  ItineraryItem,
  PersonalCalendar,
  PlannerEvent,
  TodoTask,
  Vendor,
  VenueSpace,
} from '../types/planner';
import {
  buildUnifiedCalendarEvents,
  detectScheduleConflicts,
  findVenueConflictForBooking,
  generateCalendarMonthGrid,
  generateICalFeed,
  getAvailableVenuesForDate,
  INDONESIAN_MONTH_NAMES,
} from '../utils/plannerLogic';

interface CalendarsViewProps {
  events: PlannerEvent[];
  itineraryItems: ItineraryItem[];
  vendors: Vendor[];
  venues: VenueSpace[];
  personalCalendars: PersonalCalendar[];
  todos?: TodoTask[];
  lastSyncTime: string;
  onToggleVenue: (venueId: string) => void;
  onTogglePersonalCalendar: (calId: string) => void;
  onSetAllVenuesSelected?: (selected: boolean, groupName?: string) => void;
  onSoloVenue?: (venueId: string) => void;
  onUpdateVenueColor?: (venueId: string, color: string) => void;
  onSoloPersonalCalendar?: (calId: string) => void;
  onSetAllPersonalCalendarsSelected?: (selected: boolean) => void;
  onUpdatePersonalCalendarColor?: (calId: string, color: string) => void;
  onAddEvent: (newEvent: Omit<PlannerEvent, 'id'>) => void;
  onSelectEvent: (eventId: string) => void;
  onTriggerSync: () => void;
}

const PRESET_COLORS = [
  '#dc2626',
  '#22c55e',
  '#1e3a8a',
  '#5b189a',
  '#b45309',
  '#20c9b6',
  '#3b7a8c',
  '#f5b027',
];

const YEAR_OPTIONS = Array.from({ length: 16 }, (_, idx) => 2020 + idx);

export const CalendarsView: React.FC<CalendarsViewProps> = ({
  events,
  itineraryItems,
  vendors,
  venues,
  personalCalendars,
  todos = [],
  lastSyncTime,
  onToggleVenue,
  onTogglePersonalCalendar,
  onSetAllVenuesSelected,
  onSoloVenue,
  onUpdateVenueColor,
  onSoloPersonalCalendar,
  onSetAllPersonalCalendarsSelected,
  onUpdatePersonalCalendarColor,
  onAddEvent,
  onSelectEvent,
  onTriggerSync,
}) => {
  const [viewBy, setViewBy] = useState<'event' | 'venue'>('venue');
  const [calendarMode, setCalendarMode] = useState<'month' | 'week' | 'day' | 'timeline'>('month');
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(9); // 0-indexed: 9 = Oktober
  const [weekIndex, setWeekIndex] = useState(0);
  const [selectedDayDate, setSelectedDayDate] = useState('2026-10-09');
  const [includeSubItems, setIncludeSubItems] = useState(false);

  // Interactive dropdown & collapse states
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [collapsedVenueGroups, setCollapsedVenueGroups] = useState<Record<string, boolean>>({});
  const [showTopFilterPanel, setShowTopFilterPanel] = useState(true);
  const [mobileFilterSidebarOpen, setMobileFilterSidebarOpen] = useState(false);

  const [statusFilters, setStatusFilters] = useState({
    openLeads: true,
    holds: true,
    bookedEvents: true,
    archived: false,
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('2026-10-08');
  const [newStartTime, setNewStartTime] = useState('14:00 WIB');
  const [newStatus, setNewStatus] = useState<EventStatus>('Booked Event');
  const [newVenueId, setNewVenueId] = useState(venues[4]?.id || 'ven-ch-quincy');
  const [newOwnerId, setNewOwnerId] = useState('cal-alex');
  const [formError, setFormError] = useState('');

  const venueGroups = useMemo(() => {
    const map = new Map<string, VenueSpace[]>();
    for (const v of venues) {
      const arr = map.get(v.groupName) || [];
      arr.push(v);
      map.set(v.groupName, arr);
    }
    return Array.from(map.entries());
  }, [venues]);

  const calendarEntries = useMemo(
    () =>
      buildUnifiedCalendarEvents({
        events,
        itineraryItems,
        vendors,
        venues,
        personalCalendars,
        todos,
        viewBy,
        statusFilters,
        includeSubItems,
      }),
    [
      events,
      itineraryItems,
      vendors,
      venues,
      personalCalendars,
      todos,
      viewBy,
      statusFilters,
      includeSubItems,
    ]
  );

  const conflicts = useMemo(() => detectScheduleConflicts(events), [events]);

  const entriesByDate = useMemo(() => {
    const map = new Map<string, typeof calendarEntries>();
    for (const entry of calendarEntries) {
      const list = map.get(entry.date) || [];
      list.push(entry);
      map.set(entry.date, list);
    }
    return map;
  }, [calendarEntries]);

  const monthGridCells = useMemo(
    () => generateCalendarMonthGrid(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const maxWeekIndex = Math.max(0, Math.ceil(monthGridCells.length / 7) - 1);

  const visibleCells = useMemo(() => {
    if (calendarMode === 'month') {
      return monthGridCells;
    }
    if (calendarMode === 'week' || calendarMode === 'timeline') {
      const safeWeek = Math.min(weekIndex, maxWeekIndex);
      const start = safeWeek * 7;
      return monthGridCells.slice(start, start + 7);
    }
    const foundCell = monthGridCells.find((d) => d.date === selectedDayDate);
    if (foundCell) {
      return [foundCell];
    }
    const firstInMonth = monthGridCells.find((d) => d.isCurrentMonth) || monthGridCells[0];
    return firstInMonth ? [firstInMonth] : [];
  }, [calendarMode, monthGridCells, weekIndex, maxWeekIndex, selectedDayDate]);

  // Summarize active event counts per (year, month) for quick navigation pills
  const activeMonthsWithEvents = useMemo(() => {
    const counts = new Map<string, { year: number; month: number; count: number }>();
    for (const entry of calendarEntries) {
      const parts = entry.date.split('-');
      if (parts.length === 3) {
        const y = Number(parts[0]);
        const m = Number(parts[1]) - 1;
        if (!Number.isNaN(y) && !Number.isNaN(m) && m >= 0 && m <= 11) {
          const key = `${y}-${String(m + 1).padStart(2, '0')}`;
          const existing = counts.get(key);
          if (existing) {
            existing.count += 1;
          } else {
            counts.set(key, { year: y, month: m, count: 1 });
          }
        }
      }
    }
    return Array.from(counts.values()).sort((a, b) =>
      a.year !== b.year ? a.year - b.year : a.month - b.month
    );
  }, [calendarEntries]);

  const jumpToYearMonth = (year: number, monthIndex: number) => {
    const normalizedDate = new Date(year, monthIndex, 1);
    const targetYear = normalizedDate.getFullYear();
    const targetMonth = normalizedDate.getMonth();
    setCurrentYear(targetYear);
    setCurrentMonth(targetMonth);
    setWeekIndex(0);
    const firstDayStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-01`;
    setSelectedDayDate(firstDayStr);
  };

  const handlePrevPeriod = () => {
    if (calendarMode === 'month') {
      jumpToYearMonth(currentYear, currentMonth - 1);
    } else if (calendarMode === 'week' || calendarMode === 'timeline') {
      if (weekIndex > 0) {
        setWeekIndex((w) => w - 1);
      } else {
        const prevDate = new Date(currentYear, currentMonth - 1, 1);
        const prevCells = generateCalendarMonthGrid(prevDate.getFullYear(), prevDate.getMonth());
        setCurrentYear(prevDate.getFullYear());
        setCurrentMonth(prevDate.getMonth());
        setWeekIndex(Math.max(0, Math.ceil(prevCells.length / 7) - 1));
      }
    } else {
      const [y, m, d] = selectedDayDate.split('-').map(Number);
      const prevDay = new Date(y || currentYear, (m || currentMonth + 1) - 1, (d || 1) - 1);
      const nextIso = `${prevDay.getFullYear()}-${String(prevDay.getMonth() + 1).padStart(2, '0')}-${String(prevDay.getDate()).padStart(2, '0')}`;
      setSelectedDayDate(nextIso);
      setCurrentYear(prevDay.getFullYear());
      setCurrentMonth(prevDay.getMonth());
    }
  };

  const handleNextPeriod = () => {
    if (calendarMode === 'month') {
      jumpToYearMonth(currentYear, currentMonth + 1);
    } else if (calendarMode === 'week' || calendarMode === 'timeline') {
      if (weekIndex < maxWeekIndex) {
        setWeekIndex((w) => w + 1);
      } else {
        jumpToYearMonth(currentYear, currentMonth + 1);
      }
    } else {
      const [y, m, d] = selectedDayDate.split('-').map(Number);
      const nextDay = new Date(y || currentYear, (m || currentMonth + 1) - 1, (d || 1) + 1);
      const nextIso = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}`;
      setSelectedDayDate(nextIso);
      setCurrentYear(nextDay.getFullYear());
      setCurrentMonth(nextDay.getMonth());
    }
  };

  const handleJumpToToday = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();
    const todayStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    setCurrentYear(y);
    setCurrentMonth(m);
    setSelectedDayDate(todayStr);
    const cells = generateCalendarMonthGrid(y, m);
    const cellIdx = cells.findIndex((c) => c.date === todayStr);
    setWeekIndex(cellIdx >= 0 ? Math.floor(cellIdx / 7) : 0);
  };

  const toggleGroupCollapse = (groupName: string) => {
    setCollapsedVenueGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const handleSetAllVenues = (selected: boolean, groupName?: string) => {
    if (onSetAllVenuesSelected) {
      onSetAllVenuesSelected(selected, groupName);
    } else {
      for (const v of venues) {
        if (!groupName || v.groupName === groupName) {
          if (v.selected !== selected) {
            onToggleVenue(v.id);
          }
        }
      }
    }
  };

  const handleSoloVenueRoom = (venueId: string) => {
    if (onSoloVenue) {
      onSoloVenue(venueId);
    } else {
      for (const v of venues) {
        const shouldSelect = v.id === venueId;
        if (v.selected !== shouldSelect) {
          onToggleVenue(v.id);
        }
      }
    }
    setViewBy('venue');
    setActiveDropdownId(null);
  };

  const handleSoloPersonalCal = (calId: string) => {
    if (onSoloPersonalCalendar) {
      onSoloPersonalCalendar(calId);
    } else {
      for (const c of personalCalendars) {
        const shouldSelect = c.id === calId;
        if (c.selected !== shouldSelect) {
          onTogglePersonalCalendar(c.id);
        }
      }
    }
    setViewBy('event');
    setActiveDropdownId(null);
  };

  const selectedSlotConflict = useMemo(
    () => findVenueConflictForBooking(events, newDate, newVenueId),
    [events, newDate, newVenueId]
  );

  const availableVenuesOnNewDate = useMemo(
    () => getAvailableVenuesForDate(events, venues, newDate),
    [events, venues, newDate]
  );

  const handleCreateCalendarEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setFormError('Silakan masukkan judul acara atau janji temu.');
      return;
    }
    const chosenVenue = venues.find((v) => v.id === newVenueId) || venues[0];
    const conflictEvent = findVenueConflictForBooking(events, newDate, chosenVenue.id);
    if (conflictEvent) {
      setFormError(
        `Bentrok Jadwal Dicegah: Ruangan "${chosenVenue.name}" sudah digunakan oleh "${conflictEvent.title}" (${conflictEvent.startTime}) pada tanggal ${newDate}. Silakan pilih ruangan lain yang tersedia di bawah atau ganti tanggal.`
      );
      return;
    }
    onAddEvent({
      title: newTitle.trim(),
      subtitle: 'Dibuat melalui Sinkronisasi Real-Time Kalender Master',
      date: newDate,
      endDate: newDate,
      startTime: newStartTime,
      endTime: '21:00 WIB',
      daysUntil: 28,
      status: newStatus,
      venueSpaceId: chosenVenue.id,
      venueName: `${chosenVenue.groupName} - ${chosenVenue.name}`,
      calendarOwnerId: newOwnerId,
      capturedDate: '01/10/2026',
      avatarUrl: 'default-lead',
      budgetTotal: 95000000,
      serviceCharge: 11400000,
      foodPackageName: 'Paket Makan Malam Platinum',
      foodPackageNotes: '',
      linkedToBeo: true,
    });
    // Navigate calendar to the newly created event's month & year
    const parts = newDate.split('-').map(Number);
    if (parts.length === 3 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
      setCurrentYear(parts[0]);
      setCurrentMonth(parts[1] - 1);
      setSelectedDayDate(newDate);
    }
    setNewTitle('');
    setFormError('');
    setShowAddModal(false);
  };

  const handleDownloadIcs = () => {
    const icsContent = generateICalFeed(calendarEntries);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'heal-planning-kalender-utama.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatStatusBadge = (status: EventStatus) => {
    if (status === 'Booked Event') return 'ACARA TERKONFIRMASI';
    if (status === 'Hold') return 'HOLD SEMENTARA';
    if (status === 'Open Lead') return 'PROSPEK TERBUKA';
    return status.toUpperCase();
  };

  const modeLabels: Record<'month' | 'week' | 'day' | 'timeline', string> = {
    month: 'Bulan',
    week: 'Minggu',
    day: 'Hari',
    timeline: 'Linimasa Ruangan',
  };

  const selectedVenuesCount = venues.filter((v) => v.selected).length;

  return (
    <div
      className="flex flex-col lg:flex-row min-h-[calc(100vh-2rem)] bg-[#f4f6f8] relative"
      onClick={() => {
        if (activeDropdownId) setActiveDropdownId(null);
      }}
    >
      {/* Mobile Filter Drawer Toggle Bar (< lg) */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMobileFilterSidebarOpen((prev) => !prev);
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#3898a6]/10 text-[#2b90a0] text-xs font-bold cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>
            Filter Kalender &amp; Ruangan ({selectedVenuesCount}/{venues.length} Aktif)
          </span>
          {mobileFilterSidebarOpen ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 rounded-lg bg-[#48a5b3] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Acara</span>
        </button>
      </div>

      {/* Left Venue & Personal Calendar Filter Rail matching image_0759993e.png & image_53fbfd8b.png */}
      <aside
        aria-label="Filter Ruangan Venue dan Pemilik Kalender"
        onClick={(e) => e.stopPropagation()}
        className={`${
          mobileFilterSidebarOpen ? 'block' : 'hidden'
        } lg:block w-full lg:w-64 shrink-0 bg-[#f4f6f8] border-b lg:border-b-0 lg:border-r border-slate-200/90 p-5 space-y-6`}
      >
        {/* Personal Calendars */}
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-300">
            <h2 className="text-sm font-bold text-slate-800">Kalender Personal</h2>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-2.5 py-0.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-medium cursor-pointer"
            >
              Tambah
            </button>
          </div>
          <ul className="mt-3 space-y-2">
            {personalCalendars.map((cal) => {
              const dropdownKey = `cal-${cal.id}`;
              const isDropdownOpen = activeDropdownId === dropdownKey;
              return (
                <li key={cal.id} className="relative flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onTogglePersonalCalendar(cal.id)}
                    className="flex items-center gap-2 text-xs text-slate-700 hover:text-slate-900 cursor-pointer py-0.5"
                  >
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center text-white shrink-0 transition-transform active:scale-95"
                      style={{ backgroundColor: cal.selected ? cal.color : '#cbd5e1' }}
                    >
                      {cal.selected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </span>
                    <span className={cal.selected ? 'font-medium' : 'line-through text-slate-400'}>
                      {cal.name}
                    </span>
                  </button>

                  {/* Interactive Dropdown Button for Personal Calendar */}
                  <button
                    type="button"
                    aria-label={`Opsi untuk ${cal.name}`}
                    aria-expanded={isDropdownOpen}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDropdownId(isDropdownOpen ? null : dropdownKey);
                    }}
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition cursor-pointer ${
                      isDropdownOpen
                        ? 'bg-[#3898a6] text-white shadow-xs'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-600'
                    }`}
                    title={`Menu opsi ${cal.name}`}
                  >
                    ▾
                  </button>

                  {/* Dropdown Menu Popover */}
                  {isDropdownOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-6 z-40 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-2 text-xs space-y-1"
                    >
                      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                        {cal.name}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSoloPersonalCal(cal.id)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center gap-2 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#3898a6]" />
                        <span>Tampilkan Hanya Kalender Ini</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (onSetAllPersonalCalendarsSelected) {
                            onSetAllPersonalCalendarsSelected(true);
                          }
                          setActiveDropdownId(null);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center gap-2 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Centang Semua Kalender</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewOwnerId(cal.id);
                          setShowAddModal(true);
                          setActiveDropdownId(null);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center gap-2 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#3898a6]" />
                        <span>Tambah Jadwal ke {cal.name}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleDownloadIcs();
                          setActiveDropdownId(null);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center gap-2 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-500" />
                        <span>Ekspor Jadwal (.ics)</span>
                      </button>

                      {onUpdatePersonalCalendarColor && (
                        <div className="pt-1.5 mt-1 border-t border-slate-100 px-2.5 pb-1">
                          <div className="text-[10px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                            <Palette className="w-3 h-3" /> Warna Label Kalender
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {PRESET_COLORS.map((hex) => (
                              <button
                                key={hex}
                                type="button"
                                onClick={() => {
                                  onUpdatePersonalCalendarColor(cal.id, hex);
                                  setActiveDropdownId(null);
                                }}
                                className={`w-4 h-4 rounded-full border cursor-pointer transition-transform hover:scale-110 ${
                                  cal.color === hex
                                    ? 'border-slate-900 ring-2 ring-slate-300'
                                    : 'border-white'
                                }`}
                                style={{ backgroundColor: hex }}
                                title={`Ubah warna ke ${hex}`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Venue Groups */}
        <div className="space-y-5">
          {venueGroups.map(([groupName, groupVenues], idx) => {
            const groupDropdownKey = `group-${groupName}`;
            const isGroupDropdownOpen = activeDropdownId === groupDropdownKey;
            const isGroupCollapsed = !!collapsedVenueGroups[groupName];
            const showHideKey = 'global-show-hide';
            const isShowHideOpen = activeDropdownId === showHideKey;

            return (
              <div key={groupName} className="relative">
                {idx === 0 && (
                  <div className="flex justify-end mb-1.5 relative">
                    <button
                      type="button"
                      aria-expanded={isShowHideOpen}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdownId(isShowHideOpen ? null : showHideKey);
                      }}
                      className="text-[11px] text-[#2b90a0] hover:underline font-medium cursor-pointer flex items-center gap-1"
                    >
                      <span>Tampilkan/Sembunyikan</span>
                      <span>▾</span>
                    </button>

                    {/* Dropdown for Tampilkan/Sembunyikan */}
                    {isShowHideOpen && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-5 z-40 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 text-xs space-y-1"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            handleSetAllVenues(true);
                            setActiveDropdownId(null);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center gap-2 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Tampilkan Semua Ruangan</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleSetAllVenues(false);
                            setActiveDropdownId(null);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center gap-2 cursor-pointer"
                        >
                          <EyeOff className="w-3.5 h-3.5 text-rose-500" />
                          <span>Sembunyikan Semua Ruangan</span>
                        </button>
                        <div className="border-t border-slate-100 my-1" />
                        <button
                          type="button"
                          onClick={() => {
                            setCollapsedVenueGroups({});
                            setActiveDropdownId(null);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center gap-2 cursor-pointer"
                        >
                          <ChevronDown className="w-3.5 h-3.5 text-[#3898a6]" />
                          <span>Perluas Semua Grup Venue</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const next: Record<string, boolean> = {};
                            for (const [gName] of venueGroups) next[gName] = true;
                            setCollapsedVenueGroups(next);
                            setActiveDropdownId(null);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center gap-2 cursor-pointer"
                        >
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                          <span>Ciutkan Semua Grup Venue</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Venue Group Header with Interactive Dropdown */}
                <div className="relative flex items-center justify-between pb-1.5 border-b border-slate-300">
                  <button
                    type="button"
                    onClick={() => toggleGroupCollapse(groupName)}
                    className="text-xs font-bold text-slate-800 hover:text-[#2b90a0] leading-snug text-left cursor-pointer flex items-center gap-1.5"
                    title="Klik untuk menciutkan/memperluas daftar ruangan"
                  >
                    <span>{groupName}</span>
                    {isGroupCollapsed && (
                      <span className="text-[10px] font-normal text-slate-400">
                        ({groupVenues.length})
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    aria-label={`Opsi grup venue ${groupName}`}
                    aria-expanded={isGroupDropdownOpen}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDropdownId(isGroupDropdownOpen ? null : groupDropdownKey);
                    }}
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition cursor-pointer ${
                      isGroupDropdownOpen
                        ? 'bg-[#3898a6] text-white shadow-xs'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-600'
                    }`}
                    title={`Menu grup ${groupName}`}
                  >
                    {isGroupCollapsed ? '▸' : '▾'}
                  </button>

                  {/* Group Dropdown Menu */}
                  {isGroupDropdownOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-6 z-40 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 text-xs space-y-1"
                    >
                      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 truncate">
                        {groupName}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          toggleGroupCollapse(groupName);
                          setActiveDropdownId(null);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center gap-2 cursor-pointer"
                      >
                        <ChevronDown className="w-3.5 h-3.5 text-[#3898a6]" />
                        <span>
                          {isGroupCollapsed ? 'Perluas Daftar Ruangan' : 'Ciutkan Daftar Ruangan'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleSetAllVenues(true, groupName);
                          setActiveDropdownId(null);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center gap-2 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Centang Semua di Venue Ini</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleSetAllVenues(false, groupName);
                          setActiveDropdownId(null);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center gap-2 cursor-pointer"
                      >
                        <EyeOff className="w-3.5 h-3.5 text-rose-500" />
                        <span>Sembunyikan Semua di Venue Ini</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleSetAllVenues(false);
                          handleSetAllVenues(true, groupName);
                          setViewBy('venue');
                          setActiveDropdownId(null);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center gap-2 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#3898a6]" />
                        <span>Tampilkan Hanya Venue Ini</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Rooms List inside Venue Group */}
                {!isGroupCollapsed && (
                  <ul className="mt-2.5 space-y-2">
                    {groupVenues.map((venue) => {
                      const roomDropdownKey = `room-${venue.id}`;
                      const isRoomDropdownOpen = activeDropdownId === roomDropdownKey;
                      return (
                        <li key={venue.id} className="relative flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => onToggleVenue(venue.id)}
                            className="flex items-center gap-2 text-xs text-slate-700 hover:text-slate-900 text-left cursor-pointer py-0.5"
                          >
                            <span
                              className="w-4 h-4 rounded-full flex items-center justify-center text-white shrink-0 transition-transform active:scale-95"
                              style={{ backgroundColor: venue.selected ? venue.color : '#cbd5e1' }}
                            >
                              {venue.selected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </span>
                            <span
                              className={
                                venue.selected ? 'font-medium' : 'line-through text-slate-400'
                              }
                            >
                              {venue.name}
                            </span>
                          </button>

                          {/* Interactive Dropdown Button for Individual Room */}
                          <button
                            type="button"
                            aria-label={`Opsi ruangan ${venue.name}`}
                            aria-expanded={isRoomDropdownOpen}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdownId(isRoomDropdownOpen ? null : roomDropdownKey);
                            }}
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition cursor-pointer ${
                              isRoomDropdownOpen
                                ? 'bg-[#3898a6] text-white shadow-xs'
                                : 'bg-slate-200 hover:bg-slate-300 text-slate-600'
                            }`}
                            title={`Opsi ruangan ${venue.name}`}
                          >
                            ▾
                          </button>

                          {/* Individual Room Dropdown Menu */}
                          {isRoomDropdownOpen && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-6 z-40 w-60 bg-white rounded-xl shadow-xl border border-slate-200 p-2 text-xs space-y-1"
                            >
                              <div className="px-2.5 py-1 border-b border-slate-100">
                                <div className="font-bold text-slate-800">{venue.name}</div>
                                <div className="text-[10px] text-slate-400">
                                  {venue.groupName} • Kapasitas Maks. {venue.capacity} Tamu
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleSoloVenueRoom(venue.id)}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center gap-2 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#3898a6]" />
                                <span>Tampilkan Hanya Ruangan Ini</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setNewVenueId(venue.id);
                                  setShowAddModal(true);
                                  setActiveDropdownId(null);
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center gap-2 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                                <span>+ Buat Acara / Hold di Ruangan Ini</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!venue.selected) onToggleVenue(venue.id);
                                  setCalendarMode('timeline');
                                  setActiveDropdownId(null);
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center gap-2 cursor-pointer"
                              >
                                <Clock className="w-3.5 h-3.5 text-[#3898a6]" />
                                <span>Lihat di Linimasa Ketersediaan</span>
                              </button>

                              {onUpdateVenueColor && (
                                <div className="pt-1.5 mt-1 border-t border-slate-100 px-2.5 pb-1">
                                  <div className="text-[10px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                                    <Palette className="w-3 h-3" /> Ubah Warna Label Ruangan
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {PRESET_COLORS.map((hex) => (
                                      <button
                                        key={hex}
                                        type="button"
                                        onClick={() => {
                                          onUpdateVenueColor(venue.id, hex);
                                          setActiveDropdownId(null);
                                        }}
                                        className={`w-4 h-4 rounded-full border cursor-pointer transition-transform hover:scale-110 ${
                                          venue.color === hex
                                            ? 'border-slate-900 ring-2 ring-slate-300'
                                            : 'border-white'
                                        }`}
                                        style={{ backgroundColor: hex }}
                                        title={`Pilih warna ${hex}`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* Main Calendar Area */}
      <div className="flex-1 p-4 sm:p-6 space-y-5 min-w-0">
        {/* Top Filter Controls matching image_0759993e.png */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2 w-full">
            <button
              type="button"
              onClick={() => setShowTopFilterPanel((prev) => !prev)}
              className="text-xs text-[#2b90a0] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Ubah Tampilan &amp; Filter</span>
              <span>{showTopFilterPanel ? '▴' : '▾'}</span>
            </button>

            {showTopFilterPanel && (
              <div className="flex flex-wrap items-start gap-6 lg:gap-10 pt-1">
                {/* View Calendar by */}
                <div className="space-y-1.5 max-w-xs">
                  <div className="text-xs font-bold text-slate-800">
                    Tampilkan Kalender berdasarkan:
                  </div>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="viewCalendarBy"
                      checked={viewBy === 'event'}
                      onChange={() => setViewBy('event')}
                      className="text-[#2b90a0]"
                    />
                    <span>Acara</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="viewCalendarBy"
                      checked={viewBy === 'venue'}
                      onChange={() => setViewBy('venue')}
                      className="text-[#2b90a0]"
                    />
                    <span>Ruangan Venue</span>
                  </label>
                  <p className="text-[11px] italic text-[#2b90a0] leading-relaxed pt-0.5">
                    Jika suatu Acara belum memiliki ruangan venue terkait, acara tersebut TIDAK AKAN
                    TAMPIL pada mode tampilan ruangan venue ini.
                  </p>
                </div>

                {/* Filter By Status */}
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-slate-800">Filter Berdasarkan Status</div>
                  {[
                    { key: 'openLeads', label: 'Prospek Terbuka (Open Leads)' },
                    { key: 'holds', label: 'Hold Sementara' },
                    { key: 'bookedEvents', label: 'Acara Terkonfirmasi (Booked)' },
                    { key: 'archived', label: 'Diarsipkan' },
                  ].map((st) => (
                    <label
                      key={st.key}
                      className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={statusFilters[st.key as keyof typeof statusFilters]}
                        onChange={(e) =>
                          setStatusFilters((prev) => ({
                            ...prev,
                            [st.key]: e.target.checked,
                          }))
                        }
                        className="rounded border-slate-300 text-[#2b90a0]"
                      />
                      <span>{st.label}</span>
                    </label>
                  ))}
                </div>

                {/* Real-Time Multi-Module Sync Options */}
                <div className="space-y-2 bg-white px-4 py-3 rounded-xl border border-slate-200/80 shadow-2xs w-full sm:w-auto">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <RefreshCw className="w-3.5 h-3.5 text-[#2b90a0]" />
                    <span>Sinkronisasi Kalender Real-Time</span>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeSubItems}
                      onChange={(e) => setIncludeSubItems(e.target.checked)}
                      className="rounded border-slate-300 text-[#2b90a0]"
                    />
                    <span>Tampilkan Rundown, Kedatangan Vendor &amp; Tugas</span>
                  </label>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onTriggerSync();
                        setShowSyncModal(true);
                      }}
                      className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Sinkron iCal / Google ({lastSyncTime})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(true)}
                      className="px-2.5 py-1 rounded-md bg-[#48a5b3] hover:bg-[#3d919e] text-white text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Tambah Acara</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Real-time Anti-Conflict Status Banner */}
        {conflicts.length > 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Peringatan Bentrok Ruangan Real-Time:</strong> Terdapat {conflicts.length}{' '}
                tanggal/ruangan venue dengan jadwal ganda ({conflicts[0].date} di{' '}
                {conflicts[0].venueName}: {conflicts[0].eventTitles.join(' & ')}).
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
              <span>
                <strong>Proteksi Anti-Bentrok Aktif:</strong> Seluruh {events.length} jadwal acara
                di {venues.length} ruangan venue telah terverifikasi{' '}
                <strong>bebas bentrok (0 jadwal ganda)</strong>. Sistem otomatis mengunci ruangan
                yang sudah terisi pada tanggal yang sama.
              </span>
            </div>
          </div>
        )}

        {/* Calendar Card Container matching image_0759993e.png */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3 sm:p-5">
          {/* Calendar Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-md overflow-hidden border border-slate-200 bg-slate-100">
                <button
                  type="button"
                  aria-label="Tahun Sebelumnya"
                  title={`Tahun Sebelumnya (${currentYear - 1})`}
                  onClick={() => jumpToYearMonth(currentYear - 1, currentMonth)}
                  className="px-2.5 py-1.5 hover:bg-slate-200 text-slate-600 cursor-pointer"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Periode Sebelumnya"
                  title="Bulan / Periode Sebelumnya"
                  onClick={handlePrevPeriod}
                  className="px-2.5 py-1.5 hover:bg-slate-200 text-slate-600 border-l border-slate-200 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Periode Berikutnya"
                  title="Bulan / Periode Berikutnya"
                  onClick={handleNextPeriod}
                  className="px-2.5 py-1.5 hover:bg-slate-200 text-slate-600 border-l border-slate-200 cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Tahun Berikutnya"
                  title={`Tahun Berikutnya (${currentYear + 1})`}
                  onClick={() => jumpToYearMonth(currentYear + 1, currentMonth)}
                  className="px-2.5 py-1.5 hover:bg-slate-200 text-slate-600 border-l border-slate-200 cursor-pointer"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleJumpToToday}
                className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer"
                title="Lompat ke Bulan & Tanggal Hari Ini"
              >
                hari ini
              </button>
            </div>

            {/* Interactive Month & Year Title + Direct Dropdown Selectors */}
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-2xl font-normal text-slate-700 mr-1">
                {INDONESIAN_MONTH_NAMES[currentMonth]} {currentYear}
              </h2>
              <div className="inline-flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
                <select
                  aria-label="Pilih Bulan Kalender"
                  value={currentMonth}
                  onChange={(e) => jumpToYearMonth(currentYear, Number(e.target.value))}
                  className="px-2 py-1 rounded-md bg-white border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#2b90a0] cursor-pointer"
                >
                  {INDONESIAN_MONTH_NAMES.map((monthName, idx) => (
                    <option key={monthName} value={idx}>
                      {monthName}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Pilih Tahun Kalender"
                  value={currentYear}
                  onChange={(e) => jumpToYearMonth(Number(e.target.value), currentMonth)}
                  className="px-2 py-1 rounded-md bg-white border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#2b90a0] cursor-pointer"
                >
                  {YEAR_OPTIONS.includes(currentYear) ? null : (
                    <option value={currentYear}>{currentYear}</option>
                  )}
                  {YEAR_OPTIONS.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="inline-flex flex-wrap rounded-md overflow-hidden border border-slate-200 bg-slate-100">
              {(['month', 'week', 'day', 'timeline'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setCalendarMode(mode)}
                  className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    calendarMode === mode
                      ? 'bg-[#a3a3a3] text-white'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {modeLabels[mode]}
                </button>
              ))}
            </div>
          </div>

          {/* Quick-Jump Bar for Months with Active Events */}
          {activeMonthsWithEvents.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pb-4 mb-2 border-b border-slate-100 text-[11px]">
              <span className="text-slate-500 font-medium mr-1">Lompat Cepat Jadwal Aktif:</span>
              {activeMonthsWithEvents.map((item) => {
                const isCurrent = item.year === currentYear && item.month === currentMonth;
                const shortMonth = INDONESIAN_MONTH_NAMES[item.month]?.slice(0, 3) || '';
                return (
                  <button
                    key={`${item.year}-${item.month}`}
                    type="button"
                    onClick={() => jumpToYearMonth(item.year, item.month)}
                    className={`px-2.5 py-1 rounded-full font-semibold transition cursor-pointer flex items-center gap-1 ${
                      isCurrent
                        ? 'bg-[#3898a6] text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>
                      {shortMonth} {item.year}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        isCurrent ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Venue Availability Timeline View */}
          {calendarMode === 'timeline' ? (
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span>
                  <strong>Linimasa Ketersediaan Ruangan Venue:</strong> Pantau secara instan ruangan
                  mana yang kosong (Tersedia) atau sudah dipesan pada minggu ini.
                </span>
                <span className="font-semibold text-[#2b90a0]">
                  {INDONESIAN_MONTH_NAMES[currentMonth]} {currentYear} · Minggu ke-{weekIndex + 1} (
                  {visibleCells[0]?.date} s/d {visibleCells[visibleCells.length - 1]?.date})
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs min-w-[680px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                      <th className="py-3 px-4 min-w-[200px] border-r border-slate-200">
                        Ruangan / Area Venue
                      </th>
                      {visibleCells.map((cell) => (
                        <th
                          key={cell.date}
                          className="py-3 px-2.5 text-center border-r border-slate-200 min-w-[100px]"
                        >
                          <div>{cell.date.slice(5)}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {venues
                      .filter((v) => v.selected)
                      .map((venue) => (
                        <tr key={venue.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-4 border-r border-slate-200">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: venue.color }}
                              />
                              <div>
                                <div className="font-bold text-slate-800">{venue.name}</div>
                                <div className="text-[10px] text-slate-500">
                                  {venue.groupName} · Kapasitas {venue.capacity} kursi
                                </div>
                              </div>
                            </div>
                          </td>
                          {visibleCells.map((cell) => {
                            const bookedHere = events.filter(
                              (ev) => ev.date === cell.date && ev.venueSpaceId === venue.id
                            );
                            return (
                              <td
                                key={cell.date}
                                className="p-1.5 border-r border-slate-200 align-top"
                              >
                                {bookedHere.length === 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setNewDate(cell.date);
                                      setNewVenueId(venue.id);
                                      setShowAddModal(true);
                                    }}
                                    className="w-full py-2 px-1.5 rounded-lg border border-dashed border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 text-emerald-700 text-[10px] font-semibold text-center cursor-pointer"
                                  >
                                    + Tersedia
                                  </button>
                                ) : (
                                  <div className="space-y-1">
                                    {bookedHere.map((ev) => (
                                      <button
                                        key={ev.id}
                                        type="button"
                                        onClick={() => onSelectEvent(ev.id)}
                                        style={{ backgroundColor: venue.color }}
                                        className="w-full text-left p-1.5 rounded-lg text-white text-[10px] font-semibold shadow-2xs cursor-pointer"
                                      >
                                        <div className="truncate">{ev.title}</div>
                                        <div className="opacity-85 text-[9px]">{ev.startTime}</div>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className={calendarMode === 'day' ? 'w-full' : 'min-w-[680px]'}>
                {/* Day of Week Header */}
                {calendarMode !== 'day' && (
                  <div className="grid grid-cols-7 border-t border-l border-slate-200">
                    {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((dayName) => (
                      <div
                        key={dayName}
                        className="py-1.5 text-center text-xs font-bold text-slate-700 border-r border-b border-slate-200 bg-slate-50/50"
                      >
                        {dayName}
                      </div>
                    ))}
                  </div>
                )}

                {/* Calendar Grid Cells */}
                <div
                  className={`grid ${
                    calendarMode === 'day' ? 'grid-cols-1' : 'grid-cols-7'
                  } border-l border-slate-200`}
                >
                  {visibleCells.map((cell) => {
                    const dayEntries = entriesByDate.get(cell.date) || [];
                    return (
                      <div
                        key={cell.date}
                        onClick={() => setSelectedDayDate(cell.date)}
                        className={`group min-h-[140px] border-r border-b border-slate-200 p-1.5 flex flex-col gap-1.5 transition-colors ${
                          cell.isCurrentMonth ? 'bg-white' : 'bg-slate-50/40'
                        }`}
                      >
                        <div className="flex items-center justify-between px-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNewDate(cell.date);
                              setShowAddModal(true);
                            }}
                            title={`Tambah acara pada ${cell.date}`}
                            className="opacity-0 group-hover:opacity-100 focus:opacity-100 px-1.5 py-0.5 rounded bg-slate-100 hover:bg-[#3898a6] hover:text-white text-[10px] font-semibold text-slate-600 transition cursor-pointer"
                          >
                            + Acara
                          </button>
                          <div className="flex items-center gap-1">
                            {calendarMode === 'day' && (
                              <span className="text-[10px] text-slate-400 mr-1">{cell.date}</span>
                            )}
                            <span
                              className={`text-xs tabular-nums ${
                                cell.isCurrentMonth ? 'text-slate-600 font-medium' : 'text-slate-400'
                              }`}
                            >
                              {cell.dayNum}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          {dayEntries.map((entry) => {
                            const isGold = entry.color.toLowerCase() === '#f5b027';
                            const textClass = isGold ? 'text-slate-900' : 'text-white';
                            const subTextClass = isGold ? 'text-slate-800/80' : 'text-white/85';
                            return (
                              <button
                                key={entry.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectEvent(entry.parentEventId);
                                }}
                                style={{ backgroundColor: entry.color }}
                                className={`w-full text-left rounded-xl p-2 shadow-2xs hover:opacity-95 transition-opacity cursor-pointer ${textClass}`}
                              >
                                <div
                                  className={`flex items-center gap-1 text-[10px] uppercase tracking-wide font-semibold ${subTextClass}`}
                                >
                                  <Building2 className="w-3 h-3 shrink-0" />
                                  <span>
                                    {entry.sourceType === 'event'
                                      ? 'VENUE'
                                      : entry.sourceType.toUpperCase()}
                                  </span>
                                </div>
                                <div
                                  className={`text-[10px] italic leading-tight mt-0.5 ${subTextClass}`}
                                >
                                  &ldquo;{entry.venueName}&rdquo;
                                </div>
                                <div
                                  className={`text-[10px] uppercase font-medium mt-0.5 ${subTextClass}`}
                                >
                                  {formatStatusBadge(entry.status)}
                                </div>
                                <div className="text-xs font-bold leading-snug mt-1">
                                  {entry.timeLabel} {entry.title}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Calendar Event Modal */}
      {showAddModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-calendar-modal-title"
          className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 id="add-calendar-modal-title" className="text-base font-bold text-slate-800 mb-1">
              Tambah Acara / Hold Tersinkronisasi
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Langsung tersinkronisasi ke Kalender Master, Ruangan Venue, Prospek, dan Analitik.
            </p>
            <form onSubmit={handleCreateCalendarEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Acara
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Misal: Resepsi KTT Teknologi Nusantara"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#2b90a0]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Acara
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Waktu Mulai
                  </label>
                  <input
                    type="text"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Pemesanan
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as EventStatus)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Booked Event">Acara Terkonfirmasi (Booked)</option>
                    <option value="Hold">Hold Sementara</option>
                    <option value="Open Lead">Prospek Terbuka (Open Lead)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ruangan Venue
                  </label>
                  <select
                    value={newVenueId}
                    onChange={(e) => {
                      setNewVenueId(e.target.value);
                      setFormError('');
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    {venues.map((v) => {
                      const existingOnDate = findVenueConflictForBooking(events, newDate, v.id);
                      return (
                        <option key={v.id} value={v.id}>
                          {v.groupName} - {v.name}{' '}
                          {existingOnDate
                            ? `(⚠️ Terisi: ${existingOnDate.title})`
                            : '(✓ Tersedia)'}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {selectedSlotConflict ? (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Peringatan Anti-Bentrok Ruangan:</strong> Ruangan ini sudah digunakan
                      pada <strong>{newDate}</strong> untuk acara{' '}
                      <strong>&ldquo;{selectedSlotConflict.title}&rdquo;</strong> (
                      {selectedSlotConflict.startTime}).
                    </div>
                  </div>
                  {availableVenuesOnNewDate.length > 0 && (
                    <div>
                      <div className="text-[11px] font-semibold text-amber-800 mb-1">
                        Pilih Ruangan yang Masih Tersedia pada {newDate}:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {availableVenuesOnNewDate.slice(0, 5).map((avail) => (
                          <button
                            key={avail.id}
                            type="button"
                            onClick={() => {
                              setNewVenueId(avail.id);
                              setFormError('');
                            }}
                            className="px-2 py-1 rounded-md bg-white hover:bg-emerald-50 border border-amber-300 text-slate-700 text-[10px] font-semibold cursor-pointer"
                          >
                            ✓ {avail.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl bg-emerald-50/80 border border-emerald-200 px-3 py-2 text-[11px] text-emerald-800 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Ruangan venue ini <strong>Tersedia (Bebas Bentrok)</strong> pada tanggal{' '}
                    {newDate}.
                  </span>
                </div>
              )}

              {formError && <p className="text-xs text-red-600 font-medium">{formError}</p>}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setFormError('');
                    setShowAddModal(false);
                  }}
                  className="px-4 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-full bg-[#48a5b3] hover:bg-[#3d919e] text-white text-xs font-medium cursor-pointer"
                >
                  Simpan &amp; Sinkronkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Real-Time iCal / External Calendar Sync Modal */}
      {showSyncModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ical-sync-modal-title"
          className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#48a5b3]/15 text-[#2b90a0] flex items-center justify-center">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 id="ical-sync-modal-title" className="text-base font-bold text-slate-800">
                  Umpan Kalender Real-Time &amp; Sinkronisasi iCal (.ics)
                </h3>
                <p className="text-xs text-slate-500">
                  Terakhir disinkronkan: {lastSyncTime} · {calendarEntries.length} jadwal aktif
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2">
              <div className="text-xs font-semibold text-slate-700">
                URL Langganan WebCal / iCal Dua Arah
              </div>
              <input
                type="text"
                readOnly
                value="webcal://app.healplanning.local/feeds/nusan-tara-event-master.ics"
                className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-md text-slate-600"
              />
              <p className="text-[11px] text-slate-500">
                Hubungkan ke Google Calendar, Apple Calendar, atau Outlook untuk pembaruan dua arah
                secara real-time mencakup Acara Terkonfirmasi, Hold, Kedatangan Vendor, Rundown, dan
                Tugas.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleDownloadIcs}
                className="px-4 py-1.5 rounded-full bg-[#48a5b3] hover:bg-[#3d919e] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Berkas .ICS ({calendarEntries.length} Jadwal)</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSyncModal(false)}
                className="px-4 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
