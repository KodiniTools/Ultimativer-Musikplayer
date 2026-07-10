<template>
  <div
    class="player-bar"
    :class="{ 'player-bar--active': hasTrack }"
    role="region"
    :aria-label="t('nav.current')"
  >
    <div class="player-bar__inner">
      <!-- Track info -->
      <div class="player-bar__track">
        <div
          class="player-bar__thumb"
          :class="{ 'player-bar__thumb--spinning': store.isPlaying }"
        >
          <i class="fas fa-music"></i>
        </div>
        <div class="player-bar__meta">
          <div class="player-bar__title">{{ trackTitle }}</div>
          <div class="player-bar__subtitle">{{ subtitle }}</div>
        </div>
      </div>

      <!-- Center: transport controls -->
      <div class="player-bar__controls" role="group" :aria-label="t('nav.current')">
        <button
          class="pbar-btn"
          :class="{ 'pbar-btn--active': store.shufflePlaylist }"
          :aria-pressed="store.shufflePlaylist"
          :aria-label="store.shufflePlaylist ? t('player.shuffle.on') : t('player.shuffle.off')"
          @click="store.toggleShuffle()"
        >
          <i class="fas fa-shuffle"></i>
        </button>
        <button
          class="pbar-btn"
          :aria-label="t('player.prev')"
          @click="emit('playPrevious')"
        >
          <i class="fas fa-backward-step"></i>
        </button>
        <button
          class="pbar-btn"
          :aria-label="t('player.stop')"
          @click="emit('stop')"
        >
          <i class="fas fa-stop"></i>
        </button>
        <button
          class="pbar-btn pbar-btn--play"
          :aria-label="store.isPlaying ? t('player.pause') : t('player.play')"
          @click="togglePlay"
        >
          <i :class="store.isPlaying ? 'fas fa-pause' : 'fas fa-play'"></i>
        </button>
        <button
          class="pbar-btn"
          :aria-label="t('player.next')"
          @click="emit('playNext')"
        >
          <i class="fas fa-forward-step"></i>
        </button>
        <button
          class="pbar-btn"
          :class="{ 'pbar-btn--active': store.loopPlaylist }"
          :aria-pressed="store.loopPlaylist"
          :aria-label="store.loopPlaylist ? t('player.loop.on') : t('player.loop.off')"
          @click="store.toggleLoop()"
        >
          <i class="fas fa-repeat"></i>
        </button>
      </div>

      <!-- Right: volume -->
      <div class="player-bar__right">
        <VolumeControl
          @set-volume="emit('setVolume', $event)"
          @toggle-mute="emit('toggleMute')"
        />
      </div>

      <!-- Progress (full-width row) -->
      <ProgressBar class="player-bar__progress" @seek="emit('seek', $event)" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePlayerStore } from './stores/playerStore'
import ProgressBar from './ProgressBar.vue'
import VolumeControl from './VolumeControl.vue'

const { t } = useI18n()
const store = usePlayerStore()

const emit = defineEmits([
  'play',
  'pause',
  'stop',
  'playNext',
  'playPrevious',
  'seek',
  'setVolume',
  'toggleMute',
])

const hasTrack = computed(() => store.audioFiles.length > 0 && !!store.currentFile)

const trackTitle = computed(() =>
  store.currentFile ? store.currentFile.name : t('player.nofile'),
)

const subtitle = computed(() => {
  if (!hasTrack.value) return t('player.ready')
  return t('player.trackOf', {
    index: store.currentAudioIndex + 1,
    total: store.audioFiles.length,
  })
})

const togglePlay = () => {
  if (store.isPlaying) emit('pause')
  else emit('play')
}
</script>
