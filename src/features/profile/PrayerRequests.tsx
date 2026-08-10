import { motion } from 'framer-motion';
import { HandHeart } from 'lucide-react';
import type { WallPost } from '../../shared/types/WallPost';
import { PostCard } from './PostManager';

/**
 * Prominent Prayer Requests section for the public missionary profile (/@slug).
 *
 * Design decision (kanban t_06589a52): reuse the wall's Prayer posts instead of
 * building a separate form + schema. The wall already carries a `prayer` post
 * type with a published lifecycle, so this section simply surfaces the published
 * prayer posts the missionary has written — one source of truth, no new data
 * model. A separate Turnstile-protected form can layer on later without schema
 * changes if the product wants visitor-submitted requests.
 *
 * Owner dashboard does not render this section (PostManager already owns the
 * wall there); it is public-view only.
 */
export default function PrayerRequests({
  posts,
  loading,
}: {
  /** All wall posts for the profile (public view already receives published-only). */
  posts: WallPost[];
  /** True while the wall fetch is in flight (loading/empty/success contract). */
  loading: boolean;
}) {
  // Public view only ever receives published posts from the API, but filter
  // defensively so a draft can never leak into the section.
  const prayerPosts = posts.filter(
    (p) => p.postType === 'prayer' && (p.status ?? 'published') === 'published',
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      aria-labelledby="prayer-requests-heading"
      className="bg-gray-800 border border-gray-700 rounded-2xl p-6 sm:p-8 mb-8"
    >
      <div className="flex items-center gap-3 mb-5">
        <span className="w-10 h-10 rounded-full bg-mission-500/20 flex items-center justify-center shrink-0">
          <HandHeart className="w-5 h-5 text-mission-300" />
        </span>
        <div>
          <h2 id="prayer-requests-heading" className="text-xl font-bold">
            Prayer Requests
          </h2>
          <p className="text-sm text-gray-400">
            How you can pray for this missionary.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading prayer requests…</p>
      ) : prayerPosts.length === 0 ? (
        <p className="text-sm text-gray-500">
          No prayer requests yet. Check back soon.
        </p>
      ) : (
        <div className="space-y-4">
          {prayerPosts.map((post) => (
            <PostCard key={post.id} post={post} publicView />
          ))}
        </div>
      )}
    </motion.section>
  );
}
