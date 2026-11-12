import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildUnifiedCalendarEvents,
  calculateBudgetAnalytics,
  calculateFloorplanStats,
  calculateGuestAnalytics,
  calculateLineItemTotal,
  calculateProposalSummary,
  calculateVendorMetrics,
  detectScheduleConflicts,
  findVenueConflictForBooking,
  formatIDR,
  generateAutoGridFloorplan,
  generateCalendarMonthGrid,
  generateICalFeed,
  getAvailableVenuesForDate,
  shiftItineraryTimes,
} from './plannerLogic';
import {
  INITIAL_EVENTS,
  INITIAL_FLOORPLAN_TABLES,
  INITIAL_GUESTS,
  INITIAL_ITINERARY_ITEMS,
  INITIAL_PERSONAL_CALENDARS,
  INITIAL_PROPOSAL_ITEMS,
  INITIAL_VENDORS,
  INITIAL_VENUE_SPACES,
} from '../data/seedData';

describe('plannerLogic pure business functions', () => {
  it('formats numbers into Indonesian Rupiah (formatIDR)', () => {
    assert.equal(formatIDR(250353700), 'Rp 250.353.700');
    assert.equal(formatIDR(-9332500), '-Rp 9.332.500');
    assert.equal(formatIDR(0), 'Rp 0');
  });

  it('calculates proposal line item totals and summary accurately in IDR', () => {
    const firstTotal = calculateLineItemTotal(INITIAL_PROPOSAL_ITEMS[0]);
    assert.equal(firstTotal, 26328000);

    const secondTotal = calculateLineItemTotal(INITIAL_PROPOSAL_ITEMS[1]);
    assert.equal(secondTotal, 67347000);

    const thirdTotal = calculateLineItemTotal(INITIAL_PROPOSAL_ITEMS[2]);
    assert.equal(thirdTotal, 120540000);

    const summary = calculateProposalSummary(INITIAL_PROPOSAL_ITEMS, 36138700);
    assert.equal(summary.subtotalCost, 209500000);
    assert.equal(summary.totalTax, 14047500);
    assert.equal(summary.totalMarkupOrDiscount, -9332500);
    assert.equal(summary.serviceCharge, 36138700);
    assert.equal(summary.grandTotal, 250353700);
  });

  it('calculates event budget analytics (estimated, negotiated, actual, paid, remaining, variance)', () => {
    const stats = calculateBudgetAnalytics([
      {
        id: 'b-1',
        eventId: 'ev-johnson-wedding',
        category: 'Venue & Katering',
        title: 'Sewa Ballroom & Paket Makan Malam Platinum',
        estimatedCost: 150000000,
        negotiatedCost: 142000000,
        actualCost: 140000000,
        paidAmount: 100000000,
        dueDate: '2026-09-15',
        managerName: 'Alex Ramsey',
      },
      {
        id: 'b-2',
        eventId: 'ev-johnson-wedding',
        category: 'Dekorasi & Florist',
        title: 'Dekorasi Bunga Gazebo & Pelaminan',
        estimatedCost: 50000000,
        negotiatedCost: 48500000,
        actualCost: 48500000,
        paidAmount: 24250000,
        dueDate: '2026-09-20',
        managerName: 'Laura Finch',
      },
    ]);

    assert.equal(stats.totalEstimated, 200000000);
    assert.equal(stats.totalNegotiated, 190500000);
    assert.equal(stats.totalActual, 188500000);
    assert.equal(stats.totalPaid, 124250000);
    assert.equal(stats.totalRemainingDue, 64250000);
    assert.equal(stats.varianceAmount, 11500000);
    assert.equal(stats.isOverBudget, false);
  });

  it('shifts itinerary times forward and backward automatically', () => {
    const shifted = shiftItineraryTimes(INITIAL_ITINERARY_ITEMS.slice(0, 2), 0, 30, 'after');
    assert.equal(shifted[0].startTime, '09:30 WIB');
    assert.equal(shifted[0].endTime, '10:00 WIB');
    assert.equal(shifted[1].startTime, '10:00 WIB');
  });

  it('generates auto-layout floorplan grid while preserving head table', () => {
    const grid = generateAutoGridFloorplan(INITIAL_FLOORPLAN_TABLES, 2, 4, 8, 'ev-johnson-wedding');
    // 2x4 = 8 round tables + 1 head table = 9 tables
    assert.equal(grid.length, 9);
    const totalSeats = grid.reduce((s, t) => s + t.seats, 0);
    assert.equal(totalSeats, 8 * 8 + 3);
  });

  it('aggregates guest RSVP headcounts, dietary restrictions, and seating', () => {
    const guestStats = calculateGuestAnalytics(INITIAL_GUESTS);
    assert.equal(guestStats.attendingHeadcount, 17);
    assert.equal(guestStats.pendingCount, 2);
    assert.equal(guestStats.declinedCount, 1);
    assert.equal(guestStats.seatedGuestsCount, 17);
    assert.equal(guestStats.dietaryCounts['Gluten-Free'], 2);
    assert.equal(guestStats.dietaryCounts['Vegetarian'], 2);
    assert.equal(guestStats.dietaryCounts['Reduced Sodium'], 2);
  });

  it('computes floorplan total seats (131) and metric/imperial conversion', () => {
    const fpImperial = calculateFloorplanStats(INITIAL_FLOORPLAN_TABLES, INITIAL_GUESTS, false);
    assert.equal(fpImperial.totalSeats, 131);
    assert.equal(fpImperial.assignedSeats, 17);
    assert.equal(fpImperial.convertLength(85.8), '85.8 ft.');

    const fpMetric = calculateFloorplanStats(INITIAL_FLOORPLAN_TABLES, INITIAL_GUESTS, true);
    assert.equal(fpMetric.convertLength(85.8), '26.2 m');
  });

  it('computes vendor contract totals, balance due, and COI verification counts', () => {
    const vendorStats = calculateVendorMetrics(INITIAL_VENDORS, 'ev-johnson-wedding');
    assert.equal(vendorStats.vendorCount, 7);
    assert.equal(vendorStats.signedCount, 6);
    assert.equal(vendorStats.insuranceVerifiedCount, 6);
    assert.ok(vendorStats.totalContracted > vendorStats.totalPaid);
    assert.equal(
      vendorStats.balanceDue,
      vendorStats.totalContracted - vendorStats.totalPaid
    );
  });

  it('builds unified calendar events and generates valid iCalendar (.ics) feed', () => {
    const entries = buildUnifiedCalendarEvents({
      events: INITIAL_EVENTS,
      itineraryItems: INITIAL_ITINERARY_ITEMS,
      vendors: INITIAL_VENDORS,
      venues: INITIAL_VENUE_SPACES,
      personalCalendars: INITIAL_PERSONAL_CALENDARS,
      viewBy: 'venue',
      statusFilters: {
        openLeads: true,
        holds: true,
        bookedEvents: true,
        archived: false,
      },
      includeSubItems: true,
    });

    assert.ok(entries.length >= 15);
    const ics = generateICalFeed(entries);
    assert.ok(ics.startsWith('BEGIN:VCALENDAR'));
    assert.ok(ics.includes('END:VCALENDAR'));
  });

  it('verifies INITIAL_EVENTS has 0 venue conflicts and prevents double-booking', () => {
    const initialConflicts = detectScheduleConflicts(INITIAL_EVENTS);
    assert.equal(initialConflicts.length, 0);

    const existingBooking = findVenueConflictForBooking(
      INITIAL_EVENTS,
      '2026-10-09',
      'ven-ch-quincy'
    );
    assert.ok(existingBooking !== null);
    assert.equal(existingBooking?.id, 'ev-johnson-wedding');

    const availableRoomsOct9 = getAvailableVenuesForDate(
      INITIAL_EVENTS,
      INITIAL_VENUE_SPACES,
      '2026-10-09'
    );
    assert.equal(availableRoomsOct9.length, INITIAL_VENUE_SPACES.length - 3);

    const duplicateEvents = [
      ...INITIAL_EVENTS,
      {
        ...INITIAL_EVENTS[0],
        id: 'ev-conflict-test',
        title: 'Acara Bentrok Kedua di Ballroom Quincy',
      },
    ];
    const conflicts = detectScheduleConflicts(duplicateEvents);
    assert.ok(conflicts.length >= 1);
  });

  it('generates accurate multi-month and multi-year calendar grids', () => {
    const oct2026 = generateCalendarMonthGrid(2026, 9);
    assert.equal(oct2026.length, 35);
    assert.equal(oct2026[0].date, '2026-09-27');
    assert.equal(oct2026[4].date, '2026-10-01');
    assert.equal(oct2026[34].date, '2026-10-31');

    const nov2026 = generateCalendarMonthGrid(2026, 10);
    assert.equal(nov2026[0].date, '2026-11-01');
    assert.equal(nov2026[0].isCurrentMonth, true);

    const feb2028Leap = generateCalendarMonthGrid(2028, 1);
    const hasFeb29 = feb2028Leap.some((c) => c.date === '2028-02-29' && c.isCurrentMonth);
    assert.equal(hasFeb29, true);
  });
});
