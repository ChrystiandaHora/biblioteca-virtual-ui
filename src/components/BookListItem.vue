<script setup>
/**
 * Um livro na lista da estante.
 *
 * O cartão inteiro NÃO é clicável: o link fica no título. Um cartão-link
 * engole os controles internos (mudar status, remover) e obriga a reimplementar
 * teclado à mão. Com o link no título, `Tab` percorre título → status → remover
 * na ordem visual, e o leitor de tela anuncia "Duna, link".
 */

import { computed } from 'vue'

import { READING_STATUS_LIST } from '@/domain/readingStatus.js'

import BaseButton from './BaseButton.vue'
import BaseIcon from './BaseIcon.vue'
import BookCover from './BookCover.vue'
import ProgressMeter from './ProgressMeter.vue'
import RatingInput from './RatingInput.vue'
import StatusBadge from './StatusBadge.vue'

const props = defineProps({
  item: { type: Object, required: true },
  /** Bloqueia os controles enquanto uma atualização está em andamento. */
  busy: { type: Boolean, default: false },
})

const emit = defineEmits(['change-status', 'remove'])

const authorsLabel = computed(() =>
  props.item.authors?.length ? props.item.authors.join(', ') : 'Autoria não informada',
)

const statusOptions = computed(() =>
  READING_STATUS_LIST.map((status) => ({ value: status.value, label: status.short })),
)

const showProgress = computed(
  () => props.item.status === 'lendo' || (props.item.progress_percent > 0 && props.item.total_pages),
)
</script>

<template>
  <li class="book-item card">
    <BookCover
      :cover-url="item.cover_url"
      :cover-id="item.cover_id"
      :title="item.title"
      size="md"
      class="book-item__cover"
    />

    <div class="book-item__body">
      <div class="book-item__heading">
        <h3 class="book-item__title">
          <RouterLink :to="{ name: 'livro', params: { id: item.id } }" class="book-item__link">
            {{ item.title }}
          </RouterLink>
        </h3>
        <StatusBadge :status="item.status" />
      </div>

      <p class="book-item__authors">{{ authorsLabel }}</p>

      <p class="book-item__meta">
        <span v-if="item.first_publish_year" class="book-item__meta-entry">
          <BaseIcon name="clock" :size="14" />
          {{ item.first_publish_year }}
        </span>
        <span v-if="item.total_pages" class="book-item__meta-entry tabular">
          <BaseIcon name="page" :size="14" />
          {{ item.total_pages.toLocaleString('pt-BR') }} páginas
        </span>
        <span v-if="item.diary_entry_count > 0" class="book-item__meta-entry">
          <BaseIcon name="note" :size="14" />
          {{ item.diary_entry_count }}
          {{ item.diary_entry_count === 1 ? 'registro' : 'registros' }}
        </span>
      </p>

      <RatingInput v-if="item.rating" :model-value="item.rating" readonly />

      <ProgressMeter
        v-if="showProgress"
        :percent="item.progress_percent"
        :current-page="item.current_page"
        :total-pages="item.total_pages"
        class="book-item__progress"
      />
    </div>

    <div class="book-item__actions">
      <!-- O <select> nativo carrega seu próprio rótulo escondido, então o
           controle tem nome acessível único mesmo com vários na mesma lista. -->
      <label class="sr-only" :for="`status-${item.id}`">
        Estágio de leitura de {{ item.title }}
      </label>
      <select
        :id="`status-${item.id}`"
        class="book-item__status-select"
        :value="item.status"
        :disabled="busy"
        @change="emit('change-status', { item, status: $event.target.value })"
      >
        <option v-for="option in statusOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>

      <BaseButton
        variant="ghost"
        size="sm"
        icon="trash"
        icon-only
        :label="`Remover ${item.title} da estante`"
        :disabled="busy"
        @click="emit('remove', item)"
      />
    </div>
  </li>
</template>

<style scoped>
.book-item {
  display: grid;
  /* Uma coluna no celular; capa + conteúdo + ações a partir de 34rem. */
  grid-template-areas:
    'cover body'
    'actions actions';
  grid-template-columns: auto 1fr;
  gap: var(--space-3);
  padding: var(--space-4);
}

@media (min-width: 34rem) {
  .book-item {
    grid-template-areas: 'cover body actions';
    grid-template-columns: auto 1fr auto;
    align-items: start;
  }
}

.book-item__cover {
  grid-area: cover;
}

.book-item__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  grid-area: body;
  min-width: 0;
}

.book-item__heading {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: baseline;
}

.book-item__title {
  font-size: var(--text-base);
  overflow-wrap: anywhere;
}

.book-item__link {
  /* O título é o alvo principal do cartão, então precisa dos 24px mínimos de
     altura (SC 2.5.8). O padding cresce a área clicável e a margem negativa
     devolve o espaço ao layout, deixando o texto exatamente onde estava. */
  display: inline-block;
  padding-block: var(--space-1);
  margin-block: calc(var(--space-1) * -1);
  color: var(--text);
  text-decoration-color: var(--border-strong);
}

.book-item__link:hover {
  color: var(--accent);
  text-decoration-color: currentcolor;
}

.book-item__authors {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.book-item__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1) var(--space-3);
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.book-item__meta-entry {
  display: inline-flex;
  gap: var(--space-1);
  align-items: center;
}

.book-item__progress {
  max-width: 24rem;
  margin-top: var(--space-1);
}

.book-item__actions {
  display: flex;
  gap: var(--space-2);
  grid-area: actions;
  align-items: center;
  justify-content: flex-end;
}

@media (min-width: 34rem) {
  .book-item__actions {
    flex-direction: column-reverse;
    align-items: flex-end;
  }
}

.book-item__status-select {
  min-height: var(--target);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--text);
  background-color: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
}

.book-item__status-select:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
