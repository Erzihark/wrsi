/**
 * WRSI's public social profiles, linked from the dashboard footer. Static
 * constants rather than DB rows: they change about once a year, and an
 * app-settings table isn't warranted yet (revisit if marketing needs to edit
 * them without a release).
 */
export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/wrsi.mx',
  tiktok: 'https://www.tiktok.com/@wrsi.mx',
  linkedin: 'https://www.linkedin.com/company/wrsi',
  youtube: 'https://www.youtube.com/@wrsi',
} as const;

export type SocialNetwork = keyof typeof SOCIAL_LINKS;
