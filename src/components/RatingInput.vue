<script setup>
/**
 * Nota de 1 a 5 estrelas.
 *
 * Implementado como um grupo de radios nativos (`fieldset` + `legend` +
 * `input[type=radio]`), e não como uma fileira de `div`s clicáveis. Assim o
 * teclado funciona sem código extra (setas circulam, Espaço marca), o leitor de
 * tela anuncia "3 de 5, opção 3 de 5" e o estado marcado não depende só da cor
 * da estrela.
 *
 * Em modo somente-leitura o componente vira texto + estrelas, sem controle.
 */

import { computed, useId } from 'vue'

import BaseIcon from './BaseIcon.vue'

const props = defineProps({
  modelValue: { type: Number, default: null },
  readonly: { type: Boolean, default: false },
  label: { type: String, default: 'Sua nota' },
  /** Exibe o botão de limpar a nota. */
  clearable: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue'])

const uid = useId()
const groupName = `rating-${uid}`

const VALUES = [1, 2, 3, 4, 5]

const current = computed(() => props.modelValue ?? 0)

const readonlyText = computed(() =>
  props.modelValue ? `${props.modelValue} de 5 estrelas` : 'Sem nota',
)

function select(value) {
  // Clicar na estrela já marcada limpa a nota — atalho útil e reversível.
  emit('update:modelValue', props.modelValue === value ? null : value)
}
</script>

<template>
  <p v-if="readonly" class="rating rating--readonly">
    <span class="rating__stars" aria-hidden="true">
      <BaseIcon
        v-for="value in VALUES"
        :key="value"
        name="star"
        :size="16"
        :class="['rating__star', { 'rating__star--on': value <= current }]"
      />
    </span>
    <span class="rating__text">{{ readonlyText }}</span>
  </p>

  <fieldset v-else class="rating rating--input">
    <legend class="rating__legend">{{ label }}</legend>
    <div class="rating__options">
      <label v-for="value in VALUES" :key="value" class="rating__option">
        <input
          class="rating__radio sr-only"
          type="radio"
          :name="groupName"
          :value="value"
          :checked="modelValue === value"
          @change="emit('update:modelValue', value)"
          @click="select(value)"
        />
        <BaseIcon
          name="star"
          :size="24"
          :class="['rating__star', { 'rating__star--on': value <= current }]"
        />
        <!-- O rótulo textual é o nome acessível de cada opção; sem ele o
             controle por voz não teria o que dizer. -->
        <span class="rating__value">{{ value }}</span>
      </label>

      <button
        v-if="clearable && modelValue"
        type="button"
        class="rating__clear"
        @click="emit('update:modelValue', null)"
      >
        Limpar nota
      </button>
    </div>
  </fieldset>
</template>

<style scoped>
.rating {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  padding: 0;
  margin: 0;
  border: 0;
}

.rating__legend {
  padding: 0;
  font-size: var(--text-sm);
  font-weight: 600;
}

.rating__options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  align-items: center;
}

.rating__option {
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
  justify-content: center;
  /* Alvo de 44px por estrela — dedo cabe sem errar a vizinha. */
  min-width: var(--target);
  min-height: var(--target);
  cursor: pointer;
  border-radius: var(--radius-sm);
}

.rating__option:hover .rating__star {
  color: var(--accent);
}

/* O anel de foco acompanha o radio escondido e aparece no rótulo inteiro. */
.rating__radio:focus-visible + .rating__star {
  outline: var(--focus-width) solid var(--focus);
  outline-offset: var(--focus-offset);
  border-radius: var(--radius-sm);
}

.rating__star {
  color: var(--border-strong);
}

/* Estrela marcada muda de cor E ganha preenchimento — dois canais, não só cor. */
.rating__star--on {
  color: var(--st-lendo);
  fill: var(--st-lendo);
}

.rating__value {
  font-size: var(--text-xs);
  font-variant-numeric: tabular-nums;
  color: var(--text-muted);
}

.rating__radio:checked ~ .rating__value {
  font-weight: 700;
  color: var(--text);
}

.rating__stars {
  display: inline-flex;
  gap: 2px;
}

.rating__text {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.rating__clear {
  min-height: var(--target-min);
  padding-inline: var(--space-2);
  margin-left: var(--space-2);
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-decoration: underline;
  background: none;
  border: 0;
  border-radius: var(--radius-sm);
}

.rating__clear:hover {
  color: var(--text);
}
</style>
