import { ref, onMounted, onUnmounted } from 'vue'

export function useTheme() {
  const theme = ref('light')

  const initTheme = () => {
    const saved = localStorage.getItem('theme') || 'light'
    theme.value = saved
    document.documentElement.setAttribute('data-theme', saved)
    updateThemeColor()
  }

  const toggleTheme = () => {
    const newTheme = theme.value === 'dark' ? 'light' : 'dark'
    theme.value = newTheme
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
    updateThemeColor()
  }

  const updateThemeColor = () => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme.value === 'dark' ? '#091428' : '#F5F4D6')
    }
  }

  // Sync with SSI nav theme-changed event
  const onThemeChanged = (e) => {
    const newTheme = e.detail?.theme
    if (newTheme && newTheme !== theme.value) {
      theme.value = newTheme
      updateThemeColor()
    }
  }

  onMounted(() => {
    initTheme()
    window.addEventListener('theme-changed', onThemeChanged)
  })

  onUnmounted(() => {
    window.removeEventListener('theme-changed', onThemeChanged)
  })

  return {
    theme,
    toggleTheme
  }
}
