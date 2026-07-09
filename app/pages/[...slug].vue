<script setup lang="ts">
import type { PagesCollectionItem } from '@nuxt/content'
import { computed } from 'vue'
import { createError, defineOgImage, queryCollection, useAsyncData, useRoute, useSeoMeta } from '#imports'

definePageMeta({
  validate(route) {
    if (route.path.startsWith('/_')) {
      return false
    }

    const slug = route.params.slug
    const segments = (Array.isArray(slug) ? slug : slug ? [slug] : []).map(String)
    return segments.length > 0 && !segments.some(segment => segment.startsWith('_'))
  }
})

const route = useRoute()

const { data: page } = await useAsyncData<PagesCollectionItem | null>(`page-${route.path}`, () =>
  queryCollection('pages').path(route.path).first()
)

if (!page.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page not found',
    fatal: true
  })
}

const pageData = computed(() => page.value as PagesCollectionItem)
const title = computed(() => pageData.value.title)

useSeoMeta({
  title,
  ogTitle: title
})

defineOgImage('Default', {
  title: pageData.value.title,
  description: ''
})
</script>

<template>
  <UPage>
    <Appear>
      <UPageSection :ui="{ container: 'p-8! pt-24! max-w-4xl' }">
        <h1 class="mx-auto max-w-2xl text-pretty text-center text-3xl font-bold">
          {{ pageData.title }}
        </h1>

        <div class="prose dark:prose-invert mx-auto mt-6 max-w-none">
          <ContentRenderer
            v-if="pageData.body"
            :value="pageData"
          />
        </div>
      </UPageSection>
    </Appear>
  </UPage>
</template>
