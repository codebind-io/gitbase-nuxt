import type { CategoriesCollectionItem } from '@nuxt/content'

type CategoryItem = { slug: string, title: string, description?: string, icon?: string }

/** Join catch-all route param into a category path (e.g. `weaving` or `weaving/totes`). */
export function resolveCategoryPath(slug: string | string[] | undefined): string {
  if (slug == null || slug === '') return ''
  return Array.isArray(slug) ? slug.join('/') : slug
}

async function loadCategories() {
  return queryCollection('categories').first()
}

export function useShopCategories() {
  return useAsyncData('shop-categories', async () => {
    const categories = await loadCategories()
    return categories?.shop_categories ?? []
  })
}

export function usePostCategories() {
  return useAsyncData('post-categories', async () => {
    const categories = await loadCategories()
    return categories?.blog_categories ?? []
  })
}

export function useShopCategoryBySlug(path: string) {
  return useAsyncData(`shop-category-${path}`, async () => {
    const categories = await loadCategories()
    return categories?.shop_categories?.find(c => c.slug === path) ?? null
  })
}

export function usePostCategoryBySlug(path: string) {
  return useAsyncData(`post-category-${path}`, async () => {
    const categories = await loadCategories()
    return categories?.blog_categories?.find(c => c.slug === path) ?? null
  })
}

export function categoryTitle(
  categories: CategoryItem[] | CategoriesCollectionItem['shop_categories'] | CategoriesCollectionItem['blog_categories'] | null | undefined,
  slug: string | undefined
) {
  if (!slug) return ''
  return categories?.find(c => c.slug === slug)?.title ?? slug
}
