<template>
  <div
    class="uploader"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="handleDrop"
    :class="{ 'uploader--dragging': isDragging }"
  >
    <div class="uploader__drop-area">
      <i class="fa-solid fa-music uploader__icon"></i>
      <p class="uploader__hint">{{ t('upload.dropHint') }}</p>

      <div class="uploader__buttons">
        <button type="button" class="uploader__btn" @click="fileInputRef.click()">
          <i class="fa-solid fa-file-audio"></i>
          {{ t('upload.files') }}
        </button>
        <button type="button" class="uploader__btn" @click="folderInputRef.click()">
          <i class="fa-solid fa-folder-open"></i>
          {{ t('upload.folder') }}
        </button>
      </div>
    </div>

    <!-- Single-file input — no webkitdirectory -->
    <input
      type="file"
      id="fileInput"
      accept="audio/*"
      multiple
      ref="fileInputRef"
      @change="handleFileChange"
    />
    <!-- Folder input — webkitdirectory must be in the DOM at parse time -->
    <input
      type="file"
      id="folderInput"
      accept="audio/*"
      multiple
      webkitdirectory
      ref="folderInputRef"
      @change="handleFileChange"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePlayerStore } from './stores/playerStore'

const { t } = useI18n()
const store = usePlayerStore()
const fileInputRef = ref(null)
const folderInputRef = ref(null)
const isDragging = ref(false)

const emit = defineEmits(['filesLoaded'])

const AUDIO_TYPES = /^audio\//

function commitFiles(files) {
  const audioFiles = Array.from(files).filter(f => AUDIO_TYPES.test(f.type) || /\.(mp3|wav|flac|m4a|ogg|aac|webm|opus|aiff?)$/i.test(f.name))
  if (!audioFiles.length) return

  const wasEmpty = store.audioFiles.length === 0
  store.addAudioFiles(audioFiles)
  if (wasEmpty) emit('filesLoaded', 0)
}

const handleFileChange = (event) => {
  commitFiles(event.target.files)
  event.target.value = ''
}

// Read a FileSystemDirectoryEntry recursively and collect audio files.
function readDirectory(dirEntry) {
  return new Promise((resolve) => {
    const reader = dirEntry.createReader()
    const results = []

    const readBatch = () => {
      reader.readEntries((entries) => {
        if (!entries.length) return resolve(results)

        const promises = entries.map((entry) => {
          if (entry.isFile) {
            return new Promise((res) => entry.file((f) => res([f]), () => res([])))
          }
          if (entry.isDirectory) {
            return readDirectory(entry)
          }
          return Promise.resolve([])
        })

        Promise.all(promises).then((nested) => {
          nested.forEach((arr) => results.push(...arr))
          readBatch()
        })
      }, () => resolve(results))
    }

    readBatch()
  })
}

const handleDrop = async (event) => {
  isDragging.value = false
  const items = event.dataTransfer?.items
  if (!items) return

  const allFiles = []

  await Promise.all(
    Array.from(items).map((item) => {
      const entry = item.webkitGetAsEntry?.()
      if (!entry) return Promise.resolve()
      if (entry.isFile) {
        return new Promise((res) => entry.file((f) => { allFiles.push(f); res() }, res))
      }
      if (entry.isDirectory) {
        return readDirectory(entry).then((files) => allFiles.push(...files))
      }
      return Promise.resolve()
    })
  )

  commitFiles(allFiles)
}
</script>

<style scoped>
#fileInput,
#folderInput {
  display: none;
}

.uploader {
  border: 2px dashed var(--color-border, #444);
  border-radius: 12px;
  padding: 1.5rem 1rem;
  text-align: center;
  transition: border-color 0.2s, background 0.2s;
}

.uploader--dragging {
  border-color: var(--color-accent, #7c6af7);
  background: color-mix(in srgb, var(--color-accent, #7c6af7) 8%, transparent);
}

.uploader__drop-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.uploader__icon {
  font-size: 2rem;
  opacity: 0.5;
}

.uploader__hint {
  margin: 0;
  font-size: 0.85rem;
  opacity: 0.6;
}

.uploader__buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
}

.uploader__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1.1rem;
  border-radius: 8px;
  border: 1px solid var(--color-border, #555);
  background: var(--color-surface, #2a2a2a);
  color: inherit;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.uploader__btn:hover {
  background: var(--color-accent, #7c6af7);
  border-color: var(--color-accent, #7c6af7);
  color: #fff;
}
</style>
