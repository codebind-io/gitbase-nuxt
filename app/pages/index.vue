<script setup lang="ts">
import type {
  BlockCarouselCollectionItem,
  BlockFeaturedPostsCollectionItem,
  BlockFeaturedProductsCollectionItem,
  BlockSimpleBlockCollectionItem,
  BlockSimpleHeroCollectionItem,
  SettingsCollectionItem
} from '@nuxt/content'

const [
  { data: simpleHero },
  { data: simpleBlock },
  { data: carousel },
  { data: featuredProducts },
  { data: featuredProductItems },
  { data: featuredPosts },
  { data: posts },
  { data: postCategories }
] = await Promise.all([
  useAsyncData('block-simple-hero', () => queryContent<BlockSimpleHeroCollectionItem | null>({ collection: 'blockSimpleHero', first: true })),
  useAsyncData('block-simple-block', () => queryContent<BlockSimpleBlockCollectionItem | null>({ collection: 'blockSimpleBlock', first: true })),
  useAsyncData('block-carousel', () => queryContent<BlockCarouselCollectionItem | null>({ collection: 'blockCarousel', first: true })),
  useAsyncData('block-featured-products', () => queryContent<BlockFeaturedProductsCollectionItem | null>({ collection: 'blockFeaturedProducts', first: true })),
  useAsyncData('featured-products', () => queryOnlineProducts({
    featured: true,
    order: { field: 'title', direction: 'ASC' }
  })),
  useAsyncData('block-featured-posts', () => queryContent<BlockFeaturedPostsCollectionItem | null>({ collection: 'blockFeaturedPosts', first: true })),
  useAsyncData('posts', () => queryOnlinePosts({ order: { field: 'date', direction: 'DESC' } })),
  usePostCategories()
])

const { data: settings } = useNuxtData<SettingsCollectionItem | null>('settings')

const hasHomepageContent = [
  simpleHero.value,
  simpleBlock.value,
  carousel.value,
  featuredProducts.value,
  featuredPosts.value
].some(block => !!block && block.visible !== false)

if (!hasHomepageContent) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Homepage content not found',
    fatal: true
  })
}

const seoData = settings.value?.seo
const simpleHeroForSeo = simpleHero.value?.visible !== false ? simpleHero.value : null

const seoTitle = seoData?.og_title || seoData?.title || simpleHeroForSeo?.title || 'Home'
const seoDescription = seoData?.og_description || seoData?.description || simpleHeroForSeo?.description

useSeoMeta({
  title: seoData?.title || simpleHeroForSeo?.title,
  ogTitle: seoTitle,
  description: seoData?.description || simpleHeroForSeo?.description,
  ogDescription: seoDescription,
  ogImage: seoData?.og_image || undefined
})

useKeywords(seoData?.keywords?.join(', '))

defineOgImage('Default', { title: seoTitle, description: seoDescription })
</script>

<template>
  <UPage>
    <LandingHomeBlocks
      :simple-hero="simpleHero ?? null"
      :simple-block="simpleBlock ?? null"
      :carousel="carousel ?? null"
      :featured-products="featuredProducts ?? null"
      :featured-product-items="featuredProductItems ?? []"
      :featured-posts="featuredPosts ?? null"
      :posts="posts ?? []"
      :post-categories="postCategories ?? []"
    />
  </UPage>
</template>
