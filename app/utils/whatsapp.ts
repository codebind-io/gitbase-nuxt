export function toWhatsappHref(input: string | undefined) {
  const trimmed = input?.trim()
  if (!trimmed) {
    return ''
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  const digits = trimmed.replace(/\D/g, '')
  return digits ? `https://wa.me/${digits}` : ''
}
