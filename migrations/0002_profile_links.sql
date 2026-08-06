-- Called & Sent — profile links block
-- Adds up to four named external links to a missionary's public profile:
-- website + socials (Instagram, Facebook) + a giving/Donate link. Mirrors the
-- canonical 4-column vocabulary in schema.sql (website_url, instagram_url,
-- facebook_url, giving_url). The links block is intentionally capped at these
-- four named slots — a hard cap of 4, enforced by the API on write.

ALTER TABLE profiles ADD COLUMN website_url   TEXT;
ALTER TABLE profiles ADD COLUMN instagram_url TEXT;
ALTER TABLE profiles ADD COLUMN facebook_url  TEXT;
ALTER TABLE profiles ADD COLUMN giving_url    TEXT;
