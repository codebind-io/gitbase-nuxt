export function useNavbarScroll(enabled: MaybeRefOrGetter<boolean>) {
  const isVisible = ref(true)
  const { y } = useWindowScroll()
  let lastY = 0

  watch(y, (current) => {
    if (!toValue(enabled)) {
      isVisible.value = true
      lastY = current
      return
    }

    if (current <= 16) {
      isVisible.value = true
      lastY = current
      return
    }

    const delta = current - lastY

    if (Math.abs(delta) >= 8) {
      isVisible.value = delta < 0
    }

    lastY = current
  })

  watch(() => toValue(enabled), (active) => {
    if (!active) {
      isVisible.value = true
    }
  })

  return { isVisible }
}
