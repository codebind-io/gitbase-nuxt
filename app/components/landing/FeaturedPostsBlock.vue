<script setup lang="ts">
import type {
  BlockFeaturedPostsCollectionItem,
  PostsCollectionItem,
  CategoriesCollectionItem
} from '@nuxt/content'

type PostCategory = NonNullable<CategoriesCollectionItem['blog_categories']>[number]

const POSTS_LIMIT = 12

const props = defineProps<{
  featuredPosts: BlockFeaturedPostsCollectionItem
  posts: PostsCollectionItem[]
  postCategories: PostCategory[]
}>()

function categoryLabel(slug: string | undefined) {
  return categoryTitle(props.postCategories, slug)
}

function toFeaturedCard(post: PostsCollectionItem) {
  return {
    to: post.path,
    title: post.title,
    description: post.description,
    image: post.image ?? '',
    categoryLabel: categoryLabel(post.category),
    date: post.date
  }
}

const featuredPost = computed(() =>
  findPostBySlug(props.posts, props.featuredPosts.featured)
)

const gridPosts = computed(() => {
  if (!featuredPost.value) {
    return props.posts
  }

  return props.posts.filter(post => post.path !== featuredPost.value!.path)
})

const showAllPosts = ref(false)

const visibleGridPosts = computed(() =>
  showAllPosts.value
    ? gridPosts.value
    : gridPosts.value.slice(0, POSTS_LIMIT)
)

const hasMorePosts = computed(() =>
  !showAllPosts.value && gridPosts.value.length > POSTS_LIMIT
)

const featuredCard = computed(() =>
  featuredPost.value ? toFeaturedCard(featuredPost.value) : null
)

function loadMore() {
  showAllPosts.value = true
}
</script>

<template>
  <div
    v-if="featuredCard || visibleGridPosts.length"
    class="flex flex-col gap-4 lg:gap-6"
  >
    <LandingFeaturedPostsCard
      v-if="featuredCard"
      v-bind="featuredCard"
      featured
      class="w-full"
    />

    <div
      v-if="visibleGridPosts.length"
      class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <PostsPostCard
        v-for="post in visibleGridPosts"
        :key="post.path"
        :post="post"
        :category-label="categoryLabel(post.category)"
      />
    </div>

    <div
      v-if="hasMorePosts"
      class="flex justify-center pt-4"
    >
      <UButton
        color="neutral"
        variant="soft"
        size="md"
        icon="i-lucide-plus"
        class="rounded-full px-6 font-medium"
        @click="loadMore"
      >
        Load more
      </UButton>
    </div>
  </div>
</template>
