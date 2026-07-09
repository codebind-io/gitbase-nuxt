<script setup lang="ts">
const route = useRoute()
const { data: page } = await useAsyncData(route.path, () => queryOnlinePosts().path(route.path).first())
if (!page.value) throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })

const { data: categories } = await usePostCategories()
const categoryLabel = computed(() => categoryTitle(categories.value, page.value!.category))

const { data: surround } = await useAsyncData(`${route.path}-surround`, () =>
  queryCollectionItemSurroundings('posts', route.path, {
    fields: ['description']
  }).where('status', '=', 'online')
)

const title = page.value?.seo?.title || page.value?.title
const description = page.value?.seo?.description || page.value?.description
const keywords = page.value?.tags?.join(', ')

useSeoMeta({
  title,
  description,
  ogDescription: description,
  ogTitle: title,
  keywords
})

if (page.value.image) {
  useSeoMeta({ ogImage: page.value.image })
} else {
  defineOgImage('Default', {
    title,
    description,
    headline: 'Posts'
  })
}

const articleLink = computed(() => `${window?.location}`)

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<template>
  <UMain class="mt-20 px-2">
    <UContainer class="relative min-h-screen">
      <UPage v-if="page">
        <Appear>
          <ULink
            to="/posts"
            class="text-sm flex items-center gap-1"
          >
            <UIcon name="lucide:chevron-left" />
            Posts
          </ULink>
        </Appear>
        <Appear :delay="0.1">
          <div class="flex flex-col gap-3 mt-8">
            <div class="flex text-xs text-muted items-center justify-center gap-2">
              <span v-if="page.date">
                {{ formatDate(page.date) }}
              </span>
              <span v-if="page.category">·</span>
              <ULink
                v-if="page.category"
                :to="`/posts/category/${page.category}`"
                class="hover:text-default transition-colors"
              >
                {{ categoryLabel }}
              </ULink>
            </div>
            <NuxtImg
              v-if="page.image"
              :src="page.image"
              :alt="page.title"
              class="rounded-lg w-full h-[300px] object-cover object-center"
            />
            <h1 class="text-4xl text-center font-bold text-highlighted max-w-3xl mx-auto mt-4">
              {{ page.title }}
            </h1>
            <p class="text-muted text-center max-w-2xl mx-auto">
              {{ page.description }}
            </p>
            <div
              v-if="page.tags?.length"
              class="flex flex-wrap items-center justify-center gap-2 mt-2"
            >
              <UBadge
                v-for="tag in page.tags"
                :key="tag"
                color="neutral"
                variant="subtle"
                size="sm"
              >
                {{ tag }}
              </UBadge>
            </div>
          </div>
        </Appear>
        <Appear :delay="0.2">
          <UPageBody class="max-w-3xl mx-auto">
            <ContentRenderer
              v-if="page.body"
              :value="page"
            />

            <div class="flex items-center justify-end">
              <CopyLinkButton :text="articleLink" />
            </div>
            <UContentSurround :surround />
          </UPageBody>
        </Appear>
      </UPage>
    </UContainer>
  </UMain>
</template>
