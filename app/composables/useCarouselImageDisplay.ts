export function useCarouselImageDisplay(
  coverImage?: MaybeRef<boolean | undefined>,
  options?: { hover?: boolean }
) {
  const isCover = computed(() => toValue(coverImage) === true)
  const hover = options?.hover ?? false

  const frameClass = 'relative aspect-square w-full overflow-hidden rounded-2xl bg-white'

  const imageClass = computed(() => {
    const hoverClasses = hover
      ? 'transition-transform duration-500 ease-out will-change-transform group-hover:scale-105'
      : ''

    if (isCover.value) {
      return ['absolute inset-0 size-full object-cover', hoverClasses]
    }

    return ['size-full origin-center object-contain', hoverClasses]
  })

  return { frameClass, imageClass }
}
