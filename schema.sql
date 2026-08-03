-- Called & Sent — Database Schema
-- Neon Serverless Postgres

-- ============================================
-- Users (managed by Neon Managed Better Auth)
-- ============================================
-- The `user` table is auto-managed by Better Auth.
-- We add a `profiles` table that extends user data.

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE, -- references Better Auth's user.id
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  photo_url TEXT,
  bio TEXT,
  testimony TEXT,
  location TEXT,
  church TEXT,
  instagram_url TEXT,
  facebook_url TEXT,
  website_url TEXT,
  giving_url TEXT,
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_profiles_username ON profiles(username);

-- ============================================
-- Mission Trips
-- ============================================

CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  country TEXT NOT NULL,
  coordinates_lng DOUBLE PRECISION NOT NULL,
  coordinates_lat DOUBLE PRECISION NOT NULL,
  trip_date TEXT NOT NULL,
  duration TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  story TEXT NOT NULL,
  people_reached INTEGER,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'upcoming', 'in_progress')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_trips_profile_id ON trips(profile_id);
CREATE INDEX idx_trips_status ON trips(status);

-- Trip images (separate table for multiple images per trip)
CREATE TABLE IF NOT EXISTS trip_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_trip_images_trip_id ON trip_images(trip_id);

-- Trip highlights
CREATE TABLE IF NOT EXISTS trip_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE INDEX idx_trip_highlights_trip_id ON trip_highlights(trip_id);

-- Trip ministry types
CREATE TABLE IF NOT EXISTS trip_ministry_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  type TEXT NOT NULL
);

CREATE INDEX idx_trip_ministry_types_trip_id ON trip_ministry_types(trip_id);

-- ============================================
-- Wall Posts (Faith Journey)
-- ============================================

CREATE TABLE IF NOT EXISTS wall_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  post_type TEXT DEFAULT 'update' CHECK (post_type IN ('testimony', 'prayer_request', 'field_update', 'praise_report', 'scripture', 'update')),
  is_pinned BOOLEAN DEFAULT false,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_wall_posts_profile_id ON wall_posts(profile_id);
CREATE INDEX idx_wall_posts_published ON wall_posts(published_at DESC);

-- ============================================
-- Newsletter Subscribers
-- ============================================

CREATE TABLE IF NOT EXISTS subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ,
  UNIQUE(profile_id, email)
);

CREATE INDEX idx_subscribers_profile_id ON subscribers(profile_id);

-- ============================================
-- Contact Form Submissions
-- ============================================

CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  ip_address TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_contact_submissions_profile_id ON contact_submissions(profile_id);

-- ============================================
-- Updated_at trigger
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tg_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tg_wall_posts_updated_at
  BEFORE UPDATE ON wall_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
