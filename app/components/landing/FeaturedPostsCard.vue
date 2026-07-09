<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  to: string
  title: string
  description?: string
  image: string
  categoryLabel?: string
  date?: string | Date
  featured?: boolean
}>(), {
  featured: false
})

const postDate = computed(() => {
  if (!props.date) return new Date()
  return props.date instanceof Date ? props.date : new Date(props.date as string)
})

const timeAgo = computed(() => {
  try {
    const now = Date.now()
    const diffSec = Math.floor((now - postDate.value.getTime()) / 1000)
    if (diffSec < 60) return `${diffSec}s`
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`
    return `${Math.floor(diffSec / 86400)}d`
  } catch {
    return ''
  }
})
</script>

<template>
  <NuxtLink
    :to="to"
    class="group relative block overflow-hidden rounded-2xl ring-1 ring-default"
    :class="featured ? 'min-h-72 sm:min-h-96' : 'min-h-52 sm:min-h-56'"
  >
    <img
      :src="image"
      :alt="title"
      class="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
      loading="lazy"
    >

    <div
      class="absolute inset-0 bg-linear-to-t from-black/80 via-black/35 to-black/10 transition-colors duration-300 group-hover:from-black/90 group-hover:via-black/70 group-hover:to-black/45"
    />

    <div
      class="relative flex h-full min-h-[inherit] flex-col justify-end gap-2 p-5 sm:p-6 text-center md:text-left text-white"
    >
      <UBadge
        v-if="categoryLabel"
        color="neutral"
        variant="subtle"
        size="sm"
        class="mx-auto md:mx-0 w-fit bg-black/45 text-white ring-1 ring-white/20 backdrop-blur-sm"
      >
        {{ categoryLabel }}
      </UBadge>

      <h3
        class="font-semibold text-balance"
        :class="featured ? 'text-2xl sm:text-3xl lg:text-4xl' : 'text-lg sm:text-xl'"
      >
        {{ title }}
      </h3>

      <p
        v-if="description"
        class="line-clamp-2 text-sm text-white/85 sm:text-base"
      >
        {{ description }}
      </p>

      <p
        v-if="date"
        class="text-xs text-white/70"
      >
        {{ timeAgo }}
      </p>
    </div>
  </NuxtLink>
</template>
