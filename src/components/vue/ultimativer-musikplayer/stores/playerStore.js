import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useToastStore } from './toastStore'
import { fileKey } from '../utils/audioMetadata'
import { EQ_BAND_COUNT, EQ_PRESETS } from '../utils/equalizerPresets'

export const usePlayerStore = defineStore('player', () => {
  // State
  const audioFiles = ref([])
  const currentAudioIndex = ref(0)
  const isPlaying = ref(false)
  const loopPlaylist = ref(false)
  const shufflePlaylist = ref(false)
  const isMuted = ref(false)
  const volume = ref(1)
  const currentTime = ref(0)
  const duration = ref(0)

  // Parsed track metadata (title/artist/album/cover), keyed by fileKey.
  const trackMeta = ref({})

  // Visualizer state
  const vizMode = ref('ribbon')
  const vizIntensity = ref(0.65)
  const isStopped = ref(false)

  // Equalizer state
  const eqEnabled = ref(false)
  const eqBands = ref(new Array(EQ_BAND_COUNT).fill(0))
  const eqPreset = ref('flat')

  // Computed
  const currentFile = computed(() => {
    return audioFiles.value[currentAudioIndex.value] || null
  })

  const currentMeta = computed(() => {
    const file = currentFile.value
    return file ? trackMeta.value[fileKey(file)] || null : null
  })

  const playlistCount = computed(() => audioFiles.value.length)

  const progress = computed(() => {
    if (!duration.value) return 0
    return (currentTime.value / duration.value) * 100
  })

  const remainingTime = computed(() => {
    return Math.max(0, duration.value - currentTime.value)
  })

  // Actions
  function setAudioFiles(files) {
    audioFiles.value = Array.from(files)
    if (audioFiles.value.length > 0 && currentAudioIndex.value >= audioFiles.value.length) {
      currentAudioIndex.value = 0
    }
  }

  function addAudioFiles(files) {
    const newFiles = Array.from(files)
    audioFiles.value.push(...newFiles)
  }

  function removeTrack(index) {
    if (index < 0 || index >= audioFiles.value.length) return

    const wasCurrentTrack = index === currentAudioIndex.value
    audioFiles.value.splice(index, 1)

    if (audioFiles.value.length === 0) {
      currentAudioIndex.value = 0
      isPlaying.value = false
    } else {
      if (index < currentAudioIndex.value) {
        currentAudioIndex.value--
      } else if (wasCurrentTrack) {
        currentAudioIndex.value = Math.min(currentAudioIndex.value, audioFiles.value.length - 1)
      }
    }
  }

  // Reorder a track from one position to another, keeping the currently
  // playing track selected.
  function moveTrack(from, to) {
    const len = audioFiles.value.length
    if (from === to || from < 0 || from >= len || to < 0 || to >= len) return

    const [moved] = audioFiles.value.splice(from, 1)
    audioFiles.value.splice(to, 0, moved)

    const cur = currentAudioIndex.value
    if (cur === from) {
      currentAudioIndex.value = to
    } else if (from < cur && to >= cur) {
      currentAudioIndex.value = cur - 1
    } else if (from > cur && to <= cur) {
      currentAudioIndex.value = cur + 1
    }
  }

  function clearPlaylist() {
    audioFiles.value = []
    currentAudioIndex.value = 0
    isPlaying.value = false
    currentTime.value = 0
    duration.value = 0
  }

  function setCurrentIndex(index) {
    if (index >= 0 && index < audioFiles.value.length) {
      currentAudioIndex.value = index
    }
  }

  function playNext() {
    if (audioFiles.value.length === 0) return false

    if (shufflePlaylist.value) {
      if (audioFiles.value.length === 1) {
        // Single track: respect loop setting
        if (loopPlaylist.value) {
          // Index stays 0, but signal to reload and play
          return true
        }
        return false
      }
      // Pick a random track different from the current one
      let nextIndex
      do {
        nextIndex = Math.floor(Math.random() * audioFiles.value.length)
      } while (nextIndex === currentAudioIndex.value)
      currentAudioIndex.value = nextIndex
      return true
    }

    // Sequential mode
    const nextIndex = currentAudioIndex.value + 1
    if (nextIndex >= audioFiles.value.length) {
      if (loopPlaylist.value) {
        currentAudioIndex.value = 0
        return true
      }
      return false
    }
    currentAudioIndex.value = nextIndex
    return true
  }

  function playPrevious() {
    if (audioFiles.value.length === 0) return false

    if (currentAudioIndex.value > 0) {
      currentAudioIndex.value--
      return true
    } else if (loopPlaylist.value) {
      currentAudioIndex.value = audioFiles.value.length - 1
      return true
    }
    return false
  }

  function toggleLoop() {
    loopPlaylist.value = !loopPlaylist.value
  }

  function toggleShuffle() {
    shufflePlaylist.value = !shufflePlaylist.value
  }

  function toggleMute() {
    isMuted.value = !isMuted.value
  }

  function setVolume(value) {
    volume.value = value
    if (value > 0 && isMuted.value) {
      isMuted.value = false
    }
  }

  function setCurrentTime(time) {
    currentTime.value = time
  }

  function setDuration(time) {
    duration.value = time
  }

  function setPlaying(value) {
    isPlaying.value = value
  }

  function setVizMode(mode) {
    vizMode.value = mode
  }

  function setVizIntensity(intensity) {
    vizIntensity.value = intensity
  }

  function setStopped(value) {
    isStopped.value = value
  }

  // --- Equalizer actions ---
  function setEqEnabled(value) {
    eqEnabled.value = value
  }

  function setEqBand(index, valueDb) {
    if (index < 0 || index >= eqBands.value.length) return
    eqBands.value[index] = valueDb
    eqPreset.value = 'custom'
  }

  function applyEqPreset(name) {
    const preset = EQ_PRESETS[name]
    if (!preset) return
    eqBands.value = [...preset]
    eqPreset.value = name
  }

  function setEqState({ enabled, bands, preset }) {
    if (typeof enabled === 'boolean') eqEnabled.value = enabled
    if (Array.isArray(bands) && bands.length === eqBands.value.length) {
      eqBands.value = bands.map((v) => Number(v) || 0)
    }
    if (typeof preset === 'string') eqPreset.value = preset
  }

  // Store parsed metadata for a track and return the metadata for a file.
  function setTrackMeta(key, meta) {
    trackMeta.value[key] = meta
  }

  function getMeta(file) {
    return file ? trackMeta.value[fileKey(file)] || null : null
  }

  // Surface an error as a toast. `dismissKey` gives the message a stable
  // identity so the user can choose "don't show again" for it.
  function setError(message, opts = {}) {
    const toast = useToastStore()
    const toastOpts = { dismissKey: opts.dismissKey }
    if (opts.duration != null) toastOpts.duration = opts.duration
    toast.error(message, toastOpts)
  }

  return {
    // State
    audioFiles,
    currentAudioIndex,
    isPlaying,
    loopPlaylist,
    shufflePlaylist,
    isMuted,
    volume,
    currentTime,
    duration,
    vizMode,
    vizIntensity,
    isStopped,
    trackMeta,
    eqEnabled,
    eqBands,
    eqPreset,

    // Computed
    currentFile,
    currentMeta,
    playlistCount,
    progress,
    remainingTime,

    // Actions
    setAudioFiles,
    addAudioFiles,
    removeTrack,
    moveTrack,
    clearPlaylist,
    setCurrentIndex,
    playNext,
    playPrevious,
    toggleLoop,
    toggleShuffle,
    toggleMute,
    setVolume,
    setCurrentTime,
    setDuration,
    setPlaying,
    setVizMode,
    setVizIntensity,
    setStopped,
    setEqEnabled,
    setEqBand,
    applyEqPreset,
    setEqState,
    setTrackMeta,
    getMeta,
    setError,
  }
})
