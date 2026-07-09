import { buildContactActions } from '~/utils/contact'

export async function useContactActions() {
  const { data: block } = await useAsyncData('block-quick-contact', () =>
    queryCollection('blockQuickContact').first()
  )

  const actions = computed(() =>
    buildContactActions(block.value)
  )

  const hasActions = computed(() => actions.value.length > 0)

  return {
    block,
    actions,
    hasActions
  }
}
