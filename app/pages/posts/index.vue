<script setup lang="ts">
const title = 'Posts'
const description = 'Latest news and updates.'

const [{ data: posts }, { data: categories }] = await Promise.all([
  useAsyncData('posts-index', () => queryOnlinePosts().order('date', 'DESC').all()),
  usePostCategories()
])

useSeoMeta({
  title,
  ogTitle: title,
  description,
  ogDescription: description
})

defineOgImage('Default', { title, description })
</script>

<template>
  <UPage>
    <UPageSection :ui="{ container: 'pt-0 max-w-6xl' }">
      <Appear>
        <CategoryNav
          v-if="categories?.length"
          base-path="/posts"
          :categories="categories"
          class="mb-6"
        />
      </Appear>

      <div
        v-if="posts?.length"
        class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <Appear
          v-for="(post, index) in posts"
          :key="post.path"
          :index="index"
          :stagger="0.04"
          :max-delay="0.16"
        >
          <PostsPostCard
            :post="post"
            :category-label="categoryTitle(categories, post.category)"
          />
        </Appear>
      </div>
      <p
        v-else
        class="text-muted text-center py-12"
      >
        No posts yet.
      </p>
    </UPageSection>
  </UPage>
</template>
