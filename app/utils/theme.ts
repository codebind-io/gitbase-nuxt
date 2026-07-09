import colors from 'tailwindcss/colors'

export const themePrimaryColors = [
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
  'custom-color'
] as const

export const themeCustomPrimaryColor = 'custom-color' as const

export const themeColorShades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const
export type ThemeColorShade = typeof themeColorShades[number]

export const themeNeutralColors = [
  'slate',
  'gray',
  'zinc',
  'neutral',
  'stone',
  'taupe',
  'mauve',
  'mist',
  'olive'
] as const

export const themeRadiusValues = [0, 0.125, 0.25, 0.375, 0.5] as const

export const themeFonts = {
  'public-sans': {
    label: 'Public Sans',
    family: '\'Public Sans\', sans-serif',
    google: 'Public+Sans:wght@400;500;600;700'
  },
  'dm-sans': {
    label: 'DM Sans',
    family: '\'DM Sans\', sans-serif',
    google: 'DM+Sans:wght@400;500;600;700'
  },
  'geist': {
    label: 'Geist',
    family: '\'Geist\', sans-serif',
    google: 'Geist:wght@400;500;600;700'
  },
  'inter': {
    label: 'Inter',
    family: '\'Inter\', sans-serif',
    google: 'Inter:wght@400;500;600;700'
  },
  'poppins': {
    label: 'Poppins',
    family: '\'Poppins\', sans-serif',
    google: 'Poppins:wght@400;500;600;700'
  },
  'outfit': {
    label: 'Outfit',
    family: '\'Outfit\', sans-serif',
    google: 'Outfit:wght@400;500;600;700'
  },
  'raleway': {
    label: 'Raleway',
    family: '\'Raleway\', sans-serif',
    google: 'Raleway:wght@400;500;600;700'
  }
} as const

export const themeFontSlugs = [
  'public-sans',
  'dm-sans',
  'geist',
  'inter',
  'poppins',
  'outfit',
  'raleway'
] as const

export type ThemePrimaryColor = typeof themePrimaryColors[number]
export type ThemeNeutralColor = typeof themeNeutralColors[number]
export type ThemeRadius = typeof themeRadiusValues[number]
export type ThemeFont = typeof themeFontSlugs[number]

export function getThemeFontHref(font?: ThemeFont) {
  if (!font) return undefined
  const config = themeFonts[font]
  return `https://fonts.googleapis.com/css2?family=${config.google}&display=swap`
}

const themeColorShadeLightness: Record<ThemeColorShade, number> = {
  50: 97,
  100: 94,
  200: 86,
  300: 77,
  400: 66,
  500: 50,
  600: 42,
  700: 35,
  800: 27,
  900: 20,
  950: 13
}

function hexToRgb(hex: string) {
  const value = hex.replace('#', '')
  const normalized = value.length === 3
    ? value.split('').map(char => char + char).join('')
    : value

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16)
  }
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (channel: number) => channel.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function rgbToHsl(r: number, g: number, b: number) {
  const red = r / 255
  const green = g / 255
  const blue = b / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const delta = max - min
  const lightness = (max + min) / 2

  if (delta === 0) {
    return { h: 0, s: 0, l: lightness }
  }

  const saturation = lightness > 0.5
    ? delta / (2 - max - min)
    : delta / (max + min)

  let hue: number
  if (max === red) {
    hue = ((green - blue) / delta) % 6
  } else if (max === green) {
    hue = (blue - red) / delta + 2
  } else {
    hue = (red - green) / delta + 4
  }

  return {
    h: Math.round(hue * 60),
    s: Math.round(saturation * 100),
    l: Math.round(lightness * 100)
  }
}

function hslToRgb(h: number, s: number, l: number) {
  const saturation = s / 100
  const lightness = l / 100
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation
  const huePrime = (h % 360) / 60
  const x = chroma * (1 - Math.abs((huePrime % 2) - 1))
  let red = 0
  let green = 0
  let blue = 0

  if (huePrime >= 0 && huePrime < 1) {
    red = chroma
    green = x
  } else if (huePrime < 2) {
    red = x
    green = chroma
  } else if (huePrime < 3) {
    green = chroma
    blue = x
  } else if (huePrime < 4) {
    green = x
    blue = chroma
  } else if (huePrime < 5) {
    red = x
    blue = chroma
  } else {
    red = chroma
    blue = x
  }

  const match = lightness - chroma / 2
  return {
    r: Math.round((red + match) * 255),
    g: Math.round((green + match) * 255),
    b: Math.round((blue + match) * 255)
  }
}

export function isValidHexColor(value?: string | null): value is string {
  return /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value?.trim() ?? '')
}

export function normalizeHexColor(value: string) {
  let hex = value.trim()
  if (!hex.startsWith('#')) {
    hex = `#${hex}`
  }

  if (hex.length === 4) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
  }

  return hex.toLowerCase()
}

export function generateCustomColorScale(hex: string) {
  const normalized = normalizeHexColor(hex)
  const { r, g, b } = hexToRgb(normalized)
  const { h, s } = rgbToHsl(r, g, b)

  return themeColorShades.reduce<Record<ThemeColorShade, string>>((scale, shade) => {
    if (shade === 500) {
      scale[shade] = normalized
      return scale
    }

    const rgb = hslToRgb(h, s, themeColorShadeLightness[shade])
    scale[shade] = rgbToHex(rgb.r, rgb.g, rgb.b)
    return scale
  }, {} as Record<ThemeColorShade, string>)
}

export function getPrimaryColorStyleVars(hex: string) {
  const scale = generateCustomColorScale(hex)

  return themeColorShades.map(shade => `--ui-color-primary-${shade}: ${scale[shade]}`)
}

export function getPrimaryColorStyleBlock(hex: string, selector: string) {
  const declarations = getPrimaryColorStyleVars(hex).join('; ')
  return `${selector}{${declarations}}`
}

function getTailwindPaletteShade(
  colorName: ThemePrimaryColor | ThemeNeutralColor,
  shade: ThemeColorShade
) {
  if (colorName === themeCustomPrimaryColor) return ''

  const palette = colors[colorName as keyof typeof colors]
  if (!palette || typeof palette !== 'object') return ''

  const value = palette[String(shade) as keyof typeof palette]
  return typeof value === 'string' ? value : ''
}

function getTailwindColorShade(colorName: ThemePrimaryColor, shade: ThemeColorShade) {
  return getTailwindPaletteShade(colorName, shade)
}

export function getNamedPrimaryColorStyleVars(colorName: ThemePrimaryColor) {
  return themeColorShades
    .map((shade) => {
      const value = getTailwindColorShade(colorName, shade)
      return value ? `--ui-color-primary-${shade}: ${value}` : null
    })
    .filter((value): value is string => Boolean(value))
}

export function getNamedPrimaryColorStyleBlock(colorName: ThemePrimaryColor, selector: string) {
  const declarations = getNamedPrimaryColorStyleVars(colorName).join('; ')
  if (!declarations) return ''

  return `${selector}{${declarations}}`
}

export function getNamedNeutralColorStyleVars(colorName: ThemeNeutralColor) {
  return themeColorShades
    .map((shade) => {
      const value = getTailwindPaletteShade(colorName, shade)
      return value ? `--ui-color-neutral-${shade}: ${value}` : null
    })
    .filter((value): value is string => Boolean(value))
}

export function getNamedNeutralColorStyleBlock(colorName: ThemeNeutralColor, selector: string) {
  const declarations = getNamedNeutralColorStyleVars(colorName).join('; ')
  if (!declarations) return ''

  return `${selector}{${declarations}}`
}

export function getThemeNeutralShade(
  neutral?: ThemeNeutralColor | null,
  shade: ThemeColorShade = 950
) {
  if (!neutral) return null

  return getTailwindPaletteShade(neutral, shade) || null
}

export function buildThemeNeutralColorCss(neutral?: ThemeNeutralColor | null) {
  if (!neutral) return undefined

  const block = getNamedNeutralColorStyleBlock(neutral, 'html')
  return block || undefined
}

type ThemePrimarySettings = {
  primary?: ThemePrimaryColor
  primary_dark?: ThemePrimaryColor
  custom_color?: string
  custom_color_dark?: string
}

export function resolveEffectivePrimary(theme?: ThemePrimarySettings | null, isDark = false) {
  const fallbackPrimary: ThemePrimaryColor = theme?.primary && theme.primary !== themeCustomPrimaryColor
    ? theme.primary
    : 'blue'
  const selectedPrimary = isDark && theme?.primary_dark
    ? theme.primary_dark
    : theme?.primary

  if (!selectedPrimary || selectedPrimary === themeCustomPrimaryColor) {
    const customHex = selectedPrimary === themeCustomPrimaryColor
      ? (
          isDark && theme?.primary_dark && isValidHexColor(theme.custom_color_dark)
            ? theme.custom_color_dark
            : isValidHexColor(theme?.custom_color)
              ? theme.custom_color
              : null
        )
      : null

    if (customHex) {
      return { kind: 'custom' as const, hex: normalizeHexColor(customHex) }
    }

    return { kind: 'named' as const, color: fallbackPrimary }
  }

  return { kind: 'named' as const, color: selectedPrimary }
}

export function buildThemePrimaryColorCss(theme?: ThemePrimarySettings | null) {
  if (!theme) return undefined

  const blocks: string[] = []
  const light = resolveEffectivePrimary(theme, false)
  const dark = resolveEffectivePrimary(theme, true)
  const hasDifferentNamedColors = light.kind === 'named' && dark.kind === 'named' && light.color !== dark.color

  if (light.kind === 'custom') {
    blocks.push(getPrimaryColorStyleBlock(light.hex, 'html:not(.dark)'))
  } else if (hasDifferentNamedColors) {
    blocks.push(getNamedPrimaryColorStyleBlock(light.color, 'html:not(.dark)'))
  }

  if (dark.kind === 'custom') {
    blocks.push(getPrimaryColorStyleBlock(dark.hex, 'html.dark'))
  } else if (hasDifferentNamedColors) {
    blocks.push(getNamedPrimaryColorStyleBlock(dark.color, 'html.dark'))
  }

  return blocks.filter(Boolean).join('\n') || undefined
}
