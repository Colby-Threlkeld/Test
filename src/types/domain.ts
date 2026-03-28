// ─────────────────────────────────────────────
// Core domain types
// Designed to support World Cup as v1, but
// intentionally generic for future events.
// ─────────────────────────────────────────────

export type EventType =
  | "world_cup"
  | "copa_america"
  | "euros"
  | "olympics"
  | "formula1"
  | "club_tournament"
  | "festival"
  | "other";

export interface GlobalEvent {
  id: string;
  name: string;
  type: EventType;
  startDate: string;
  endDate: string;
  hostCities: City[];
  coverImage?: string;
  isActive: boolean;
}

export interface City {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  timezone: string;
  lat?: number;
  lon?: number;
}

export interface Venue {
  id: string;
  name: string;
  cityId: string;
  address?: string;
  capacity?: number;
  lat?: number;
  lon?: number;
}

export interface Match {
  id: string;
  eventId: string;
  homeTeam: Team;
  awayTeam: Team;
  venue: Venue;
  kickoffUtc: string;
  stage: string; // "Group Stage", "Round of 16", "Final", etc.
  status: "scheduled" | "live" | "finished";
  score?: { home: number; away: number };
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  countryCode: string; // ISO 3166-1 alpha-2
  flagEmoji: string;
}

// ─────────────────────────────────────────────
// User & Profile
// ─────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  nationality?: string;
  bio?: string;
  joinedAt: string;
}

export interface Profile extends User {
  followersCount: number;
  followingCount: number;
  postsCount: number;
  communities: string[]; // community ids
}

// ─────────────────────────────────────────────
// Feed
// ─────────────────────────────────────────────

export type FeedItemType =
  | "fan_post"
  | "local_tip"
  | "match_update"
  | "meetup"
  | "travel_tip"
  | "community_highlight";

export interface FeedItem {
  id: string;
  type: FeedItemType;
  author: Pick<User, "id" | "name" | "avatarUrl" | "nationality">;
  body: string;
  imageUrl?: string;
  cityId?: string;
  eventId?: string;
  matchId?: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  createdAt: string;
  tags?: string[];
}

// ─────────────────────────────────────────────
// Communities
// ─────────────────────────────────────────────

export type CommunityType =
  | "national_supporters"
  | "city_based"
  | "travel_group"
  | "fan_identity"
  | "event_official"
  | "watch_party";

export interface Community {
  id: string;
  name: string;
  description: string;
  type: CommunityType;
  coverImage?: string;
  memberCount: number;
  isJoined: boolean;
  isPrivate: boolean;
  cityId?: string;
  eventId?: string;
  tags: string[];
  createdAt: string;
}

// ─────────────────────────────────────────────
// Messaging
// ─────────────────────────────────────────────

export interface MessageThread {
  id: string;
  participants: Pick<User, "id" | "name" | "avatarUrl">[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
  isGroup: boolean;
  groupName?: string;
}

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  createdAt: string;
  isRead: boolean;
}

// ─────────────────────────────────────────────
// Planning / Itinerary
// ─────────────────────────────────────────────

export type ItineraryItemType =
  | "match"
  | "travel"
  | "accommodation"
  | "activity"
  | "meetup"
  | "food"
  | "transport";

export interface ItineraryItem {
  id: string;
  type: ItineraryItemType;
  title: string;
  notes?: string;
  date: string;
  time?: string;
  location?: string;
  cityId?: string;
  matchId?: string;
  confirmed: boolean;
  participants?: string[]; // user ids
}

export interface TripPlan {
  id: string;
  userId: string;
  title: string;
  eventId?: string;
  cities: City[];
  items: ItineraryItem[];
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────

export type NotificationType =
  | "message"
  | "community_activity"
  | "event_reminder"
  | "planning_update"
  | "social_interaction"
  | "system";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  linkTo?: string;
  actorAvatarUrl?: string;
}
