/**
 * CMS Abstraction Layer
 *
 * This is the ONLY file that knows about theBCMS data shapes.
 * All Astro pages and components import from here, never from
 * @thebcms/client directly.
 *
 * To swap CMS providers, replace the internals of this file.
 * The public API (getBlogPosts, getServices, etc.) stays the same.
 */

import { Client } from '@thebcms/client'
import type {
  BlogPost,
  Service,
  Testimonial,
  TeamMember,
} from './types'

// ---------------------------------------------------------------------------
// Client initialization
// ---------------------------------------------------------------------------

const client = new Client(
  import.meta.env.BCMS_ORG_ID ?? '',
  import.meta.env.BCMS_INSTANCE_ID ?? '',
  {
    id: import.meta.env.BCMS_API_KEY_ID ?? '',
    secret: import.meta.env.BCMS_API_KEY_SECRET ?? '',
  },
)

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface BcmsParsedEntry {
  meta: Record<string, Record<string, unknown>>
  content: Record<string, Array<{ type: string; value: string }>>
}

/**
 * Extract the English meta object from a BCMS parsed entry.
 * Falls back to an empty object if the language key is missing.
 */
function metaEn(entry: BcmsParsedEntry): Record<string, unknown> {
  return (entry.meta?.en ?? {}) as Record<string, unknown>
}

/**
 * Concatenate all paragraph values from the English content array
 * into a single body string.
 */
function bodyEn(entry: BcmsParsedEntry): string {
  const items = entry.content?.en ?? []
  return items.map((item) => String(item.value ?? '')).join('')
}

/**
 * Return a value only if it is defined and non-null.
 * Used to keep optional fields off the normalized object entirely
 * rather than setting them to undefined.
 */
function optional<T>(value: unknown): T | undefined {
  return value != null ? (value as T) : undefined
}

// ---------------------------------------------------------------------------
// Normalizers (BCMS shape -> clean app types)
// ---------------------------------------------------------------------------

function normalizeBlogPost(entry: BcmsParsedEntry): BlogPost {
  const m = metaEn(entry)

  const base: BlogPost = {
    slug: String(m.slug ?? ''),
    title: String(m.title ?? ''),
    excerpt: String(m.excerpt ?? ''),
    body: bodyEn(entry),
    publishedAt: String(m.published_at ?? ''),
  }

  const coverImage = optional<string>(m.cover_image)
  const category = optional<string>(m.category)
  const author = optional<string>(m.author)

  if (coverImage !== undefined) base.coverImage = coverImage
  if (category !== undefined) base.category = category
  if (author !== undefined) base.author = author

  return base
}

function normalizeService(entry: BcmsParsedEntry): Service {
  const m = metaEn(entry)

  const base: Service = {
    slug: String(m.slug ?? ''),
    title: String(m.title ?? ''),
    description: String(m.description ?? ''),
    order: typeof m.order === 'number' ? m.order : 0,
  }

  const icon = optional<string>(m.icon)
  const image = optional<string>(m.image)
  const price = optional<string>(m.price)

  if (icon !== undefined) base.icon = icon
  if (image !== undefined) base.image = image
  if (price !== undefined) base.price = price

  return base
}

function normalizeTestimonial(entry: BcmsParsedEntry): Testimonial {
  const m = metaEn(entry)

  const base: Testimonial = {
    quote: String(m.quote ?? ''),
    author: String(m.author ?? ''),
  }

  const role = optional<string>(m.role)
  const avatar = optional<string>(m.avatar)
  const rating = optional<number>(m.rating)

  if (role !== undefined) base.role = role
  if (avatar !== undefined) base.avatar = avatar
  if (rating !== undefined) base.rating = rating

  return base
}

function normalizeTeamMember(entry: BcmsParsedEntry): TeamMember {
  const m = metaEn(entry)

  const base: TeamMember = {
    name: String(m.name ?? ''),
    role: String(m.role ?? ''),
    bio: String(m.bio ?? ''),
    order: typeof m.order === 'number' ? m.order : 0,
  }

  const photo = optional<string>(m.photo)

  if (photo !== undefined) base.photo = photo

  return base
}

// ---------------------------------------------------------------------------
// Template names — change these if your BCMS templates have different names
// ---------------------------------------------------------------------------

const TEMPLATES = {
  blogPost: 'blog_post',
  service: 'service',
  testimonial: 'testimonial',
  teamMember: 'team_member',
} as const

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getBlogPosts(): Promise<BlogPost[]> {
  const entries = await client.entry.getAll(TEMPLATES.blogPost)
  return entries.map((e) => normalizeBlogPost(e as unknown as BcmsParsedEntry))
}

export async function getBlogPostBySlug(
  slug: string,
): Promise<BlogPost | null> {
  try {
    const entry = await client.entry.getBySlug(slug, TEMPLATES.blogPost)
    return normalizeBlogPost(entry as unknown as BcmsParsedEntry)
  } catch {
    return null
  }
}

export async function getServices(): Promise<Service[]> {
  const entries = await client.entry.getAll(TEMPLATES.service)
  return entries
    .map((e) => normalizeService(e as unknown as BcmsParsedEntry))
    .sort((a, b) => a.order - b.order)
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const entries = await client.entry.getAll(TEMPLATES.testimonial)
  return entries.map((e) =>
    normalizeTestimonial(e as unknown as BcmsParsedEntry),
  )
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  const entries = await client.entry.getAll(TEMPLATES.teamMember)
  return entries
    .map((e) => normalizeTeamMember(e as unknown as BcmsParsedEntry))
    .sort((a, b) => a.order - b.order)
}
