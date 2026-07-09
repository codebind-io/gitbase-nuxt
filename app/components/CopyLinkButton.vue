<script setup lang="ts">
const props = withDefaults(defineProps<{
  text: string
  label?: string
  message?: string
}>(), {
  label: 'Copy link',
  message: 'Link copied to clipboard'
})

function onCopy() {
  copyToClipboard(props.text, props.message)
}
</script>

<template>
  <UButton
    size="xs"
    color="neutral"
    variant="ghost"
    icon="i-lucide-link-2"
    :label="label"
    @click="onCopy"
  />
</template>
