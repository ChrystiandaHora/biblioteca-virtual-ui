<script setup>
/**
 * Estado vazio, de erro ou de "nada encontrado".
 *
 * Um estado vazio precisa dizer o que aconteceu **e** qual é o próximo passo —
 * uma tela em branco deixa a pessoa sem saber se falhou ou se está certo.
 */

import BaseIcon from './BaseIcon.vue'

defineProps({
  icon: { type: String, default: 'empty' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  tone: {
    type: String,
    default: 'neutral',
    validator: (value) => ['neutral', 'error'].includes(value),
  },
})
</script>

<template>
  <div :class="['empty', `empty--${tone}`]">
    <span class="empty__icon">
      <BaseIcon :name="tone === 'error' ? 'warning' : icon" size="xl" />
    </span>
    <div class="empty__body">
      <p class="empty__title">
        <!-- Prefixo textual: um estado de erro não se distingue de um estado
             vazio apenas pela cor do ícone. -->
        <span v-if="tone === 'error'" class="empty__prefix">Erro:</span>
        {{ title }}
      </p>
      <p v-if="description" class="empty__description">{{ description }}</p>
    </div>
    <div v-if="$slots.action" class="empty__action">
      <slot name="action" />
    </div>
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-6) var(--space-4);
  text-align: center;
  background-color: var(--surface);
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-lg);
}

.empty__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  color: var(--text-muted);
  background-color: var(--surface-2);
  border-radius: 50%;
}

.empty--error {
  border-color: var(--danger);
}

.empty--error .empty__icon {
  color: var(--danger);
  background-color: var(--danger-soft-bg);
}

.empty__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  max-width: 42ch;
}

.empty__title {
  font-size: var(--text-base);
  font-weight: 650;
}

.empty__prefix {
  color: var(--danger);
}

.empty__description {
  font-size: var(--text-sm);
  color: var(--text-muted);
}
</style>
