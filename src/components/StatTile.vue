<script setup>
/**
 * Bloco de número do painel.
 *
 * Um número isolado não é gráfico: uma barra sozinha ou uma pizza de duas
 * fatias diria menos e ocuparia mais. O valor grande usa os dígitos
 * proporcionais da fonte — `tabular-nums` só entra em colunas de números que
 * precisam alinhar verticalmente.
 */

import { computed } from 'vue'

import BaseIcon from './BaseIcon.vue'

const props = defineProps({
  label: { type: String, required: true },
  value: { type: [Number, String], required: true },
  /** Unidade exibida em tamanho menor ao lado do valor. */
  unit: { type: String, default: '' },
  icon: { type: String, default: '' },
  hint: { type: String, default: '' },
  /** Destaca este bloco como número principal do painel. */
  hero: { type: Boolean, default: false },
})

const formatted = computed(() =>
  typeof props.value === 'number' ? props.value.toLocaleString('pt-BR') : props.value,
)

/**
 * Textos substitutos ("Sem nota") entram em corpo menor: na escala de um
 * número eles ficariam largos demais e roubariam o destaque de quem realmente
 * traz um valor.
 */
const isPlaceholder = computed(() => typeof props.value !== 'number')
</script>

<template>
  <div :class="['tile', { 'tile--hero': hero }]">
    <p class="tile__label">
      <BaseIcon v-if="icon" :name="icon" size="sm" class="tile__icon" />
      {{ label }}
    </p>
    <p class="tile__value" :class="{ 'tile__value--placeholder': isPlaceholder }">
      {{ formatted }}
      <span v-if="unit" class="tile__unit">{{ unit }}</span>
    </p>
    <p v-if="hint" class="tile__hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.tile {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-4);
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.tile__label {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--text-muted);
}

.tile__icon {
  color: var(--accent);
}

.tile__value {
  font-size: var(--text-2xl);
  font-weight: 700;
  line-height: 1.1;
}

.tile__value--placeholder {
  font-size: var(--text-lg);
  color: var(--text-muted);
}

.tile--hero {
  background-color: var(--accent-soft-bg);
  border-color: var(--accent);
}

.tile--hero .tile__value {
  /* Único número em escala de destaque na tela, na mesma família sem serifa
     do resto da interface. */
  font-size: var(--text-hero);
}

.tile__unit {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-muted);
}

.tile__hint {
  font-size: var(--text-xs);
  color: var(--text-muted);
}
</style>
