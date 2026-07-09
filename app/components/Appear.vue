<script setup lang="ts">
defineOptions({
  name: 'MotionAppear'
})
const props = withDefaults(defineProps<{
  delay?: number
  index?: number
  stagger?: number
  maxDelay?: number
}>(), {
  delay: 0,
  index: 0,
  stagger: 0.2,
  maxDelay: 0.5
})

const transitionDelay = computed(() =>
  props.delay + Math.min(props.index * props.stagger, props.maxDelay)
)
</script>

<template>
  <Motion
    class="block"
    :initial="{ opacity: 0, transform: 'translateY(10px)' }"
    :while-in-view="{ opacity: 1, transform: 'translateY(0)' }"
    :transition="{ delay: transitionDelay }"
    :in-view-options="{ once: true }"
  >
    <slot />
  </Motion>
</template>
