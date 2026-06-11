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

          <AudioVisualizer :on-init="visualizer.initCanvas" />

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

import AppHeader from './AppHeader.vue'
import AudioUploader from './AudioUploader.vue'
import AudioVisualizer from './AudioVisualizer.vue'
import VisualizerControls from './VisualizerControls.vue'
import ProgressBar from './ProgressBar.vue'
import VolumeControl from './VolumeControl.vue'
import PlayerControls from './PlayerControls.vue'
import Playlist from './Playlist.vue'
import ToolCards from './ToolCards.vue'

const { t } = useI18n()
const store = usePlayerStore()
useTheme()
useI18nSync()

const audioElementRef = ref(null)
const audioPlayer = useAudioPlayer(store)
const visualizer  = useVisualizer(store, audioPlayer.analyser, audioPlayer.dataArray, audioPlayer.timeDomainArray)

onMounted(() => {
  if (audioElementRef.value) {
    audioPlayer.setupAudioElement(audioElementRef.value)
  }
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
</style>
