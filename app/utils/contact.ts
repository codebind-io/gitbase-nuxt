import { toWhatsappHref } from './whatsapp'

export type ContactAction = {
  key: string
  label: string
  display: string
  href: string
  icon: string
  class: string
  external?: boolean
}

export function toMailtoHref(email: string | undefined) {
  const trimmed = email?.trim()
  if (!trimmed) {
    return ''
  }

  return trimmed.startsWith('mailto:') ? trimmed : `mailto:${trimmed}`
}

export function toTelHref(phone: string | undefined) {
  const trimmed = phone?.trim()
  if (!trimmed) {
    return ''
  }

  return trimmed.startsWith('tel:') ? trimmed : `tel:${trimmed.replace(/\s/g, '')}`
}

export function buildContactActions(data: {
  whatsapp?: string
  phone?: string
  email?: string
  maps_url?: string
} | null | undefined): ContactAction[] {
  if (!data) {
    return []
  }

  return [
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      display: data.whatsapp?.trim() ?? '',
      href: toWhatsappHref(data.whatsapp),
      icon: 'simple-icons:whatsapp',
      class: 'bg-[#25D366] text-white'
    },
    {
      key: 'phone',
      label: 'Téléphone',
      display: data.phone?.trim() ?? '',
      href: toTelHref(data.phone),
      icon: 'lucide:phone',
      class: 'bg-blue-600 text-white'
    },
    {
      key: 'email',
      label: 'Email',
      display: data.email?.trim() ?? '',
      href: toMailtoHref(data.email),
      icon: 'lucide:mail',
      class: 'bg-rose-500 text-white'
    },
    {
      key: 'maps',
      label: 'Itinéraire',
      display: 'Ouvrir dans Google Maps',
      href: data.maps_url?.trim() ?? '',
      icon: 'lucide:map-pin',
      class: 'bg-amber-500 text-white',
      external: true
    }
  ].filter(action => action.href)
}
