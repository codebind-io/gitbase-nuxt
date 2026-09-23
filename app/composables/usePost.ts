import type { ContentNavigationItem, PostsCollectionItem } from '@nuxt/content'

type PostQuery = {
  path?: string
  category?: string
  order?: ContentOrder
  first?: boolean
}

function onlinePosts(options: PostQuery = {}) {
  const where: ContentWhere[] = [{ field: 'status', value: 'online' }]

  if (options.category) {
    where.push({ field: 'category', value: options.category })
  }

  return queryContent<PostsCollectionItem[] | PostsCollectionItem | null>({
    collection: 'posts',
    where,
    path: options.path,
    order: options.order,
    first: options.first
  })
}

export function queryOnlinePosts(options: PostQuery & { first: true }): Promise<PostsCollectionItem | null>
export function queryOnlinePosts(options?: PostQuery): Promise<PostsCollectionItem[]>
export function queryOnlinePosts(options: PostQuery = {}) {
  return onlinePosts(options) as Promise<PostsCollectionItem[] | PostsCollectionItem | null>
}

export function queryOnlinePostsNavigation() {
  return queryContent<unknown[]>({
    collection: 'posts',
    kind: 'navigation',
    where: [{ field: 'status', value: 'online' }]
  })
}

export function queryOnlinePostsSearchSections() {
  return queryContent<unknown[]>({
    collection: 'posts',
    kind: 'search',
    where: [{ field: 'status', value: 'online' }]
  })
}

export function queryOnlinePostSurround(path: string) {
  return queryContent<ContentNavigationItem[]>({
    collection: 'posts',
    kind: 'surround',
    path,
    fields: ['description'],
    where: [{ field: 'status', value: 'online' }]
  })
}

function normalizeSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
}

function postPathSlug(post: PostsCollectionItem) {
  return post.path?.split('/').filter(Boolean).pop() ?? ''
}

export function findPostBySlug(
  posts: PostsCollectionItem[],
  slug: string
) {
  const normalizedSlug = normalizeSlug(slug)

  return posts.find((post) => {
    if (post.path === `/posts/${slug}` || post.path?.endsWith(`/${slug}`)) {
      return true
    }

    return normalizeSlug(postPathSlug(post)) === normalizedSlug
  })
}
