import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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
  
  // Visualizer state
  const vizMode = ref('ribbon')
  const vizIntensity = ref(0.65)
  
  // Computed
  const currentFile = computed(() => {
    return audioFiles.value[currentAudioIndex.value] || null
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
    
    // Computed
    currentFile,
    playlistCount,
    progress,
    remainingTime,
    
    // Actions
    setAudioFiles,
    addAudioFiles,
    removeTrack,
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
    setVizIntensity
  }
})
