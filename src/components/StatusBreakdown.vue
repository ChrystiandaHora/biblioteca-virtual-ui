<script setup>
/**
 * Distribuição da estante por estágio de leitura.
 *
 * Não é uma pizza de propósito: quatro fatias próximas são difíceis de comparar
 * e a identificação passaria a depender de casar cor com legenda. Aqui cada
 * linha traz ícone + rótulo + número + barra — a barra é o reforço visual, e a
 * informação está toda em texto.
 */

import { computed } from 'vue'

import { describeStatus } from '@/domain/readingStatus.js'

import BaseIcon from './BaseIcon.vue'

const props = defineProps({
  /** `[{ status, label, count }]` vindo de GET /api/stats. */
  items: { type: Array, required: true },
})

const total = computed(() => props.items.reduce((sum, item) => sum + item.count, 0))

const rows = computed(() =>
  props.items.map((item) => {
    const meta = describeStatus(item.status)
    const share = total.value === 0 ? 0 : Math.round((item.count / total.value) * 100)
    return { ...item, meta, share }
  }),
)
</script>

<template>
  <section class="breakdown" aria-labelledby="breakdown-title">
    <h3 id="breakdown-title" class="breakdown__title">Estante por estágio</h3>

    <ul class="breakdown__list">
      <li
        v-for="row in rows"
        :key="row.status"
        class="breakdown__row"
        :style="{ '--row-color': `var(${row.meta.colorToken})` }"
      >
        <span class="breakdown__label">
          <BaseIcon :name="row.meta.icon" size="sm" class="breakdown__icon" />
          {{ row.label }}
        </span>

        <span class="breakdown__track">
          <span class="breakdown__fill" :style="{ width: `${row.share}%` }" />
        </span>

        <span class="breakdown__numbers tabular">
          <strong>{{ row.count }}</strong>
          <span class="breakdown__share">{{ row.share }}%</span>
        </span>
      </li>
    </ul>

    <p v-if="total === 0" class="breakdown__empty">
      Nenhum livro na estante ainda — os números aparecem aqui quando você
      adicionar o primeiro.
    </p>
  </section>
</template>

<style scoped>
.breakdown {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.breakdown__title {
  font-size: var(--text-lg);
}

.breakdown__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.breakdown__row {
  display: grid;
  grid-template-areas:
    'label numbers'
    'track track';
  grid-template-columns: 1fr auto;
  gap: var(--space-1) var(--space-3);
  align-items: center;
}

@media (min-width: 30rem) {
  .breakdown__row {
    grid-template-areas: 'label track numbers';
    grid-template-columns: 9.5rem 1fr auto;
  }
}

.breakdown__label {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  grid-area: label;
  font-size: var(--text-sm);
  font-weight: 600;
}

.breakdown__icon {
  color: var(--row-color);
}

.breakdown__track {
  grid-area: track;
  height: 10px;
  overflow: hidden;
  background-color: var(--chart-track);
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
}

.breakdown__fill {
  display: block;
  height: 100%;
  background-color: var(--row-color);
  border-radius: var(--radius-pill);
  transition: width var(--transition);
}

@media (prefers-reduced-motion: reduce) {
  .breakdown__fill {
    transition: none;
  }
}

.breakdown__numbers {
  display: flex;
  gap: var(--space-2);
  grid-area: numbers;
  align-items: baseline;
  font-size: var(--text-sm);
}

.breakdown__share {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.breakdown__empty {
  font-size: var(--text-sm);
  color: var(--text-muted);
}
</style>
