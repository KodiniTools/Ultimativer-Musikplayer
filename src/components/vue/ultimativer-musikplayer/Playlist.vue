<template>
  <aside class="panel playlist-panel">
    <div class="panel__header">
      <div class="panel-title-group">
        <i class="fa-solid fa-music"></i>
        <span>{{ t('player.playlist') }}</span>
        <span class="playlist-count-badge">{{ store.playlistCount }}</span>
      </div>
      <button
        class="clear-all-btn"
        :title="t('player.clear')"
        aria-label="Playlist löschen"
        @click="handleClearPlaylist"
      >
        <i class="fas fa-trash"></i>
      </button>
    </div>
    <ul class="playlist">
      <li
        v-for="(file, index) in store.audioFiles"
        :key="index"
        :class="{ active: index === store.currentAudioIndex }"
        @click="handleTrackClick(index)"
      >
        <span class="track-thumb" :class="{ 'track-thumb--cover': metaFor(file)?.coverUrl }">
          <img v-if="metaFor(file)?.coverUrl" :src="metaFor(file).coverUrl" alt="" />
          <i v-else class="fas fa-music"></i>
        </span>
        <span class="track-info">
          <span class="track-name">{{ metaFor(file)?.title || file.name }}</span>
          <span v-if="metaFor(file)?.artist" class="track-artist">{{ metaFor(file).artist }}</span>
        </span>
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
      <!-- eslint-disable-next-line vue/no-v-html -->
      <span v-html="t('player.formats')"></span>
    </div>
  </aside>
</template>

<script setup>
  import { useI18n } from 'vue-i18n'
  import { usePlayerStore } from './stores/playerStore'
  import { useToastStore } from './stores/toastStore'

  const { t } = useI18n()
  const store = usePlayerStore()
  const toast = useToastStore()

  const metaFor = (file) => store.getMeta(file)

  const emit = defineEmits(['trackSelected', 'trackDeleted', 'playlistCleared'])

  const handleClearPlaylist = () => {
    if (store.playlistCount === 0) return
    emit('playlistCleared')
    toast.info(t('toast.playlist.cleared'), { dismissKey: 'playlist.cleared' })
  }

  const handleTrackClick = (index) => {
    if (index === store.currentAudioIndex && store.isPlaying) {
      return
    }
    emit('trackSelected', index)
  }

  const handleDeleteTrack = (index) => {
    const wasCurrentTrack = index === store.currentAudioIndex
    store.removeTrack(index)
    emit('trackDeleted', { index, wasCurrentTrack })
    toast.info(t('toast.playlist.trackRemoved'), { dismissKey: 'playlist.trackRemoved' })
  }
</script>

<style scoped>
  .track-thumb {
    flex-shrink: 0;
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border-radius: 8px;
    background: linear-gradient(135deg, var(--accent, #014f99), var(--primary-dark, #003971));
    color: #f5f4d6;
    font-size: 0.85rem;
    overflow: hidden;
  }

  .track-thumb--cover {
    background: none;
  }

  .track-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .track-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .track-info .track-name {
    flex-grow: 0;
  }

  .track-artist {
    font-size: 0.75rem;
    font-weight: 400;
    opacity: 0.65;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
