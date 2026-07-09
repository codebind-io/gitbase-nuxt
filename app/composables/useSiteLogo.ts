import type { SettingsCollectionItem } from '@nuxt/content'

export function useSiteLogo() {
  const colorMode = useColorMode()
  const { data: settings } = useNuxtData<SettingsCollectionItem | null>('settings')

  return computed(() => {
    const { logo_light, logo_dark } = settings.value?.site ?? {}

    if (colorMode.value === 'dark') {
      return logo_dark || logo_light || '/logo-default.svg'
    }

    return logo_light || logo_dark || '/logo-default.svg'
  })
}
