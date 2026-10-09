<template>
  <div
    class="uploader"
    :class="{ 'uploader--dragging': isDragging, 'uploader--hover': isHovering }"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="handleDrop"
    @pointerenter="isHovering = true"
    @pointerleave="isHovering = false"
  >
    <div class="uploader__drop-area">
      <span class="uploader__badge" aria-hidden="true">
        <i class="fa-solid fa-cloud-arrow-up"></i>
      </span>

      <div class="uploader__text">
        <p class="uploader__title">{{ t('upload.dropHint') }}</p>
        <p class="uploader__hint">{{ t('upload.pasteHint') }}</p>
      </div>

      <div class="uploader__buttons">
        <button
          type="button"
          class="uploader__btn uploader__btn--primary"
          @click="fileInputRef.click()"
        >
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
      id="fileInput"
      ref="fileInputRef"
      type="file"
      accept="audio/*"
      multiple
      @change="handleFileChange"
    />
    <!-- Folder input — webkitdirectory must be in the DOM at parse time -->
    <input
      id="folderInput"
      ref="folderInputRef"
      type="file"
      accept="audio/*"
      multiple
      webkitdirectory
      @change="handleFileChange"
    />
  </div>
</template>

<script setup>
  import { ref, onMounted, onUnmounted } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { usePlayerStore } from './stores/playerStore'
  import { useToastStore } from './stores/toastStore'

  const { t } = useI18n()
  const store = usePlayerStore()
  const toast = useToastStore()
  const fileInputRef = ref(null)
  const folderInputRef = ref(null)
  const isDragging = ref(false)

  // Hover färbt nur den Rahmen der Dropzone (kein Spotlight, kein Glow).
  const isHovering = ref(false)

  const emit = defineEmits(['filesLoaded'])

  const AUDIO_TYPES = /^audio\//

  function commitFiles(files) {
    const audioFiles = Array.from(files).filter(
      (f) =>
        AUDIO_TYPES.test(f.type) || /\.(mp3|wav|flac|m4a|ogg|aac|webm|opus|aiff?)$/i.test(f.name)
    )
    if (!audioFiles.length) {
      toast.warning(t('toast.playlist.noAudio'), { dismissKey: 'playlist.noAudio' })
      return
    }

    const wasEmpty = store.audioFiles.length === 0
    store.addAudioFiles(audioFiles)
    toast.success(t('toast.playlist.filesAdded', { count: audioFiles.length }), {
      dismissKey: 'playlist.filesAdded',
    })
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
        reader.readEntries(
          (entries) => {
            if (!entries.length) return resolve(results)

            const promises = entries.map((entry) => {
              if (entry.isFile) {
                return new Promise((res) =>
                  entry.file(
                    (f) => res([f]),
                    () => res([])
                  )
                )
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
          },
          () => resolve(results)
        )
      }

      readBatch()
    })
  }

  const handlePaste = (event) => {
    const items = event.clipboardData?.items
    if (!items) return

    const audioFiles = []
    for (const item of Array.from(items)) {
      if (item.kind === 'file') {
        const file = item.getAsFile()
        if (file) audioFiles.push(file)
      }
    }

    if (audioFiles.length) {
      event.preventDefault()
      commitFiles(audioFiles)
    }
  }

  onMounted(() => document.addEventListener('paste', handlePaste))
  onUnmounted(() => document.removeEventListener('paste', handlePaste))

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
          return new Promise((res) =>
            entry.file((f) => {
              allFiles.push(f)
              res()
            }, res)
          )
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

  /* Dropzone: Eingabefläche mit gestricheltem Rahmen, beim Ziehen ausgewählt */
  .uploader {
    max-width: min(600px, 100%);
    margin: 0 auto var(--ds-space-4);
    padding: var(--ds-space-6);
    border: var(--ds-border-width) dashed var(--ds-border-strong);
    border-radius: var(--ds-radius-md);
    background: var(--ds-surface-2);
    text-align: center;
    transition:
      background-color var(--ds-duration) var(--ds-ease),
      border-color var(--ds-duration) var(--ds-ease);
  }

  .uploader--hover {
    border-color: var(--ds-accent);
  }

  .uploader--dragging {
    border-style: solid;
    border-color: var(--ds-accent);
    background: var(--ds-accent-soft);
  }

  .uploader__drop-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--ds-space-3);
  }

  .uploader__badge {
    display: grid;
    place-items: center;
    color: var(--ds-text-2);
    font-size: var(--ds-text-3xl);
    line-height: 1;
    transition: color var(--ds-duration) var(--ds-ease);
  }

  .uploader--hover .uploader__badge,
  .uploader--dragging .uploader__badge {
    color: var(--ds-text);
  }

  .uploader__text {
    display: flex;
    flex-direction: column;
    gap: var(--ds-space-1);
  }

  /* panel-title */
  .uploader__title {
    margin: 0;
    font-size: var(--ds-text-lg);
    font-weight: var(--ds-weight-semibold);
    color: var(--ds-text);
  }

  /* caption */
  .uploader__hint {
    margin: 0;
    font-size: var(--ds-text-sm);
    color: var(--ds-text-2);
  }

  .uploader__buttons {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--ds-space-2);
    margin-top: var(--ds-space-1);
  }

  /* Button secondary: Fläche 2, kräftiger Rahmen; Hover nur Farbe */
  .uploader__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--ds-space-2);
    height: var(--ds-control-md);
    padding: 0 var(--ds-space-4);
    border: var(--ds-border-width) solid var(--ds-border-strong);
    border-radius: var(--ds-radius-md);
    background: var(--ds-surface-1);
    color: var(--ds-text);
    font-size: var(--ds-text-md);
    font-weight: var(--ds-weight-medium);
    line-height: 1;
    cursor: pointer;
    transition:
      background-color var(--ds-duration) var(--ds-ease),
      border-color var(--ds-duration) var(--ds-ease);
  }

  .uploader__btn:hover {
    background: var(--ds-surface-3);
  }

  .uploader__btn i {
    color: var(--ds-text-2);
    font-size: var(--ds-icon-sm);
  }

  /* Hauptaktion des Uploaders: kräftiger Text, aber keine zweite Goldfläche
     (Gold füllt in dieser Ansicht nur der Wiedergabe-Button). */
  .uploader__btn--primary {
    font-weight: var(--ds-weight-semibold);
  }

  .uploader__btn--primary i {
    color: var(--ds-text);
  }

  @media (max-width: 480px) {
    .uploader {
      padding: var(--ds-space-4);
    }

    .uploader__buttons {
      flex-direction: column;
      align-items: stretch;
      width: 100%;
    }
  }
</style>
