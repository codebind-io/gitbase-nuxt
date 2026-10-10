import type { CategoriesCollectionItem } from '@nuxt/content'

type CategoryItem = { slug: string, title: string, description?: string, icon?: string }

/** Join catch-all route param into a category path (e.g. `weaving` or `weaving/totes`). */
export function resolveCategoryPath(slug: string | string[] | undefined): string {
  if (slug == null || slug === '') return ''
  return Array.isArray(slug) ? slug.join('/') : slug
}

function useCategories() {
  return useAsyncData('categories', () =>
    queryContent<CategoriesCollectionItem | null>({ collection: 'categories', first: true })
  )
}

export async function useShopCategories() {
  const { data } = await useCategories()

  return {
    data: computed(() => data.value?.shop_categories ?? [])
  }
}

export async function usePostCategories() {
  const { data } = await useCategories()

  return {
    data: computed(() => data.value?.blog_categories ?? [])
  }
}

export async function useShopCategoryBySlug(path: string) {
  const { data } = await useCategories()

  return {
    data: computed(() => data.value?.shop_categories?.find(c => c.slug === path) ?? null)
  }
}

export async function usePostCategoryBySlug(path: string) {
  const { data } = await useCategories()

  return {
    data: computed(() => data.value?.blog_categories?.find(c => c.slug === path) ?? null)
  }
}

export function categoryTitle(
  categories: CategoryItem[] | CategoriesCollectionItem['shop_categories'] | CategoriesCollectionItem['blog_categories'] | null | undefined,
  slug: string | undefined
) {
  if (!slug) return ''
  return categories?.find(c => c.slug === slug)?.title ?? slug
}
