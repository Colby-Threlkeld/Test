-- Run this in your Supabase SQL editor: https://supabase.com/dashboard/project/paepymfqyblhdtniiulj/sql
-- Safe to re-run: all statements are idempotent.

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─────────────────────────────────────────────
-- Users
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.users (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name          text        NOT NULL,
  email         text        NOT NULL UNIQUE,
  password_hash text        NOT NULL,
  avatar_url    text,
  nationality   text        DEFAULT 'US',
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.users TO anon;
GRANT SELECT, INSERT ON public.users TO authenticated;

-- ─────────────────────────────────────────────
-- Posts
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.posts (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id      uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type           text        NOT NULL DEFAULT 'fan_post'
                               CHECK (type IN ('fan_post','local_tip','meetup','travel_tip','match_update','community_highlight')),
  body           text        NOT NULL,
  image_url      text,
  city_id        text,
  location_label text,
  state_label    text,
  event_id       text,
  tags           text[]      DEFAULT '{}',
  likes_count    int         DEFAULT 0,
  comments_count int         DEFAULT 0,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS location_label text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS state_label text;

ALTER TABLE public.posts DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;

-- ─────────────────────────────────────────────
-- Post likes
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.post_likes (
  post_id    uuid        NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

ALTER TABLE public.post_likes DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.post_likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.post_likes TO authenticated;

-- ─────────────────────────────────────────────
-- Post comments
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.post_comments (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id    uuid        NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id  uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body       text        NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.post_comments DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.post_comments TO anon;
GRANT SELECT, INSERT, DELETE ON public.post_comments TO authenticated;

-- ─────────────────────────────────────────────
-- Communities
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.communities (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name         text        NOT NULL UNIQUE,
  description  text,
  type         text        NOT NULL DEFAULT 'fan_identity'
                             CHECK (type IN ('national_supporters','city_based','travel_group','fan_identity','event_official','watch_party')),
  cover_image  text,
  member_count int         DEFAULT 0,
  is_private   bool        DEFAULT false,
  city_id      text,
  event_id     text,
  tags         text[]      DEFAULT '{}',
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.communities DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.communities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.communities TO authenticated;

-- ─────────────────────────────────────────────
-- Community members
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.community_members (
  community_id uuid        NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id      uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at    timestamptz DEFAULT now(),
  PRIMARY KEY (community_id, user_id)
);

ALTER TABLE public.community_members DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.community_members TO anon;
GRANT SELECT, INSERT, DELETE ON public.community_members TO authenticated;

-- ─────────────────────────────────────────────
-- Message threads
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.message_threads (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  is_group    bool        DEFAULT false,
  group_name  text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE public.message_threads DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.message_threads TO anon;
GRANT SELECT, INSERT, UPDATE ON public.message_threads TO authenticated;

-- ─────────────────────────────────────────────
-- Thread participants
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.thread_participants (
  thread_id  uuid NOT NULL REFERENCES public.message_threads(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  PRIMARY KEY (thread_id, user_id)
);

ALTER TABLE public.thread_participants DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.thread_participants TO anon;
GRANT SELECT, INSERT, DELETE ON public.thread_participants TO authenticated;

-- ─────────────────────────────────────────────
-- Messages (realtime enabled)
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.messages (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id  uuid        NOT NULL REFERENCES public.message_threads(id) ON DELETE CASCADE,
  sender_id  uuid        NOT NULL REFERENCES public.users(id),
  body       text        NOT NULL,
  is_read    bool        DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.messages TO anon;
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- Itinerary items
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.itinerary_items (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type       text        NOT NULL CHECK (type IN ('match','travel','accommodation','meetup','activity')),
  title      text        NOT NULL,
  date       date        NOT NULL,
  time       text,
  location   text,
  notes      text,
  confirmed  bool        DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.itinerary_items DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.itinerary_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.itinerary_items TO authenticated;

-- ─────────────────────────────────────────────
-- Notifications
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notifications (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type             text        NOT NULL CHECK (type IN ('message','community_activity','event_reminder','planning_update','social_interaction','system')),
  title            text        NOT NULL,
  body             text        NOT NULL,
  is_read          bool        DEFAULT false,
  link_to          text,
  actor_avatar_url text,
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;

-- ─────────────────────────────────────────────
-- Reset communities
-- ─────────────────────────────────────────────

DELETE FROM public.community_members;
DELETE FROM public.communities;

-- ─────────────────────────────────────────────
-- Seed communities
-- ─────────────────────────────────────────────

INSERT INTO public.communities (name, description, type, cover_image, member_count, is_private, tags) VALUES
(
  'F1 Global Fans',
  'The home for Formula 1 fans worldwide. Race previews, live reactions, travel to Grand Prix events, and connecting with fans at every circuit on the calendar.',
  'event_official',
  'https://images.unsplash.com/photo-1541348263662-e068662d82af?w=800&q=80',
  0, false,
  ARRAY['formula1','racing','grandprix','motorsport']
),
(
  'World Cup 2026',
  'Official fan community for FIFA World Cup 2026 hosted across the USA, Canada, and Mexico. Match schedules, city guides, fan meetups, and travel planning.',
  'event_official',
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
  0, false,
  ARRAY['worldcup','football','soccer','fifa','2026']
),
(
  'Olympics Community',
  'Connecting fans of the Olympic Games. Summer, Winter, and Paralympic events — share your passion for the world''s greatest sporting celebration.',
  'event_official',
  'https://images.unsplash.com/photo-1569517282132-25d22f4573e6?w=800&q=80',
  0, false,
  ARRAY['olympics','sports','paris2024','la2028']
),
(
  'Music Festival Hub',
  'For fans who travel the world for live music. Coachella, Glastonbury, Tomorrowland, Lollapalooza and more — find festival friends, share setlists, plan your season.',
  'fan_identity',
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80',
  0, false,
  ARRAY['festival','music','concerts','livemusic']
)
ON CONFLICT (name) DO NOTHING;

-- ─────────────────────────────────────────────
-- Comprehensive seed data (idempotent)
-- ─────────────────────────────────────────────

DO $$
DECLARE
  demo_id   uuid;
  carlos_id uuid;
  priya_id  uuid;
  jonas_id  uuid;
  sofia_id  uuid;
  yuki_id   uuid;
  ahmed_id  uuid;
  james_id  uuid;
  mei_id    uuid;
  marco_id  uuid;
  ana_id    uuid;

  brazil_com_id   uuid;
  dallas_com_id   uuid;
  us_com_id       uuid;
  noticket_com_id uuid;
  toronto_com_id  uuid;

  thread1_id uuid;
  thread2_id uuid;

  p1 uuid; p2 uuid; p3 uuid; p4 uuid; p5 uuid;
  p6 uuid; p7 uuid; p8 uuid; p9 uuid; p10 uuid;
  p11 uuid; p12 uuid; p13 uuid; p14 uuid; p15 uuid;
  p16 uuid; p17 uuid; p18 uuid; p19 uuid; p20 uuid;
  p21 uuid; p22 uuid; p23 uuid; p24 uuid; p25 uuid;
BEGIN
  -- Guard: skip if already seeded
  IF EXISTS (SELECT 1 FROM public.users WHERE email = 'carlos@fanzone.app') THEN
    RETURN;
  END IF;

  -- ── Users ──────────────────────────────────

  INSERT INTO public.users (name, email, password_hash, avatar_url, nationality) VALUES
    ('Demo User',    'demo@fanzone.app',   crypt('demo', gen_salt('bf', 10)), 'https://api.dicebear.com/9.x/avataaars/svg?seed=demo',   'US')
  ON CONFLICT (email) DO NOTHING;

  INSERT INTO public.users (name, email, password_hash, avatar_url, nationality) VALUES
    ('Carlos Méndez', 'carlos@fanzone.app', crypt('demo', gen_salt('bf', 10)), 'https://api.dicebear.com/9.x/avataaars/svg?seed=carlos', 'MX'),
    ('Priya Sharma',  'priya@fanzone.app',  crypt('demo', gen_salt('bf', 10)), 'https://api.dicebear.com/9.x/avataaars/svg?seed=priya',  'IN'),
    ('Jonas Weber',   'jonas@fanzone.app',  crypt('demo', gen_salt('bf', 10)), 'https://api.dicebear.com/9.x/avataaars/svg?seed=jonas',  'DE'),
    ('Sofia Oliveira','sofia@fanzone.app',  crypt('demo', gen_salt('bf', 10)), 'https://api.dicebear.com/9.x/avataaars/svg?seed=sofia',  'BR'),
    ('Yuki Tanaka',   'yuki@fanzone.app',   crypt('demo', gen_salt('bf', 10)), 'https://api.dicebear.com/9.x/avataaars/svg?seed=yuki',   'JP'),
    ('Ahmed Al-Rashid','ahmed@fanzone.app', crypt('demo', gen_salt('bf', 10)), 'https://api.dicebear.com/9.x/avataaars/svg?seed=ahmed',  'SA'),
    ('James Park',    'james@fanzone.app',  crypt('demo', gen_salt('bf', 10)), 'https://api.dicebear.com/9.x/avataaars/svg?seed=james',  'KR'),
    ('Mei Lin',       'mei@fanzone.app',    crypt('demo', gen_salt('bf', 10)), 'https://api.dicebear.com/9.x/avataaars/svg?seed=mei',    'CN'),
    ('Marco Rossi',   'marco@fanzone.app',  crypt('demo', gen_salt('bf', 10)), 'https://api.dicebear.com/9.x/avataaars/svg?seed=marco',  'IT'),
    ('Ana García',    'ana@fanzone.app',    crypt('demo', gen_salt('bf', 10)), 'https://api.dicebear.com/9.x/avataaars/svg?seed=ana',    'ES')
  ON CONFLICT (email) DO NOTHING;

  SELECT id INTO demo_id   FROM public.users WHERE email = 'demo@fanzone.app';
  SELECT id INTO carlos_id FROM public.users WHERE email = 'carlos@fanzone.app';
  SELECT id INTO priya_id  FROM public.users WHERE email = 'priya@fanzone.app';
  SELECT id INTO jonas_id  FROM public.users WHERE email = 'jonas@fanzone.app';
  SELECT id INTO sofia_id  FROM public.users WHERE email = 'sofia@fanzone.app';
  SELECT id INTO yuki_id   FROM public.users WHERE email = 'yuki@fanzone.app';
  SELECT id INTO ahmed_id  FROM public.users WHERE email = 'ahmed@fanzone.app';
  SELECT id INTO james_id  FROM public.users WHERE email = 'james@fanzone.app';
  SELECT id INTO mei_id    FROM public.users WHERE email = 'mei@fanzone.app';
  SELECT id INTO marco_id  FROM public.users WHERE email = 'marco@fanzone.app';
  SELECT id INTO ana_id    FROM public.users WHERE email = 'ana@fanzone.app';

  -- ── Posts (25 total, spread across cities and users) ──

  -- Dallas posts
  INSERT INTO public.posts (id, author_id, type, body, city_id, location_label, state_label, event_id, tags, likes_count, comments_count, created_at)
  VALUES (gen_random_uuid(), demo_id, 'fan_post', 'Just landed in Dallas. The energy at the airport is insane — fans from everywhere. This is what it''s about. 🌍⚽', 'dal', 'Dallas, Texas, US', 'Texas', 'wc2026', ARRAY['Dallas','WorldCup2026'], 84, 12, now() - interval '23 minutes') RETURNING id INTO p1;

  INSERT INTO public.posts (id, author_id, type, body, city_id, location_label, state_label, event_id, tags, likes_count, comments_count, created_at)
  VALUES (gen_random_uuid(), carlos_id, 'local_tip', 'Deep Ellum has the best atmosphere in Dallas for pre-game. Walking distance to DART and the bars are already filling up with Mexican fans. Highly recommend Adair''s for the vibe.', 'dal', 'Dallas, Texas, US', 'Texas', 'wc2026', ARRAY['Dallas','LocalTip','DeepEllum'], 156, 22, now() - interval '1 hour') RETURNING id INTO p2;

  INSERT INTO public.posts (id, author_id, type, body, city_id, location_label, state_label, event_id, tags, likes_count, comments_count, created_at)
  VALUES (gen_random_uuid(), jonas_id, 'meetup', 'German supporters meetup tonight at The Rustic, Dallas — 7pm. Look for the DFB scarves. All welcome, we''ve got a section reserved. First round''s on us if Germany scores tomorrow.', 'dal', 'Dallas, Texas, US', 'Texas', 'wc2026', ARRAY['Dallas','Germany','Meetup'], 73, 31, now() - interval '3 hours') RETURNING id INTO p3;

  INSERT INTO public.posts (id, author_id, type, body, city_id, location_label, state_label, event_id, tags, likes_count, comments_count, created_at)
  VALUES (gen_random_uuid(), ahmed_id, 'travel_tip', 'DART Blue Line direct to AT&T Stadium from downtown. Buy your GoPass before the day — the app gets slow near the stadium. Platform gets packed 90 minutes before kickoff.', 'dal', 'Dallas, Texas, US', 'Texas', 'wc2026', ARRAY['Dallas','Transport','DART'], 209, 18, now() - interval '6 hours') RETURNING id INTO p4;

  INSERT INTO public.posts (id, author_id, type, body, city_id, location_label, state_label, event_id, tags, likes_count, comments_count, created_at)
  VALUES (gen_random_uuid(), sofia_id, 'fan_post', 'Brazilian fans have taken over Klyde Warren Park. Drums, flags, singing. If you''re in Dallas and haven''t been yet, come now. This is a once-in-a-lifetime scene. 💚💛', 'dal', 'Dallas, Texas, US', 'Texas', 'wc2026', ARRAY['Dallas','Brazil','KlydeWarren'], 342, 47, now() - interval '10 hours') RETURNING id INTO p5;

  -- Miami posts
  INSERT INTO public.posts (id, author_id, type, body, city_id, location_label, state_label, event_id, tags, likes_count, comments_count, created_at)
  VALUES (gen_random_uuid(), demo_id, 'local_tip', 'For anyone heading to Miami matches — Wynwood is the spot for pre-game. Bars stay open late and there''s a huge screen set up near the food hall. Much better than the stadium concourses.', 'mia', 'Miami, Florida, US', 'Florida', 'wc2026', ARRAY['Miami','LocalTip','Wynwood'], 211, 34, now() - interval '2 hours') RETURNING id INTO p6;

  INSERT INTO public.posts (id, author_id, type, body, city_id, location_label, state_label, event_id, tags, likes_count, comments_count, created_at)
  VALUES (gen_random_uuid(), priya_id, 'fan_post', 'Miami Beach is absolutely electric. Every nationality you can imagine, all here for the same reason. Picked up a knock-off scarf from a street vendor, no regrets. 🏖️⚽', 'mia', 'Miami, Florida, US', 'Florida', 'wc2026', ARRAY['Miami','VibeCheck','WorldCup'], 128, 19, now() - interval '4 hours') RETURNING id INTO p7;

  INSERT INTO public.posts (id, author_id, type, body, city_id, location_label, state_label, event_id, tags, likes_count, comments_count, created_at)
  VALUES (gen_random_uuid(), carlos_id, 'match_update', 'The atmosphere inside Hard Rock Stadium is unlike anything I''ve ever experienced. Standing section in the south end was incredible. 10/10 would fly back just for the stadium.', 'mia', 'Miami, Florida, US', 'Florida', 'wc2026', ARRAY['Miami','HardRockStadium','MatchDay'], 387, 56, now() - interval '14 hours') RETURNING id INTO p8;

  INSERT INTO public.posts (id, author_id, type, body, city_id, location_label, state_label, event_id, tags, likes_count, comments_count, created_at)
  VALUES (gen_random_uuid(), ana_id, 'travel_tip', 'Uber surge pricing in Miami on match days is brutal. Book your ride back at least 45 minutes before final whistle or expect to wait 90 minutes. The Brightline to Fort Lauderdale is actually a solid option.', 'mia', 'Miami, Florida, US', 'Florida', 'wc2026', ARRAY['Miami','Transport','TravelTip'], 174, 27, now() - interval '20 hours') RETURNING id INTO p9;

  -- New York posts
  INSERT INTO public.posts (id, author_id, type, body, city_id, location_label, state_label, event_id, tags, likes_count, comments_count, created_at)
  VALUES (gen_random_uuid(), demo_id, 'meetup', 'Organizing a German supporters meetup in NYC before the Group Stage opener. Anyone in? Targeting a bar in Midtown. Drop your details below and I''ll share the invite.', 'nyc', 'New York, New York, US', 'New York', 'wc2026', ARRAY['NYC','Germany','Meetup'], 57, 28, now() - interval '5 hours') RETURNING id INTO p10;

  INSERT INTO public.posts (id, author_id, type, body, city_id, location_label, state_label, event_id, tags, likes_count, comments_count, created_at)
  VALUES (gen_random_uuid(), priya_id, 'fan_post', 'NYC fan fest at Pier 17 is massive. Free entry, multiple screens, food trucks everywhere. Came for 2 hours, stayed for 6. Genuinely the best World Cup experience outside a stadium.', 'nyc', 'New York, New York, US', 'New York', 'wc2026', ARRAY['NYC','FanFest','Pier17'], 293, 44, now() - interval '7 hours') RETURNING id INTO p11;

  INSERT INTO public.posts (id, author_id, type, body, city_id, location_label, state_label, event_id, tags, likes_count, comments_count, created_at)
  VALUES (gen_random_uuid(), james_id, 'local_tip', 'Korean BBQ in Koreatown is where the Korean supporters are gathering pre and post-match. 32nd St block is packed after games. Amazing food and everyone''s welcome.', 'nyc', 'New York, New York, US', 'New York', 'wc2026', ARRAY['NYC','Korea','Koreatown','LocalTip'], 145, 21, now() - interval '11 hours') RETURNING id INTO p12;

  INSERT INTO public.posts (id, author_id, type, body, city_id, location_label, state_label, event_id, tags, likes_count, comments_count, created_at)
  VALUES (gen_random_uuid(), marco_id, 'fan_post', 'Saw the most beautiful spontaneous fan march from Times Square to MetLife. Thousands of fans from 30+ countries, all singing together. Gave me chills. This is what football is for.', 'nyc', 'New York, New York, US', 'New York', 'wc2026', ARRAY['NYC','FanMarch','Beautiful'], 521, 88, now() - interval '16 hours') RETURNING id INTO p13;

  INSERT INTO public.posts (id, author_id, type, body, city_id, location_label, state_label, event_id, tags, likes_count, comments_count, created_at)
  VALUES (gen_random_uuid(), yuki_id, 'travel_tip', 'NJ Transit to MetLife: buy your ticket BEFORE the match. Return queues at the stadium station after the game are 45+ minutes. The bus is actually faster on match nights.', 'nyc', 'New York, New York, US', 'New York', 'wc2026', ARRAY['NYC','MetLife','Transport'], 267, 33, now() - interval '22 hours') RETURNING id INTO p14;

  -- LA posts
  INSERT INTO public.posts (id, author_id, type, body, city_id, location_label, state_label, event_id, tags, likes_count, comments_count, created_at)
  VALUES (gen_random_uuid(), demo_id, 'travel_tip', 'Heads up: Metro lines in LA get completely overwhelmed on match days. Leave 90 minutes early minimum or use rideshare pickup zones marked in the official app.', 'lax', 'Los Angeles, California, US', 'California', 'wc2026', ARRAY['LosAngeles','Travel','Transport'], 394, 61, now() - interval '9 hours') RETURNING id INTO p15;

  INSERT INTO public.posts (id, author_id, type, body, city_id, location_label, state_label, event_id, tags, likes_count, comments_count, created_at)
  VALUES (gen_random_uuid(), mei_id, 'fan_post', 'SoFi Stadium is genuinely one of the best venues I''ve ever been to. Roof keeps the noise in, sightlines from every seat are perfect. Worth every penny of the ticket price.', 'lax', 'Los Angeles, California, US', 'California', 'wc2026', ARRAY['LosAngeles','SoFi','StadiumReview'], 312, 42, now() - interval '13 hours') RETURNING id INTO p16;

  INSERT INTO public.posts (id, author_id, type, body, city_id, location_label, state_label, event_id, tags, likes_count, comments_count, created_at)
  VALUES (gen_random_uuid(), james_id, 'local_tip', 'Little Tokyo in DTLA for Korean and Japanese fans — great food, passionate supporters, and the watch parties there are electric. Also try Koreatown on Wilshire for the late-night scene.', 'lax', 'Los Angeles, California, US', 'California', 'wc2026', ARRAY['LA','LittleTokyo','Koreatown','LocalTip'], 189, 25, now() - interval '18 hours') RETURNING id INTO p17;

  INSERT INTO public.posts (id, author_id, type, body, city_id, location_label, state_label, event_id, tags, likes_count, comments_count, created_at)
  VALUES (gen_random_uuid(), ana_id, 'community_highlight', 'Spanish fans absolutely took over the Rose Bowl tailgate area. Watched the match from outside on a projector screen with 500 others who didn''t have tickets. Better atmosphere than inside, honestly.', 'lax', 'Los Angeles, California, US', 'California', 'wc2026', ARRAY['LA','Spain','RoseBowl','FanExperience'], 234, 38, now() - interval '26 hours') RETURNING id INTO p18;

  -- Toronto posts
  INSERT INTO public.posts (id, author_id, type, body, city_id, location_label, state_label, event_id, tags, likes_count, comments_count, created_at)
  VALUES (gen_random_uuid(), carlos_id, 'fan_post', 'Toronto is an incredible host city. Friendly locals, amazing food diversity, and public transit that actually works on match days. Already planning to come back for the knockouts.', 'tor', 'Toronto, Ontario, CA', 'Ontario', 'wc2026', ARRAY['Toronto','Canada','HostCity'], 178, 29, now() - interval '8 hours') RETURNING id INTO p19;

  INSERT INTO public.posts (id, author_id, type, body, city_id, location_label, state_label, event_id, tags, likes_count, comments_count, created_at)
  VALUES (gen_random_uuid(), sofia_id, 'local_tip', 'Kensington Market in Toronto is the unofficial fan village. Every nationality represented, street food from everywhere, and impromptu singalongs happening on every corner. Go before it gets discovered.', 'tor', 'Toronto, Ontario, CA', 'Ontario', 'wc2026', ARRAY['Toronto','KensingtonMarket','LocalTip'], 143, 20, now() - interval '15 hours') RETURNING id INTO p20;

  INSERT INTO public.posts (id, author_id, type, body, city_id, location_label, state_label, event_id, tags, likes_count, comments_count, created_at)
  VALUES (gen_random_uuid(), yuki_id, 'travel_tip', 'Presto card is essential for Toronto transit. Load it at the airport before you leave arrivals. The TTC and GO Transit both accept it — saves you fumbling for cash at rush hour.', 'tor', 'Toronto, Ontario, CA', 'Ontario', 'wc2026', ARRAY['Toronto','Transit','Presto','TravelTip'], 201, 17, now() - interval '21 hours') RETURNING id INTO p21;

  -- Mexico City posts
  INSERT INTO public.posts (id, author_id, type, body, city_id, location_label, state_label, event_id, tags, likes_count, comments_count, created_at)
  VALUES (gen_random_uuid(), carlos_id, 'fan_post', 'Azteca pregame is something you have to experience at least once. The noise starts 3 hours before kickoff. I''ve been to 40+ stadiums worldwide and nothing compares to this crowd.', 'mex', 'Mexico City, Mexico City, MX', 'Mexico City', 'wc2026', ARRAY['MexicoCity','Azteca','ElTricolor'], 489, 74, now() - interval '12 hours') RETURNING id INTO p22;

  INSERT INTO public.posts (id, author_id, type, body, city_id, location_label, state_label, event_id, tags, likes_count, comments_count, created_at)
  VALUES (gen_random_uuid(), priya_id, 'local_tip', 'Condesa and Roma neighborhoods in CDMX are where the international fans are. Café El Popular for breakfast, Mercado de Medellín for lunch, El Paisa for the late-night taco situation.', 'mex', 'Mexico City, Mexico City, MX', 'Mexico City', 'wc2026', ARRAY['MexicoCity','FoodGuide','Condesa','Roma'], 267, 36, now() - interval '19 hours') RETURNING id INTO p23;

  INSERT INTO public.posts (id, author_id, type, body, city_id, location_label, state_label, event_id, tags, likes_count, comments_count, created_at)
  VALUES (gen_random_uuid(), ahmed_id, 'fan_post', 'Met fans from Saudi Arabia, Morocco, Egypt, and Tunisia all in one bar in Mexico City watching the Arab nations progress. The joy in that room was unforgettable. Football really does connect people.', 'mex', 'Mexico City, Mexico City, MX', 'Mexico City', 'wc2026', ARRAY['MexicoCity','ArabFans','Unity','Football'], 356, 51, now() - interval '25 hours') RETURNING id INTO p24;

  INSERT INTO public.posts (id, author_id, type, body, city_id, location_label, state_label, event_id, tags, likes_count, comments_count, created_at)
  VALUES (gen_random_uuid(), marco_id, 'travel_tip', 'Altitude in Mexico City (2,240m) is real. Take it easy the first day, drink lots of water, avoid heavy meals before the match. Took me a full day to stop feeling lightheaded.', 'mex', 'Mexico City, Mexico City, MX', 'Mexico City', 'wc2026', ARRAY['MexicoCity','Altitude','HealthTip','TravelWarning'], 312, 44, now() - interval '30 hours') RETURNING id INTO p25;

  -- ── Post likes ──────────────────────────────

  INSERT INTO public.post_likes (post_id, user_id) VALUES
    (p1,  carlos_id), (p1,  priya_id),  (p1,  jonas_id),
    (p2,  demo_id),   (p2,  sofia_id),  (p2,  ahmed_id),
    (p3,  demo_id),   (p3,  carlos_id), (p3,  sofia_id),
    (p5,  demo_id),   (p5,  carlos_id), (p5,  priya_id),  (p5,  james_id),
    (p6,  carlos_id), (p6,  priya_id),  (p6,  jonas_id),
    (p8,  demo_id),   (p8,  priya_id),  (p8,  sofia_id),  (p8,  yuki_id),
    (p10, carlos_id), (p10, jonas_id),  (p10, sofia_id),
    (p11, demo_id),   (p11, carlos_id), (p11, james_id),
    (p13, demo_id),   (p13, carlos_id), (p13, priya_id),  (p13, yuki_id),  (p13, ahmed_id),
    (p15, carlos_id), (p15, priya_id),  (p15, mei_id),
    (p22, demo_id),   (p22, priya_id),  (p22, jonas_id),  (p22, sofia_id), (p22, ahmed_id)
  ON CONFLICT DO NOTHING;

  -- ── Post comments ───────────────────────────

  INSERT INTO public.post_comments (post_id, author_id, body, created_at) VALUES
    (p1,  carlos_id, 'Same! The Mexican fans on my flight were singing the whole way. Epic start.', now() - interval '20 minutes'),
    (p1,  priya_id,  'Welcome to Dallas! The city really stepped up for this tournament.', now() - interval '18 minutes'),
    (p2,  demo_id,   'Adair''s is a classic, great call. The patio fills up fast though — get there early.', now() - interval '55 minutes'),
    (p2,  jonas_id,  'Adding this to my list. Thanks for the tip, Carlos!', now() - interval '50 minutes'),
    (p3,  carlos_id, 'The Rustic is perfect for this. See you there tonight!', now() - interval '2 hours 45 minutes'),
    (p3,  sofia_id,  'Brazilian fans coming to join the Germans tonight 🇧🇷🇩🇪 solidarity!', now() - interval '2 hours 30 minutes'),
    (p4,  demo_id,   'The GoPass tip is gold. Got caught buying paper tickets last time and missed warm-ups.', now() - interval '5 hours'),
    (p4,  james_id,  'Also the Blue Line gets packed at Pearl/Arts District station. Board at Victory Park instead.', now() - interval '4 hours 45 minutes'),
    (p5,  demo_id,   'On my way there right now. Amazing scenes!', now() - interval '9 hours 30 minutes'),
    (p5,  carlos_id, 'The drum circle near the fountain has been going since 8am. These fans are dedicated.', now() - interval '9 hours'),
    (p6,  demo_id,   'The Wynwood Walls area specifically — there''s a pop-up fan zone right next to the murals.', now() - interval '1 hour 40 minutes'),
    (p6,  ana_id,    'Wynwood is incredible for this. The vibe is totally different to the stadium area.', now() - interval '1 hour 30 minutes'),
    (p7,  carlos_id, 'Miami Beach was my favorite city of the whole trip. Worth every dollar.', now() - interval '3 hours 30 minutes'),
    (p7,  sofia_id,  'The energy there is unreal. Bumped into fans from 15 countries in one afternoon.', now() - interval '3 hours'),
    (p8,  demo_id,   'The standing section was incredible. Best atmosphere I''ve experienced at a football match.', now() - interval '13 hours'),
    (p8,  yuki_id,   'Hard Rock is one of the best-designed stadiums for noise. The bowl effect is incredible.', now() - interval '12 hours 30 minutes'),
    (p9,  priya_id,  'The Brightline advice is so good. Skipped an hour of post-match traffic last time.', now() - interval '19 hours'),
    (p9,  marco_id,  'Uber was charging $80+ after the match I attended. Never again without a backup plan.', now() - interval '18 hours 30 minutes'),
    (p10, jonas_id,  'I''ll be there! Bringing a few guys from the German supporters club.', now() - interval '4 hours 30 minutes'),
    (p10, sofia_id,  'Brazilian fans want to crash the German party again — hope you don''t mind 😄', now() - interval '4 hours'),
    (p11, demo_id,   'The Pier 17 setup is genuinely world-class. Better than most fan zones I''ve seen.', now() - interval '6 hours 30 minutes'),
    (p11, carlos_id, 'The food trucks alone are worth the trip. Had tacos, ramen, and jerk chicken in 2 hours.', now() - interval '6 hours'),
    (p12, demo_id,   'The galbi ribs at Seoul Garden right there are unbelievable. Fuel for matchday.', now() - interval '10 hours 30 minutes'),
    (p12, priya_id,  'K-town after a Korean national team win must be something else entirely.', now() - interval '10 hours'),
    (p13, priya_id,  'I was in that march! The moment near Port Authority when everyone started the "Ole" chant — unforgettable.', now() - interval '15 hours'),
    (p13, ahmed_id,  'Moments like this are why football is the world''s game. Beautiful post.', now() - interval '14 hours 30 minutes'),
    (p14, carlos_id, 'The return bus tip is key. Watched half the stadium stand in train queues for over an hour.', now() - interval '21 hours'),
    (p14, mei_id,    'The bus lane moves so fast compared to the rail bottleneck. Great advice.', now() - interval '20 hours 30 minutes'),
    (p15, priya_id,  'The Metro tip saved me twice. Left early both times and got home in under an hour.', now() - interval '8 hours 30 minutes'),
    (p15, jonas_id,  'The rideshare zones are so much less chaotic than the stadium entrance side. 100% worth the walk.', now() - interval '8 hours'),
    (p16, demo_id,   'SoFi might be the most impressive stadium I''ve ever stepped into. Agree with every word here.', now() - interval '12 hours 30 minutes'),
    (p16, carlos_id, 'The roof makes it feel like an indoor arena but with open sides. Engineering masterpiece.', now() - interval '12 hours'),
    (p17, james_id,  'Koreatown for late nights is the move. The norebang bars are going until 4am during the tournament.', now() - interval '17 hours'),
    (p17, yuki_id,   'Little Tokyo during the Japan matches was surreal — the whole neighborhood turned blue.', now() - interval '17 hours 30 minutes'),
    (p18, priya_id,  'The outside-the-stadium experience really can be better. No overpriced beer and better company.', now() - interval '25 hours'),
    (p18, demo_id,   'Might actually try this for one of the remaining matches. Thanks for changing my perspective.', now() - interval '24 hours 30 minutes'),
    (p19, priya_id,  'Toronto surprised me too. The locals are incredibly welcoming to international fans.', now() - interval '7 hours 30 minutes'),
    (p19, demo_id,   'The food scene alone makes Toronto worth the trip. Best food city of the tournament.', now() - interval '7 hours'),
    (p20, carlos_id, 'Kensington Market is brilliant. Found a guy selling handmade scarves from every nation. Bought three.', now() - interval '14 hours'),
    (p20, james_id,  'The spontaneous singalongs there are the highlight of my whole trip so far.', now() - interval '13 hours 30 minutes'),
    (p21, sofia_id,  'The Presto card is a lifesaver. Loaded mine at the airport and used it on every transit system.', now() - interval '20 hours'),
    (p21, marco_id,  'Also works at select stores so you can top it up easily. Very convenient system.', now() - interval '19 hours 30 minutes'),
    (p22, demo_id,   'The Azteca atmosphere is legendary. Can''t imagine experiencing this and not being overwhelmed.', now() - interval '11 hours'),
    (p22, sofia_id,  'The Mexican fans are the best in the world for atmosphere. Non-negotiable.', now() - interval '10 hours 30 minutes'),
    (p23, carlos_id, 'El Paisa is the real one. Best tacos de canasta in the city. Go at midnight.', now() - interval '18 hours'),
    (p23, ahmed_id,  'Adding all of these to my map. Staying in Condesa so this is perfect.', now() - interval '17 hours 30 minutes'),
    (p24, priya_id,  'This is the best thing about World Cups. Football transcends everything.', now() - interval '24 hours'),
    (p24, marco_id,  'Had a similar moment in a bar in Dallas with Italian and Argentine fans celebrating together. The sport at its best.', now() - interval '23 hours 30 minutes'),
    (p25, carlos_id, 'The altitude warning is real. Saw tourists completely wiped out just walking to the metro on day 1.', now() - interval '29 hours'),
    (p25, demo_id,   'Same advice for anyone flying in same-day as the match — factor in an acclimatization period.', now() - interval '28 hours 30 minutes')
  ON CONFLICT DO NOTHING;

  -- ── Itinerary items for demo user ───────────

  INSERT INTO public.itinerary_items (user_id, type, title, date, time, location, notes, confirmed) VALUES
    (demo_id, 'travel',        'Flight DFW — Dallas/Fort Worth International',     '2026-06-14', '08:30', 'DFW Airport, Terminal D',          'American Airlines AA2847. Check in online night before.', true),
    (demo_id, 'match',         'Group Stage Match — AT&T Stadium, Dallas',          '2026-06-15', '21:00', 'AT&T Stadium, Arlington, TX',      'Section 238, Row 12. DART Blue Line to Stadium station.', true),
    (demo_id, 'meetup',        'German Supporters Meetup — The Rustic',             '2026-06-15', '18:00', 'The Rustic, 3656 Howell St, Dallas','Meeting Jonas and crew before the match.',               false),
    (demo_id, 'accommodation', 'Omni Dallas Hotel',                                 '2026-06-14', '15:00', 'Omni Dallas, 555 S Lamar St',      'Check-in 3pm. Paid parking available.',                  true)
  ON CONFLICT DO NOTHING;

  -- ── Message threads ─────────────────────────

  INSERT INTO public.message_threads (id, is_group, group_name, created_at, updated_at)
  VALUES (gen_random_uuid(), false, NULL, now() - interval '2 days', now() - interval '3 hours')
  RETURNING id INTO thread1_id;

  INSERT INTO public.message_threads (id, is_group, group_name, created_at, updated_at)
  VALUES (gen_random_uuid(), true, 'Miami Match Crew', now() - interval '5 days', now() - interval '1 hour')
  RETURNING id INTO thread2_id;

  INSERT INTO public.thread_participants (thread_id, user_id) VALUES
    (thread1_id, demo_id),
    (thread1_id, carlos_id),
    (thread2_id, demo_id),
    (thread2_id, priya_id),
    (thread2_id, jonas_id),
    (thread2_id, sofia_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.messages (thread_id, sender_id, body, is_read, created_at) VALUES
    (thread1_id, carlos_id, 'Hey! You going to the Dallas match tomorrow?',                                                       true,  now() - interval '4 hours'),
    (thread1_id, demo_id,   'Yes! Section 238. You?',                                                                              true,  now() - interval '3 hours 45 minutes'),
    (thread1_id, carlos_id, 'Lower deck south end. Let''s meet at Deep Ellum beforehand — I know a great spot.',                   false, now() - interval '3 hours'),
    (thread2_id, priya_id,  'Has everyone sorted their transport for the Miami match?',                                            true,  now() - interval '2 hours'),
    (thread2_id, jonas_id,  'I''m taking the Brightline from Fort Lauderdale. Anyone want to share an Uber to the station?',       true,  now() - interval '1 hour 45 minutes'),
    (thread2_id, sofia_id,  'I can share! I''m staying in Brickell. Let''s coordinate.',                                           true,  now() - interval '1 hour 30 minutes'),
    (thread2_id, demo_id,   'Count me in for the Brightline. Meet at Priya''s hotel at 5:30?',                                     false, now() - interval '1 hour')
  ON CONFLICT DO NOTHING;

  -- ── Community members ───────────────────────

  SELECT id INTO brazil_com_id   FROM public.communities WHERE name = 'Brazil Supporters — North America';
  SELECT id INTO dallas_com_id   FROM public.communities WHERE name = 'Dallas Match Week — Group Stage';
  SELECT id INTO us_com_id       FROM public.communities WHERE name = 'US Soccer Fan Network';
  SELECT id INTO noticket_com_id FROM public.communities WHERE name = 'Traveling Fans Without Tickets';
  SELECT id INTO toronto_com_id  FROM public.communities WHERE name = 'Toronto Arrivals & Welcome';

  INSERT INTO public.community_members (community_id, user_id) VALUES
    -- demo user
    (brazil_com_id,   demo_id),
    (dallas_com_id,   demo_id),
    -- carlos
    (brazil_com_id,   carlos_id),
    (dallas_com_id,   carlos_id),
    (noticket_com_id, carlos_id),
    -- priya
    (noticket_com_id, priya_id),
    (toronto_com_id,  priya_id),
    -- jonas
    (dallas_com_id,   jonas_id),
    (us_com_id,       jonas_id),
    -- sofia
    (brazil_com_id,   sofia_id),
    (toronto_com_id,  sofia_id),
    -- yuki
    (noticket_com_id, yuki_id),
    (toronto_com_id,  yuki_id),
    -- ahmed
    (dallas_com_id,   ahmed_id),
    (noticket_com_id, ahmed_id),
    -- james
    (us_com_id,       james_id),
    (dallas_com_id,   james_id),
    -- mei
    (noticket_com_id, mei_id),
    -- marco
    (us_com_id,       marco_id),
    (noticket_com_id, marco_id),
    -- ana
    (brazil_com_id,   ana_id),
    (toronto_com_id,  ana_id)
  ON CONFLICT DO NOTHING;

  -- ── Notifications for demo user ─────────────

  INSERT INTO public.notifications (user_id, type, title, body, is_read, link_to, actor_avatar_url, created_at) VALUES
    (demo_id, 'message',           'Carlos Méndez sent you a message',                   'Let''s meet at Deep Ellum beforehand — I know a great spot.',                         false, '/messages', 'https://api.dicebear.com/9.x/avataaars/svg?seed=carlos', now() - interval '3 hours'),
    (demo_id, 'community_activity','New post in Brazil Supporters — North America',       'Sofia Oliveira: "Brazilian fans have taken over Klyde Warren Park. Drums, flags…"',   false, '/communities', 'https://api.dicebear.com/9.x/avataaars/svg?seed=sofia', now() - interval '10 hours'),
    (demo_id, 'event_reminder',    'Match tomorrow: Group Stage at AT&T Stadium',         'Your confirmed match starts at 21:00 on June 15. Leave early — DART gets busy.',       false, '/planning',    NULL,                                                    now() - interval '14 hours'),
    (demo_id, 'social_interaction','Priya Sharma liked your post',                        '"For anyone heading to Miami matches — Wynwood is the spot for pre-game…"',            true,  '/home',        'https://api.dicebear.com/9.x/avataaars/svg?seed=priya',  now() - interval '2 hours')
  ON CONFLICT DO NOTHING;

END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────
-- User follows
-- ─────────────────────────────────────────────
-- NOTE: Demo user (demo@fanzone.app) is Atlanta, GA based.
-- Their itinerary references Mercedes-Benz Stadium, Atlanta, GA
-- and World Cup 2026 Atlanta matches. Update seed data above
-- if you want to change the demo user's home city.

CREATE TABLE IF NOT EXISTS public.follows (
  follower_id  uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at   timestamptz DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);
ALTER TABLE public.follows DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.follows TO anon;
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;

-- ─────────────────────────────────────────────
-- Trips
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trips (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  description text,
  event_name  text,
  start_date  date,
  end_date    date,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE public.trips DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips TO authenticated;

-- Add trip_id to itinerary_items (nullable so existing rows are not broken)
ALTER TABLE public.itinerary_items ADD COLUMN IF NOT EXISTS trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL;

-- Fix type constraint to include food and transport
ALTER TABLE public.itinerary_items DROP CONSTRAINT IF EXISTS itinerary_items_type_check;
ALTER TABLE public.itinerary_items ADD CONSTRAINT itinerary_items_type_check
  CHECK (type IN ('match','travel','accommodation','meetup','activity','food','transport'));

-- ─────────────────────────────────────────────
-- Post image storage bucket
-- ─────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public post images'
  ) THEN
    CREATE POLICY "Public post images" ON storage.objects
      FOR ALL USING (bucket_id = 'post-images');
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- Post user tagging
-- ─────────────────────────────────────────────
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS tagged_users_json jsonb DEFAULT '[]';

-- ─────────────────────────────────────────────
-- Profile bio field
-- ─────────────────────────────────────────────
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio text;

-- Grant UPDATE on users so profile saves work
GRANT UPDATE ON public.users TO anon;
GRANT UPDATE ON public.users TO authenticated;

-- ─────────────────────────────────────────────
-- Per-user message read tracking
-- ─────────────────────────────────────────────
-- last_read_at replaces the per-message is_read flag for unread count tracking.
-- Unread count = messages with created_at > last_read_at for this user in this thread.
ALTER TABLE public.thread_participants ADD COLUMN IF NOT EXISTS last_read_at timestamptz;

-- ─────────────────────────────────────────────
-- Allow deleting message threads (cascades to messages + participants)
-- ─────────────────────────────────────────────
GRANT DELETE ON public.message_threads TO anon;
GRANT DELETE ON public.message_threads TO authenticated;
