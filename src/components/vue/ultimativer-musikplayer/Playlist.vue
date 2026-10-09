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
    padding: var(--ds-space-3) var(--ds-space-5);
    border-bottom: var(--ds-border-width) solid var(--ds-border);
  }

  .playlist-search__icon {
    position: absolute;
    left: calc(var(--ds-space-5) + var(--ds-space-3));
    top: 50%;
    transform: translateY(-50%);
    color: var(--ds-text-3);
    font-size: var(--ds-text-sm);
    pointer-events: none;
  }

  /* TextField: Höhe lg, Fläche 2, Fokus färbt den Rahmen */
  .playlist-search__input {
    width: 100%;
    height: var(--ds-control-lg);
    padding: 0 var(--ds-space-3) 0 var(--ds-space-8);
    border: var(--ds-border-width) solid var(--ds-border-strong);
    border-radius: var(--ds-radius-md);
    background: var(--ds-surface-2);
    color: var(--ds-text);
    font-size: var(--ds-text-md);
    outline: none;
    transition:
      border-color var(--ds-duration) var(--ds-ease),
      box-shadow var(--ds-duration) var(--ds-ease);
  }

  .playlist-search__input::placeholder {
    color: var(--ds-text-3);
  }

  .playlist-search__input:focus-visible {
    border-color: var(--ds-accent);
    box-shadow: var(--ds-focus-ring);
  }

  .playlist-empty {
    padding: var(--ds-space-5);
    color: var(--ds-text-2);
    font-size: var(--ds-text-sm);
    text-align: center;
    cursor: default;
  }

  .playlist .playlist-empty:hover {
    background: transparent;
  }

  .drag-handle {
    flex-shrink: 0;
    margin-right: calc(-1 * var(--ds-space-1));
    color: var(--ds-text-3);
    font-size: var(--ds-text-sm);
    cursor: grab;
    transition: color var(--ds-duration) var(--ds-ease);
  }

  .playlist li:hover .drag-handle {
    color: var(--ds-text-2);
  }

  .playlist li.is-dragging {
    opacity: 0.45;
  }

  .playlist li.is-drop-target {
    border-top-color: var(--ds-accent);
  }

  /* Thumbnail: radius sm, Fläche 2 */
  .track-thumb {
    flex-shrink: 0;
    width: var(--ds-control-md);
    height: var(--ds-control-md);
    display: grid;
    place-items: center;
    border: var(--ds-border-width) solid var(--ds-border);
    border-radius: var(--ds-radius-sm);
    background: var(--ds-surface-2);
    color: var(--ds-text-2);
    font-size: var(--ds-text-sm);
    overflow: hidden;
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
  }

  .track-info .track-name {
    flex-grow: 0;
  }

  .track-artist {
    color: var(--ds-text-2);
    font-size: var(--ds-text-sm);
    font-weight: var(--ds-weight-regular);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @media (max-width: 768px) {
    .playlist-search {
      padding-inline: var(--ds-space-4);
    }

    .playlist-search__icon {
      left: calc(var(--ds-space-4) + var(--ds-space-3));
    }
  }
</style>
