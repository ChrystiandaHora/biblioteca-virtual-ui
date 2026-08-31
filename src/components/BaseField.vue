<script setup>
/**
 * Campo de formulário com rótulo, dica e mensagem de erro amarrados por id.
 *
 * Decisões de acessibilidade embutidas aqui:
 *  - o `<label for>` é sempre visível; `placeholder` nunca substitui rótulo;
 *  - dica e erro são ligados por `aria-describedby`, então o leitor de tela
 *    os lê junto com o campo;
 *  - `aria-invalid` marca o campo com erro, e a mensagem traz ícone + texto,
 *    nunca apenas a cor vermelha;
 *  - o `id` é gerado de um lado só e passado ao outro, para nunca sobrar um
 *    `aria-describedby` apontando para um id inexistente;
 *  - campos de senha não bloqueiam colar (SC 3.3.8) e declaram `autocomplete`,
 *    para que o gerenciador de senhas funcione.
 */

import { computed, useId } from 'vue'

import BaseIcon from './BaseIcon.vue'

const props = defineProps({
  label: { type: String, required: true },
  modelValue: { type: [String, Number], default: '' },
  type: { type: String, default: 'text' },
  /** Renderiza `<textarea>` em vez de `<input>`. */
  multiline: { type: Boolean, default: false },
  rows: { type: Number, default: 4 },
  /** Texto de apoio permanente, exibido abaixo do rótulo. */
  hint: { type: String, default: '' },
  /** Mensagem de erro. Quando presente, marca o campo como inválido. */
  error: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  autocomplete: { type: String, default: undefined },
  placeholder: { type: String, default: undefined },
  inputmode: { type: String, default: undefined },
  min: { type: [String, Number], default: undefined },
  max: { type: [String, Number], default: undefined },
  maxlength: { type: [String, Number], default: undefined },
})

const emit = defineEmits(['update:modelValue'])

const uid = useId()
const fieldId = `field-${uid}`
const hintId = `hint-${uid}`
const errorId = `error-${uid}`

/** Só referencia ids que realmente existem no DOM. */
const describedBy = computed(() => {
  const ids = []
  if (props.hint) ids.push(hintId)
  if (props.error) ids.push(errorId)
  return ids.length > 0 ? ids.join(' ') : undefined
})

function onInput(event) {
  emit('update:modelValue', event.target.value)
}
</script>

<template>
  <div class="field" :class="{ 'field--invalid': Boolean(error) }">
    <label class="field__label" :for="fieldId">
      {{ label }}
      <span v-if="required" class="field__required">
        *<span class="sr-only">(obrigatório)</span>
      </span>
    </label>

    <p v-if="hint" :id="hintId" class="field__hint">{{ hint }}</p>

    <textarea
      v-if="multiline"
      :id="fieldId"
      class="field-control field__control"
      :value="String(modelValue ?? '')"
      :rows="rows"
      :required="required"
      :disabled="disabled"
      :placeholder="placeholder"
      :maxlength="maxlength"
      :aria-describedby="describedBy"
      :aria-invalid="error ? 'true' : undefined"
      @input="onInput"
    />

    <input
      v-else
      :id="fieldId"
      class="field-control field__control"
      :type="type"
      :value="modelValue ?? ''"
      :required="required"
      :disabled="disabled"
      :autocomplete="autocomplete"
      :placeholder="placeholder"
      :inputmode="inputmode"
      :min="min"
      :max="max"
      :maxlength="maxlength"
      :aria-describedby="describedBy"
      :aria-invalid="error ? 'true' : undefined"
      @input="onInput"
    />

    <p v-if="error" :id="errorId" class="field__error">
      <BaseIcon name="warning" size="sm" />
      <span>{{ error }}</span>
    </p>
  </div>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.field__label {
  font-size: var(--text-sm);
  font-weight: 600;
}

.field__required {
  color: var(--danger);
}

.field__hint {
  margin-top: calc(var(--space-1) * -1);
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.field__control {
  width: 100%;
  min-height: var(--target);
  padding: var(--space-3);
  color: var(--text);
  background-color: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  transition: border-color var(--transition);
}

.field__control::placeholder {
  color: var(--text-muted);
  opacity: 1;
}

.field__control:hover:not(:disabled) {
  border-color: var(--text-muted);
}

.field__control:disabled {
  cursor: not-allowed;
  background-color: var(--surface-2);
  opacity: 0.7;
}

textarea.field__control {
  min-height: 6rem;
  resize: vertical;
}

.field--invalid .field__control {
  /* Erro sinalizado por borda mais grossa + ícone + texto — nunca só por cor. */
  border-color: var(--danger);
  border-width: 2px;
}

.field__error {
  display: flex;
  gap: var(--space-2);
  align-items: flex-start;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--danger);
}
</style>
