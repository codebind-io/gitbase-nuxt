import type { SettingsCollectionItem } from '@nuxt/content'

export function queryOnlineProducts() {
  return queryCollection('products').where('status', '=', 'online')
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
