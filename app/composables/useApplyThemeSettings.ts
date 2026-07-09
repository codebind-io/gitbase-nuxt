import type { SettingsCollectionItem } from '@nuxt/content'
import {
  buildThemeNeutralColorCss,
  buildThemePrimaryColorCss,
  getThemeFontHref,
  resolveEffectivePrimary,
  themeFonts,
  type ThemeFont
} from '~/utils/theme'

export function useApplyThemeSettings(
  settings: Ref<SettingsCollectionItem | null | undefined>
) {
  const appConfig = useAppConfig()
  const colorMode = useColorMode()

  watchEffect(() => {
    const theme = settings.value?.theme
    if (!theme) return

    const isDark = colorMode.value === 'dark'
    const effective = resolveEffectivePrimary(theme, isDark)

    if (effective.kind === 'named') {
      appConfig.ui.colors.primary = effective.color
    }

    if (theme.neutral) {
      appConfig.ui.colors.neutral = theme.neutral
    }
  })

  const htmlStyle = computed(() => {
    const theme = settings.value?.theme
    const styles: string[] = []

    if (theme?.radius != null) {
      styles.push(`--ui-radius: ${theme.radius}rem`)
    }

    const font = theme?.font as ThemeFont | undefined
    if (font && themeFonts[font]) {
      styles.push(`--font-sans: ${themeFonts[font].family}`)
    }

    return styles.length ? styles.join('; ') : undefined
  })

  const themeColorCss = computed(() => {
    const theme = settings.value?.theme
    const blocks = [
      buildThemePrimaryColorCss(theme),
      buildThemeNeutralColorCss(theme?.neutral)
    ].filter(Boolean)

    return blocks.length ? blocks.join('\n') : undefined
  })

  const fontHref = computed(() => getThemeFontHref(settings.value?.theme?.font as ThemeFont | undefined))

  useHead(() => ({
    style: themeColorCss.value
      ? [{ key: 'theme-colors', innerHTML: themeColorCss.value, tagPriority: 'high' }]
      : []
  }))

  return { htmlStyle, fontHref }
}
