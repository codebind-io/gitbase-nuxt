<script setup lang="ts">
import { computed } from 'vue'
import type { PostsCollectionItem } from '@nuxt/content'

const props = defineProps<{
  post: PostsCollectionItem
  categoryLabel?: string
}>()

const postDate = computed(() => {
  const date = props.post.date ?? new Date()
  return new Date(date as any)
})

const timeAgo = computed(() => {
  try {
    const now = Date.now()
    const diffSec = Math.floor((now - postDate.value.getTime()) / 1000)
    if (diffSec < 60) return `${diffSec}s`
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d`
    return postDate.value.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return ''
  }
})
</script>

<template>
  <div class="group relative flex h-full flex-col overflow-hidden rounded-2xl">
    <span
      class="pointer-events-none absolute inset-0 origin-top scale-y-0 rounded-2xl bg-primary/10 transition-transform duration-300 ease-out group-hover:scale-y-100 dark:bg-white/10"
      aria-hidden="true"
    />

    <NuxtLink
      :to="post.path"
      class="relative flex flex-1 flex-col"
    >
      <div class="relative aspect-4/3 w-full overflow-hidden">
        <NuxtImg
          v-if="post.image"
          :src="post.image"
          :alt="post.title"
          class="absolute -inset-px size-[calc(100%+2px)] max-w-none object-cover transition-transform duration-300 ease-out will-change-transform group-hover:scale-105"
        />
        <span
          v-if="categoryLabel"
          class="absolute bottom-3 left-3 z-10 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm"
        >
          {{ categoryLabel }}
        </span>
      </div>

      <div class="relative z-10 flex flex-col gap-2 p-4">
        <h2 class="text-lg font-bold leading-snug text-highlighted">
          {{ post.title }}
        </h2>
        <p
          v-if="post.description"
          class="line-clamp-3 text-sm leading-relaxed text-muted"
        >
          {{ post.description }}
        </p>
        <p
          v-if="post.date"
          class="text-xs text-muted"
        >
          {{ timeAgo }}
        </p>
      </div>
    </NuxtLink>
  </div>
</template>
