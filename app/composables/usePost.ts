import type { PostsCollectionItem } from '@nuxt/content'

export function queryOnlinePosts() {
  return queryCollection('posts').where('status', '=', 'online')
}

export function queryOnlinePostsNavigation() {
  return queryCollectionNavigation('posts').where('status', '=', 'online')
}

export function queryOnlinePostsSearchSections() {
  return queryCollectionSearchSections('posts').where('status', '=', 'online')
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
