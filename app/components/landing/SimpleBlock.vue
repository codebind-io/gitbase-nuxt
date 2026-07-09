<script setup lang="ts">
import type { BlockSimpleBlockCollectionItem } from '@nuxt/content'

const props = defineProps<{
  block: BlockSimpleBlockCollectionItem
}>()

const hasImage = computed(() => !!props.block.image?.trim())

const layoutClasses = computed(() => {
  const desktop = props.block.layout?.desktop ?? 'left'
  const mobile = props.block.layout?.mobile ?? 'first'
  const isStacked = desktop === 'top' || desktop === 'bottom'

  return {
    container: [
      'flex flex-col gap-8 lg:gap-12',
      !isStacked && 'lg:items-center',
      desktop === 'left' && 'lg:flex-row',
      desktop === 'right' && 'lg:flex-row-reverse'
    ],
    image: [
      mobile === 'second' ? 'order-2' : 'order-1',
      isStacked
        ? (desktop === 'bottom' ? 'lg:order-2' : 'lg:order-1')
        : 'lg:order-0',
      isStacked ? 'w-full' : 'w-full shrink-0 lg:w-1/2'
    ],
    content: [
      mobile === 'second' ? 'order-1' : 'order-2',
      isStacked
        ? (desktop === 'bottom' ? 'lg:order-1' : 'lg:order-2')
        : 'lg:order-0',
      isStacked ? 'w-full' : 'w-full lg:w-1/2',
      'space-y-3 text-center',
      !isStacked && 'lg:text-start'
    ]
  }
})
</script>

<template>
  <div :class="hasImage ? layoutClasses.container : undefined">
    <div
      v-if="hasImage"
      :class="layoutClasses.image"
    >
      <NuxtImg
        :src="block.image!"
        :alt="block.title"
        class="w-full rounded-2xl"
        loading="lazy"
      />
    </div>

    <div
      :class="hasImage ? layoutClasses.content : 'w-full space-y-3 text-center lg:text-start'"
    >
      <h2 class="text-3xl font-semibold tracking-tight text-highlighted sm:text-4xl">
        {{ block.title }}
      </h2>
      <p class="text-base text-muted sm:text-lg">
        {{ block.description }}
      </p>
    </div>
  </div>
</template>
