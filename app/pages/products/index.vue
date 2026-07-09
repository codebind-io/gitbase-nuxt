<script setup lang="ts">
const title = 'Products'
const description = 'Advanced wellbeing technologies from Organotest — quantum medicine, bioresonance and complementary devices for holistic practitioners.'

const [{ data: categories }, { data: products }] = await Promise.all([
  useShopCategories(),
  useAsyncData('products-list', () => queryOnlineProducts().order('title', 'ASC').all())
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
          base-path="/products"
          :categories="categories"
          class="mb-6"
        />
      </Appear>

      <div
        v-if="products?.length"
        class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <Appear
          v-for="(product, index) in products"
          :key="product.path"
          class="h-full"
          :index="index"
          :stagger="0.04"
          :max-delay="0.16"
        >
          <ShopProductCard
            :product="product"
            :category-label="categoryTitle(categories, product.category)"
          />
        </Appear>
      </div>
      <p
        v-else
        class="text-muted text-center py-12"
      >
        No products yet.
      </p>
    </UPageSection>
  </UPage>
</template>
