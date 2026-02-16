import { ref, onBeforeUnmount } from 'vue'

export function useAudioPlayer(store) {
  const audioElement = ref(null)
  const audioContext = ref(null)
  const analyser = ref(null)
  const dataArray = ref(null)
  const timeDomainArray = ref(null)
  const sourceNode = ref(null)
  
  let lastVolume = 1
  
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
      sourceNode.value.connect(analyser.value)
      analyser.value.connect(audioContext.value.destination)
    }
  }
  
  // Load audio file
  const loadAudioFile = (index) => {
    if (!audioElement.value) {
      console.warn('Audio element not ready')
      return
    }
    
    const file = store.audioFiles[index]
    if (!file) {
      console.warn('No file at index', index)
      return
    }
    
    console.log('Loading audio file:', file.name)
    const objectURL = URL.createObjectURL(file)
    audioElement.value.src = objectURL
    audioElement.value.load()
    
    if (!audioContext.value) {
      initAudioContext()
    }
  }
  
  // Playback controls
  const play = async () => {
    if (!audioElement.value) return
    
    // Check if a file is loaded
    if (!audioElement.value.src) {
      console.warn('No audio file loaded')
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
    } catch (error) {
      console.error('Error playing audio:', error)
      store.setPlaying(false)
    }
  }
  
  const pause = () => {
    if (!audioElement.value) return
    audioElement.value.pause()
    store.setPlaying(false)
  }
  
  const stop = () => {
    if (!audioElement.value) return
    audioElement.value.pause()
    audioElement.value.currentTime = 0
    store.setPlaying(false)
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
  
  const seek = (percentage) => {
    if (!audioElement.value || !store.duration) return
    audioElement.value.currentTime = (percentage / 100) * store.duration
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
  
  // Handle track removal: reload if the current track was replaced
  const handleTrackRemoved = (removedIndex, wasCurrentTrack) => {
    if (wasCurrentTrack && store.audioFiles.length > 0) {
      loadAudioFile(store.currentAudioIndex)
    } else if (store.audioFiles.length === 0) {
      stop()
    }
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
    handleTrackRemoved
  }
}
