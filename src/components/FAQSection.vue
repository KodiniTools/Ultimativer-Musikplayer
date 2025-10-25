<template>
  <section class="content-section">
    <h2 v-html="t('faq.title')"></h2>
    
    <div class="faq-item" v-for="(item, index) in faqItems" :key="index">
      <div class="faq-question" @click="toggleFAQ(index)">
        <span>{{ t(item.question) }}</span>
        <i class="fa-solid fa-chevron-down faq-icon" :class="{ open: openItems.includes(index) }"></i>
      </div>
      <div class="faq-answer" :class="{ open: openItems.includes(index) }">
        <p>{{ t(item.answer) }}</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const faqItems = [
  { question: 'faq.formats.question', answer: 'faq.formats.answer' },
  { question: 'faq.free.question', answer: 'faq.free.answer' },
  { question: 'faq.visualization.question', answer: 'faq.visualization.answer' },
  { question: 'faq.mobile.question', answer: 'faq.mobile.answer' },
  { question: 'faq.privacy.question', answer: 'faq.privacy.answer' },
  { question: 'faq.upload_limit.question', answer: 'faq.upload_limit.answer' }
]

const openItems = ref([])

const toggleFAQ = (index) => {
  const itemIndex = openItems.value.indexOf(index)
  if (itemIndex > -1) {
    openItems.value.splice(itemIndex, 1)
  } else {
    openItems.value.push(index)
  }
}
</script>
