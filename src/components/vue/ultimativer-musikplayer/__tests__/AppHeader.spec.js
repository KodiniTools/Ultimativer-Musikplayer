import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import i18n from '../i18n'
import AppHeader from '../AppHeader.vue'

describe('AppHeader', () => {
  afterEach(() => {
    i18n.global.locale.value = 'de'
  })

  it('verlinkt zurück zur Landing-Page', () => {
    const wrapper = mount(AppHeader, { global: { plugins: [i18n] } })
    const link = wrapper.get('a.app__home')
    expect(link.attributes('href')).toBe('/ultimativer-musikplayer/')
    expect(link.attributes('aria-label')).toBe('Zur Startseite des Musikplayers')
    expect(link.text()).toBe('Startseite')
    expect(wrapper.get('h1').text()).toBe('Ultimativer Musikplayer')
  })

  it('übersetzt den Rücklink', async () => {
    i18n.global.locale.value = 'en'
    const wrapper = mount(AppHeader, { global: { plugins: [i18n] } })
    expect(wrapper.get('a.app__home').text()).toBe('Home')
    expect(wrapper.get('a.app__home').attributes('aria-label')).toBe(
      'Back to the music player home page'
    )
  })
})
