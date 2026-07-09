<script setup lang="ts">
const route = useRoute()
const categoryPath = resolveCategoryPath(route.params.slug)

const [{ data: category }, { data: categories }, { data: products }] = await Promise.all([
  useShopCategoryBySlug(categoryPath),
  useShopCategories(),
  useAsyncData(`products-${categoryPath}`, () =>
    queryOnlineProducts().where('category', '=', categoryPath).order('title', 'ASC').all()
  )
])

if (!category.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Category not found',
    fatal: true
  })
}

const categoryData = category.value
const title = categoryData.title
const description = categoryData.description || `Browse our ${title.toLowerCase()}.`

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
        <header class="mb-6 space-y-3">
          <div
            v-if="categoryData.icon"
            class="flex items-center gap-3"
          >
            <UIcon
              :name="categoryData.icon"
              class="size-8 shrink-0 text-primary"
            />
            <h1 class="text-3xl font-semibold text-highlighted sm:text-4xl">
              {{ categoryData.title }}
            </h1>
          </div>
          <h1
            v-else
            class="text-3xl font-semibold text-highlighted sm:text-4xl"
          >
            {{ categoryData.title }}
          </h1>
          <p
            v-if="categoryData.description"
            class="max-w-2xl text-muted"
          >
            {{ categoryData.description }}
          </p>
        </header>
      </Appear>

      <Appear :delay="0.05">
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
        No products in this category yet.
      </p>
    </UPageSection>
  </UPage>
</template>
