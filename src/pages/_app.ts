import type { App } from 'vue'
import { createPinia } from 'pinia'
import i18n from '../components/vue/ultimativer-musikplayer/i18n'

export default (app: App) => {
  app.use(createPinia())
  app.use(i18n)
}
