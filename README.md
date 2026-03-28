# FanZone

A global fan social platform — built for major live events (World Cup, Olympics, F1, and more). Connect with fans worldwide, follow live feeds, plan your trip, and coordinate with your crew.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **NextAuth v4** (credentials provider)
- **Zustand** (client state)
- **Lucide React** (icons)

## Prerequisites

- Node.js 18+
- npm / yarn / pnpm

## Setup

1. **Clone and install dependencies**

   ```bash
   git clone <repo-url>
   cd fanzone
   npm install
   ```

2. **Configure environment variables**

   ```bash
   cp .env.local.example .env.local
   ```

   Then edit `.env.local`:

   | Variable | Required | Description |
   |---|---|---|
   | `NEXTAUTH_SECRET` | Yes | Run `openssl rand -base64 32` to generate |
   | `NEXTAUTH_URL` | Yes | `http://localhost:3000` for local dev |
   | `NEXT_PUBLIC_WEATHER_API_KEY` | No | OpenWeatherMap free-tier key (mocked if omitted) |

3. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Demo Login

The app ships with a mock auth user — no database required to try it out.

- **Email:** `demo@fanzone.app`
- **Password:** `demo`

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Public routes: login, signup
│   └── (main)/          # Protected routes: home, messages, communities, planning, settings
├── components/
│   ├── layout/          # AppShell, Sidebar, MobileNav, TopBar
│   ├── ui/              # Button, Card, Badge, Avatar, Input, Textarea
│   └── features/        # feed, communities, messaging, planning
├── data/mock.ts         # Mock feed posts, communities, threads, itinerary
├── lib/
│   ├── auth.ts          # NextAuth config + mock user store
│   └── utils.ts         # cn(), formatRelativeTime, formatCount, getInitials
├── store/ui.ts          # Zustand: notifications + sidebar state
├── types/domain.ts      # All domain interfaces (User, Event, FeedItem, Community…)
└── middleware.ts        # Protects main routes, redirects unauthenticated users
```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run type-check` | TypeScript check (no emit) |

## Roadmap to Production

1. Replace mock user store in `src/lib/auth.ts` with Supabase + bcrypt
2. Wire feed, communities, and messages to a real database (Supabase recommended for realtime)
3. Implement `POST /api/auth/register` for signup
4. Add server-side weather route (`/api/weather`) and connect WeatherWidget
5. Add Supabase Realtime to `ChatWindow` for live messaging
6. Layer OpenAI translation (voice or text) onto `MessageComposer`
