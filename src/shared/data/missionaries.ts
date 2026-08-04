import type { MissionaryProfile } from '../types/MissionaryProfile';

/**
 * Seed missionary profiles for the public profile pages.
 * The single current profile (Kelsey) owns every trip in `missionTrips`.
 */
export const missionaries: MissionaryProfile[] = [
  {
    slug: 'kelsey',
    name: 'Kelsey',
    location: 'Honduras',
    bio: 'Medical missionary sharing the Gospel through hands-on care and village evangelism across Honduras and beyond.',
    about:
      'I am a medical missionary serving with BMDMI and local church planters, bringing both practical care and the hope of the Gospel to communities that have rarely heard it. Every trip is an opportunity to follow up with new believers, serve physical needs, and point families to Jesus.',
    verse: '“How beautiful are the feet of those who bring good news!” — Romans 10:15',
    partners: 38,
    tags: ['Medical', 'Evangelism', 'Discipleship'],
    themeColor: 'sage',
    socials: [
      { label: 'Instagram', url: 'https://instagram.com/' },
      { label: 'Facebook', url: 'https://facebook.com/' },
    ],
    updates: [
      {
        id: 'u1',
        title: 'Back in Guatemala — ready for round two',
        date: '2026-07-12',
        excerpt:
          'The team is assembled and the bags are packed. Pray for divine appointments as we return to communities we served last year.',
      },
      {
        id: 'u2',
        title: '33 surgeries and one salvation',
        date: '2025-09-22',
        excerpt:
          'A recap of the Honduras medical mission: 33 life-changing procedures and a woman who gave her life to Christ.',
        image: '/images/honduras-2025/IMG_0762.jpg',
      },
    ],
  },
];
