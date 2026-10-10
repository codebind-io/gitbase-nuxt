<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { getThemeNeutralShade } from '~/utils/theme'

const colorMode = useColorMode()

const { data: settings } = await useSettings()

const { htmlStyle: themeStyle, fontHref: themeFontHref } = useApplyThemeSettings(settings)

const colorModeCookie = useCookie<string | null>('nuxt-color-mode')

const navLinks = computed<NavigationMenuItem[]>(() =>
  settings.value?.navbar?.nav_items?.map(item => ({
    label: item.label,
    to: item.to
  })) ?? []
)

watch(
  () => settings.value?.theme?.dark_mode,
  (enabled) => {
    if (enabled === undefined) return

    const saved = colorModeCookie.value
    if (saved === 'light' || saved === 'dark') return
    if (colorMode.preference !== 'system') return

    colorMode.preference = enabled ? 'dark' : 'light'
  },
  { immediate: true }
)

const color = computed(() => {
  if (colorMode.value !== 'dark') return 'white'

  return getThemeNeutralShade(settings.value?.theme?.neutral, 950) ?? '#020618'
})

const favicon = computed(() => settings.value?.site?.favicon || '/favicon.svg')

useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color }
  ],
  link: [
    computed(() => ({ key: 'favicon', rel: 'icon' as const, href: favicon.value })),
    computed(() => themeFontHref.value
      ? { key: 'theme-font', rel: 'stylesheet' as const, href: themeFontHref.value }
      : undefined)
  ],
  htmlAttrs: {
    lang: 'fr',
    style: themeStyle
  }
})

useSeoMeta({
  titleTemplate: '%s',
  twitterCard: 'summary_large_image'
})

useKeywords(() => settings.value?.seo?.keywords?.join(', '))

const [{ data: navigation }, { data: files }] = await Promise.all([
  useAsyncData('navigation', () => queryOnlinePostsNavigation()),
  useLazyAsyncData('search', () => queryOnlinePostsSearchSections(), {
    server: false
  })
])
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <UMain class="relative overflow-x-clip">
        <NuxtPage />
      </UMain>
    </NuxtLayout>

    <ClientOnly>
      <LazyUContentSearch
        :files="files"
        :navigation="navigation"
        shortcut="meta_k"
        :links="navLinks"
        :fuse="{ resultLimit: 42 }"
      />
    </ClientOnly>
  </UApp>
</template>
