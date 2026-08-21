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
    <div v-if="store.playlistCount > 0" class="playlist-search">
      <i class="fa-solid fa-magnifying-glass playlist-search__icon"></i>
      <input
        v-model="query"
        type="search"
        class="playlist-search__input"
        :placeholder="t('player.search')"
        :aria-label="t('player.search')"
      />
    </div>

    <ul class="playlist">
      <li
        v-for="{ file, index } in filteredTracks"
        :key="index"
        :class="{
          active: index === store.currentAudioIndex,
          'is-dragging': index === dragIndex,
          'is-drop-target': index === dropTargetIndex,
        }"
        :draggable="canReorder"
        @click="handleTrackClick(index)"
        @dragstart="onDragStart(index, $event)"
        @dragover.prevent="onDragOver(index)"
        @drop.prevent="onDrop(index)"
        @dragend="onDragEnd"
      >
        <i v-if="canReorder" class="fa-solid fa-grip-vertical drag-handle" aria-hidden="true"></i>
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
      <li v-if="store.playlistCount > 0 && filteredTracks.length === 0" class="playlist-empty">
        {{ t('player.noResults') }}
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
  import { ref, computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { usePlayerStore } from './stores/playerStore'
  import { useToastStore } from './stores/toastStore'

  const { t } = useI18n()
  const store = usePlayerStore()
  const toast = useToastStore()

  const metaFor = (file) => store.getMeta(file)

  const emit = defineEmits(['trackSelected', 'trackDeleted', 'playlistCleared'])

  // --- Search / filter ---
  const query = ref('')

  const filteredTracks = computed(() => {
    const q = query.value.trim().toLowerCase()
    const all = store.audioFiles.map((file, index) => ({ file, index }))
    if (!q) return all
    return all.filter(({ file }) => {
      const meta = store.getMeta(file) || {}
      return (
        file.name.toLowerCase().includes(q) ||
        (meta.title || '').toLowerCase().includes(q) ||
        (meta.artist || '').toLowerCase().includes(q) ||
        (meta.album || '').toLowerCase().includes(q)
      )
    })
  })

  // Reordering only makes sense on the full, unfiltered list.
  const canReorder = computed(() => query.value.trim() === '' && store.playlistCount > 1)

  // --- Drag & drop reorder ---
  const dragIndex = ref(-1)
  const dropTargetIndex = ref(-1)

  const onDragStart = (index, event) => {
    if (!canReorder.value) return
    dragIndex.value = index
    event.dataTransfer.effectAllowed = 'move'
    // Firefox requires data to be set for dragging to start.
    event.dataTransfer.setData('text/plain', String(index))
  }

  const onDragOver = (index) => {
    if (dragIndex.value === -1) return
    dropTargetIndex.value = index
  }

  const onDrop = (index) => {
    if (dragIndex.value === -1 || dragIndex.value === index) {
      onDragEnd()
      return
    }
    store.moveTrack(dragIndex.value, index)
    onDragEnd()
  }

  const onDragEnd = () => {
    dragIndex.value = -1
    dropTargetIndex.value = -1
  }

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
  .playlist-search {
    position: relative;
    padding: 10px 16px;
    border-bottom: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
  }

  .playlist-search__icon {
    position: absolute;
    left: 26px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.8rem;
    opacity: 0.5;
    pointer-events: none;
  }

  .playlist-search__input {
    width: 100%;
    padding: 8px 12px 8px 32px;
    border-radius: 8px;
    border: 1px solid var(--border-primary, rgba(255, 255, 255, 0.16));
    background: var(--bg-surface, rgba(255, 255, 255, 0.06));
    color: var(--text-primary, inherit);
    font-size: 0.85rem;
    outline: none;
    transition:
      border-color 0.15s ease,
      box-shadow 0.15s ease;
  }

  .playlist-search__input:focus {
    border-color: var(--accent, #7c6af7);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent, #7c6af7) 25%, transparent);
  }

  .playlist-empty {
    padding: 20px;
    text-align: center;
    font-size: 0.85rem;
    opacity: 0.6;
    cursor: default;
  }

  .drag-handle {
    flex-shrink: 0;
    font-size: 0.8rem;
    opacity: 0.35;
    cursor: grab;
    margin-right: -4px;
  }

  .playlist li:hover .drag-handle {
    opacity: 0.6;
  }

  .playlist li.is-dragging {
    opacity: 0.4;
  }

  .playlist li.is-drop-target {
    box-shadow: inset 0 2px 0 var(--accent, #7c6af7);
  }

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
