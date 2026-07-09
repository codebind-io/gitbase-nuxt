<script setup lang="ts">
import type { SettingsCollectionItem } from '@nuxt/content'

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
  useAsyncData('block-simple-hero', () => queryCollection('blockSimpleHero').first()),
  useAsyncData('block-simple-block', () => queryCollection('blockSimpleBlock').first()),
  useAsyncData('block-carousel', () => queryCollection('blockCarousel').first()),
  useAsyncData('block-featured-products', () => queryCollection('blockFeaturedProducts').first()),
  useAsyncData('featured-products', () => queryOnlineProducts().where('featured', '=', true).order('title', 'ASC').all()),
  useAsyncData('block-featured-posts', () => queryCollection('blockFeaturedPosts').first()),
  useAsyncData('posts', () => queryOnlinePosts().order('date', 'DESC').all()),
  usePostCategories()
])

const { data: settings } = useNuxtData<SettingsCollectionItem | null>('settings')

const hasHomepageContent = [
  simpleHero.value,
  simpleBlock.value,
  carousel.value,
  featuredProducts.value,
  featuredPosts.value
].some(block => block?.visible !== false)

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
  ogImage: seoData?.og_image || undefined,
  keywords: seoData?.keywords?.join(', ')
})

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
