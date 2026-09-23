import type { ProductsCollectionItem, SettingsCollectionItem } from '@nuxt/content'

type ProductQuery = {
  path?: string
  category?: string
  featured?: boolean
  order?: ContentOrder
  first?: boolean
}

function onlineProducts(options: ProductQuery = {}) {
  const where: ContentWhere[] = [{ field: 'status', value: 'online' }]

  if (options.category) {
    where.push({ field: 'category', value: options.category })
  }

  if (options.featured != null) {
    where.push({ field: 'featured', value: options.featured })
  }

  return queryContent<ProductsCollectionItem[] | ProductsCollectionItem | null>({
    collection: 'products',
    where,
    path: options.path,
    order: options.order,
    first: options.first
  })
}

export function queryOnlineProducts(options: ProductQuery & { first: true }): Promise<ProductsCollectionItem | null>
export function queryOnlineProducts(options?: ProductQuery): Promise<ProductsCollectionItem[]>
export function queryOnlineProducts(options: ProductQuery = {}) {
  return onlineProducts(options) as Promise<ProductsCollectionItem[] | ProductsCollectionItem | null>
}

export function useFormatPrice() {
  const { data: settings } = useNuxtData<SettingsCollectionItem | null>('settings')

  const currencySymbol = computed(() => settings.value?.shop?.currency_symbol?.trim() || '€')

  function formatPrice(price?: number | null) {
    if (price == null) return null
    return `${currencySymbol.value}${price.toFixed(0)}`
  }

  return { formatPrice, currencySymbol }
}
