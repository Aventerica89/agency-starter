import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { BlogPost, Service, Testimonial, TeamMember } from '../../src/lib/types'

// ---------------------------------------------------------------------------
// Mock @thebcms/client BEFORE importing cms.ts (module-scope client init)
// ---------------------------------------------------------------------------

const { mockGetAll, mockGetBySlug } = vi.hoisted(() => ({
  mockGetAll: vi.fn(),
  mockGetBySlug: vi.fn(),
}))

vi.mock('@thebcms/client', () => {
  return {
    Client: class MockClient {
      entry = {
        getAll: mockGetAll,
        getBySlug: mockGetBySlug,
      }
    },
  }
})

// Import AFTER mock is registered
import {
  getBlogPosts,
  getBlogPostBySlug,
  getServices,
  getTestimonials,
  getTeamMembers,
} from '../../src/lib/cms'

// ---------------------------------------------------------------------------
// Helpers — simulate BCMS EntryParsed shape
// ---------------------------------------------------------------------------

function makeParsedEntry(
  meta: Record<string, unknown>,
  contentText?: string,
) {
  const contentItems = contentText
    ? [{ type: 'paragraph' as const, value: contentText }]
    : []

  return {
    _id: `entry-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
    instanceId: 'inst-1',
    templateId: 'tmpl-1',
    templateName: 'blog_post',
    userId: 'user-1',
    statuses: [],
    meta: { en: { slug: meta.slug ?? 'fallback-slug', ...meta } },
    content: { en: contentItems },
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CMS abstraction layer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // -----------------------------------------------------------------------
  // Blog Posts
  // -----------------------------------------------------------------------
  describe('getBlogPosts', () => {
    it('returns normalized BlogPost[] from BCMS entries', async () => {
      mockGetAll.mockResolvedValueOnce([
        makeParsedEntry(
          {
            slug: 'hello-world',
            title: 'Hello World',
            excerpt: 'A first post',
            cover_image: '/img/hello.jpg',
            category: 'General',
            published_at: '2025-06-01',
            author: 'Jane Doe',
          },
          '<p>Full body content here.</p>',
        ),
        makeParsedEntry(
          {
            slug: 'second-post',
            title: 'Second Post',
            excerpt: 'Another post',
            published_at: '2025-07-15',
          },
          '<p>Second body.</p>',
        ),
      ])

      const posts: BlogPost[] = await getBlogPosts()

      expect(posts).toHaveLength(2)

      expect(posts[0]).toEqual({
        slug: 'hello-world',
        title: 'Hello World',
        excerpt: 'A first post',
        body: '<p>Full body content here.</p>',
        coverImage: '/img/hello.jpg',
        category: 'General',
        publishedAt: '2025-06-01',
        author: 'Jane Doe',
      })

      // Optional fields should be absent when not provided
      expect(posts[1].coverImage).toBeUndefined()
      expect(posts[1].category).toBeUndefined()
      expect(posts[1].author).toBeUndefined()
    })

    it('returns empty array when no entries exist', async () => {
      mockGetAll.mockResolvedValueOnce([])
      const posts = await getBlogPosts()
      expect(posts).toEqual([])
    })
  })

  describe('getBlogPostBySlug', () => {
    it('returns a single normalized BlogPost', async () => {
      mockGetBySlug.mockResolvedValueOnce(
        makeParsedEntry(
          {
            slug: 'specific-post',
            title: 'Specific Post',
            excerpt: 'Found by slug',
            published_at: '2025-08-01',
          },
          '<p>Slug body.</p>',
        ),
      )

      const post = await getBlogPostBySlug('specific-post')

      expect(post).toBeDefined()
      expect(post!.slug).toBe('specific-post')
      expect(post!.title).toBe('Specific Post')
      expect(post!.body).toBe('<p>Slug body.</p>')
    })
  })

  // -----------------------------------------------------------------------
  // Services
  // -----------------------------------------------------------------------
  describe('getServices', () => {
    it('returns normalized Service[] sorted by order', async () => {
      mockGetAll.mockResolvedValueOnce([
        makeParsedEntry({
          slug: 'branding',
          title: 'Branding',
          description: 'Brand identity',
          icon: 'palette',
          image: '/img/brand.jpg',
          price: '$2,000',
          order: 2,
        }),
        makeParsedEntry({
          slug: 'web-design',
          title: 'Web Design',
          description: 'Modern websites',
          order: 1,
        }),
        makeParsedEntry({
          slug: 'seo',
          title: 'SEO',
          description: 'Search optimization',
          order: 3,
        }),
      ])

      const services: Service[] = await getServices()

      expect(services).toHaveLength(3)
      // Sorted by order ascending
      expect(services[0].slug).toBe('web-design')
      expect(services[1].slug).toBe('branding')
      expect(services[2].slug).toBe('seo')

      expect(services[1]).toEqual({
        slug: 'branding',
        title: 'Branding',
        description: 'Brand identity',
        icon: 'palette',
        image: '/img/brand.jpg',
        price: '$2,000',
        order: 2,
      })

      // Optional fields absent
      expect(services[0].icon).toBeUndefined()
      expect(services[0].image).toBeUndefined()
      expect(services[0].price).toBeUndefined()
    })
  })

  // -----------------------------------------------------------------------
  // Testimonials
  // -----------------------------------------------------------------------
  describe('getTestimonials', () => {
    it('returns normalized Testimonial[]', async () => {
      mockGetAll.mockResolvedValueOnce([
        makeParsedEntry({
          slug: 'testimonial-1',
          quote: 'Amazing work!',
          author: 'John Smith',
          role: 'CEO, Acme Corp',
          avatar: '/img/john.jpg',
          rating: 5,
        }),
        makeParsedEntry({
          slug: 'testimonial-2',
          quote: 'Great team.',
          author: 'Lisa Ray',
        }),
      ])

      const testimonials: Testimonial[] = await getTestimonials()

      expect(testimonials).toHaveLength(2)

      expect(testimonials[0]).toEqual({
        quote: 'Amazing work!',
        author: 'John Smith',
        role: 'CEO, Acme Corp',
        avatar: '/img/john.jpg',
        rating: 5,
      })

      expect(testimonials[1].role).toBeUndefined()
      expect(testimonials[1].avatar).toBeUndefined()
      expect(testimonials[1].rating).toBeUndefined()
    })
  })

  // -----------------------------------------------------------------------
  // Team Members
  // -----------------------------------------------------------------------
  describe('getTeamMembers', () => {
    it('returns normalized TeamMember[] sorted by order', async () => {
      mockGetAll.mockResolvedValueOnce([
        makeParsedEntry({
          slug: 'alice',
          name: 'Alice Johnson',
          role: 'Lead Designer',
          bio: 'Designs with passion.',
          photo: '/img/alice.jpg',
          order: 2,
        }),
        makeParsedEntry({
          slug: 'bob',
          name: 'Bob Chen',
          role: 'Developer',
          bio: 'Full-stack engineer.',
          order: 1,
        }),
      ])

      const members: TeamMember[] = await getTeamMembers()

      expect(members).toHaveLength(2)
      // Sorted by order ascending
      expect(members[0].name).toBe('Bob Chen')
      expect(members[1].name).toBe('Alice Johnson')

      expect(members[1]).toEqual({
        name: 'Alice Johnson',
        role: 'Lead Designer',
        bio: 'Designs with passion.',
        photo: '/img/alice.jpg',
        order: 2,
      })

      expect(members[0].photo).toBeUndefined()
    })

    it('defaults order to 0 when not provided', async () => {
      mockGetAll.mockResolvedValueOnce([
        makeParsedEntry({
          slug: 'no-order',
          name: 'No Order',
          role: 'Intern',
          bio: 'Just started.',
        }),
      ])

      const members = await getTeamMembers()

      expect(members[0].order).toBe(0)
    })
  })
})
