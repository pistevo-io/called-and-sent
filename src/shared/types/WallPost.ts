/** A wall post — a testimony, update, or prayer request shared on a
 *  missionary's profile. */
export type WallPostStatus = 'draft' | 'published' | 'archived';

export interface WallPost {
  /** Stable id for dedupe/merge (seed posts use `seed-*`, user posts `new-*`/uuid). */
  id: string;
  title: string;
  content: string;
  /** ISO date string (YYYY-MM-DD). */
  date: string;
  /** Lifecycle status (ADR-0001). Defaults to `draft` for authored posts. */
  status?: WallPostStatus;
  /** Post category (testimony / prayer / update / praise / scripture). */
  postType?: string;
  /** Ordered image URLs (shown as a carousel on published cards). */
  images?: string[];
}
