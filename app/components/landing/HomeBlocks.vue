<script setup lang="ts">
import type {
  BlockCarouselCollectionItem,
  BlockFeaturedPostsCollectionItem,
  BlockFeaturedProductsCollectionItem,
  BlockSimpleBlockCollectionItem,
  BlockSimpleHeroCollectionItem,
  PostsCollectionItem,
  ProductsCollectionItem,
  CategoriesCollectionItem
} from '@nuxt/content'

type PostCategory = NonNullable<CategoriesCollectionItem['blog_categories']>[number]

const props = defineProps<{
  simpleHero: BlockSimpleHeroCollectionItem | null
  simpleBlock: BlockSimpleBlockCollectionItem | null
  carousel: BlockCarouselCollectionItem | null
  featuredProducts: BlockFeaturedProductsCollectionItem | null
  featuredProductItems: ProductsCollectionItem[]
  featuredPosts: BlockFeaturedPostsCollectionItem | null
  posts: PostsCollectionItem[]
  postCategories: PostCategory[]
}>()

const showSimpleHero = computed(() => props.simpleHero?.visible !== false)
const showSimpleBlock = computed(() => props.simpleBlock?.visible !== false)
const showCarousel = computed(() => props.carousel?.visible !== false)
const carouselImages = computed(() =>
  (props.carousel?.images ?? []).filter(item => item.image)
)
const showFeaturedProducts = computed(() => props.featuredProducts?.visible !== false)
const showFeaturedPosts = computed(() => props.featuredPosts?.visible !== false)

const logoSrc = useSiteLogo()

type HeroCta = NonNullable<BlockSimpleHeroCollectionItem['cta']>

const heroCtas = computed(() => {
  if (!props.simpleHero) return []

  return [props.simpleHero.cta, props.simpleHero.cta2]
    .filter((cta): cta is HeroCta => !!cta?.url?.trim())
})

function isExternalUrl(url: string) {
  return /^https?:\/\//i.test(url)
}

function ctaVariant(style: HeroCta['style'] | undefined) {
  return style === 'outline' ? 'outline' : 'solid'
}

function ctaColor(index: number) {
  return index === 1 ? 'neutral' : 'primary'
}
</script>

<template>
  <Appear v-if="showSimpleHero && simpleHero">
    <UPageHero
      :title="simpleHero.title"
      :description="simpleHero.description"
      :ui="{
        container: 'pt-18 pb-24 sm:pt-24 sm:pb-32 lg:pt-28 lg:pb-40',
        headline: 'flex items-center justify-center',
        title: 'text-shadow-md max-w-lg mx-auto',
        description: 'mt-2'
      }"
    >
      <template #headline>
        <img
          class="size-32 object-contain"
          :src="logoSrc"
          :alt="simpleHero.title"
        >
      </template>

      <template
        v-if="heroCtas.length"
        #links
      >
        <div class="relative z-10 flex flex-wrap items-center justify-center gap-3">
          <UButton
            v-for="(cta, index) in heroCtas"
            :key="index"
            :label="cta.label || 'Learn more'"
            :to="cta.url!"
            :color="ctaColor(index)"
            size="xl"
            :variant="ctaVariant(cta.style)"
            :target="isExternalUrl(cta.url!) ? '_blank' : undefined"
            :rel="isExternalUrl(cta.url!) ? 'noopener noreferrer' : undefined"
          />
        </div>
      </template>
    </UPageHero>
  </Appear>

  <Appear
    v-if="showSimpleBlock && simpleBlock"
    :delay="0.04"
  >
    <UPageSection :ui="{ container: 'pt-0!' }">
      <LandingSimpleBlock :block="simpleBlock" />
    </UPageSection>
  </Appear>

  <Appear
    v-if="showCarousel && carousel && carouselImages.length"
    :delay="0.06"
  >
    <UPageSection :ui="{ container: 'pt-0!' }">
      <LandingCarouselBlock :block="carousel" />
    </UPageSection>
  </Appear>

  <Appear
    v-if="showFeaturedProducts && featuredProducts && featuredProductItems.length"
    :delay="0.1"
  >
    <UPageSection :ui="{ container: 'pt-0!' }">
      <LandingFeaturedProductsBlock
        :block="featuredProducts"
        :products="featuredProductItems"
      />
    </UPageSection>
  </Appear>

  <Appear
    v-if="showFeaturedPosts && featuredPosts"
    :delay="0.14"
  >
    <UPageSection :ui="{ container: 'mt-8 pt-0! sm:mt-12' }">
      <LandingFeaturedPostsBlock
        :featured-posts="featuredPosts"
        :posts="posts"
        :post-categories="postCategories"
      />
    </UPageSection>
  </Appear>
</template>
