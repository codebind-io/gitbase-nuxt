<script setup lang="ts">
type CategoryItem = { slug: string, title: string }

const props = defineProps<{
  basePath: '/posts' | '/products'
  categories: CategoryItem[]
}>()

const route = useRoute()

const ariaLabel = computed(() =>
  props.basePath === '/posts' ? 'Post categories' : 'Product categories'
)

const isAllActive = computed(() => route.path === props.basePath)

function isCategoryActive(slug: string) {
  return route.path === `${props.basePath}/category/${slug}`
}

const pillClass = (active: boolean) => [
  'rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300',
  active
    ? 'bg-neutral-950 text-white shadow-sm dark:bg-white dark:text-neutral-950'
    : 'bg-muted/60 text-muted hover:bg-primary/10 hover:text-primary'
]
</script>

<template>
  <nav
    v-if="categories.length"
    class="flex flex-wrap gap-2"
    :aria-label="ariaLabel"
  >
    <NuxtLink
      :to="basePath"
      :class="pillClass(isAllActive)"
    >
      All
    </NuxtLink>
    <NuxtLink
      v-for="category in categories"
      :key="category.slug"
      :to="`${basePath}/category/${category.slug}`"
      :class="pillClass(isCategoryActive(category.slug))"
    >
      {{ category.title }}
    </NuxtLink>
  </nav>
</template>
