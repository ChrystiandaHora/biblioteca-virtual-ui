<script setup>
/**
 * Selo do estágio de leitura.
 *
 * Aplica a regra ícone + texto + cor: o rótulo textual está sempre presente e o
 * ícone é distinto por status, então a informação sobrevive ao tema
 * monocromático "tinta", à impressão em preto e branco e a qualquer tipo de
 * daltonismo. A cor é reforço, nunca o único canal.
 */

import { computed } from 'vue'

import { describeStatus } from '@/domain/readingStatus.js'

import BaseIcon from './BaseIcon.vue'

const props = defineProps({
  status: { type: String, required: true },
  /** Usa o rótulo curto ("Lido") em vez do longo ("Concluídos"). */
  short: { type: Boolean, default: true },
})

const meta = computed(() => describeStatus(props.status))
const text = computed(() => (props.short ? meta.value.short : meta.value.label))
</script>

<template>
  <span
    class="badge status-badge"
    :style="{ '--badge-color': `var(${meta.colorToken})`, '--badge-bg': `var(${meta.bgToken})` }"
  >
    <BaseIcon :name="meta.icon" size="xs" class="status-badge__icon" />
    {{ text }}
  </span>
</template>

<style scoped>
.status-badge {
  display: inline-flex;
  gap: var(--space-1);
  align-items: center;
  padding: 2px var(--space-2);
  font-size: var(--text-xs);
  font-weight: 650;
  line-height: 1.5;
  color: var(--text);
  white-space: nowrap;
  background-color: var(--badge-bg);
  border: 1px solid var(--badge-color);
  border-radius: var(--radius-pill);
}

.status-badge__icon {
  color: var(--badge-color);
}
</style>
