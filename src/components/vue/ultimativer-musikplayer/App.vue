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

      <audio ref="audioElementRef" style="display: none"></audio>
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

    <button
      type="button"
      class="shortcuts-fab"
      :aria-label="t('shortcuts.title')"
      :title="t('shortcuts.title') + ' (?)'"
      @click="helpVisible = true"
    >
      <i class="fa-solid fa-keyboard"></i>
    </button>

    <ShortcutsHelp :visible="helpVisible" @close="helpVisible = false" />
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
  import { usePersistence } from './composables/usePersistence'
  import { useMediaSession } from './composables/useMediaSession'
  import { useKeyboardShortcuts } from './composables/useKeyboardShortcuts'
  import { useMetadata } from './composables/useMetadata'
  import { getSharedFiles, clearSharedFiles } from './utils/sharedFileRepository'

  import AppHeader from './AppHeader.vue'
  import AudioUploader from './AudioUploader.vue'
  import AudioVisualizer from './AudioVisualizer.vue'
  import VisualizerControls from './VisualizerControls.vue'
  import PlayerBar from './PlayerBar.vue'
  import Playlist from './Playlist.vue'
  import ToolCards from './ToolCards.vue'
  import ToastContainer from './ToastContainer.vue'
  import ShortcutsHelp from './ShortcutsHelp.vue'

  const { t } = useI18n()
  const store = usePlayerStore()
  const toast = useToastStore()
  useTheme()
  useI18nSync()

  const audioElementRef = ref(null)
  const audioPlayer = useAudioPlayer(store)
  const visualizer = useVisualizer(
    store,
    audioPlayer.analyser,
    audioPlayer.dataArray,
    audioPlayer.timeDomainArray
  )

  // Keyboard shortcuts help overlay
  const helpVisible = ref(false)

  // Parse ID3/FLAC metadata (title/artist/album/cover) for each track
  useMetadata(store)

  // Persist playlist + settings across reloads
  const persistence = usePersistence(store)

  // OS media-session controls (lock screen, media keys)
  useMediaSession(store, {
    play: () => audioPlayer.play(),
    pause: () => audioPlayer.pause(),
    stop: () => audioPlayer.stop(),
    next: () => audioPlayer.playNext(),
    previous: () => audioPlayer.playPrevious(),
    seek: (percentage) => audioPlayer.seek(percentage),
  })

  // Global keyboard shortcuts
  useKeyboardShortcuts(store, {
    togglePlay: () => (store.isPlaying ? audioPlayer.pause() : audioPlayer.play()),
    next: () => audioPlayer.playNext(),
    previous: () => audioPlayer.playPrevious(),
    stop: () => audioPlayer.stop(),
    seekTo: (percentage) => audioPlayer.seek(percentage),
    setVolume: (v) => audioPlayer.setVolume(v),
    toggleMute: () => audioPlayer.toggleMute(),
    toggleLoop: () => store.toggleLoop(),
    toggleShuffle: () => store.toggleShuffle(),
    toggleHelp: () => (helpVisible.value = !helpVisible.value),
    closeHelp: () => (helpVisible.value = false),
  })

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
        (r) => new File([r.blob], r.name, { type: r.mimeType || r.blob.type })
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

  async function restorePlaylist() {
    const { files, savedIndex } = await persistence.restore()
    if (!files.length) return

    store.setAudioFiles(files)
    audioPlayer.setVolume(store.volume)
    audioPlayer.initAudioContext()

    const index = Math.min(Math.max(savedIndex, 0), files.length - 1)
    store.setCurrentIndex(index)
    // Preload the track (browsers block autoplay, so we don't call play()).
    setTimeout(() => audioPlayer.loadAudioFile(index), 0)

    toast.info(t('toast.playlist.restored', { count: files.length }), {
      dismissKey: 'playlist.restored',
    })
  }

  onMounted(async () => {
    if (audioElementRef.value) {
      audioPlayer.setupAudioElement(audioElementRef.value)
    }

    const source = new URLSearchParams(window.location.search).get('source')
    if (source === 'audionormalizer') {
      await loadSharedFiles()
    } else {
      await restorePlaylist()
    }

    // Begin persisting changes only after the initial restore.
    persistence.startWatching()
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
  .shortcuts-fab {
    position: fixed;
    left: 16px;
    bottom: 96px;
    z-index: 9998;
    width: 42px;
    height: 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border-primary, rgba(255, 255, 255, 0.16));
    border-radius: 50%;
    background: var(--bg-panel, rgba(20, 38, 64, 0.9));
    color: var(--text-primary, #f9f2d5);
    font-size: 1rem;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(6px);
    transition:
      transform 0.15s ease,
      box-shadow 0.15s ease,
      background 0.15s ease;
  }

  .shortcuts-fab:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
    background: var(--bg-elevated, rgba(20, 38, 64, 0.95));
  }

  @media (max-width: 600px) {
    .shortcuts-fab {
      display: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .shortcuts-fab {
      transition: none;
    }
  }
</style>
