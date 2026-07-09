<script setup lang="ts">
const route = useRoute()
const { block, actions, hasActions } = await useContactActions()

const isHomePage = computed(() => route.path === '/')
const showOn = computed(() => block.value?.show_on ?? 'mobile')
const showPages = computed(() => block.value?.show_pages ?? 'homepage')
const isOnAllowedPage = computed(() =>
  showPages.value === 'website' || isHomePage.value
)
const showFab = computed(() =>
  isOnAllowedPage.value && hasActions.value && showOn.value !== 'hide'
)
const fabVisibilityClass = computed(() => {
  switch (showOn.value) {
    case 'mobile':
      return 'md:hidden'
    case 'mobile_tablet':
      return 'lg:hidden'
    default:
      return ''
  }
})

const open = ref(false)
const fabRoot = ref<HTMLElement | null>(null)

onClickOutside(fabRoot, () => {
  open.value = false
})

function toggleFab() {
  open.value = !open.value
}

function closeFab() {
  open.value = false
}
</script>

<template>
  <div
    v-if="showFab"
    class="pointer-events-none fixed inset-0 z-40"
    :class="fabVisibilityClass"
  >
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="pointer-events-auto absolute inset-0 bg-black/20"
        aria-hidden="true"
        @click="closeFab"
      />
    </Transition>

    <div
      ref="fabRoot"
      class="pointer-events-auto fixed bottom-4 right-4 z-50"
    >
      <div
        id="quick-contact-actions"
        class="absolute bottom-[calc(100%+0.75rem)] right-0 flex flex-col-reverse items-center gap-3"
      >
        <Motion
          v-for="(action, index) in actions"
          :key="action.key"
          :initial="false"
          :animate="open
            ? { opacity: 1, scale: 1, y: 0 }
            : { opacity: 0, scale: 0.4, y: 20 }"
          :transition="{
            delay: open ? index * 0.06 : (actions.length - 1 - index) * 0.04,
            duration: 0.28,
            ease: [0.22, 1, 0.36, 1]
          }"
          :style="{ pointerEvents: open ? 'auto' : 'none' }"
        >
          <a
            :href="action.href"
            :target="action.external ? '_blank' : undefined"
            :rel="action.external ? 'noopener noreferrer' : undefined"
            :aria-label="action.label"
            class="flex size-12 items-center justify-center rounded-full shadow-md transition-transform hover:scale-105"
            :class="action.class"
            @click="closeFab"
          >
            <UIcon
              :name="action.icon"
              class="size-5"
            />
          </a>
        </Motion>
      </div>

      <button
        type="button"
        class="flex size-14 items-center justify-center rounded-full bg-neutral-950 text-white shadow-lg transition-shadow hover:shadow-xl dark:bg-white dark:text-neutral-950"
        :aria-expanded="open"
        aria-controls="quick-contact-actions"
        :aria-label="open ? 'Fermer le menu contact' : 'Ouvrir le menu contact'"
        @click="toggleFab"
      >
        <Motion
          :animate="{ rotate: open ? 45 : 0 }"
          :transition="{ type: 'spring', stiffness: 260, damping: 20 }"
          class="flex items-center justify-center"
        >
          <UIcon
            :name="open ? 'lucide:x' : 'lucide:message-circle'"
            class="size-7"
          />
        </Motion>
      </button>
    </div>
  </div>
</template>
