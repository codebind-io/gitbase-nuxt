/** Tailwind basis classes per visible column count (1–6). */
const MOBILE_COLUMNS: Record<number, string> = {
  1: 'basis-full',
  2: 'basis-1/2',
  3: 'basis-1/3',
  4: 'basis-1/4',
  5: 'basis-1/5',
  6: 'basis-1/6'
}

const TABLET_COLUMNS: Record<number, string> = {
  1: 'md:basis-full',
  2: 'md:basis-1/2',
  3: 'md:basis-1/3',
  4: 'md:basis-1/4',
  5: 'md:basis-1/5',
  6: 'md:basis-1/6'
}

const DESKTOP_COLUMNS: Record<number, string> = {
  1: 'lg:basis-full',
  2: 'lg:basis-1/2',
  3: 'lg:basis-1/3',
  4: 'lg:basis-1/4',
  5: 'lg:basis-1/5',
  6: 'lg:basis-1/6'
}

export function clampCarouselColumns(count: number) {
  return Math.min(Math.max(Math.round(count) || 1, 1), 6)
}

/** UCarousel `ui.item` classes: how many image columns fit in the viewport per breakpoint. */
export function carouselVisibleColumnsClass(mobile: number, tablet: number, desktop: number) {
  const m = clampCarouselColumns(mobile)
  const t = clampCarouselColumns(tablet)
  const d = clampCarouselColumns(desktop)
  return `${MOBILE_COLUMNS[m]} ${TABLET_COLUMNS[t]} ${DESKTOP_COLUMNS[d]} ps-3 sm:ps-4`
}
