<template>
  <div class="uploader">
    <label for="fileInput" class="uploader__label">
      <i class="fa-solid fa-upload"></i>
      <span>{{ t('upload.text') }}</span>
    </label>
    <input 
      type="file" 
      id="fileInput" 
      accept="audio/*" 
      multiple 
      @change="handleFileChange"
      ref="fileInputRef"
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

const emit = defineEmits(['filesLoaded'])

const handleFileChange = (event) => {
  const files = event.target.files
  console.log('File input changed:', files.length, 'files selected')

  if (files && files.length > 0) {
    console.log('First file:', files[0].name, files[0].type)

    // Add to existing playlist instead of replacing
    const wasEmpty = store.audioFiles.length === 0
    store.addAudioFiles(files)

    console.log('Store now has', store.audioFiles.length, 'files')

    // Only auto-play first track if playlist was empty
    if (wasEmpty) {
      emit('filesLoaded', 0)
    }
  }

  // Reset input so same file can be selected again
  event.target.value = ''
}
</script>

<style scoped>
#fileInput {
  display: none;
}
</style>
