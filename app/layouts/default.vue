<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import type { SettingsCollectionItem } from '@nuxt/content'

const { data: settings } = useNuxtData<SettingsCollectionItem | null>('settings')

const links = computed<NavigationMenuItem[]>(() =>
  settings.value?.navbar?.nav_items?.map((item: { label: string, to: string }) => ({
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
</script>

<template>
  <div class="overflow-x-clip">
    <UContainer class="sm:border-x border-default pt-10">
      <AppHeader
        :links="links"
        :hide-on-scroll="hideNavbarOnScroll"
        :show-darkmode-switch="showDarkmodeSwitch"
        :cta="navbarCta"
      />
      <slot />
      <AppFooter />
    </UContainer>
    <AppQuickContact />
  </div>
</template>
