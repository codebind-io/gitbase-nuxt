<script setup lang="ts">
import type { NuxtError } from '#app'
import type { NavigationMenuItem } from '@nuxt/ui'
import type { SettingsCollectionItem } from '@nuxt/content'

defineProps({
  error: {
    type: Object as PropType<NuxtError>,
    required: true
  }
})

const { data: settings } = useNuxtData<SettingsCollectionItem | null>('settings')

const navLinks = computed<NavigationMenuItem[]>(() =>
  settings.value?.navbar?.nav_items?.map(item => ({
    label: item.label,
    to: item.to
  })) ?? []
)

const hideNavbarOnScroll = computed(() => settings.value?.navbar?.hide_on_scroll ?? false)

const showDarkmodeSwitch = computed(() => settings.value?.navbar?.show_darkmode_switch ?? true)

const navbarCta = computed(() => {
  const cta = settings.value?.navbar?.cta
  if (!cta?.label?.trim() || !cta?.url?.trim()) {
    return null
  }

  return cta
})

useHead({
  htmlAttrs: {
    lang: 'en'
  }
})

useSeoMeta({
  title: 'Page not found',
  description: 'We are sorry but this page could not be found.'
})

const [{ data: navigation }, { data: files }] = await Promise.all([
  useAsyncData('navigation', () => {
    return Promise.all([
      queryOnlinePostsNavigation()
    ])
  }, {
    transform: data => data.flat()
  }),
  useLazyAsyncData('search', () => {
    return Promise.all([
      queryOnlinePostsSearchSections()
    ])
  }, {
    server: false,
    transform: data => data.flat()
  })
])
</script>

<template>
  <div>
    <AppHeader
      :links="navLinks"
      :hide-on-scroll="hideNavbarOnScroll"
      :show-darkmode-switch="showDarkmodeSwitch"
      :cta="navbarCta"
    />

    <UMain>
      <UContainer>
        <UPage>
          <UError :error="error" />
        </UPage>
      </UContainer>
    </UMain>

    <AppFooter />

    <ClientOnly>
      <LazyUContentSearch
        :files="files"
        shortcut="meta_k"
        :navigation="navigation"
        :links="navLinks"
        :fuse="{ resultLimit: 42 }"
      />
    </ClientOnly>

    <UToaster />
  </div>
</template>
