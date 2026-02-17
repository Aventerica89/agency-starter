export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  body: string
  coverImage?: string
  category?: string
  publishedAt: string
  author?: string
}

export interface Service {
  slug: string
  title: string
  description: string
  icon?: string
  image?: string
  price?: string
  order: number
}

export interface Testimonial {
  quote: string
  author: string
  role?: string
  avatar?: string
  rating?: number
}

export interface TeamMember {
  name: string
  role: string
  bio: string
  photo?: string
  order: number
}

export interface SiteConfig {
  name: string
  tagline: string
  description: string
  phone?: string
  email?: string
  address?: string
  socialLinks?: Record<string, string>
}
