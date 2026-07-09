<script setup lang="ts">
import type {
  BlockFeaturedProductsCollectionItem,
  ProductsCollectionItem
} from '@nuxt/content'

const props = defineProps<{
  block: BlockFeaturedProductsCollectionItem
  products: ProductsCollectionItem[]
}>()

const { frameClass, imageClass } = useCarouselImageDisplay(
  computed(() => props.block.cover_image),
  { hover: true }
)

const carouselUi = computed(() => {
  const columns = props.block.columns_visible
  return {
    item: carouselVisibleColumnsClass(
      columns?.mobile ?? 1,
      columns?.tablet ?? 2,
      columns?.desktop ?? 3
    ),
    prev: 'z-20 sm:start-8',
    next: 'z-20 sm:end-8',
    container: '-ms-3 sm:-ms-4'
  }
})
</script>

<template>
  <div
    v-if="products.length"
    class="relative"
  >
    <UCarousel
      v-slot="{ item }"
      loop
      arrows
      :autoplay="{ delay: 2000 }"
      wheel-gestures
      :prev="{ variant: 'solid' }"
      :next="{ variant: 'solid' }"
      :items="products"
      :ui="carouselUi"
    >
      <NuxtLink
        :to="item.path"
        class="group block h-full overflow-hidden rounded-2xl"
      >
        <div
          v-if="item.image"
          :class="frameClass"
        >
          <NuxtImg
            :src="item.image"
            :alt="item.title"
            :class="imageClass"
            loading="lazy"
          />
        </div>
      </NuxtLink>
    </UCarousel>

    <div
      class="pointer-events-none absolute inset-y-0 inset-s-0 z-10 w-14 bg-linear-to-r from-default via-(--ui-bg)/40 to-transparent sm:w-24 lg:w-32"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute inset-y-0 inset-e-0 z-10 w-14 bg-linear-to-l from-default via-(--ui-bg)/40 to-transparent sm:w-24 lg:w-32"
      aria-hidden="true"
    />
  </div>
</template>
