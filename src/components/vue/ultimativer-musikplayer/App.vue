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
            :data-array="dataArray"
            :time-domain-array="timeDomainArray"
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
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePlayerStore } from './stores/playerStore'
import { useAudioPlayer } from './composables/useAudioPlayer'
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
  if (audioElementRef.value && !audioPlayer.audioElement.value) {
    audioPlayer.setupAudioElement(audioElementRef.value)
  }
  audioPlayer.initAudioContext()
  analyser.value = audioPlayer.analyser.value
  dataArray.value = audioPlayer.dataArray.value
  timeDomainArray.value = audioPlayer.timeDomainArray.value
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
