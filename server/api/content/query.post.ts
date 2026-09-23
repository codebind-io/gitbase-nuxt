import type { H3Event } from 'h3'
import {
  queryCollection,
  queryCollectionItemSurroundings,
  queryCollectionNavigation,
  queryCollectionSearchSections
} from '@nuxt/content/server'

const collections = [
  'pages',
  'posts',
  'products',
  'settings',
  'categories',
  'blockSimpleBlock',
  'blockSimpleHero',
  'blockCarousel',
  'blockFeaturedProducts',
  'blockFeaturedPosts',
  'blockQuickContact'
] as const

type CollectionName = typeof collections[number]

const fields: Record<CollectionName, string[]> = {
  pages: ['path', 'title'],
  posts: ['status', 'category', 'title', 'date', 'path'],
  products: ['status', 'category', 'featured', 'title', 'path'],
  settings: [],
  categories: [],
  blockSimpleBlock: ['visible'],
  blockSimpleHero: ['visible'],
  blockCarousel: ['visible'],
  blockFeaturedProducts: ['visible'],
  blockFeaturedPosts: ['visible', 'featured'],
  blockQuickContact: []
}

const orderFields: Record<CollectionName, string[]> = {
  pages: ['title', 'stem'],
  posts: ['title', 'date', 'stem'],
  products: ['title', 'stem'],
  settings: ['stem'],
  categories: ['stem'],
  blockSimpleBlock: ['stem'],
  blockSimpleHero: ['stem'],
  blockCarousel: ['stem'],
  blockFeaturedProducts: ['stem'],
  blockFeaturedPosts: ['stem'],
  blockQuickContact: ['stem']
}

type WhereClause = {
  field: string
  value: string | number | boolean
}

type ContentQuery = {
  collection?: string
  kind?: 'list' | 'navigation' | 'search' | 'surround'
  where?: WhereClause[]
  path?: string
  order?: { field?: string, direction?: string }
  first?: boolean
  fields?: string[]
}

type ContentBuilder = {
  where: (field: string, operator: '=', value: unknown) => ContentBuilder
  path: (path: string) => ContentBuilder
  order: (field: string, direction: 'ASC' | 'DESC') => ContentBuilder
  first: () => Promise<unknown>
  all: () => Promise<unknown[]>
}

function isCollection(value: string): value is CollectionName {
  return (collections as readonly string[]).includes(value)
}

function assertField(collection: CollectionName, field: string, allowed: string[]) {
  if (!allowed.includes(field) || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(field)) {
    throw createError({ statusCode: 400, statusMessage: `Unknown content field ${field}` })
  }
}

function readWhere(collection: CollectionName, where: WhereClause[] | undefined) {
  if (!where) {
    return []
  }

  if (!Array.isArray(where) || where.length > 8) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid content filters' })
  }

  return where.map((clause) => {
    if (!clause || typeof clause.field !== 'string') {
      throw createError({ statusCode: 400, statusMessage: 'Invalid content filter' })
    }

    assertField(collection, clause.field, fields[collection])

    const value = clause.value
    if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
      throw createError({ statusCode: 400, statusMessage: 'Invalid content filter value' })
    }

    if (typeof value === 'string' && value.length > 200) {
      throw createError({ statusCode: 400, statusMessage: 'Content filter value is too long' })
    }

    return { field: clause.field, value }
  })
}

function applyWhere(query: { where: (field: string, operator: '=', value: unknown) => unknown }, where: WhereClause[]) {
  for (const clause of where) {
    query.where(clause.field, '=', clause.value)
  }
}

function collectionQuery(event: H3Event, collection: CollectionName) {
  switch (collection) {
    case 'pages': return queryCollection(event, 'pages') as unknown as ContentBuilder
    case 'posts': return queryCollection(event, 'posts') as unknown as ContentBuilder
    case 'products': return queryCollection(event, 'products') as unknown as ContentBuilder
    case 'settings': return queryCollection(event, 'settings') as unknown as ContentBuilder
    case 'categories': return queryCollection(event, 'categories') as unknown as ContentBuilder
    case 'blockSimpleBlock': return queryCollection(event, 'blockSimpleBlock') as unknown as ContentBuilder
    case 'blockSimpleHero': return queryCollection(event, 'blockSimpleHero') as unknown as ContentBuilder
    case 'blockCarousel': return queryCollection(event, 'blockCarousel') as unknown as ContentBuilder
    case 'blockFeaturedProducts': return queryCollection(event, 'blockFeaturedProducts') as unknown as ContentBuilder
    case 'blockFeaturedPosts': return queryCollection(event, 'blockFeaturedPosts') as unknown as ContentBuilder
    case 'blockQuickContact': return queryCollection(event, 'blockQuickContact') as unknown as ContentBuilder
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ContentQuery>(event)
  const name = body?.collection

  if (typeof name !== 'string' || !isCollection(name)) {
    throw createError({ statusCode: 400, statusMessage: 'Unknown content collection' })
  }

  const kind = body.kind ?? 'list'
  const where = readWhere(name, body.where)

  if (kind === 'navigation' || kind === 'search' || kind === 'surround') {
    if (name !== 'posts') {
      throw createError({ statusCode: 400, statusMessage: 'This content query only supports posts' })
    }

    if (kind === 'navigation') {
      const query = queryCollectionNavigation(event, 'posts')
      applyWhere(query, where)
      return await query
    }

    if (kind === 'search') {
      const query = queryCollectionSearchSections(event, 'posts')
      applyWhere(query, where)
      return await query
    }

    if (typeof body.path !== 'string' || !body.path.startsWith('/') || body.path.length > 200) {
      throw createError({ statusCode: 400, statusMessage: 'Missing content path' })
    }

    const surroundFields = (body.fields ?? []).filter(field => field === 'description')
    const query = queryCollectionItemSurroundings(event, 'posts', body.path, {
      fields: surroundFields as 'description'[]
    })
    applyWhere(query, where)
    return await query
  }

  if (kind !== 'list') {
    throw createError({ statusCode: 400, statusMessage: 'Unknown content query' })
  }

  const query = collectionQuery(event, name)

  if (body.path != null) {
    if (typeof body.path !== 'string' || !body.path.startsWith('/') || body.path.length > 200) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid content path' })
    }

    query.path(body.path)
  }

  applyWhere(query, where)

  if (body.order) {
    const field = body.order.field ?? ''
    const direction = body.order.direction === 'DESC' ? 'DESC' : body.order.direction === 'ASC' ? 'ASC' : ''
    if (!direction) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid content sort' })
    }

    assertField(name, field, orderFields[name])
    query.order(field, direction)
  }

  if (body.first) {
    return await query.first()
  }

  return await query.all()
})
