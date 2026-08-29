<template>
  <div
    class="uploader"
    :class="{ 'uploader--dragging': isDragging, 'uploader--hover': isHovering }"
    :style="pointerStyle"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="handleDrop"
    @pointermove="handlePointerMove"
    @pointerenter="isHovering = true"
    @pointerleave="isHovering = false"
  >
    <span class="uploader__spotlight" aria-hidden="true"></span>

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
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { usePlayerStore } from './stores/playerStore'
  import { useToastStore } from './stores/toastStore'

  const { t } = useI18n()
  const store = usePlayerStore()
  const toast = useToastStore()
  const fileInputRef = ref(null)
  const folderInputRef = ref(null)
  const isDragging = ref(false)

  // Cursor-following spotlight: track the pointer position inside the
  // drop area and expose it to CSS as custom properties.
  const isHovering = ref(false)
  const pointerX = ref(50)
  const pointerY = ref(50)

  const pointerStyle = computed(() => ({
    '--pointer-x': `${pointerX.value}%`,
    '--pointer-y': `${pointerY.value}%`,
  }))

  const handlePointerMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    pointerX.value = ((event.clientX - rect.left) / rect.width) * 100
    pointerY.value = ((event.clientY - rect.top) / rect.height) * 100
  }

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

  .uploader {
    /* Brand accent + spotlight colors, adjustable per theme below. */
    --up-accent: var(--accent, #014f99);
    --up-spot: rgba(1, 79, 153, 0.14);

    /* Keep the drop area no wider than the visualizer container. */
    max-width: min(600px, 100%);
    margin: 0 auto 20px;

    position: relative;
    overflow: hidden;
    border: 2px dashed var(--border-accent, rgba(1, 79, 153, 0.35));
    border-radius: 18px;
    padding: 1.75rem 1.5rem;
    text-align: center;
    background: var(--glass-bg, rgba(255, 255, 255, 0.06));
    box-shadow: var(--shadow-3d-sm);
    transition:
      border-color 0.25s ease,
      background 0.25s ease,
      box-shadow 0.25s ease;
  }

  /* Stronger glow on the dark background for good visibility. */
  html[data-theme='dark'] .uploader {
    --up-accent: var(--primary, #c9984d);
    --up-spot: rgba(201, 152, 77, 0.22);
  }

  /* Cursor-following spotlight. Its center tracks the pointer via the
     --pointer-x / --pointer-y custom properties set inline. */
  .uploader__spotlight {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    z-index: 0;
    opacity: 0;
    transition: opacity 0.3s ease;
    background: radial-gradient(
      240px circle at var(--pointer-x, 50%) var(--pointer-y, 50%),
      var(--up-spot),
      transparent 72%
    );
  }

  .uploader--hover .uploader__spotlight,
  .uploader--dragging .uploader__spotlight {
    opacity: 1;
  }

  .uploader--hover {
    border-color: var(--up-accent);
    box-shadow:
      0 0 0 1px color-mix(in srgb, var(--up-accent) 30%, transparent),
      0 0 26px color-mix(in srgb, var(--up-accent) 22%, transparent);
  }

  .uploader--dragging {
    border-color: var(--up-accent);
    border-style: solid;
    background: color-mix(in srgb, var(--up-accent) 8%, transparent);
    box-shadow:
      0 0 0 1px color-mix(in srgb, var(--up-accent) 45%, transparent),
      0 0 30px color-mix(in srgb, var(--up-accent) 30%, transparent);
  }

  .uploader__drop-area {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  /* Rounded brand badge replacing the old music-note icon. */
  .uploader__badge {
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    border-radius: 16px;
    color: #f5f4d6;
    font-size: 1.35rem;
    background: linear-gradient(135deg, var(--accent, #014f99), var(--primary-dark, #003971));
    box-shadow:
      var(--shadow-3d-sm),
      0 0 16px rgba(1, 79, 153, 0.25);
    transition:
      transform 0.25s ease,
      box-shadow 0.25s ease;
  }

  html[data-theme='dark'] .uploader__badge {
    background: linear-gradient(135deg, var(--primary, #c9984d), var(--accent, #014f99));
    box-shadow:
      var(--shadow-3d-sm),
      0 0 16px rgba(201, 152, 77, 0.3);
  }

  .uploader--hover .uploader__badge,
  .uploader--dragging .uploader__badge {
    transform: translateY(-3px) scale(1.06);
    box-shadow:
      var(--shadow-3d-md),
      0 0 22px rgba(1, 79, 153, 0.35);
  }

  @media (prefers-reduced-motion: reduce) {
    .uploader,
    .uploader__spotlight,
    .uploader__badge {
      transition: none;
    }
    .uploader--hover .uploader__badge,
    .uploader--dragging .uploader__badge {
      transform: none;
    }
  }

  .uploader__text {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  /* High-contrast heading in both light and dark themes. */
  .uploader__title {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-primary, #003971);
    letter-spacing: -0.01em;
  }

  .uploader__hint {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--text-muted, #5c88b0);
  }

  .uploader__buttons {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 0.25rem;
  }

  .uploader__btn {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.55rem 1.2rem;
    border-radius: 12px;
    border: 2px solid var(--up-accent);
    background: transparent;
    color: var(--up-accent);
    font-family: inherit;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition:
      background 0.2s ease,
      color 0.2s ease,
      transform 0.2s ease,
      box-shadow 0.2s ease;
  }

  .uploader__btn:hover {
    transform: translateY(-2px);
    background: color-mix(in srgb, var(--up-accent) 12%, transparent);
    box-shadow: 0 0 18px color-mix(in srgb, var(--up-accent) 25%, transparent);
  }

  /* Primary action: filled brand gradient. */
  .uploader__btn--primary {
    border-color: transparent;
    color: #f5f4d6;
    background: linear-gradient(135deg, var(--accent, #014f99), var(--primary-dark, #003971));
    box-shadow:
      var(--shadow-3d-sm),
      0 0 16px rgba(1, 79, 153, 0.25);
  }

  html[data-theme='dark'] .uploader__btn--primary {
    background: linear-gradient(135deg, var(--primary, #c9984d), var(--accent, #014f99));
    box-shadow:
      var(--shadow-3d-sm),
      0 0 16px rgba(201, 152, 77, 0.3);
  }

  .uploader__btn--primary:hover {
    background: linear-gradient(135deg, var(--accent, #014f99), var(--primary-dark, #003971));
    box-shadow:
      var(--shadow-3d-md),
      0 0 24px rgba(1, 79, 153, 0.4);
  }

  html[data-theme='dark'] .uploader__btn--primary:hover {
    background: linear-gradient(135deg, var(--primary, #c9984d), var(--accent, #014f99));
    box-shadow:
      var(--shadow-3d-md),
      0 0 24px rgba(201, 152, 77, 0.4);
  }

  @media (prefers-reduced-motion: reduce) {
    .uploader__btn:hover {
      transform: none;
    }
  }

  @media (max-width: 480px) {
    .uploader__buttons {
      flex-direction: column;
      align-items: stretch;
      width: 100%;
    }

    .uploader__btn {
      justify-content: center;
    }
  }
</style>
