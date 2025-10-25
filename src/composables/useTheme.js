import { ref, onMounted } from 'vue'

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
      metaThemeColor.setAttribute('content', theme.value === 'dark' ? '#0D0D0E' : '#F5F9FD')
    }
  }
  
  onMounted(() => {
    initTheme()
  })
  
  return {
    theme,
    toggleTheme
  }
}
