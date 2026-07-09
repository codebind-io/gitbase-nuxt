import { defineCollection, defineContentConfig, z } from '@nuxt/content'
import { themeFontSlugs, themeNeutralColors, themePrimaryColors } from './app/utils/theme'

export default defineContentConfig({
  collections: {
    settings: defineCollection({
      type: 'data',
      source: 'settings.yml',
      schema: z.object({
        site: z.object({
          logo_light: z.string().optional().editor({ input: 'media' }),
          logo_dark: z.string().optional().editor({ input: 'media' }),
          favicon: z.string().optional().editor({ input: 'media' })
        }).optional(),
        shop: z.object({
          currency_symbol: z.string().default('€')
        }).optional(),
        seo: z.object({
          title: z.string().optional(),
          description: z.string().optional(),
          og_title: z.string().optional(),
          og_description: z.string().optional(),
          og_image: z.string().optional().editor({ input: 'media' }),
          keywords: z.array(z.string()).optional()
        }),
        navbar: z.object({
          hide_on_scroll: z.boolean().default(false),
          show_darkmode_switch: z.boolean().default(true),
          nav_items: z.array(z.object({
            label: z.string(),
            to: z.string()
          })),
          cta: z.object({
            label: z.string(),
            url: z.string()
          }).optional()
        }),
        footer: z.object({
          links: z.array(z.object({
            label: z.string(),
            to: z.string()
          })).default([])
        }).optional(),
        social: z.object({
          facebook: z.string().optional(),
          instagram: z.string().optional(),
          x: z.string().optional(),
          whatsapp: z.string().optional()
        }).optional(),
        theme: z.object({
          dark_mode: z.boolean().default(true),
          primary: z.enum(themePrimaryColors).default('blue'),
          primary_dark: z.preprocess(
            value => value === '' ? undefined : value,
            z.enum(themePrimaryColors).optional()
          ),
          custom_color: z.string().optional(),
          custom_color_dark: z.string().optional(),
          neutral: z.enum(themeNeutralColors).default('neutral'),
          radius: z.union([
            z.literal(0),
            z.literal(0.125),
            z.literal(0.25),
            z.literal(0.375),
            z.literal(0.5)
          ]).default(0.25),
          font: z.enum(themeFontSlugs).default('public-sans')
        }).optional()
      })
    }),
    blockSimpleBlock: defineCollection({
      type: 'data',
      source: 'blocks/simple-block.yml',
      schema: z.object({
        visible: z.boolean().default(true),
        title: z.string(),
        description: z.string(),
        image: z.string().optional().editor({ input: 'media' }),
        layout: z.object({
          desktop: z.enum(['left', 'right', 'top', 'bottom']).default('left'),
          mobile: z.enum(['first', 'second']).default('first')
        }).default({ desktop: 'left', mobile: 'first' })
      })
    }),
    blockSimpleHero: defineCollection({
      type: 'data',
      source: 'blocks/simple-hero.yml',
      schema: z.object({
        visible: z.boolean().default(true),
        title: z.string(),
        description: z.string(),
        cta: z.object({
          label: z.string().optional(),
          url: z.string().optional(),
          style: z.enum(['plain', 'outline']).default('plain')
        }).optional(),
        cta2: z.object({
          label: z.string().optional(),
          url: z.string().optional(),
          style: z.enum(['plain', 'outline']).default('outline')
        }).optional()
      })
    }),
    blockCarousel: defineCollection({
      type: 'data',
      source: 'blocks/carousel.yml',
      schema: z.object({
        visible: z.boolean().default(true),
        columns_visible: z.object({
          mobile: z.number().min(1).max(6).default(1),
          tablet: z.number().min(1).max(6).default(2),
          desktop: z.number().min(1).max(6).default(3)
        }).default({ mobile: 1, tablet: 2, desktop: 3 }),
        cover_image: z.boolean().default(false),
        images: z.array(z.object({
          image: z.string().editor({ input: 'media' }),
          alt: z.string().optional()
        })).default([])
      })
    }),
    blockFeaturedPosts: defineCollection({
      type: 'data',
      source: 'blocks/featured-posts.yml',
      schema: z.object({
        visible: z.boolean().default(true),
        featured: z.string()
      })
    }),
    blockFeaturedProducts: defineCollection({
      type: 'data',
      source: 'blocks/featured-products.yml',
      schema: z.object({
        visible: z.boolean().default(true),
        columns_visible: z.object({
          mobile: z.number().min(1).max(6).default(1),
          tablet: z.number().min(1).max(6).default(2),
          desktop: z.number().min(1).max(6).default(3)
        }).default({ mobile: 1, tablet: 2, desktop: 3 }),
        cover_image: z.boolean().default(false)
      })
    }),
    blockQuickContact: defineCollection({
      type: 'data',
      source: 'blocks/quick-contact.yml',
      schema: z.object({
        show_on: z.enum(['hide', 'mobile', 'mobile_tablet', 'all']).default('mobile'),
        show_pages: z.enum(['homepage', 'website']).default('homepage'),
        whatsapp: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        maps_url: z.string().optional()
      })
    }),
    pages: defineCollection({
      type: 'page',
      source: {
        include: 'pages/*.md',
        prefix: '/'
      },
      schema: z.object({
        title: z.string()
      })
    }),
    categories: defineCollection({
      type: 'data',
      source: 'categories.yml',
      schema: z.object({
        shop_categories: z.array(z.object({
          title: z.string(),
          slug: z.string(),
          description: z.string().optional(),
          icon: z.string().optional()
        })),
        blog_categories: z.array(z.object({
          title: z.string(),
          slug: z.string(),
          description: z.string().optional(),
          icon: z.string().optional()
        }))
      })
    }),
    products: defineCollection({
      type: 'page',
      source: {
        include: 'products/*.md',
        prefix: '/products'
      },
      schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        price: z.number().nullish(),
        checkout_url: z.string().optional(),
        image: z.string().optional().editor({ input: 'media' }),
        featured: z.boolean().default(false),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
        status: z.enum(['draft', 'online']).default('draft')
      })
    }),
    posts: defineCollection({
      type: 'page',
      source: {
        include: 'posts/*.md',
        prefix: '/posts'
      },
      schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        date: z.coerce.date().optional(),
        image: z.string().optional().editor({ input: 'media' }),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
        status: z.enum(['draft', 'online']).default('draft')
      })
    })
  }
})
