<template>
  <div class="app">
    <AppHeader />

    <main class="app__main">
      <section class="panel">
        <div class="panel__body">
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

    <ToastContainer />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePlayerStore } from './stores/playerStore'
import { useToastStore } from './stores/toastStore'
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
import ToastContainer from './ToastContainer.vue'

const { t } = useI18n()
const store = usePlayerStore()
const toast = useToastStore()
useTheme()
useI18nSync()

const audioElementRef = ref(null)
const audioPlayer = useAudioPlayer(store)
const visualizer  = useVisualizer(store, audioPlayer.analyser, audioPlayer.dataArray, audioPlayer.timeDomainArray)

// Shared files loading state
let sharedHandled = false

async function loadSharedFiles() {
  if (sharedHandled) return
  sharedHandled = true

  let loadingId = null

  try {
    const records = await getSharedFiles()
    if (!records?.length) {
      toast.warning(t('shared.empty'), { dismissKey: 'shared.empty' })
      return
    }

    loadingId = toast.info(t('shared.loading', { count: records.length }), {
      duration: 0,
      dismissKey: 'shared.loading',
    })

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
    toast.remove(loadingId)
    toast.success(t('shared.loaded', { count: files.length }), { dismissKey: 'shared.loaded' })
  } catch (err) {
    console.error('[Musikplayer] Error loading shared files:', err)
    toast.remove(loadingId)
    toast.error(t('shared.error'), { dismissKey: 'shared.error' })
  }
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

