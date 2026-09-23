import type { H3Event } from 'h3'
import { parseMarkdown } from '@nuxtjs/mdc/runtime'
import { fromHast } from 'minimark/hast'
import { parseFrontMatter } from 'remark-mdc'

type ColumnKind = 'text' | 'json' | 'bool' | 'int' | 'navigation'

type Column = {
  name: string
  kind: ColumnKind
  default?: unknown
}

type CollectionDef = {
  name: string
  table: string
  page: boolean
  prefix?: string
  match: (relativePath: string) => boolean
  columns: Column[]
}

type D1Statement = {
  bind: (...values: unknown[]) => D1Statement
}

type ContentDatabase = {
  prepare: (sql: string) => D1Statement
  batch: (statements: D1Statement[]) => Promise<unknown>
}

export type ContentChange = {
  action?: string
  path?: string
  previousPath?: string
  data?: string
}

const text = (name: string, fallback?: unknown): Column => ({ name, kind: 'text', default: fallback })
const json = (name: string, fallback?: unknown): Column => ({ name, kind: 'json', default: fallback })
const bool = (name: string, fallback?: unknown): Column => ({ name, kind: 'bool', default: fallback })
const int = (name: string): Column => ({ name, kind: 'int' })

const pageColumns = (extra: Column[]): Column[] => [
  text('id'),
  text('title'),
  json('body'),
  ...extra,
  text('description'),
  text('extension'),
  json('meta', {}),
  { name: 'navigation', kind: 'navigation', default: true },
  text('path'),
  json('seo', {}),
  text('stem')
]

function markdownIn(folder: string) {
  return (relativePath: string) => {
    const prefix = `${folder}/`
    if (!relativePath.startsWith(prefix) || !relativePath.endsWith('.md')) {
      return false
    }

    return !relativePath.slice(prefix.length).includes('/')
  }
}

function exactFile(file: string) {
  return (relativePath: string) => relativePath === file
}

const collections: CollectionDef[] = [
  {
    name: 'pages',
    table: '_content_pages',
    page: true,
    prefix: '/',
    match: markdownIn('pages'),
    columns: pageColumns([])
  },
  {
    name: 'posts',
    table: '_content_posts',
    page: true,
    prefix: '/posts',
    match: markdownIn('posts'),
    columns: pageColumns([
      text('category'),
      text('date'),
      text('image'),
      text('status', 'draft'),
      json('tags')
    ])
  },
  {
    name: 'products',
    table: '_content_products',
    page: true,
    prefix: '/products',
    match: markdownIn('products'),
    columns: pageColumns([
      text('category'),
      text('checkout_url'),
      bool('featured', false),
      text('image'),
      int('price'),
      text('status', 'draft'),
      json('tags')
    ])
  },
  {
    name: 'settings',
    table: '_content_settings',
    page: false,
    match: exactFile('settings.yml'),
    columns: [
      text('id'),
      text('extension'),
      json('footer'),
      json('meta', {}),
      json('navbar'),
      json('seo'),
      json('shop'),
      json('site'),
      json('social'),
      text('stem'),
      json('theme')
    ]
  },
  {
    name: 'categories',
    table: '_content_categories',
    page: false,
    match: exactFile('categories.yml'),
    columns: [
      text('id'),
      json('blog_categories'),
      text('extension'),
      json('meta', {}),
      json('shop_categories'),
      text('stem')
    ]
  },
  {
    name: 'blockSimpleBlock',
    table: '_content_blockSimpleBlock',
    page: false,
    match: exactFile('blocks/simple-block.yml'),
    columns: [
      text('id'),
      text('title'),
      text('description'),
      text('extension'),
      text('image'),
      json('layout'),
      json('meta', {}),
      text('stem'),
      bool('visible', true)
    ]
  },
  {
    name: 'blockSimpleHero',
    table: '_content_blockSimpleHero',
    page: false,
    match: exactFile('blocks/simple-hero.yml'),
    columns: [
      text('id'),
      text('title'),
      json('cta'),
      json('cta2'),
      text('description'),
      text('extension'),
      json('meta', {}),
      text('stem'),
      bool('visible', true)
    ]
  },
  {
    name: 'blockCarousel',
    table: '_content_blockCarousel',
    page: false,
    match: exactFile('blocks/carousel.yml'),
    columns: [
      text('id'),
      json('columns_visible'),
      bool('cover_image', false),
      text('extension'),
      json('images'),
      json('meta', {}),
      text('stem'),
      bool('visible', true)
    ]
  },
  {
    name: 'blockFeaturedProducts',
    table: '_content_blockFeaturedProducts',
    page: false,
    match: exactFile('blocks/featured-products.yml'),
    columns: [
      text('id'),
      json('columns_visible'),
      bool('cover_image', false),
      text('extension'),
      json('meta', {}),
      text('stem'),
      bool('visible', true)
    ]
  },
  {
    name: 'blockFeaturedPosts',
    table: '_content_blockFeaturedPosts',
    page: false,
    match: exactFile('blocks/featured-posts.yml'),
    columns: [
      text('id'),
      text('extension'),
      text('featured'),
      json('meta', {}),
      text('stem'),
      bool('visible', true)
    ]
  },
  {
    name: 'blockQuickContact',
    table: '_content_blockQuickContact',
    page: false,
    match: exactFile('blocks/quick-contact.yml'),
    columns: [
      text('id'),
      text('email'),
      text('extension'),
      text('maps_url'),
      json('meta', {}),
      text('phone'),
      text('show_on', 'mobile'),
      text('show_pages', 'homepage'),
      text('stem'),
      text('whatsapp')
    ]
  }
]

export function readContentDatabase(event: H3Event) {
  const context = event.context as {
    cloudflare?: { env?: { DB?: ContentDatabase } }
  }

  return context.cloudflare?.env?.DB
}

function relativeContentPath(path: string) {
  const normalized = path.replace(/\\/g, '/').replace(/^\//, '')
  if (!normalized.startsWith('content/')) {
    return null
  }

  return normalized.slice('content/'.length)
}

function findCollection(relativePath: string) {
  return collections.find(collection => collection.match(relativePath))
}

function contentId(collection: CollectionDef, relativePath: string) {
  if (collection.prefix === undefined) {
    return `${collection.name}/${relativePath}`
  }

  const fileName = relativePath.split('/').pop() ?? relativePath
  const prefixPath = collection.prefix.replace(/^\//, '').replace(/\/$/, '')
  return [collection.name, prefixPath, fileName].filter(Boolean).join('/')
}

function stemFromId(id: string) {
  const parts = id.split('/')
  parts.shift()
  const last = parts.at(-1) ?? ''
  const match = last.match(/^(.*)\.[^.]+$/)
  if (match?.[1]) {
    parts[parts.length - 1] = match[1]
  }

  return parts.join('/')
}

function extensionFromId(id: string) {
  const match = id.match(/\.([^.]+)$/)
  return match?.[1] ?? ''
}

function routePath(stem: string) {
  return `/${stem.split('/').map(part => part.toLowerCase()).join('/')}`
}

function bindValue(kind: ColumnKind, value: unknown) {
  if (kind === 'navigation') {
    return value === false ? 'false' : 'true'
  }

  if (kind === 'bool') {
    if (value == null) {
      return null
    }

    return value ? 1 : 0
  }

  if (kind === 'int') {
    if (value == null || value === '') {
      return null
    }

    const number = Number(value)
    return Number.isFinite(number) ? number : null
  }

  if (kind === 'json') {
    if (value == null) {
      return null
    }

    return JSON.stringify(value)
  }

  if (value == null) {
    return null
  }

  if (value instanceof Date) {
    const iso = value.toISOString()
    return iso.endsWith('T00:00:00.000Z') ? iso.slice(0, 10) : iso
  }

  return String(value)
}

async function rowHash(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('')
}

async function parseMarkdownFile(source: string) {
  const parsed = await parseMarkdown(source.replace(/\r\n/g, '\n'))
  const data = (parsed.data ?? {}) as Record<string, unknown>
  const body = {
    ...fromHast(parsed.body),
    toc: parsed.toc
  }

  return { data, body }
}

async function parseYamlFile(source: string) {
  const wrapped = `---\n${source.replace(/\r\n/g, '\n').trim()}\n---`
  const parsed = await parseFrontMatter(wrapped)
  const data = parsed?.data

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Content file must be a YAML mapping')
  }

  return { data: data as Record<string, unknown> }
}

async function buildRow(collection: CollectionDef, relativePath: string, source: string) {
  const id = contentId(collection, relativePath)
  const stem = stemFromId(id)
  const extension = extensionFromId(id)
  const parsed = collection.page
    ? await parseMarkdownFile(source)
    : await parseYamlFile(source)
  const data: Record<string, unknown> = { ...parsed.data }

  if (collection.page && 'body' in parsed) {
    data.body = parsed.body
    if (typeof data.path !== 'string' || !data.path) {
      data.path = routePath(stem)
    }

    const seo = data.seo && typeof data.seo === 'object'
      ? { ...(data.seo as Record<string, unknown>) }
      : {}
    seo.title = seo.title || data.title
    seo.description = seo.description || data.description
    data.seo = seo
    if (data.navigation == null) {
      data.navigation = true
    }
  }

  data.id = id
  data.stem = stem
  data.extension = extension

  const columnNames = new Set(collection.columns.map(column => column.name))
  const meta: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (!columnNames.has(key)) {
      meta[key] = value
    }
  }
  data.meta = meta

  const values = collection.columns.map((column) => {
    const value = data[column.name] === undefined ? column.default : data[column.name]
    return bindValue(column.kind, value === undefined ? null : value)
  })
  values.push(await rowHash(JSON.stringify(values)))

  return {
    stem,
    columns: [...collection.columns.map(column => column.name), '__hash__'],
    values
  }
}

function deleteStatement(db: ContentDatabase, table: string, stem: string) {
  return db.prepare(`DELETE FROM "${table}" WHERE stem = ?`).bind(stem)
}

export async function syncContentChanges(db: ContentDatabase, changes: ContentChange[]) {
  const statements: D1Statement[] = []

  for (const change of changes) {
    if (typeof change?.path !== 'string' || !change.path.trim()) {
      throw new Error('Content change is missing a path')
    }

    const relativePath = relativeContentPath(change.path)
    const collection = relativePath ? findCollection(relativePath) : undefined
    if (!relativePath || !collection) {
      throw new Error(`No content collection for ${change.path}`)
    }

    const action = change.action || 'update'

    if (change.previousPath) {
      const previousPath = relativeContentPath(change.previousPath)
      const previousCollection = previousPath ? findCollection(previousPath) : undefined
      if (previousPath && previousCollection) {
        statements.push(deleteStatement(
          db,
          previousCollection.table,
          stemFromId(contentId(previousCollection, previousPath))
        ))
      }
    }

    statements.push(deleteStatement(
      db,
      collection.table,
      stemFromId(contentId(collection, relativePath))
    ))

    if (action === 'delete') {
      continue
    }

    if (typeof change.data !== 'string') {
      throw new Error(`Missing content for ${change.path}`)
    }

    const row = await buildRow(collection, relativePath, change.data)
    const names = row.columns.map(name => `"${name}"`).join(', ')
    const placeholders = row.columns.map(() => '?').join(', ')
    statements.push(
      db.prepare(`INSERT INTO "${collection.table}" (${names}) VALUES (${placeholders})`).bind(...row.values)
    )
  }

  if (statements.length) {
    await db.batch(statements)
  }
}
