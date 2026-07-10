<template>
  <div class="app">
    <AppHeader />

    <main class="app__main">
      <section class="panel">
        <div class="panel__body">
          <!-- Shared files banner -->
          <div v-if="sharedBanner" class="shared-banner" :class="'shared-banner--' + sharedBanner.type">
            <span class="shared-banner__icon">
              <template v-if="sharedBanner.type === 'success'">&#10003;</template>
              <template v-else-if="sharedBanner.type === 'error'">&#10007;</template>
              <template v-else-if="sharedBanner.type === 'warning'">&#9888;</template>
              <template v-else>&#8505;</template>
            </span>
            <span>{{ sharedBanner.message }}</span>
          </div>

          <AudioUploader @files-loaded="handleFilesLoaded" />

          <AudioVisualizer :on-init="visualizer.initCanvas" />

          <div class="viz-controls-bar">
            <VisualizerControls />
          </div>
        </div>
      </section>

      <Playlist
        @track-selected="handleTrackSelected"
        @track-deleted="handleTrackDeleted"
        @playlist-cleared="handlePlaylistCleared"
      />

      <ToolCards />

      <audio ref="audioElementRef" style="display: none;"></audio>
    </main>

    <Teleport to="body">
      <PlayerBar
        @play="audioPlayer.play"
        @pause="audioPlayer.pause"
        @stop="audioPlayer.stop"
        @play-next="audioPlayer.playNext"
        @play-previous="audioPlayer.playPrevious"
        @seek="handleSeek"
        @set-volume="audioPlayer.setVolume"
        @toggle-mute="audioPlayer.toggleMute"
      />
    </Teleport>

    <Transition name="toast">
      <div v-if="store.errorMessage" class="error-toast" role="alert">
        <i class="fa-solid fa-triangle-exclamation"></i>
        {{ store.errorMessage }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePlayerStore } from './stores/playerStore'
import { useAudioPlayer } from './composables/useAudioPlayer'
import { useVisualizer } from './composables/useVisualizer'
import { useTheme } from './composables/useTheme'
import { useI18nSync } from './composables/useI18nSync'
import { getSharedFiles, clearSharedFiles } from './utils/sharedFileRepository'

import AppHeader from './AppHeader.vue'
import AudioUploader from './AudioUploader.vue'
import AudioVisualizer from './AudioVisualizer.vue'
import VisualizerControls from './VisualizerControls.vue'
import PlayerBar from './PlayerBar.vue'
import Playlist from './Playlist.vue'
import ToolCards from './ToolCards.vue'

const { t } = useI18n()
const store = usePlayerStore()
useTheme()
useI18nSync()

const audioElementRef = ref(null)
const audioPlayer = useAudioPlayer(store)
const visualizer  = useVisualizer(store, audioPlayer.analyser, audioPlayer.dataArray, audioPlayer.timeDomainArray)

// Shared files banner state
const sharedBanner = ref(null)
let sharedHandled = false

async function loadSharedFiles() {
  if (sharedHandled) return
  sharedHandled = true

  try {
    const records = await getSharedFiles()
    if (!records?.length) {
      sharedBanner.value = { type: 'warning', message: t('shared.empty') }
      setTimeout(() => { sharedBanner.value = null }, 5000)
      return
    }

    sharedBanner.value = { type: 'info', message: t('shared.loading', { count: records.length }) }

    const files = records.map(
      (r) => new File([r.blob], r.name, { type: r.mimeType || r.blob.type }),
    )

    const wasEmpty = store.audioFiles.length === 0
    store.addAudioFiles(files)

    if (audioElementRef.value && !audioPlayer.audioElement.value) {
      audioPlayer.setupAudioElement(audioElementRef.value)
    }
    audioPlayer.initAudioContext()

    if (wasEmpty && store.audioFiles.length > 0) {
      store.setCurrentIndex(0)
      setTimeout(() => audioPlayer.loadAudioFile(0), 0)
    }

    await clearSharedFiles()
    sharedBanner.value = { type: 'success', message: t('shared.loaded', { count: files.length }) }
  } catch (err) {
    console.error('[Musikplayer] Error loading shared files:', err)
    sharedBanner.value = { type: 'error', message: t('shared.error') }
  }

  setTimeout(() => { sharedBanner.value = null }, 5000)
}

onMounted(() => {
  if (audioElementRef.value) {
    audioPlayer.setupAudioElement(audioElementRef.value)
  }

  const source = new URLSearchParams(window.location.search).get('source')
  if (source === 'audionormalizer') loadSharedFiles()
})

const handleFilesLoaded = (index) => {
  if (audioElementRef.value && !audioPlayer.audioElement.value) {
    audioPlayer.setupAudioElement(audioElementRef.value)
  }
  audioPlayer.initAudioContext()
  if (store.audioFiles.length > 0) {
    store.setCurrentIndex(index)
    setTimeout(() => audioPlayer.loadAudioFile(index), 0)
  }
}

const handleTrackSelected = (index) => {
  store.setCurrentIndex(index)
  setTimeout(() => {
    audioPlayer.loadAudioFile(index)
    audioPlayer.play()
  }, 0)
}

const handleTrackDeleted = ({ index, wasCurrentTrack }) => {
  audioPlayer.handleTrackRemoved(index, wasCurrentTrack)
}

const handlePlaylistCleared = () => {
  audioPlayer.clearPlaylist()
}

const handleSeek = (percentage) => {
  audioPlayer.seek(percentage)
}
</script>

<style scoped>
.error-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(220, 53, 69, 0.92);
  color: #fff;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(6px);
  z-index: 9999;
  max-width: min(420px, 90vw);
  text-align: center;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
}

/* Shared files banner */
.shared-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  margin-bottom: 12px;
  font-size: 0.85rem;
  font-weight: 500;
  animation: bannerIn 0.3s ease-out;
}

.shared-banner__icon {
  flex-shrink: 0;
  font-size: 1rem;
}

.shared-banner--success {
  background: rgba(76, 175, 80, 0.15);
  border: 1px solid rgba(76, 175, 80, 0.4);
  color: #66bb6a;
}

.shared-banner--error {
  background: rgba(244, 67, 54, 0.15);
  border: 1px solid rgba(244, 67, 54, 0.4);
  color: #ef5350;
}

.shared-banner--warning {
  background: rgba(255, 193, 7, 0.15);
  border: 1px solid rgba(255, 193, 7, 0.4);
  color: #ffca28;
}

.shared-banner--info {
  background: rgba(33, 150, 243, 0.15);
  border: 1px solid rgba(33, 150, 243, 0.4);
  color: #42a5f5;
}

@keyframes bannerIn {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
