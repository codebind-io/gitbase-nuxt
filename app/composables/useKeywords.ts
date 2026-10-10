export function useKeywords(keywords: MaybeRefOrGetter<string | null | undefined>) {
  useHead({
    meta: computed(() => {
      const content = toValue(keywords)?.trim()
      if (!content) return []

      return [{ key: 'keywords', name: 'keywords', content }]
    })
  })
}
