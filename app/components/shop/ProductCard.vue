<script setup lang="ts">
import type { ProductsCollectionItem } from '@nuxt/content'

defineProps<{
  product: ProductsCollectionItem
  categoryLabel?: string
}>()

const { formatPrice } = useFormatPrice()
</script>

<template>
  <div class="group relative flex h-full flex-col overflow-hidden rounded-2xl">
    <span
      class="pointer-events-none absolute inset-0 origin-top scale-y-0 rounded-2xl bg-primary/10 transition-transform duration-300 ease-out group-hover:scale-y-100 dark:bg-white/10"
      aria-hidden="true"
    />

    <NuxtLink
      :to="product.path"
      class="relative flex flex-1 flex-col"
    >
      <div class="relative aspect-square w-full overflow-hidden">
        <NuxtImg
          v-if="product.image"
          :src="product.image"
          :alt="product.title"
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
        <h2 class="line-clamp-2 min-h-12 text-lg font-bold leading-snug text-highlighted">
          {{ product.title }}
        </h2>
        <p
          v-if="product.description"
          class="line-clamp-3 text-sm leading-relaxed text-muted"
        >
          {{ product.description }}
        </p>
        <p
          v-if="formatPrice(product.price)"
          class="text-sm font-medium text-primary"
        >
          {{ formatPrice(product.price) }}
        </p>
      </div>
    </NuxtLink>

    <div class="relative z-10 flex flex-col gap-2 px-4 pb-4">
      <UButton
        :to="product.path"
        label="View product"
        color="primary"
        variant="soft"
        block
        icon="i-lucide-arrow-right"
        :ui="{ base: 'text-sm' }"
      />
      <UButton
        v-if="product.checkout_url"
        :to="product.checkout_url"
        label="View on Organotest"
        color="neutral"
        variant="outline"
        block
        :target="product.checkout_url.startsWith('http') ? '_blank' : undefined"
        :rel="product.checkout_url.startsWith('http') ? 'noopener noreferrer' : undefined"
        icon="i-lucide-external-link"
        :ui="{ base: 'text-sm' }"
      />
    </div>
  </div>
</template>
