import { onMounted, onUnmounted } from 'vue'
import { useSettingsStore } from '../stores/settingsStore'

/**
 * Bindet den Settings-Store an die Lebensdauer der App: Ereignisse der
 * SSI-Navigation (theme-changed, locale-changed, Sprach-Buttons) und
 * Änderungen an html[data-theme] werden nur gehört, solange die App lebt.
 */
export function useSettingsSync() {
  const settings = useSettingsStore()
  onMounted(() => settings.startListening())
  onUnmounted(() => settings.stopListening())
  return settings
}
