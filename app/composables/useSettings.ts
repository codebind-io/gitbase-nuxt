import type { SettingsCollectionItem } from '@nuxt/content'

export function useSettings() {
  return useAsyncData('settings', () =>
    queryContent<SettingsCollectionItem | null>({ collection: 'settings', first: true })
  )
}
