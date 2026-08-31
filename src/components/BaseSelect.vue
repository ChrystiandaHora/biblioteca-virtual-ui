<script setup>
/**
 * Seletor baseado no `<select>` nativo.
 *
 * Uma combobox customizada exigiria reimplementar teclado, leitura de opções e
 * o seletor nativo do sistema no celular. O elemento nativo já faz tudo isso
 * corretamente, então não há motivo para substituí-lo aqui.
 */

import { computed, useId } from 'vue'

import BaseIcon from './BaseIcon.vue'

const props = defineProps({
  label: { type: String, required: true },
  modelValue: { type: [String, Number, null], default: '' },
  /** `[{ value, label }]` */
  options: { type: Array, required: true },
  hint: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  /** Esconde o rótulo visualmente, mantendo-o para leitores de tela. */
  hideLabel: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const uid = useId()
const fieldId = `select-${uid}`
const hintId = `select-hint-${uid}`

const describedBy = computed(() => (props.hint ? hintId : undefined))
</script>

<template>
  <div class="select-field">
    <label :for="fieldId" :class="hideLabel ? 'sr-only' : 'select-field__label'">
      {{ label }}
    </label>
    <p v-if="hint" :id="hintId" class="select-field__hint">{{ hint }}</p>
    <div class="select-field__wrapper">
      <select
        :id="fieldId"
        class="field-control select-field__control"
        :value="modelValue ?? ''"
        :disabled="disabled"
        :aria-describedby="describedBy"
        @change="emit('update:modelValue', $event.target.value)"
      >
        <option v-for="option in options" :key="String(option.value)" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <BaseIcon class="select-field__chevron" name="chevronDown" size="sm" />
    </div>
  </div>
</template>

<style scoped>
.select-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
}

.select-field__label {
  font-size: var(--text-sm);
  font-weight: 600;
}

.select-field__hint {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.select-field__wrapper {
  position: relative;
  display: flex;
}

.select-field__control {
  width: 100%;
  min-height: var(--target);
  padding: var(--space-2) var(--space-6) var(--space-2) var(--space-3);
  color: var(--text);
  background-color: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  appearance: none;
}

.select-field__control:disabled {
  cursor: not-allowed;
  background-color: var(--surface-2);
  opacity: 0.7;
}

.select-field__chevron {
  position: absolute;
  top: 50%;
  right: var(--space-3);
  color: var(--text-muted);
  pointer-events: none;
  translate: 0 -50%;
}
</style>
