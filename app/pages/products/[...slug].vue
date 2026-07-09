<script setup lang="ts">
const route = useRoute()
const { formatPrice } = useFormatPrice()

const [{ data: product }, { data: categories }] = await Promise.all([
  useAsyncData(route.path, () => queryOnlineProducts().path(route.path).first()),
  useShopCategories()
])

const { data: relatedProducts } = await useAsyncData(
  `related-products-${route.path}`,
  async () => {
    const category = product.value?.category
    if (!category) return []

    const items = await queryOnlineProducts().where('category', '=', category).order('title', 'ASC').all()

    return items.filter(item => item.path !== route.path && item.category === category)
  }
)

if (!product.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Product not found',
    fatal: true
  })
}

const page = product.value

const categoryLabel = computed(() =>
  page.category ? categoryTitle(categories.value, page.category) : ''
)

const title = page.seo?.title || page.title
const description = page.seo?.description || page.description
const keywords = page.tags?.join(', ')

useSeoMeta({
  title,
  description,
  ogDescription: description,
  ogTitle: title,
  keywords
})

if (page.image) {
  useSeoMeta({ ogImage: page.image })
} else {
  defineOgImage('Default', {
    title,
    description,
    headline: 'Products'
  })
}

const checkoutUrl = computed(() => product.value?.checkout_url?.trim() || '')
</script>

<template>
  <UMain class="mt-20 px-2">
    <UContainer class="relative min-h-screen">
      <UPage>
        <Appear>
          <ULink
            to="/products"
            class="text-sm flex items-center gap-1"
          >
            <UIcon name="lucide:chevron-left" />
            Products
          </ULink>
        </Appear>

        <div class="mt-8">
          <div class="mx-auto flex max-w-5xl flex-col gap-8">
            <Appear :delay="0.1">
              <div class="grid grid-cols-1 gap-8 md:grid-cols-2 md:items-start md:gap-10">
                <div
                  v-if="page.image"
                  class="min-w-0 w-full overflow-hidden rounded-2xl aspect-square"
                >
                  <NuxtImg
                    :src="page.image"
                    :alt="page.title"
                    class="size-full object-cover"
                  />
                </div>

                <div class="flex min-w-0 flex-col gap-4 md:pt-2">
                  <div class="flex flex-wrap items-center gap-2">
                    <UButton
                      v-if="page.category"
                      :to="`/products/category/${page.category}`"
                      :label="categoryLabel"
                      size="sm"
                      color="neutral"
                      variant="subtle"
                    />
                    <span
                      v-if="formatPrice(page.price)"
                      class="text-lg font-semibold text-primary"
                    >
                      {{ formatPrice(page.price) }}
                    </span>
                  </div>

                  <h1 class="text-3xl font-bold text-highlighted lg:text-4xl">
                    {{ page.title }}
                  </h1>

                  <p
                    v-if="page.description"
                    class="text-muted"
                  >
                    {{ page.description }}
                  </p>

                  <div
                    v-if="page.tags?.length"
                    class="flex flex-wrap gap-2"
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

                  <div class="mt-2 flex flex-col gap-2 md:flex-row md:flex-wrap">
                    <UButton
                      to="/products"
                      label="Browse products"
                      color="primary"
                      icon="i-lucide-shopping-bag"
                      class="w-full md:w-auto"
                      :ui="{ base: 'justify-center px-6 py-4 transition-transform duration-300 ease-out hover:scale-[1.02] active:scale-[0.98] md:justify-start' }"
                    />
                    <UButton
                      v-if="checkoutUrl"
                      :to="checkoutUrl"
                      label="View on Organotest"
                      color="neutral"
                      variant="outline"
                      icon="i-lucide-external-link"
                      class="w-full md:w-auto"
                      :ui="{ base: 'justify-center px-6 py-4 transition-transform duration-300 ease-out hover:scale-[1.02] active:scale-[0.98] md:justify-start' }"
                      :target="checkoutUrl.startsWith('http') ? '_blank' : undefined"
                      :rel="checkoutUrl.startsWith('http') ? 'noopener noreferrer' : undefined"
                    />
                  </div>
                </div>
              </div>
            </Appear>

            <Appear :delay="0.2">
              <UPageSection
                :ui="{ container: 'p-0! max-w-none prose dark:prose-invert mx-auto max-w-3xl' }"
              >
                <ContentRenderer
                  v-if="page.body"
                  :value="page"
                />
              </UPageSection>
            </Appear>
          </div>
        </div>

        <section
          v-if="relatedProducts?.length"
          class="mt-16 border-t border-default pt-12"
        >
          <Appear>
            <h2 class="mb-6 text-2xl font-semibold text-highlighted">
              More in {{ categoryLabel }}
            </h2>
          </Appear>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Appear
              v-for="(related, index) in relatedProducts"
              :key="related.path"
              class="h-full"
              :index="index"
              :stagger="0.04"
              :max-delay="0.16"
            >
              <ShopProductCard
                :product="related"
                :category-label="categoryLabel"
              />
            </Appear>
          </div>
        </section>
      </UPage>
    </UContainer>
  </UMain>
</template>
