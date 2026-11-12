export type NavSection =
  | 'home'
  | 'events'
  | 'calendars'
  | 'contacts'
  | 'communications'
  | 'leads'
  | 'proposals'
  | 'invoices'
  | 'contracts'
  | 'reports'
  | 'templates'
  | 'client-portal';

export type EventSubView =
  | 'itinerary'
  | 'guests'
  | 'vendors'
  | 'floorplan'
  | 'food-package'
  | 'todos'
  | 'budgets'
  | 'website'
  | 'vision-board';

export type EventStatus = 'Booked Event' | 'Open Lead' | 'Hold' | 'Closed' | 'Archived';

export interface VenueSpace {
  id: string;
  groupName: string;
  name: string;
  color: string;
  capacity: number;
  selected: boolean;
}

export interface PersonalCalendar {
  id: string;
  name: string;
  color: string;
  selected: boolean;
}

export interface Vendor {
  id: string;
  name: string;
  company: string;
  category:
    | 'Coordinator'
    | 'Decor & Floral'
    | 'Rentals'
    | 'Transport'
    | 'Catering'
    | 'Photography'
    | 'Entertainment'
    | 'Beauty & Hair'
    | 'Venue Staff';
  email: string;
  phone: string;
  eventIds: string[];
  contractAmount: number;
  paidAmount: number;
  contractStatus: 'Signed' | 'Pending Signature' | 'Draft';
  insuranceVerified: boolean;
  arrivalTime?: string;
  notes?: string;
}

export interface ContactPerson {
  id: string;
  name: string;
  organization: string;
  role: 'Client' | 'Venue Manager' | 'Planner' | 'VIP Guest' | 'Sponsor';
  email: string;
  phone: string;
  eventIds: string[];
}

export interface ItineraryItem {
  id: string;
  eventId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. "09:00 WIB"
  endTime?: string;
  title: string;
  category: 'Ceremony' | 'Reception' | 'Setup/Prep';
  vendorIds: string[];
  contactIds: string[];
  venueRoom?: string;
  reminderText?: string;
  notes?: string;
  attachmentsCount: number;
  completed?: boolean;
  expanded?: boolean;
}

export type RsvpStatus = 'Attending' | 'Declined' | 'Pending';

export type DietaryTag =
  | 'None'
  | 'Gluten-Free'
  | 'Vegetarian'
  | 'Vegan'
  | 'Reduced Sodium'
  | 'Nut Allergy'
  | 'Dairy-Free';

export interface GuestItem {
  id: string;
  eventId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  groupOrHousehold: string;
  rsvpStatus: RsvpStatus;
  plusOnes: number;
  mealChoice: string;
  dietaryRestrictions: DietaryTag[];
  customQuestionResponse?: string;
  tableId: string | null;
  seatNumber?: number;
  isVip: boolean;
  checkedIn: boolean;
  notes?: string;
}

export interface FloorplanTable {
  id: string;
  eventId: string;
  number: string;
  label: string;
  type: 'round-8' | 'round-10' | 'head-table' | 'cocktail' | 'buffet' | 'piano' | 'lounge' | 'bar-circle';
  seats: number;
  x: number; // percentage 0..100 on canvas
  y: number; // percentage 0..100 on canvas
  diameterFt: number;
}

export interface FoodPackageItem {
  id: string;
  category: 'Entree' | 'Side Dish' | 'Appetizer' | 'Dessert' | 'Beverage';
  name: string;
  description: string;
  imageType: 'chicken' | 'pasta' | 'beans' | 'salad' | 'rice' | 'dessert';
  dietaryNotes?: string;
  pricePerPerson: number;
}

export interface ProposalLineItem {
  id: string;
  eventId: string;
  title: string;
  subtitle: string;
  bullets: string[];
  importantNote?: string;
  imageType: 'clipboard' | 'planner' | 'ballroom' | 'catering';
  qty: number;
  unitCost: number;
  tax: number;
  markupOrDiscount: number; // positive for markup, negative for discount
}

export interface BudgetLineItem {
  id: string;
  eventId: string;
  category:
    | 'Venue & Katering'
    | 'Dekorasi & Florist'
    | 'Dokumentasi & Hiburan'
    | 'Busana & Rias'
    | 'Koordinasi & Logistik';
  title: string;
  estimatedCost: number;
  negotiatedCost: number;
  actualCost: number;
  paidAmount: number;
  dueDate: string;
  vendorId?: string;
  managerName: string;
  notes?: string;
}

export interface VisionComment {
  id: string;
  author: string;
  role: 'Planner' | 'Klien';
  text: string;
  timestamp: string;
}

export interface VisionBoardItem {
  id: string;
  eventId: string;
  category: 'Dekorasi & Bunga' | 'Busana & Rias' | 'Kue & Katering' | 'Pencahayaan & Panggung';
  title: string;
  description: string;
  paletteColors: string[];
  visualTheme: 'gazebo-floral' | 'table-setting' | 'wedding-cake' | 'string-lights' | 'bridal-attire' | 'lounge-decor';
  uploadedBy: string;
  comments: VisionComment[];
}

export interface WeddingWebsiteConfig {
  eventId: string;
  slug: string;
  heroTitle: string;
  welcomeMessage: string;
  ceremonyTimeLocation: string;
  receptionTimeLocation: string;
  dressCode: string;
  rsvpDeadline: string;
  customRsvpQuestion: string;
  seoTitle: string;
  seoDescription: string;
  allowOnlineRsvp: boolean;
  socialSharingEnabled: boolean;
  themeColor: string;
}

export interface TodoTask {
  id: string;
  eventId: string;
  title: string;
  description: string;
  subList?: string;
  dueRule: string; // e.g., "150 hari SEBELUM tanggal acara"
  dueDate: string; // YYYY-MM-DD
  contactNames: string[];
  organization: string;
  reminderText: string;
  fileName?: string;
  completed: boolean;
  overdue?: boolean;
}

export interface CommunicationMessage {
  id: string;
  senderName: string;
  senderEmail: string;
  recipientName: string;
  subject: string;
  preview: string;
  body: string;
  timestamp: string;
  dateFormatted: string;
  timeFormatted: string;
  unread: boolean;
  starred: boolean;
  folder: 'inbox' | 'sent' | 'archived' | 'trash';
  associatedEventId?: string;
  associatedEventLabel?: string;
  associatedEventColor?: string;
}

export interface PlannerEvent {
  id: string;
  title: string;
  subtitle: string;
  date: string; // YYYY-MM-DD
  endDate: string;
  startTime: string;
  endTime: string;
  daysUntil: number;
  status: EventStatus;
  venueSpaceId: string;
  venueName: string;
  calendarOwnerId: string;
  capturedDate: string;
  avatarUrl: string;
  budgetTotal: number;
  serviceCharge: number;
  foodPackageName: string;
  foodPackageNotes: string;
  linkedToBeo: boolean;
}

export interface UnifiedCalendarEntry {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  timeLabel: string;
  status: EventStatus;
  venueSpaceId: string;
  venueName: string;
  color: string;
  sourceType: 'event' | 'itinerary' | 'vendor' | 'todo';
  parentEventId: string;
}
