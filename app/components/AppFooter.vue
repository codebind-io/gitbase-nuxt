<script setup lang="ts">
import type { SettingsCollectionItem } from '@nuxt/content'
import { toWhatsappHref } from '../utils/whatsapp'

const { footer } = useAppConfig()
const { data: settings } = useNuxtData<SettingsCollectionItem | null>('settings')

const footerLinks = computed(() =>
  settings.value?.footer?.links?.filter(link => link.label?.trim() && link.to?.trim()) ?? []
)

const socialLinks = computed(() => {
  const social = settings.value?.social
  if (!social) {
    return []
  }

  return [
    { key: 'facebook', label: 'Facebook', icon: 'i-simple-icons-facebook', url: social.facebook },
    { key: 'instagram', label: 'Instagram', icon: 'i-simple-icons-instagram', url: social.instagram },
    { key: 'x', label: 'X', icon: 'i-simple-icons-x', url: social.x },
    { key: 'whatsapp', label: 'WhatsApp', icon: 'i-simple-icons-whatsapp', url: social.whatsapp }
  ]
    .filter(link => link.url?.trim())
    .map(link => ({
      ...link,
      url: link.key === 'whatsapp' ? toWhatsappHref(link.url) : link.url!.trim()
    }))
    .filter(link => link.url)
})
</script>

<template>
  <UFooter
    class="z-10 bg-default"
    :ui="{
      container: 'overflow-x-clip py-8 lg:py-4 lg:flex lg:items-center lg:justify-between lg:gap-x-3',
      left: 'text-muted text-xs text-center lg:text-start',
      right: 'w-full max-w-full flex flex-wrap items-center justify-center gap-x-2 gap-y-1 lg:flex-1 lg:justify-end'
    }"
  >
    <template #left>
      <div class="flex items-center gap-3">
        <span>{{ footer.credits }}</span>
        <a
          href="https://gitbase.cloud"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex opacity-70 transition-opacity hover:opacity-100"
          aria-label="CodeBind"
        >
          <img
            src="/gitbase-logo.svg"
            alt=""
            class="h-4 w-auto dark:hidden"
          >
          <img
            src="/gitbase-logo.svg"
            alt=""
            class="hidden h-4 w-auto dark:block"
          >
        </a>
      </div>
    </template>

    <template #right>
      <div class="flex max-w-full flex-wrap items-center justify-center gap-1">
        <UButton
          v-for="(link, index) in footerLinks"
          :key="`${link.to}-${index}`"
          :label="link.label"
          :to="link.to"
          size="xs"
          color="neutral"
          variant="ghost"
        />
        <UButton
          v-for="link in socialLinks"
          :key="link.key"
          :to="link.url"
          target="_blank"
          rel="noopener noreferrer"
          :icon="link.icon"
          :aria-label="link.label"
          size="xs"
          color="neutral"
          variant="ghost"
        />
      </div>
    </template>
  </UFooter>
</template>
