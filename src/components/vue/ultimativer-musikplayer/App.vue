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

          <EqualizerControls class="eq-bar" />
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
        @seek="audioPlayer.seek"
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
  import { useSettingsSync } from './composables/useSettingsSync'
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
  import EqualizerControls from './EqualizerControls.vue'

  const { t } = useI18n()
  const store = usePlayerStore()
  const toast = useToastStore()
  useSettingsSync()

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

  // Attach the <audio> element (if not done yet) and create the audio graph.
  function ensureAudioReady() {
    if (audioElementRef.value && !audioPlayer.audioElement.value) {
      audioPlayer.setupAudioElement(audioElementRef.value)
    }
    audioPlayer.initAudioContext()
  }

  // Select a track and load it on the next tick (without starting playback).
  function preloadTrack(index) {
    store.setCurrentIndex(index)
    setTimeout(() => audioPlayer.loadAudioFile(index), 0)
  }

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

      ensureAudioReady()

      if (wasEmpty && store.audioFiles.length > 0) {
        preloadTrack(0)
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
    ensureAudioReady()

    // Preload the track (browsers block autoplay, so we don't call play()).
    preloadTrack(Math.min(Math.max(savedIndex, 0), files.length - 1))

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
    ensureAudioReady()
    if (store.audioFiles.length > 0) {
      preloadTrack(index)
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
</script>

<style scoped>
  .eq-bar {
    margin-top: var(--ds-space-3);
  }

  /* Freistehender Icon-Button über der Player-Leiste: schwebt, daher Overlay-Schatten */
  .shortcuts-fab {
    position: fixed;
    left: var(--ds-space-4);
    bottom: 96px;
    z-index: var(--ds-z-player);
    width: var(--ds-control-lg);
    height: var(--ds-control-lg);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: var(--ds-border-width) solid var(--ds-border-strong);
    border-radius: var(--ds-radius-full);
    background: var(--ds-surface-1);
    color: var(--ds-text-2);
    font-size: var(--ds-icon-sm);
    cursor: pointer;
    box-shadow: var(--ds-shadow-overlay);
    transition:
      background-color var(--ds-duration) var(--ds-ease),
      color var(--ds-duration) var(--ds-ease);
  }

  .shortcuts-fab:hover {
    background: var(--ds-surface-3);
    color: var(--ds-text);
  }

  .shortcuts-fab:focus-visible {
    box-shadow: var(--ds-focus-ring);
  }

  @media (max-width: 600px) {
    .shortcuts-fab {
      display: none;
    }
  }
</style>
