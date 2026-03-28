import type {
  FeedItem,
  Community,
  MessageThread,
  Message,
  ItineraryItem,
  AppNotification,
  GlobalEvent,
  City,
} from "@/types/domain";

// ─────────────────────────────────────────────
// Events
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
// Feed
// ─────────────────────────────────────────────

export const MOCK_FEED_ITEMS: FeedItem[] = [
  {
    id: "f1",
    type: "fan_post",
    author: {
      id: "u2",
      name: "Carlos Mendez",
      avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=carlos",
      nationality: "MX",
    },
    body: "Just landed in Dallas. The energy at the airport is insane — fans from everywhere. This is what it's about. 🌍⚽",
    likesCount: 84,
    commentsCount: 12,
    isLiked: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 23).toISOString(),
    cityId: "dal",
    eventId: "wc2026",
    tags: ["Dallas", "WorldCup2026"],
  },
  {
    id: "f2",
    type: "local_tip",
    author: {
      id: "u3",
      name: "Priya Nair",
      avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=priya",
      nationality: "IN",
    },
    body: "For anyone heading to Miami matches — Wynwood is the spot for pre-game. Bars stay open late and there's a huge screen set up near the food hall. Much better than the stadium concourses.",
    likesCount: 211,
    commentsCount: 34,
    isLiked: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    cityId: "mia",
    eventId: "wc2026",
    tags: ["Miami", "LocalTip", "Wynwood"],
  },
  {
    id: "f3",
    type: "meetup",
    author: {
      id: "u4",
      name: "Jonas Weber",
      avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=jonas",
      nationality: "DE",
    },
    body: "Organizing a German supporters meetup in NYC before the Group Stage opener. Anyone in? Targeting a bar in Midtown. Drop your details below and I'll share the invite.",
    likesCount: 57,
    commentsCount: 28,
    isLiked: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    cityId: "nyc",
    eventId: "wc2026",
    tags: ["NYC", "Germany", "Meetup"],
  },
  {
    id: "f4",
    type: "travel_tip",
    author: {
      id: "u5",
      name: "Sofia Almeida",
      avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=sofia",
      nationality: "BR",
    },
    body: "Heads up: Metro lines in LA get completely overwhelmed on match days. Leave 90 minutes early minimum or use rideshare pickup zones marked in the official app. The walk from the nearest station is also longer than Google Maps suggests.",
    likesCount: 394,
    commentsCount: 61,
    isLiked: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 9).toISOString(),
    cityId: "lax",
    eventId: "wc2026",
    tags: ["LosAngeles", "Travel", "Transport"],
  },
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

// ─────────────────────────────────────────────
// Messages
// ─────────────────────────────────────────────

export const MOCK_THREADS: MessageThread[] = [
  {
    id: "t1",
    participants: [
      { id: "u2", name: "Carlos Mendez", avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=carlos" },
    ],
    lastMessage: {
      id: "m3",
      threadId: "t1",
      senderId: "u2",
      body: "See you at the fan zone at 6. Look for the green jersey.",
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      isRead: false,
    },
    unreadCount: 2,
    updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    isGroup: false,
  },
  {
    id: "t2",
    participants: [
      { id: "u3", name: "Priya Nair", avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=priya" },
      { id: "u4", name: "Jonas Weber", avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=jonas" },
      { id: "u5", name: "Sofia Almeida", avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=sofia" },
    ],
    lastMessage: {
      id: "m8",
      threadId: "t2",
      senderId: "u3",
      body: "The hotel lobby at 7pm works for everyone?",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      isRead: true,
    },
    unreadCount: 0,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    isGroup: true,
    groupName: "Miami Match Crew",
  },
];

export const MOCK_MESSAGES: Record<string, Message[]> = {
  t1: [
    { id: "m1", threadId: "t1", senderId: "u1", body: "Hey, heading to Dallas tomorrow. You around?", createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), isRead: true },
    { id: "m2", threadId: "t1", senderId: "u2", body: "Yes! Already here since yesterday. City is wild.", createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), isRead: true },
    { id: "m3", threadId: "t1", senderId: "u2", body: "See you at the fan zone at 6. Look for the green jersey.", createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), isRead: false },
  ],
  t2: [
    { id: "m5", threadId: "t2", senderId: "u5", body: "We should coordinate for the semifinal.", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), isRead: true },
    { id: "m6", threadId: "t2", senderId: "u4", body: "Agreed. I'm in Miami from the 12th.", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), isRead: true },
    { id: "m7", threadId: "t2", senderId: "u5", body: "Same. Should we meet before the match?", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3.5).toISOString(), isRead: true },
    { id: "m8", threadId: "t2", senderId: "u3", body: "The hotel lobby at 7pm works for everyone?", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), isRead: true },
  ],
};

// ─────────────────────────────────────────────
// Planning
// ─────────────────────────────────────────────

export const MOCK_ITINERARY_ITEMS: ItineraryItem[] = [
  {
    id: "i1",
    type: "travel",
    title: "Flight to Dallas (DFW)",
    notes: "American Airlines AA 2341 — Terminal D",
    date: "2026-06-14",
    time: "08:45",
    location: "JFK International Airport",
    cityId: "nyc",
    confirmed: true,
  },
  {
    id: "i2",
    type: "match",
    title: "Group Stage: Match Day 1",
    notes: "Section 112, Row F — arrive 2h early for entry",
    date: "2026-06-15",
    time: "19:00",
    location: "AT&T Stadium, Dallas",
    cityId: "dal",
    confirmed: true,
  },
  {
    id: "i3",
    type: "meetup",
    title: "German Supporters Pre-Game Meetup",
    notes: "Organized via FanZone — green jerseys as identifier",
    date: "2026-06-15",
    time: "16:00",
    location: "The Rustic, Dallas",
    cityId: "dal",
    confirmed: false,
  },
  {
    id: "i4",
    type: "accommodation",
    title: "Hotel check-in — Omni Dallas",
    date: "2026-06-14",
    time: "15:00",
    location: "555 S Lamar St, Dallas",
    cityId: "dal",
    confirmed: true,
  },
];

// ─────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: "n1",
    type: "message",
    title: "Carlos Mendez",
    body: "See you at the fan zone at 6. Look for the green jersey.",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    linkTo: "/messages/t1",
    actorAvatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=carlos",
  },
  {
    id: "n2",
    type: "community_activity",
    title: "Brazil Supporters — North America",
    body: "New post: Match-day transport guide for Dallas just shared.",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    linkTo: "/communities/c1",
  },
  {
    id: "n3",
    type: "event_reminder",
    title: "Match tomorrow",
    body: "Group Stage: Match Day 1 is at 7:00 PM. Don't forget to check transport.",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    linkTo: "/planning",
  },
  {
    id: "n4",
    type: "social_interaction",
    title: "Priya Nair liked your post",
    body: "Your local tip about stadium transport got 40 new likes.",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    actorAvatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=priya",
  },
];
