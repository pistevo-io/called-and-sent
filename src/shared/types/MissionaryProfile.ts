/** Accent palettes a missionary can pick for their public profile. */
export type ThemeColor = 'sage' | 'terracotta' | 'ocean' | 'lavender' | 'rose';

export interface ProfileUpdate {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  image?: string;
}

export interface SocialLink {
  label: string;
  url: string;
}

/** A missionary's public-facing profile (the consumer-facing view). */
export interface MissionaryProfile {
  slug: string;
  name: string;
  location: string;
  bio: string;
  about?: string;
  /** Short calling verse shown under the bio. */
  verse?: string;
  /** Number of supporters currently partnering with the missionary. */
  partners?: number;
  avatar?: string;
  coverImage?: string;
  tags: string[];
  themeColor: ThemeColor;
  socials: SocialLink[];
  updates?: ProfileUpdate[];
}
