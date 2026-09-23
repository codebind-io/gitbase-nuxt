import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const gitbaseConfigPath = join(process.cwd(), 'gitbase.config.yml')

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

function resolveInstalled(packageName: string, specifier: string) {
  const entry = fileURLToPath(import.meta.resolve(packageName))
  return createRequire(entry).resolve(specifier)
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

  // /admin/* hits the worker (config injection, CMS script, auth).
  // Static public assets (e.g. /favicon.svg) are excluded via the root walk below.

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

function contentSqliteConnector(): 'better-sqlite3' | 'native' {
  const major = Number(process.versions.node.split('.')[0])

  // better-sqlite3 12 aborts on Node 24+ when a Statement is finalized.
  // Older Node keeps that connector. node:sqlite is available from 22.5.
  return major >= 24 ? 'native' : 'better-sqlite3'
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

  alias: {
    'minimark/hast': resolveInstalled('@nuxt/content', 'minimark/hast'),
    'remark-mdc': resolveInstalled('@nuxtjs/mdc/runtime', 'remark-mdc')
  },

  content: {
    database: {
      type: 'd1',
      bindingName: 'DB'
    },
    experimental: {
      sqliteConnector: contentSqliteConnector()
    }
  },

  routeRules: {
    '/admin': { redirect: '/admin/index.html' },
    '/**': {
      cache: false,
      headers: { 'cache-control': 'no-store' }
    }
  },

  compatibilityDate: '2024-11-01',

  nitro: {
    preset: 'cloudflare_pages',
    sourceMap: false,
    // Bundle CMS IIFE from npm so /admin/gitbase-cms.js works on Cloudflare Workers
    serverAssets: [
      {
        baseName: 'gitbase-cms',
        dir: 'node_modules/@gitbase/cms/dist'
      }
    ],
    rollupConfig: {
      plugins: [gitbaseConfigPlugin()]
    },
    prerender: {
      crawlLinks: false,
      routes: [],
      autoSubfolderIndex: false,
      ignore: ['/api/**', '/__nuxt_content/**', '/admin/**']
    }
  },

  vite: {
    build: {
      sourcemap: false
    },
    optimizeDeps: {
      include: ['minimark/hast', 'tailwindcss/colors']
    }
  },

  hooks: {
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
