import type {
  Community,
  GlobalEvent,
  City,
} from "@/types/domain";

// ─────────────────────────────────────────────
// Events
// These constants are used as fallback references — migrate to DB when an events table is added.
// ─────────────────────────────────────────────

export const MOCK_CITIES: City[] = [
  { id: "nyc", name: "New York", country: "United States", countryCode: "US", timezone: "America/New_York" },
  { id: "lax", name: "Los Angeles", country: "United States", countryCode: "US", timezone: "America/Los_Angeles" },
  { id: "dal", name: "Dallas", country: "United States", countryCode: "US", timezone: "America/Chicago" },
  { id: "mia", name: "Miami", country: "United States", countryCode: "US", timezone: "America/New_York" },
  { id: "mex", name: "Mexico City", country: "Mexico", countryCode: "MX", timezone: "America/Mexico_City" },
  { id: "tor", name: "Toronto", country: "Canada", countryCode: "CA", timezone: "America/Toronto" },
];

export const MOCK_EVENT: GlobalEvent = {
  id: "wc2026",
  name: "FIFA World Cup 2026",
  type: "world_cup",
  startDate: "2026-06-11",
  endDate: "2026-07-19",
  hostCities: MOCK_CITIES,
  isActive: true,
};

// ─────────────────────────────────────────────
// Itinerary
// ─────────────────────────────────────────────

export const MOCK_ITINERARY_ITEMS: { id: string; title: string; date: string; time?: string }[] = [
  { id: "it1", title: "Brazil vs Mexico — Group Stage", date: "2026-06-22", time: "15:00" },
  { id: "it2", title: "Fan Fest at Dallas Fair Park", date: "2026-06-23", time: "11:00" },
  { id: "it3", title: "Toronto Arrival & Hotel Check-in", date: "2026-06-28" },
];

// ─────────────────────────────────────────────
// Communities
// ─────────────────────────────────────────────

export const MOCK_COMMUNITIES: Community[] = [
  {
    id: "c1",
    name: "Brazil Supporters — North America",
    description: "The official gathering place for Brazilian fans attending matches across the US, Canada, and Mexico. Match-day coordination, fan zones, and travel tips.",
    type: "national_supporters",
    memberCount: 4821,
    isJoined: true,
    isPrivate: false,
    eventId: "wc2026",
    tags: ["Brazil", "CBF", "SelecaoNasCopas"],
    createdAt: "2025-09-01T00:00:00Z",
  },
  {
    id: "c2",
    name: "Dallas Match Week — Group Stage",
    description: "Everything you need for the Group Stage matches in Dallas: tickets, transport, tailgates, and local recommendations from people already on the ground.",
    type: "city_based",
    memberCount: 1203,
    isJoined: false,
    isPrivate: false,
    cityId: "dal",
    eventId: "wc2026",
    tags: ["Dallas", "GroupStage", "ATT Stadium"],
    createdAt: "2025-11-15T00:00:00Z",
  },
  {
    id: "c3",
    name: "US Soccer Fan Network",
    description: "The home base for USMNT supporters — from everyday MLS fans to those making the trip to cheer on the home side.",
    type: "national_supporters",
    memberCount: 9340,
    isJoined: false,
    isPrivate: false,
    eventId: "wc2026",
    tags: ["USMNT", "USASoccer", "BeBoldOrBeGone"],
    createdAt: "2024-06-01T00:00:00Z",
  },
  {
    id: "c4",
    name: "Traveling Fans Without Tickets",
    description: "A community for the thousands of fans who make the trip for the atmosphere — whether or not they have a ticket. Watch parties, fan fests, and city guides.",
    type: "fan_identity",
    memberCount: 2617,
    isJoined: false,
    isPrivate: false,
    eventId: "wc2026",
    tags: ["FanFest", "WatchParty", "NoTicketNeeded"],
    createdAt: "2026-01-10T00:00:00Z",
  },
  {
    id: "c5",
    name: "Toronto Arrivals & Welcome",
    description: "Helping international fans navigate Toronto — airport transfers, accommodation, SIM cards, and meeting locals who know the city.",
    type: "city_based",
    memberCount: 788,
    isJoined: false,
    isPrivate: false,
    cityId: "tor",
    eventId: "wc2026",
    tags: ["Toronto", "Arrivals", "Welcome"],
    createdAt: "2026-02-01T00:00:00Z",
  },
];
