<script setup>
/**
 * Um registro do diário.
 *
 * Citações são renderizadas como `<blockquote>` de verdade, não como um
 * parágrafo com aspas via CSS — o elemento semântico é o que informa ao leitor
 * de tela que aquilo é uma citação.
 *
 * Os botões de editar e apagar nomeiam o registro no rótulo acessível, porque
 * uma lista com vários "Editar" idênticos é inútil para navegação por lista de
 * botões.
 */

import { computed } from 'vue'

import { describeDiaryKind } from '@/domain/readingStatus.js'

import BaseButton from './BaseButton.vue'
import BaseIcon from './BaseIcon.vue'

const props = defineProps({
  entry: { type: Object, required: true },
  busy: { type: Boolean, default: false },
})

const emit = defineEmits(['edit', 'delete'])

const meta = computed(() => describeDiaryKind(props.entry.kind))

const isQuote = computed(() => props.entry.kind === 'citacao')

const formattedDate = computed(() =>
  new Date(props.entry.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }),
)

const wasEdited = computed(() => props.entry.updated_at !== props.entry.created_at)

/** Trecho curto usado nos rótulos dos botões, para diferenciá-los. */
const excerpt = computed(() => {
  const text = props.entry.content.trim()
  return text.length > 40 ? `${text.slice(0, 40)}…` : text
})
</script>

<template>
  <li class="entry card">
    <div class="entry__head">
      <p class="entry__kind">
        <BaseIcon :name="meta.icon" size="sm" class="entry__kind-icon" />
        {{ meta.label }}
      </p>

      <p class="entry__meta">
        <span v-if="entry.page != null" class="entry__page tabular">
          Página {{ entry.page.toLocaleString('pt-BR') }}
        </span>
        <span class="entry__date">
          <time :datetime="entry.created_at">{{ formattedDate }}</time>
          <span v-if="wasEdited" class="entry__edited"> · editado</span>
        </span>
      </p>
    </div>

    <blockquote v-if="isQuote" class="entry__quote">
      <p>{{ entry.content }}</p>
    </blockquote>
    <p v-else class="entry__content">{{ entry.content }}</p>

    <div class="entry__actions">
      <BaseButton
        variant="ghost"
        size="sm"
        icon="pencil"
        :disabled="busy"
        :label="`Editar registro: ${excerpt}`"
        icon-only
        @click="emit('edit', entry)"
      />
      <BaseButton
        variant="ghost"
        size="sm"
        icon="trash"
        :disabled="busy"
        :label="`Apagar registro: ${excerpt}`"
        icon-only
        @click="emit('delete', entry)"
      />
    </div>
  </li>
</template>

<style scoped>
.entry {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
}

.entry__head {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
  align-items: baseline;
  justify-content: space-between;
}

.entry__kind {
  display: inline-flex;
  gap: var(--space-2);
  align-items: center;
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.entry__kind-icon {
  color: var(--accent);
}

.entry__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1) var(--space-3);
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.entry__page {
  font-weight: 600;
}

.entry__edited {
  font-style: italic;
}

.entry__content {
  font-size: var(--text-sm);
  white-space: pre-wrap;
}

.entry__quote {
  margin: 0;
  /* A barra lateral é reforço visual; o elemento <blockquote> é o que carrega
     o significado para tecnologia assistiva. */
  padding-left: var(--space-4);
  font-size: var(--text-base);
  font-style: italic;
  border-left: 3px solid var(--accent);
}

.entry__quote p {
  white-space: pre-wrap;
}

.entry__actions {
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
}
</style>
