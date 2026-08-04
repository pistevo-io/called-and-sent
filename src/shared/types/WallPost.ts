/** A wall post — a testimony, update, or prayer request shared on a
 *  missionary's profile. */
export interface WallPost {
  /** Stable id for dedupe/merge (seed posts use `seed-*`, user posts `new-*`/uuid). */
  id: string;
  title: string;
  content: string;
  /** ISO date string (YYYY-MM-DD). */
  date: string;
}
