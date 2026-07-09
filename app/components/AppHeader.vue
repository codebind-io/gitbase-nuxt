<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const props = defineProps<{
  links: NavigationMenuItem[]
  hideOnScroll?: boolean
  showDarkmodeSwitch?: boolean
  cta?: {
    label: string
    url: string
  } | null
}>()

const route = useRoute()
const isOpen = ref(false)

const { isVisible: isScrollVisible } = useNavbarScroll(() => props.hideOnScroll ?? false)

const isNavbarVisible = computed(() => !props.hideOnScroll || isOpen.value || isScrollVisible.value)

const navShellClass = 'bg-muted/80 backdrop-blur-sm border border-muted/50 shadow-lg shadow-neutral-950/5'
const navMotionClass = 'transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform'
const navHiddenClass = '-translate-y-[calc(100%+0.75rem)] sm:-translate-y-[calc(100%+1.25rem)] pointer-events-none'
const ctaButtonClass = 'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-opacity hover:opacity-85 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950'
const mobileCtaButtonClass = 'flex w-full items-center justify-center rounded-xl px-4 py-4 text-base font-semibold transition-opacity hover:opacity-85 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950'

const ctaHref = computed(() => {
  const url = props.cta?.url
  if (!url) {
    return ''
  }

  if (url.startsWith('mailto:') || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) {
    return url
  }

  if (url.includes('@')) {
    return `mailto:${url}`
  }

  return url
})

watch(() => route.path, () => {
  isOpen.value = false
})

function closeMenu() {
  isOpen.value = false
}

function isActiveLink(to: string) {
  if (to === '/') {
    return route.path === '/'
  }

  return route.path === to || route.path.startsWith(`${to}/`)
}
</script>

<template>
  <!-- Desktop & tablet -->
  <header
    class="hidden sm:block fixed top-2 sm:top-4 left-1/2 z-50"
    :class="[
      navMotionClass,
      isNavbarVisible ? '-translate-x-1/2 translate-y-0' : ['-translate-x-1/2', navHiddenClass]
    ]"
  >
    <UNavigationMenu
      :items="links"
      variant="link"
      color="neutral"
      :class="[navShellClass, 'rounded-full px-2 sm:px-4']"
      :ui="{
        link: 'px-2 py-1',
        linkLeadingIcon: 'hidden'
      }"
    >
      <template #list-trailing>
        <a
          v-if="cta"
          :href="ctaHref"
          :class="[ctaButtonClass, 'ms-1']"
        >
          {{ cta.label }}
        </a>
        <ColorModeButton v-if="showDarkmodeSwitch !== false" />
      </template>
    </UNavigationMenu>
  </header>

  <!-- Mobile (phones only) -->
  <header
    class="sm:hidden fixed top-2 right-2 sm:top-4 sm:right-4 z-50"
    :class="[
      navMotionClass,
      isNavbarVisible ? 'translate-y-0' : navHiddenClass
    ]"
  >
    <div class="bg-transparent">
      <nav
        :class="[navShellClass, 'flex items-center gap-1 overflow-hidden rounded-full px-2 py-1.5']"
        aria-label="Main navigation"
      >
        <button
          type="button"
          class="relative flex size-9 items-center justify-center rounded-full text-neutral-950 transition-colors hover:bg-neutral-950/5 dark:text-white dark:hover:bg-white/10"
          :aria-expanded="isOpen"
          aria-controls="mobile-nav-menu"
          aria-label="Open navigation menu"
          @click="isOpen = true"
        >
          <span class="sr-only">Open menu</span>
          <span class="absolute block h-0.5 w-4 rounded-full bg-current -translate-y-1.5" />
          <span class="absolute block h-0.5 w-4 rounded-full bg-current" />
          <span class="absolute block h-0.5 w-4 rounded-full bg-current translate-y-1.5" />
        </button>

        <ColorModeButton v-if="showDarkmodeSwitch !== false" />
      </nav>
    </div>

    <USlideover
      v-model:open="isOpen"
      side="right"
      title="Menu"
      close-icon="lucide:x"
      :close="{
        color: 'neutral',
        variant: 'outline'
      }"
      :ui="{
        close: 'absolute top-4 end-4 text-highlighted ring ring-default bg-elevated'
      }"
    >
      <template #body>
        <nav
          id="mobile-nav-menu"
          aria-label="Main navigation"
        >
          <ul class="flex flex-col gap-1">
            <li
              v-for="item in links"
              :key="item.to"
            >
              <NuxtLink
                :to="item.to!"
                class="flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200"
                :class="isActiveLink(String(item.to))
                  ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950'
                  : 'text-neutral-700 hover:bg-neutral-950/5 hover:text-neutral-950 dark:text-neutral-200 dark:hover:bg-white/10 dark:hover:text-white'"
                @click="closeMenu"
              >
                {{ item.label }}
              </NuxtLink>
            </li>
          </ul>
        </nav>
      </template>

      <template #footer>
        <a
          v-if="cta"
          :href="ctaHref"
          :class="mobileCtaButtonClass"
          @click="closeMenu"
        >
          {{ cta.label }}
        </a>
      </template>
    </USlideover>
  </header>
</template>
