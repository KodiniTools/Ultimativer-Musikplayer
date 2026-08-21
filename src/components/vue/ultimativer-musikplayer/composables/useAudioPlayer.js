import { ref, watch, onBeforeUnmount } from 'vue'
import i18n from '../i18n'
import { EQ_FREQUENCIES } from '../utils/equalizerPresets'

const t = (key, params) => i18n.global.t(key, params)

export function useAudioPlayer(store) {
  const audioElement = ref(null)
  const audioContext = ref(null)
  const analyser = ref(null)
  const dataArray = ref(null)
  const timeDomainArray = ref(null)
  const sourceNode = ref(null)

  let lastVolume = 1
  let currentObjectURL = null
  let eqFilters = []

  // Build the equalizer BiquadFilter chain and return the head/tail nodes.
  const buildEqChain = () => {
    eqFilters = EQ_FREQUENCIES.map((freq, i) => {
      const filter = audioContext.value.createBiquadFilter()
      if (i === 0) filter.type = 'lowshelf'
      else if (i === EQ_FREQUENCIES.length - 1) filter.type = 'highshelf'
      else filter.type = 'peaking'
      filter.frequency.value = freq
      filter.Q.value = 1
      filter.gain.value = 0
      return filter
    })
    for (let i = 0; i < eqFilters.length - 1; i++) {
      eqFilters[i].connect(eqFilters[i + 1])
    }
    return { head: eqFilters[0], tail: eqFilters[eqFilters.length - 1] }
  }

  // Apply the store's EQ state to the filter gains (0 dB = transparent).
  const applyEq = () => {
    if (!eqFilters.length) return
    eqFilters.forEach((filter, i) => {
      const gain = store.eqEnabled ? store.eqBands[i] || 0 : 0
      filter.gain.value = gain
    })
  }

  // Initialize Audio Context
  const initAudioContext = () => {
    if (audioContext.value) return

    audioContext.value = new (window.AudioContext || window.webkitAudioContext)()
    analyser.value = audioContext.value.createAnalyser()
    analyser.value.fftSize = 512

    dataArray.value = new Uint8Array(analyser.value.frequencyBinCount)
    timeDomainArray.value = new Uint8Array(analyser.value.fftSize)

    if (audioElement.value && !sourceNode.value) {
      sourceNode.value = audioContext.value.createMediaElementSource(audioElement.value)
      // source -> EQ chain -> analyser -> destination
      const { head, tail } = buildEqChain()
      sourceNode.value.connect(head)
      tail.connect(analyser.value)
      analyser.value.connect(audioContext.value.destination)
      applyEq()
    }
  }

  // Keep the filter gains in sync with the store.
  watch(() => store.eqEnabled, applyEq)
  watch(() => store.eqBands, applyEq, { deep: true })

  // Load audio file
  const loadAudioFile = (index) => {
    if (!audioElement.value) {
      store.setError(t('toast.audio.notReady'), { dismissKey: 'audio.notReady' })
      return
    }

    const file = store.audioFiles[index]
    if (!file) {
      store.setError(t('toast.audio.trackNotFound'), { dismissKey: 'audio.trackNotFound' })
      return
    }

    if (currentObjectURL) {
      URL.revokeObjectURL(currentObjectURL)
    }
    const objectURL = URL.createObjectURL(file)
    currentObjectURL = objectURL
    audioElement.value.src = objectURL
    audioElement.value.load()

    if (!audioContext.value) {
      initAudioContext()
    }
  }

  // Playback controls
  const play = async () => {
    if (!audioElement.value) return

    if (!audioElement.value.src) {
      store.setError(t('toast.audio.noFile'), { dismissKey: 'audio.noFile' })
      return
    }

    if (!audioContext.value) {
      initAudioContext()
    }

    if (audioContext.value.state === 'suspended') {
      await audioContext.value.resume()
    }

    try {
      await audioElement.value.play()
      store.setPlaying(true)
      store.setStopped(false)
    } catch {
      store.setError(t('toast.audio.playbackFailed'), { dismissKey: 'audio.playbackFailed' })
      store.setPlaying(false)
    }
  }

  const pause = () => {
    if (!audioElement.value) return
    audioElement.value.pause()
    store.setPlaying(false)
    store.setStopped(false)
  }

  const stop = () => {
    if (!audioElement.value) return
    audioElement.value.pause()
    audioElement.value.currentTime = 0
    store.setPlaying(false)
    store.setStopped(true)
  }

  const playNext = () => {
    const shouldPlay = store.playNext()
    if (shouldPlay) {
      loadAudioFile(store.currentAudioIndex)
      play()
    } else {
      stop()
    }
  }

  const playPrevious = () => {
    const shouldPlay = store.playPrevious()
    if (shouldPlay) {
      loadAudioFile(store.currentAudioIndex)
      play()
    }
  }

  const seek = async (percentage) => {
    if (!audioElement.value || !store.duration) return
    try {
      if (audioContext.value?.state === 'suspended') {
        await audioContext.value.resume()
      }
      const targetTime = Math.max(0, Math.min((percentage / 100) * store.duration, store.duration))
      audioElement.value.currentTime = targetTime
    } catch {
      store.setError(t('toast.audio.seekFailed'), { dismissKey: 'audio.seekFailed' })
    }
  }

  const toggleMute = () => {
    if (!audioElement.value) return

    store.toggleMute()

    if (store.isMuted) {
      lastVolume = audioElement.value.volume
      audioElement.value.volume = 0
    } else {
      audioElement.value.volume = lastVolume
    }
  }

  const setVolume = (value) => {
    if (!audioElement.value) return
    audioElement.value.volume = value
    store.setVolume(value)
  }

  // Event handlers
  const onTimeUpdate = () => {
    if (!audioElement.value) return
    store.setCurrentTime(audioElement.value.currentTime)
  }

  const onLoadedMetadata = () => {
    if (!audioElement.value) return
    store.setDuration(audioElement.value.duration)
  }

  const onEnded = () => {
    playNext()
  }

  // Setup audio element
  const setupAudioElement = (element) => {
    audioElement.value = element

    if (element) {
      element.addEventListener('timeupdate', onTimeUpdate)
      element.addEventListener('loadedmetadata', onLoadedMetadata)
      element.addEventListener('ended', onEnded)
      element.volume = store.volume
    }
  }

  // Stop playback and fully unload the media element (frees the source)
  const unloadAudio = () => {
    if (!audioElement.value) return
    audioElement.value.pause()
    audioElement.value.removeAttribute('src')
    audioElement.value.load()
    if (currentObjectURL) {
      URL.revokeObjectURL(currentObjectURL)
      currentObjectURL = null
    }
    store.setPlaying(false)
    store.setStopped(false)
    store.setCurrentTime(0)
    store.setDuration(0)
  }

  // Handle track removal: reload the replacement track and keep the
  // play/pause state consistent.
  const handleTrackRemoved = (removedIndex, wasCurrentTrack) => {
    if (store.audioFiles.length === 0) {
      unloadAudio()
      return
    }
    if (wasCurrentTrack) {
      const wasPlaying = store.isPlaying
      loadAudioFile(store.currentAudioIndex)
      if (wasPlaying) {
        play() // continue with the track that took its place
      } else {
        store.setPlaying(false)
      }
    }
  }

  // Clear the whole playlist: stop audio, unload element, reset store
  const clearPlaylist = () => {
    unloadAudio()
    store.clearPlaylist()
  }

  // Cleanup
  onBeforeUnmount(() => {
    if (audioElement.value) {
      audioElement.value.removeEventListener('timeupdate', onTimeUpdate)
      audioElement.value.removeEventListener('loadedmetadata', onLoadedMetadata)
      audioElement.value.removeEventListener('ended', onEnded)
    }
  })

  return {
    audioElement,
    analyser,
    dataArray,
    timeDomainArray,
    setupAudioElement,
    initAudioContext,
    loadAudioFile,
    play,
    pause,
    stop,
    playNext,
    playPrevious,
    seek,
    toggleMute,
    setVolume,
    handleTrackRemoved,
    clearPlaylist,
  }
}
