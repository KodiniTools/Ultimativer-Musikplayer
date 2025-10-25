<template>
  <aside class="panel playlist-panel">
    <div class="panel__header">
      <div class="panel-title-group">
        <i class="fa-solid fa-music"></i>
        <span>{{ t('player.playlist') }}</span>
        <span class="playlist-count-badge">{{ store.playlistCount }}</span>
      </div>
      <button 
        class="pill-button" 
        @click="store.clearPlaylist()"
        aria-label="Playlist löschen"
      >
        <span>{{ t('player.clear') }}</span>
      </button>
    </div>
    <ul class="playlist">
      <li 
        v-for="(file, index) in store.audioFiles" 
        :key="index"
        :class="{ active: index === store.currentAudioIndex }"
        @click="handleTrackClick(index)"
      >
        <span class="track-name">{{ file.name }}</span>
        <button 
          class="delete-track-btn" 
          :aria-label="`${t('player.delete.track')}: ${file.name}`"
          :title="t('player.delete.track')"
          @click.stop="handleDeleteTrack(index)"
        >
          <i class="fas fa-trash-alt"></i>
        </button>
      </li>
    </ul>
    <div class="info-tab" role="note">
      <i class="fa-solid fa-circle-info"></i>
      <span v-html="t('player.formats')"></span>
    </div>
  </aside>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { usePlayerStore } from '@/stores/playerStore'

const { t } = useI18n()
const store = usePlayerStore()

const emit = defineEmits(['trackSelected', 'trackDeleted'])

const handleTrackClick = (index) => {
  if (index === store.currentAudioIndex && store.isPlaying) {
    return
  }
  emit('trackSelected', index)
}

const handleDeleteTrack = (index) => {
  store.removeTrack(index)
  emit('trackDeleted', index)
}
</script>
