<script setup>
/**
 * Um resultado da busca no catálogo da Open Library.
 *
 * O botão "Adicionar" muda para um estado desabilitado com texto "Na estante"
 * quando o livro já foi salvo — o estado é dito, não apenas indicado por cor.
 */

import { computed } from 'vue'

import BaseButton from './BaseButton.vue'
import BaseIcon from './BaseIcon.vue'
import BookCover from './BookCover.vue'

const props = defineProps({
  book: { type: Object, required: true },
  /** `true` quando o livro já está na estante do usuário. */
  alreadyInLibrary: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
})

const emit = defineEmits(['add'])

const authorsLabel = computed(() =>
  props.book.authors?.length ? props.book.authors.join(', ') : 'Autoria não informada',
)

/** No máximo 3 assuntos: a Open Library às vezes devolve dezenas. */
const subjects = computed(() => props.book.subjects?.slice(0, 3) ?? [])
</script>

<template>
  <li class="result card">
    <BookCover
      :cover-url="book.cover_url"
      :cover-id="book.cover_id"
      :title="book.title"
      size="md"
      class="result__cover"
    />

    <div class="result__body">
      <h3 class="result__title">{{ book.title }}</h3>
      <p class="result__authors">{{ authorsLabel }}</p>

      <p class="result__meta">
        <span v-if="book.first_publish_year" class="result__meta-entry">
          <BaseIcon name="clock" :size="14" />
          {{ book.first_publish_year }}
        </span>
        <span v-if="book.page_estimate" class="result__meta-entry tabular">
          <BaseIcon name="page" :size="14" />
          ~{{ book.page_estimate.toLocaleString('pt-BR') }} páginas
        </span>
        <span v-if="book.edition_count" class="result__meta-entry tabular">
          <BaseIcon name="books" :size="14" />
          {{ book.edition_count.toLocaleString('pt-BR') }}
          {{ book.edition_count === 1 ? 'edição' : 'edições' }}
        </span>
      </p>

      <ul v-if="subjects.length" class="result__subjects">
        <li v-for="subject in subjects" :key="subject" class="badge result__subject">
          {{ subject }}
        </li>
      </ul>
    </div>

    <div class="result__actions">
      <BaseButton
        v-if="alreadyInLibrary"
        variant="secondary"
        size="sm"
        icon="check"
        disabled
      >
        Na estante
      </BaseButton>
      <BaseButton
        v-else
        variant="primary"
        size="sm"
        icon="plus"
        :loading="busy"
        @click="emit('add', book)"
      >
        Adicionar
        <span class="sr-only">{{ book.title }} à estante</span>
      </BaseButton>
    </div>
  </li>
</template>

<style scoped>
.result {
  display: grid;
  grid-template-areas:
    'cover body'
    'actions actions';
  grid-template-columns: auto 1fr;
  gap: var(--space-3);
  padding: var(--space-4);
}

@media (min-width: 34rem) {
  .result {
    grid-template-areas: 'cover body actions';
    grid-template-columns: auto 1fr auto;
    align-items: start;
  }
}

.result__cover {
  grid-area: cover;
}

.result__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  grid-area: body;
  min-width: 0;
}

.result__title {
  font-size: var(--text-base);
  overflow-wrap: anywhere;
}

.result__authors {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.result__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1) var(--space-3);
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.result__meta-entry {
  display: inline-flex;
  gap: var(--space-1);
  align-items: center;
}

.result__subjects {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.result__subject {
  padding: 2px var(--space-2);
  font-size: var(--text-xs);
  color: var(--text-muted);
  background-color: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
}

.result__actions {
  display: flex;
  grid-area: actions;
  justify-content: flex-end;
}
</style>
