<template>
  <div class="app">
    <AppHeader />
    <NavigationTabs />
    <ContentSection />

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
            :dataArray="dataArray"
            :timeDomainArray="timeDomainArray"
          />

          <VisualizerControls />

          <ProgressBar @seek="handleSeek" />

          <VolumeControl 
            @set-volume="audioPlayer.setVolume"
            @toggle-mute="audioPlayer.toggleMute"
          />

          <PlayerControls 
            @play="audioPlayer.play"
            @pause="audioPlayer.pause"
            @stop="audioPlayer.stop"
            @play-next="audioPlayer.playNext"
            @play-previous="audioPlayer.playPrevious"
          />
        </div>
      </section>

      <Playlist 
        @track-selected="handleTrackSelected"
      />

      <audio ref="audioElementRef" style="display: none;"></audio>
    </main>

    <FAQSection />
    <CookieBanner />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePlayerStore } from '@/stores/playerStore'
import { useAudioPlayer } from '@/composables/useAudioPlayer'

import AppHeader from '@/components/AppHeader.vue'
import NavigationTabs from '@/components/NavigationTabs.vue'
import ContentSection from '@/components/ContentSection.vue'
import AudioUploader from '@/components/AudioUploader.vue'
import AudioVisualizer from '@/components/AudioVisualizer.vue'
import VisualizerControls from '@/components/VisualizerControls.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import VolumeControl from '@/components/VolumeControl.vue'
import PlayerControls from '@/components/PlayerControls.vue'
import Playlist from '@/components/Playlist.vue'
import FAQSection from '@/components/FAQSection.vue'
import CookieBanner from '@/components/CookieBanner.vue'

const { t } = useI18n()
const store = usePlayerStore()

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
  console.log('Files loaded:', store.audioFiles.length, 'files')
  
  // Ensure audio element is set up first
  if (audioElementRef.value && !audioPlayer.audioElement.value) {
    console.log('Setting up audio element')
    audioPlayer.setupAudioElement(audioElementRef.value)
  }
  
  // Initialize audio context
  audioPlayer.initAudioContext()
  analyser.value = audioPlayer.analyser.value
  dataArray.value = audioPlayer.dataArray.value
  timeDomainArray.value = audioPlayer.timeDomainArray.value
  
  // Load the file explicitly
  if (store.audioFiles.length > 0) {
    console.log('Loading file at index', index)
    store.setCurrentIndex(index)
    // Give Vue a tick to update, then load the file
    setTimeout(() => {
      audioPlayer.loadAudioFile(index)
    }, 0)
  }
}

const handleTrackSelected = (index) => {
  console.log('Track selected:', index)
  store.setCurrentIndex(index)
  // Load and play immediately
  setTimeout(() => {
    audioPlayer.loadAudioFile(index)
    audioPlayer.play()
  }, 0)
}

const handleSeek = (percentage) => {
  audioPlayer.seek(percentage)
}
</script>
