<script setup>
/**
 * Medidor de progresso de leitura.
 *
 * Usa `role="progressbar"` com os valores em `aria-*` e, ao lado, o mesmo
 * número em texto visível — então o valor nunca depende só da largura da barra.
 * A trilha é um passo mais claro do mesmo token do preenchimento, para que o
 * estado seja legível ao longo de toda a barra.
 */

import { computed } from 'vue'

const props = defineProps({
  /** 0 a 100. */
  percent: { type: Number, required: true },
  currentPage: { type: Number, default: null },
  totalPages: { type: Number, default: null },
  /** Mostra o texto "204 de 680 páginas" abaixo da barra. */
  showPages: { type: Boolean, default: true },
})

const clamped = computed(() => Math.min(100, Math.max(0, Math.round(props.percent))))

const pagesLabel = computed(() => {
  if (!props.totalPages) return null
  return `${(props.currentPage ?? 0).toLocaleString('pt-BR')} de ${props.totalPages.toLocaleString('pt-BR')} páginas`
})

/** Texto lido pelo leitor de tela — mais informativo que só a porcentagem. */
const accessibleText = computed(() =>
  pagesLabel.value ? `${clamped.value}% lido — ${pagesLabel.value}` : `${clamped.value}% lido`,
)
</script>

<template>
  <div class="meter">
    <div class="meter__head">
      <span class="meter__percent tabular">{{ clamped }}%</span>
      <span v-if="showPages && pagesLabel" class="meter__pages tabular">{{ pagesLabel }}</span>
    </div>
    <div
      class="meter__track"
      role="progressbar"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="clamped"
      :aria-valuetext="accessibleText"
    >
      <div class="meter__fill" :style="{ width: `${clamped}%` }" />
    </div>
  </div>
</template>

<style scoped>
.meter {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.meter__head {
  display: flex;
  gap: var(--space-2);
  align-items: baseline;
  justify-content: space-between;
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.meter__percent {
  font-weight: 700;
  color: var(--text);
}

.meter__track {
  height: 8px;
  overflow: hidden;
  background-color: var(--chart-track);
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
}

.meter__fill {
  height: 100%;
  background-color: var(--chart);
  border-radius: var(--radius-pill);
  transition: width var(--transition);
}

@media (prefers-reduced-motion: reduce) {
  .meter__fill {
    transition: none;
  }
}
</style>
