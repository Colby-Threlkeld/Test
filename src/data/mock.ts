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
    name: "F1 Global Fans",
    description: "The home for Formula 1 fans worldwide. Race previews, live reactions, travel to Grand Prix events, and connecting with fans at every circuit on the calendar.",
    type: "event_official",
    memberCount: 0,
    isJoined: false,
    isPrivate: false,
    tags: ["formula1", "racing", "grandprix", "motorsport"],
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "c2",
    name: "World Cup 2026",
    description: "Official fan community for FIFA World Cup 2026 hosted across the USA, Canada, and Mexico. Match schedules, city guides, fan meetups, and travel planning.",
    type: "event_official",
    memberCount: 0,
    isJoined: false,
    isPrivate: false,
    tags: ["worldcup", "football", "soccer", "fifa", "2026"],
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "c3",
    name: "Olympics Community",
    description: "Connecting fans of the Olympic Games. Summer, Winter, and Paralympic events — share your passion for the world's greatest sporting celebration.",
    type: "event_official",
    memberCount: 0,
    isJoined: false,
    isPrivate: false,
    tags: ["olympics", "sports", "paris2024", "la2028"],
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "c4",
    name: "Music Festival Hub",
    description: "For fans who travel the world for live music. Coachella, Glastonbury, Tomorrowland, Lollapalooza and more — find festival friends, share setlists, plan your season.",
    type: "fan_identity",
    memberCount: 0,
    isJoined: false,
    isPrivate: false,
    tags: ["festival", "music", "concerts", "livemusic"],
    createdAt: "2026-01-01T00:00:00Z",
  },
];
