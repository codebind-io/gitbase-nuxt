import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const gitbaseConfigPath = join(process.cwd(), 'public/admin/gitbase.config.yml')

const CF_MAX_RULE_LENGTH = 100
const CF_MAX_RULES = 100

const CF_ASSET_EXCLUDES = [
  '/_nuxt/*',
  '/_fonts/*',
  '/_og-static-fonts/*',
  '/_og/s/*',
  '/__nuxt_content/*'
]

const CF_SKIP_ENTRIES = new Set([
  '_worker.js',
  '_headers',
  '_redirects',
  '_routes.json',
  '_nuxt',
  '_fonts',
  '_og',
  '_og-static-fonts',
  '__nuxt_content',
  'admin'
])

const CF_SKIP_FILES = new Set(['nitro.json'])

function gitbaseConfigPlugin() {
  return {
    name: 'gitbase-config-inline',
    resolveId(id: string) {
      if (id === 'virtual:gitbase-config') {
        return id
      }
    },
    load(id: string) {
      if (id === 'virtual:gitbase-config') {
        const content = readFileSync(gitbaseConfigPath, 'utf-8')
        return `export default ${JSON.stringify(content)}`
      }
    }
  }
}

function markdownRoutes(contentDir: string, segment: string) {
  const dir = join(contentDir, segment)

  if (!existsSync(dir)) {
    return []
  }

  return readdirSync(dir)
    .filter(file => file.endsWith('.md'))
    .map(file => `/${segment}/${file.slice(0, -3).toLowerCase()}`)
}

function pageRoutes(contentDir: string) {
  const dir = join(contentDir, 'pages')

  if (!existsSync(dir)) {
    return []
  }

  return readdirSync(dir)
    .filter(file => file.endsWith('.md'))
    .map(file => `/${file.slice(0, -3)}`)
}

function categoryRoutes(yaml: string, sectionKey: string, prefix: string) {
  const section = yaml.split(`${sectionKey}:`)[1]?.split(/\n\w/)[0] ?? ''

  return [...section.matchAll(/^\s+slug:\s+(\S+)/gm)].map(([, slug]) => `${prefix}/${slug}`)
}

function getPrerenderRoutes(rootDir = process.cwd()) {
  const contentDir = join(rootDir, 'content')
  const categoriesYaml = readFileSync(join(contentDir, 'categories.yml'), 'utf8')

  return [
    '/',
    '/posts',
    '/products',
    ...pageRoutes(contentDir),
    ...markdownRoutes(contentDir, 'posts'),
    ...markdownRoutes(contentDir, 'products'),
    ...categoryRoutes(categoriesYaml, 'shop_categories', '/products/category'),
    ...categoryRoutes(categoriesYaml, 'blog_categories', '/posts/category')
  ]
}

function toCloudflareRoutePath(fileName: string) {
  if (fileName.endsWith('.html')) {
    const base = fileName.slice(0, -5)
    return base === 'index' ? '/' : `/${base}`
  }

  return `/${fileName}`
}

function fixCloudflareRoutes(distDir = join(process.cwd(), 'dist')) {
  const routesPath = join(distDir, '_routes.json')

  if (!existsSync(routesPath)) {
    console.warn('[fix-cloudflare-routes] No _routes.json found, skipping.')
    return
  }

  const excludes = new Set(CF_ASSET_EXCLUDES)

  // /admin/index.html and /admin/config.yml must hit the worker (env injection).
  // Only icon.svg is served as a static asset from public/admin/.
  const adminIcon = join(distDir, 'admin', 'icon.svg')
  if (existsSync(adminIcon)) {
    excludes.add('/admin/icon.svg')
  }

  let hasRootSql = false

  for (const entry of readdirSync(distDir)) {
    if (CF_SKIP_ENTRIES.has(entry)) {
      continue
    }

    const fullPath = join(distDir, entry)
    const stats = statSync(fullPath)

    if (stats.isDirectory()) {
      excludes.add(`/${entry}/*`)
      continue
    }

    if (CF_SKIP_FILES.has(entry)) {
      continue
    }

    const baseName = entry.replace(/\.(html|json)$/, '')
    const siblingDir = join(distDir, baseName)
    if (baseName !== entry && existsSync(siblingDir) && statSync(siblingDir).isDirectory()) {
      continue
    }

    if (entry.endsWith('.sql')) {
      hasRootSql = true
      continue
    }

    const rule = toCloudflareRoutePath(entry)

    if (rule.length <= CF_MAX_RULE_LENGTH) {
      excludes.add(rule)
    }
  }

  if (hasRootSql) {
    excludes.add('/*.sql')
  }

  const exclude = [...excludes]
    .filter(rule => rule.length <= CF_MAX_RULE_LENGTH)
    .sort((a, b) => a.localeCompare(b))
    .slice(0, CF_MAX_RULES - 1)

  writeFileSync(
    routesPath,
    `${JSON.stringify({ version: 1, include: ['/*'], exclude }, null, 2)}\n`
  )

  const tooLong = exclude.filter(rule => rule.length > CF_MAX_RULE_LENGTH)
  if (tooLong.length) {
    console.warn(`[fix-cloudflare-routes] ${tooLong.length} rules exceed ${CF_MAX_RULE_LENGTH} chars.`)
  }

  console.log(`[fix-cloudflare-routes] Wrote ${exclude.length} exclude rules.`)
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxt/content',
    '@vueuse/nuxt',
    'nuxt-og-image',
    'motion-v/nuxt'
  ],

  devtools: {
    enabled: false
  },

  css: ['~/assets/css/main.css'],

  content: {
    experimental: {
      sqliteConnector: 'native'
    }
  },

  routeRules: {
    '/admin': { redirect: '/admin/index.html' }
  },

  compatibilityDate: '2024-11-01',

  nitro: {
    preset: 'cloudflare_pages',
    sourceMap: false,
    rollupConfig: {
      plugins: [gitbaseConfigPlugin()]
    },
    prerender: {
      crawlLinks: true,
      routes: ['/'],
      autoSubfolderIndex: false,
      ignore: ['/api/**', '/__nuxt_content/**', '/admin/**']
    }
  },

  vite: {
    build: {
      sourcemap: false
    },
    optimizeDeps: {
      include: []
    }
  },

  hooks: {
    'prerender:routes'(ctx) {
      for (const route of getPrerenderRoutes()) {
        ctx.routes.add(route)
      }
    },
    close() {
      fixCloudflareRoutes()
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  icon: {
    provider: 'none',
    serverBundle: false,
    clientBundle: {
      scan: {
        globInclude: [
          '{app,content}/**/*.{vue,ts,md,yml}',
          'node_modules/@nuxt/ui/dist/**'
        ]
      },
      icons: [
        'lucide:sun',
        'lucide:moon',
        'lucide:shopping-bag',
        'lucide:workflow',
        'lucide:palette',
        'lucide:arrow-left',
        'lucide:arrow-right',
        'lucide:arrow-up-right',
        'lucide:x',
        'lucide:hash',
        'lucide:chevron-left',
        'lucide:message-circle',
        'lucide:phone',
        'lucide:mail',
        'lucide:map-pin',
        'lucide:building',
        'lucide:utensils-crossed',
        'simple-icons:facebook',
        'simple-icons:instagram',
        'simple-icons:x',
        'simple-icons:whatsapp'
      ]
    }
  },

  image: {
    // TODO: replace with your R2 domain for image optimization
    domains: ['r2.gitbase.cloud'],
    format: ['webp'],
    quality: 80
  },

  ogImage: {
    zeroRuntime: true
  }
})
