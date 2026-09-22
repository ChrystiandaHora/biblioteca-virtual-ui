<script setup>
/**
 * Paginação numérica.
 *
 * Escolhemos paginação explícita em vez de rolagem infinita: o total de itens
 * fica visível, o rodapé continua alcançável e não há conteúdo aparecendo sem
 * o usuário pedir.
 *
 * A troca de página é anunciada por região viva, e a página atual é marcada com
 * `aria-current="page"`.
 */

import { computed } from 'vue'

import BaseButton from './BaseButton.vue'

const props = defineProps({
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  total: { type: Number, default: null },
  /** Nome do que está sendo paginado, ex.: "livros". */
  itemLabel: { type: String, default: 'itens' },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['change'])

/** Janela de no máximo 5 números em volta da página atual, com elipses. */
const pages = computed(() => {
  const { page, totalPages } = props
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)

  const window = new Set([1, totalPages, page])
  for (const offset of [-1, 1]) {
    const candidate = page + offset
    if (candidate > 1 && candidate < totalPages) window.add(candidate)
  }

  const sorted = [...window].sort((a, b) => a - b)
  const withGaps = []
  let previous = 0
  for (const value of sorted) {
    if (previous && value - previous > 1) withGaps.push('gap')
    withGaps.push(value)
    previous = value
  }
  return withGaps
})

const summary = computed(() => {
  const base = `Página ${props.page} de ${props.totalPages}`
  if (props.total === null) return base
  return `${base} · ${props.total.toLocaleString('pt-BR')} ${props.itemLabel}`
})

function go(target) {
  if (target < 1 || target > props.totalPages || target === props.page) return
  emit('change', target)
}
</script>

<template>
  <nav v-if="totalPages > 1" class="pagination" aria-label="Paginação dos resultados">
    <p class="pagination__summary tabular">{{ summary }}</p>

    <ul class="pagination__list">
      <li>
        <BaseButton
          variant="secondary"
          size="sm"
          icon="arrowLeft"
          :disabled="disabled || page <= 1"
          @click="go(page - 1)"
        >
          <span class="pagination__word">Anterior</span>
        </BaseButton>
      </li>

      <li v-for="(entry, index) in pages" :key="`${entry}-${index}`" class="pagination__number-item">
        <span v-if="entry === 'gap'" class="pagination__gap" aria-hidden="true">…</span>
        <button
          v-else
          type="button"
          class="pagination__number tabular"
          :class="{ 'pagination__number--current': entry === page }"
          :aria-current="entry === page ? 'page' : undefined"
          :aria-label="`Página ${entry}`"
          :disabled="disabled"
          @click="go(entry)"
        >
          {{ entry }}
        </button>
      </li>

      <li>
        <BaseButton
          variant="secondary"
          size="sm"
          icon="arrowRight"
          icon-position="end"
          :disabled="disabled || page >= totalPages"
          @click="go(page + 1)"
        >
          <span class="pagination__word">Próxima</span>
        </BaseButton>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.pagination {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
  justify-content: space-between;
  padding-top: var(--space-4);
  border-top: 1px solid var(--border);
}

.pagination__summary {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.pagination__list {
  display: flex;
  flex-wrap: wrap;
  /* 8px entre alvos adjacentes evita acionamento acidental. */
  gap: var(--space-2);
  align-items: center;
}

.pagination__number-item {
  display: flex;
}

.pagination__number {
  position: relative;
  min-width: var(--target-min);
  min-height: var(--target-min);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text);
  background-color: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

/* O comentário antigo prometia 44px de área clicável, mas não havia nada que
   entregasse isso — o botão media cerca de 34x40px. A altura vai a 44px pelo
   retângulo invisível; a largura acompanha o botão de propósito, para não
   comer os 8px de separação entre números vizinhos. */
.pagination__number::after {
  position: absolute;
  content: '';
  inset: 50% auto auto 50%;
  width: 100%;
  height: var(--target);
  translate: -50% -50%;
}

.pagination__number:hover:not(:disabled) {
  background-color: var(--surface-2);
}

/* Página atual: cor + borda espessa + negrito, além do aria-current. */
.pagination__number--current {
  color: var(--accent-text);
  background-color: var(--accent);
  border-color: var(--accent);
}

.pagination__number:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.pagination__gap {
  padding-inline: var(--space-1);
  color: var(--text-muted);
}

/* Em telas estreitas ficam só as setas, para os números não quebrarem linha. */
@media (max-width: 30rem) {
  .pagination__word {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
}
</style>
