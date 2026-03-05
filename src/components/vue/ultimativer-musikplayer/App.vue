<template>
  <div class="app">
    <AppHeader />

    <main class="app__main">
      <section class="panel">
        <div class="panel__body">
          <AudioUploader @files-loaded="handleFilesLoaded" />

          <div class="meta">
            <div class="current-title">
              {{ store.currentFile ? store.currentFile.name : t('player.nofile') }}
            </div>
          </div>

          <AudioVisualizer
            :analyser="analyser"
            :dataArray="dataArray"
            :timeDomainArray="timeDomainArray"
          />

          <ProgressBar @seek="handleSeek" />

          <div class="controls-bar">
            <PlayerControls
              @play="audioPlayer.play"
              @pause="audioPlayer.pause"
              @stop="audioPlayer.stop"
              @play-next="audioPlayer.playNext"
              @play-previous="audioPlayer.playPrevious"
            />
            <span class="controls-divider"></span>
            <VisualizerControls />
            <span class="controls-divider"></span>
            <VolumeControl
              @set-volume="audioPlayer.setVolume"
              @toggle-mute="audioPlayer.toggleMute"
            />
          </div>
        </div>
      </section>

      <Playlist
        @track-selected="handleTrackSelected"
        @track-deleted="handleTrackDeleted"
      />

      <ToolCards />

      <audio ref="audioElementRef" style="display: none;"></audio>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import i18n from './i18n'
import { usePlayerStore } from './stores/playerStore'
import { useAudioPlayer } from './composables/useAudioPlayer'
import { useTheme } from './composables/useTheme'

import AppHeader from './AppHeader.vue'
import AudioUploader from './AudioUploader.vue'
import AudioVisualizer from './AudioVisualizer.vue'
import VisualizerControls from './VisualizerControls.vue'
import ProgressBar from './ProgressBar.vue'
import VolumeControl from './VolumeControl.vue'
import PlayerControls from './PlayerControls.vue'
import Playlist from './Playlist.vue'
import ToolCards from './ToolCards.vue'

const { t, locale } = useI18n()
const store = usePlayerStore()
useTheme()

// Set the global i18n locale so every component (including children) reacts
function setGlobalLocale(lang) {
  if (!lang || lang === i18n.global.locale.value) return
  i18n.global.locale.value = lang
}

// Sync with SSI nav language switching via event delegation on .global-nav-lang-btn clicks
// This is more robust than relying on localStorage (not reactive) or custom events alone
const onNavLangClick = (e) => {
  const btn = e.target.closest('.global-nav-lang-btn')
  if (!btn) return
  setGlobalLocale(btn.getAttribute('data-lang'))
}

// Also listen for the SSI nav's custom 'locale-changed' event as a fallback
const onLocaleChanged = (e) => {
  setGlobalLocale(e.detail?.locale)
}

onMounted(() => {
  document.addEventListener('click', onNavLangClick)
  window.addEventListener('locale-changed', onLocaleChanged)
})

onUnmounted(() => {
  document.removeEventListener('click', onNavLangClick)
  window.removeEventListener('locale-changed', onLocaleChanged)
})

const audioElementRef = ref(null)
const analyser = ref(null)
const dataArray = ref(null)
const timeDomainArray = ref(null)

const audioPlayer = useAudioPlayer(store)

onMounted(() => {
  if (audioElementRef.value) {
    audioPlayer.setupAudioElement(audioElementRef.value)
  }
})

const handleFilesLoaded = (index) => {
  console.log('Files loaded:', store.audioFiles.length, 'files')
  
  // Ensure audio element is set up first
  if (audioElementRef.value && !audioPlayer.audioElement.value) {
    console.log('Setting up audio element')
    audioPlayer.setupAudioElement(audioElementRef.value)
  }
  
  // Initialize audio context
  audioPlayer.initAudioContext()
  analyser.value = audioPlayer.analyser.value
  dataArray.value = audioPlayer.dataArray.value
  timeDomainArray.value = audioPlayer.timeDomainArray.value
  
  // Load the file explicitly
  if (store.audioFiles.length > 0) {
    console.log('Loading file at index', index)
    store.setCurrentIndex(index)
    // Give Vue a tick to update, then load the file
    setTimeout(() => {
      audioPlayer.loadAudioFile(index)
    }, 0)
  }
}

const handleTrackSelected = (index) => {
  console.log('Track selected:', index)
  store.setCurrentIndex(index)
  // Load and play immediately
  setTimeout(() => {
    audioPlayer.loadAudioFile(index)
    audioPlayer.play()
  }, 0)
}

const handleTrackDeleted = ({ index, wasCurrentTrack }) => {
  audioPlayer.handleTrackRemoved(index, wasCurrentTrack)
}

const handleSeek = (percentage) => {
  audioPlayer.seek(percentage)
}
</script>
