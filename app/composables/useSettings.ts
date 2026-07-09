export function useSettings() {
  return useAsyncData('settings', () => queryCollection('settings').first())
}
