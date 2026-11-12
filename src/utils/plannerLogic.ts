import {
  BudgetLineItem,
  FloorplanTable,
  GuestItem,
  ItineraryItem,
  PersonalCalendar,
  PlannerEvent,
  ProposalLineItem,
  TodoTask,
  UnifiedCalendarEntry,
  Vendor,
  VenueSpace,
} from '../types/planner';

/**
 * Formats a number into Indonesian Rupiah (e.g. Rp 250.353.700)
 */
export function formatIDR(amount: number): string {
  const isNegative = amount < 0;
  const absVal = Math.round(Math.abs(amount));
  const formatted = absVal.toLocaleString('id-ID');
  return isNegative ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

/**
 * Calculates the total for a single proposal/invoice line item.
 * Formula: (qty * unitCost) + tax + markupOrDiscount
 */
export function calculateLineItemTotal(
  item: Pick<ProposalLineItem, 'qty' | 'unitCost' | 'tax' | 'markupOrDiscount'>
): number {
  const baseCost = item.qty * item.unitCost;
  const total = baseCost + item.tax + item.markupOrDiscount;
  return Math.round(total * 100) / 100;
}

/**
 * Calculates the full proposal summary matching Planning Pod's Proposal Total block.
 */
export function calculateProposalSummary(
  items: ProposalLineItem[],
  serviceCharge: number
): {
  subtotalCost: number;
  totalTax: number;
  totalMarkupOrDiscount: number;
  serviceCharge: number;
  grandTotal: number;
} {
  let subtotalCost = 0;
  let totalTax = 0;
  let totalMarkupOrDiscount = 0;

  for (const item of items) {
    subtotalCost += item.qty * item.unitCost;
    totalTax += item.tax;
    totalMarkupOrDiscount += item.markupOrDiscount;
  }

  subtotalCost = Math.round(subtotalCost * 100) / 100;
  totalTax = Math.round(totalTax * 100) / 100;
  totalMarkupOrDiscount = Math.round(totalMarkupOrDiscount * 100) / 100;
  const cleanService = Math.round(serviceCharge * 100) / 100;

  const grandTotal =
    Math.round((subtotalCost + totalTax + totalMarkupOrDiscount + cleanService) * 100) / 100;

  return {
    subtotalCost,
    totalTax,
    totalMarkupOrDiscount,
    serviceCharge: cleanService,
    grandTotal,
  };
}

/**
 * Calculates comprehensive Event Budget metrics (Estimated, Negotiated, Actual, Paid, Remaining, Over/Under Budget).
 */
export function calculateBudgetAnalytics(items: BudgetLineItem[]) {
  let totalEstimated = 0;
  let totalNegotiated = 0;
  let totalActual = 0;
  let totalPaid = 0;

  for (const item of items) {
    totalEstimated += item.estimatedCost;
    totalNegotiated += item.negotiatedCost;
    totalActual += item.actualCost;
    totalPaid += item.paidAmount;
  }

  const totalRemainingDue = Math.max(0, totalActual - totalPaid);
  const varianceAmount = totalEstimated - totalActual; // positive = under budget, negative = over budget
  const isOverBudget = totalActual > totalEstimated;
  const paidPercentage =
    totalActual > 0 ? Math.min(100, Math.round((totalPaid / totalActual) * 100)) : 0;

  return {
    totalEstimated: Math.round(totalEstimated),
    totalNegotiated: Math.round(totalNegotiated),
    totalActual: Math.round(totalActual),
    totalPaid: Math.round(totalPaid),
    totalRemainingDue: Math.round(totalRemainingDue),
    varianceAmount: Math.round(varianceAmount),
    isOverBudget,
    paidPercentage,
  };
}

/**
 * Parses a time label like "09:30 WIB" or "15:45 WIB" and shifts it by offsetMinutes.
 */
export function shiftTimeString(timeStr: string, offsetMinutes: number): string {
  const match24 = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (!match24) return timeStr;
  let hours = parseInt(match24[1], 10);
  const mins = parseInt(match24[2], 10);
  const isPM = /pm/i.test(timeStr) && hours < 12;
  const isAM = /am/i.test(timeStr) && hours === 12;
  if (isPM) hours += 12;
  if (isAM) hours = 0;

  let totalMinutes = hours * 60 + mins + offsetMinutes;
  totalMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const newHours = Math.floor(totalMinutes / 60);
  const newMins = totalMinutes % 60;
  const hh = String(newHours).padStart(2, '0');
  const mm = String(newMins).padStart(2, '0');
  return `${hh}:${mm} WIB`;
}

/**
 * Automatically shifts itinerary items prior to, after, or across the whole timeline by offsetMinutes.
 */
export function shiftItineraryTimes(
  items: ItineraryItem[],
  referenceIndex: number,
  offsetMinutes: number,
  scope: 'after' | 'before' | 'all' = 'after'
): ItineraryItem[] {
  return items.map((item, idx) => {
    const shouldShift =
      scope === 'all' ||
      (scope === 'after' && idx >= referenceIndex) ||
      (scope === 'before' && idx <= referenceIndex);

    if (!shouldShift) return item;

    return {
      ...item,
      startTime: shiftTimeString(item.startTime, offsetMinutes),
      endTime: item.endTime ? shiftTimeString(item.endTime, offsetMinutes) : item.endTime,
    };
  });
}

/**
 * Auto-layouts round banquet tables in a structured grid on the floorplan canvas.
 */
export function generateAutoGridFloorplan(
  existingTables: FloorplanTable[],
  rows: number,
  cols: number,
  seatsPerTable: number,
  eventId: string
): FloorplanTable[] {
  const headTable = existingTables.find((t) => t.type === 'head-table');
  const generated: FloorplanTable[] = [];

  const safeRows = Math.max(1, Math.min(4, rows));
  const safeCols = Math.max(1, Math.min(7, cols));

  let tableCounter = 1010;
  for (let r = 0; r < safeRows; r++) {
    for (let c = 0; c < safeCols; c++) {
      const x = 28 + c * (46 / Math.max(1, safeCols - 1));
      const y = 38 + r * (34 / Math.max(1, safeRows - 1));
      const numStr = String(tableCounter++);
      generated.push({
        id: `tbl-${numStr}`,
        eventId,
        number: numStr,
        label: `Meja ${numStr}`,
        type: seatsPerTable >= 10 ? 'round-10' : 'round-8',
        seats: seatsPerTable,
        x: Math.round(x),
        y: Math.round(y),
        diameterFt: seatsPerTable >= 10 ? 6 : 5,
      });
    }
  }

  if (headTable) {
    generated.push(headTable);
  }
  return generated;
}

/**
 * Aggregates guest RSVP counts, meal choices, dietary restrictions, and seating assignments.
 */
export function calculateGuestAnalytics(guests: GuestItem[]) {
  let totalInvitations = guests.length;
  let attendingHeadcount = 0;
  let declinedCount = 0;
  let pendingCount = 0;
  let checkedInCount = 0;
  let seatedGuestsCount = 0;
  let vipCount = 0;

  const mealCounts: Record<string, number> = {};
  const dietaryCounts: Record<string, number> = {
    'Gluten-Free': 0,
    Vegetarian: 0,
    Vegan: 0,
    'Reduced Sodium': 0,
    'Nut Allergy': 0,
    'Dairy-Free': 0,
  };
  const tableOccupancy: Record<string, number> = {};

  for (const g of guests) {
    const partySize = 1 + Math.max(0, g.plusOnes || 0);
    if (g.rsvpStatus === 'Attending') {
      attendingHeadcount += partySize;
      if (g.mealChoice) {
        mealCounts[g.mealChoice] = (mealCounts[g.mealChoice] || 0) + partySize;
      }
      for (const d of g.dietaryRestrictions) {
        if (d !== 'None') {
          dietaryCounts[d] = (dietaryCounts[d] || 0) + 1;
        }
      }
      if (g.tableId) {
        seatedGuestsCount += partySize;
        tableOccupancy[g.tableId] = (tableOccupancy[g.tableId] || 0) + partySize;
      }
    } else if (g.rsvpStatus === 'Declined') {
      declinedCount += partySize;
    } else {
      pendingCount += partySize;
    }

    if (g.checkedIn && g.rsvpStatus === 'Attending') {
      checkedInCount += partySize;
    }
    if (g.isVip) {
      vipCount += 1;
    }
  }

  return {
    totalInvitations,
    attendingHeadcount,
    declinedCount,
    pendingCount,
    checkedInCount,
    seatedGuestsCount,
    unseatedAttendingCount: Math.max(0, attendingHeadcount - seatedGuestsCount),
    vipCount,
    mealCounts,
    dietaryCounts,
    tableOccupancy,
  };
}

/**
 * Calculates floorplan seating capacity and unit conversions.
 */
export function calculateFloorplanStats(
  tables: FloorplanTable[],
  guests: GuestItem[],
  useMetric: boolean
) {
  const totalSeats = tables.reduce((sum, t) => sum + (t.seats || 0), 0);
  const guestStats = calculateGuestAnalytics(guests);
  const assignedSeats = guestStats.seatedGuestsCount;
  const availableSeats = Math.max(0, totalSeats - assignedSeats);

  const convertLength = (feet: number): string => {
    if (!useMetric) {
      return `${feet.toFixed(1)} ft.`;
    }
    const meters = feet * 0.3048;
    return `${meters.toFixed(1)} m`;
  };

  return {
    totalSeats,
    assignedSeats,
    availableSeats,
    tableOccupancy: guestStats.tableOccupancy,
    convertLength,
  };
}

/**
 * Calculates vendor financial & compliance metrics for an event or across all events.
 */
export function calculateVendorMetrics(vendors: Vendor[], eventId?: string) {
  const filtered = eventId
    ? vendors.filter((v) => v.eventIds.includes(eventId))
    : vendors;

  let totalContracted = 0;
  let totalPaid = 0;
  let signedCount = 0;
  let insuranceVerifiedCount = 0;

  for (const v of filtered) {
    totalContracted += v.contractAmount;
    totalPaid += v.paidAmount;
    if (v.contractStatus === 'Signed') signedCount++;
    if (v.insuranceVerified) insuranceVerifiedCount++;
  }

  return {
    vendorCount: filtered.length,
    totalContracted: Math.round(totalContracted * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    balanceDue: Math.round((totalContracted - totalPaid) * 100) / 100,
    signedCount,
    insuranceVerifiedCount,
  };
}

/**
 * Builds the real-time synchronized calendar entries from Events, Itinerary items, Vendor schedules, and Tasks.
 */
export function buildUnifiedCalendarEvents(params: {
  events: PlannerEvent[];
  itineraryItems: ItineraryItem[];
  vendors: Vendor[];
  venues: VenueSpace[];
  personalCalendars: PersonalCalendar[];
  todos?: TodoTask[];
  viewBy: 'venue' | 'event';
  statusFilters: Record<string, boolean>;
  includeSubItems?: boolean;
}): UnifiedCalendarEntry[] {
  const {
    events,
    itineraryItems,
    vendors,
    venues,
    personalCalendars,
    todos = [],
    viewBy,
    statusFilters,
    includeSubItems = false,
  } = params;

  const venueMap = new Map<string, VenueSpace>();
  for (const v of venues) venueMap.set(v.id, v);

  const personalMap = new Map<string, PersonalCalendar>();
  for (const p of personalCalendars) personalMap.set(p.id, p);

  const entries: UnifiedCalendarEntry[] = [];

  for (const ev of events) {
    // Check status filter
    const statusAllowed =
      (ev.status === 'Open Lead' && statusFilters.openLeads) ||
      (ev.status === 'Hold' && statusFilters.holds) ||
      (ev.status === 'Booked Event' && statusFilters.bookedEvents) ||
      (ev.status === 'Archived' && statusFilters.archived);

    if (!statusAllowed) continue;

    const venue = venueMap.get(ev.venueSpaceId);
    const personal = personalMap.get(ev.calendarOwnerId);

    if (viewBy === 'venue') {
      if (!venue || !venue.selected) continue;
    } else {
      if (personal && !personal.selected && (!venue || !venue.selected)) continue;
    }

    entries.push({
      id: `cal-ev-${ev.id}`,
      title: ev.title,
      date: ev.date,
      timeLabel: ev.startTime,
      status: ev.status,
      venueSpaceId: ev.venueSpaceId,
      venueName: venue ? `${venue.groupName} - ${venue.name}` : ev.venueName,
      color: venue?.color || '#14b8a6',
      sourceType: 'event',
      parentEventId: ev.id,
    });

    if (includeSubItems) {
      const evItineraries = itineraryItems.filter((it) => it.eventId === ev.id);
      for (const it of evItineraries) {
        entries.push({
          id: `cal-it-${it.id}`,
          title: `Rundown: ${it.title}`,
          date: it.date,
          timeLabel: it.startTime,
          status: ev.status,
          venueSpaceId: ev.venueSpaceId,
          venueName: venue ? `${venue.groupName} - ${venue.name}` : ev.venueName,
          color: '#0ea5e9',
          sourceType: 'itinerary',
          parentEventId: ev.id,
        });
      }

      const evVendors = vendors.filter((v) => v.eventIds.includes(ev.id) && v.arrivalTime);
      for (const v of evVendors) {
        entries.push({
          id: `cal-ven-${ev.id}-${v.id}`,
          title: `Kedatangan Vendor: ${v.company}`,
          date: ev.date,
          timeLabel: v.arrivalTime || '08:00 WIB',
          status: ev.status,
          venueSpaceId: ev.venueSpaceId,
          venueName: venue ? `${venue.groupName} - ${venue.name}` : ev.venueName,
          color: '#f59e0b',
          sourceType: 'vendor',
          parentEventId: ev.id,
        });
      }

      const evTodos = todos.filter((t) => t.eventId === ev.id && !t.completed);
      for (const td of evTodos) {
        entries.push({
          id: `cal-td-${td.id}`,
          title: `Tugas: ${td.title}`,
          date: td.dueDate.startsWith('2026-10') ? td.dueDate : ev.date,
          timeLabel: '09:00 WIB',
          status: ev.status,
          venueSpaceId: ev.venueSpaceId,
          venueName: venue ? `${venue.groupName} - ${venue.name}` : ev.venueName,
          color: '#ec4899',
          sourceType: 'todo',
          parentEventId: ev.id,
        });
      }
    }
  }

  return entries;
}

/**
 * Detects real-time venue double-bookings on the same date and venueSpaceId.
 */
export function detectScheduleConflicts(events: PlannerEvent[]): Array<{
  date: string;
  venueSpaceId: string;
  venueName: string;
  eventTitles: string[];
}> {
  const byDateAndVenue = new Map<string, PlannerEvent[]>();

  for (const ev of events) {
    if (ev.status === 'Archived' || ev.status === 'Closed') continue;
    const key = `${ev.date}::${ev.venueSpaceId}`;
    const list = byDateAndVenue.get(key) || [];
    list.push(ev);
    byDateAndVenue.set(key, list);
  }

  const conflicts: Array<{
    date: string;
    venueSpaceId: string;
    venueName: string;
    eventTitles: string[];
  }> = [];

  for (const [, list] of byDateAndVenue.entries()) {
    if (list.length > 1) {
      conflicts.push({
        date: list[0].date,
        venueSpaceId: list[0].venueSpaceId,
        venueName: list[0].venueName,
        eventTitles: list.map((e) => e.title),
      });
    }
  }

  return conflicts;
}

/**
 * Checks whether a specific venue space already has an active booking/hold on the given date.
 */
export function findVenueConflictForBooking(
  events: PlannerEvent[],
  date: string,
  venueSpaceId: string,
  excludeEventId?: string
): PlannerEvent | null {
  for (const ev of events) {
    if (ev.status === 'Archived' || ev.status === 'Closed') continue;
    if (excludeEventId && ev.id === excludeEventId) continue;
    if (ev.date === date && ev.venueSpaceId === venueSpaceId) {
      return ev;
    }
  }
  return null;
}

/**
 * Returns all venue spaces that are free (unbooked) on a given date.
 */
export function getAvailableVenuesForDate(
  events: PlannerEvent[],
  venues: VenueSpace[],
  date: string,
  excludeEventId?: string
): VenueSpace[] {
  return venues.filter(
    (venue) => !findVenueConflictForBooking(events, date, venue.id, excludeEventId)
  );
}

/**
 * Generates an RFC 5545 iCalendar (.ics) string for real-time calendar synchronization.
 */
export function generateICalFeed(entries: UnifiedCalendarEntry[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Heal Planning//Event Management Real-Time Sync//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Heal Planning Kalender Utama',
  ];

  for (const entry of entries) {
    const cleanDate = entry.date.replace(/-/g, '');
    lines.push(
      'BEGIN:VEVENT',
      `UID:${entry.id}@healplanning.local`,
      `DTSTART;VALUE=DATE:${cleanDate}`,
      `SUMMARY:${entry.title} [${entry.status}]`,
      `LOCATION:${entry.venueName}`,
      `DESCRIPTION:Waktu: ${entry.timeLabel} | Sumber: ${entry.sourceType.toUpperCase()}`,
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export const INDONESIAN_MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export interface CalendarGridCell {
  date: string; // YYYY-MM-DD
  dayNum: number;
  monthIndex: number; // 0..11
  year: number;
  isCurrentMonth: boolean;
}

function formatYMD(year: number, monthIndex: number, day: number): string {
  const d = new Date(year, monthIndex, day);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/**
 * Generates a complete Sunday-to-Saturday calendar grid (35 or 42 cells) for any given year and monthIndex (0..11).
 */
export function generateCalendarMonthGrid(year: number, monthIndex: number): CalendarGridCell[] {
  const firstDay = new Date(year, monthIndex, 1);
  const normYear = firstDay.getFullYear();
  const normMonth = firstDay.getMonth();
  const startDayOfWeek = firstDay.getDay(); // 0 (Sunday) .. 6 (Saturday)
  const daysInCurrentMonth = new Date(normYear, normMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(normYear, normMonth, 0).getDate();

  const cells: CalendarGridCell[] = [];

  // Leading days from previous month
  const prevMonthDate = new Date(normYear, normMonth - 1, 1);
  const prevYear = prevMonthDate.getFullYear();
  const prevMonth = prevMonthDate.getMonth();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    cells.push({
      date: formatYMD(prevYear, prevMonth, dayNum),
      dayNum,
      monthIndex: prevMonth,
      year: prevYear,
      isCurrentMonth: false,
    });
  }

  // Days of current month
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    cells.push({
      date: formatYMD(normYear, normMonth, d),
      dayNum: d,
      monthIndex: normMonth,
      year: normYear,
      isCurrentMonth: true,
    });
  }

  // Trailing days from next month to complete 7-column weeks (minimum 35 cells)
  const nextMonthDate = new Date(normYear, normMonth + 1, 1);
  const nextYear = nextMonthDate.getFullYear();
  const nextMonth = nextMonthDate.getMonth();
  let nextDay = 1;
  while (cells.length % 7 !== 0 || cells.length < 35) {
    cells.push({
      date: formatYMD(nextYear, nextMonth, nextDay),
      dayNum: nextDay,
      monthIndex: nextMonth,
      year: nextYear,
      isCurrentMonth: false,
    });
    nextDay++;
  }

  return cells;
}

