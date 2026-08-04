import type { WallPost } from '../types/WallPost';

/** Seed wall posts shown to every visitor (public + owner).
 *  Real user posts saved in localStorage merge on top of these by id.
 *  To be replaced by the DB-backed posts table later. */
export const wallPosts: WallPost[] = [
  {
    id: 'seed-1',
    title: 'A Woman Came Home to Jesus',
    content:
      'This week in Honduras I watched a woman give her life to Christ, tears streaming down her face as we prayed together. Every obstacle, every delay to get there was worth it for one soul. Thank you all for praying — keep lifting up the new believers as their roots grow deep.',
    date: '2025-09-14',
  },
  {
    id: 'seed-2',
    title: 'Prayer Request: Southeast Asia Trip',
    content:
      'In February I will be partnering with local missionaries in an unreached region where most have never heard the name of Jesus. Pray for divine appointments, boldness to speak truth, and open hearts. The spiritual opposition is real — but so is our God.',
    date: '2026-01-20',
  },
  {
    id: 'seed-3',
    title: 'Once a Receiver, Now a Giver',
    content:
      'Serving on the water truck in Honduras was personal. More than a decade ago in India I carried water pots for my family. By God’s grace I stood on the giving side this time. He lifts us up so we can lift others. What a picture of the Gospel.',
    date: '2025-09-10',
  },
];
