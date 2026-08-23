<script setup>
/**
 * Botão da aplicação.
 *
 * Sempre renderiza um `<button>` nativo (ou um `RouterLink`, quando `to` é
 * informado) — nunca uma `div` clicável. O elemento nativo já traz teclado,
 * papel semântico e estado desabilitado de graça.
 *
 * Sobre `aria-label` em botões só de ícone: o rótulo visível e o nome
 * acessível precisam coincidir para que controle por voz funcione (SC 2.5.3).
 * Como aqui não há texto visível, o `aria-label` é a única fonte do nome — é o
 * caso legítimo de uso. Quando existe texto visível, não sobrescrevemos nada.
 */

import { computed } from 'vue'

import BaseIcon from './BaseIcon.vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'ghost', 'danger'].includes(value),
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value),
  },
  type: { type: String, default: 'button' },
  icon: { type: String, default: '' },
  /** Posição do ícone em relação ao texto. */
  iconPosition: { type: String, default: 'start' },
  /** Botão apenas com ícone — exige `label`. */
  iconOnly: { type: Boolean, default: false },
  /** Nome acessível para botões sem texto visível. */
  label: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  /** Exibe estado de processamento e bloqueia novos cliques. */
  loading: { type: Boolean, default: false },
  /** Ocupa toda a largura disponível. */
  block: { type: Boolean, default: false },
  /** Quando presente, renderiza um RouterLink com aparência de botão. */
  to: { type: [String, Object], default: null },
})

const isDisabled = computed(() => props.disabled || props.loading)

const classes = computed(() => [
  'btn',
  `btn--${props.variant}`,
  `btn--${props.size}`,
  {
    'btn--block': props.block,
    'btn--icon-only': props.iconOnly,
    'btn--loading': props.loading,
  },
])
</script>

<template>
  <RouterLink v-if="to && !isDisabled" :to="to" :class="classes" :aria-label="label || undefined">
    <BaseIcon v-if="icon && iconPosition === 'start'" :name="icon" :size="size === 'sm' ? 16 : 18" />
    <span v-if="!iconOnly" class="btn__text"><slot /></span>
    <BaseIcon v-if="icon && iconPosition === 'end'" :name="icon" :size="size === 'sm' ? 16 : 18" />
  </RouterLink>

  <button
    v-else
    :type="type"
    :class="classes"
    :disabled="isDisabled"
    :aria-label="label || undefined"
    :aria-busy="loading ? 'true' : undefined"
  >
    <span v-if="loading" class="btn__spinner" aria-hidden="true" />
    <BaseIcon
      v-else-if="icon && iconPosition === 'start'"
      :name="icon"
      :size="size === 'sm' ? 16 : 18"
    />
    <span v-if="!iconOnly" class="btn__text"><slot /></span>
    <BaseIcon
      v-if="!loading && icon && iconPosition === 'end'"
      :name="icon"
      :size="size === 'sm' ? 16 : 18"
    />
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  gap: var(--space-2);
  align-items: center;
  justify-content: center;
  /* Piso ergonômico de 44px em ambos os eixos (regra da casa, acima do
     mínimo normativo de 24px). */
  min-height: var(--target);
  padding-inline: var(--space-4);
  font-size: var(--text-sm);
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
  text-decoration: none;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  transition:
    background-color var(--transition),
    border-color var(--transition),
    color var(--transition);
}

/* O slot pode conter mais de um elemento — o gatilho do menu de conta, por
   exemplo, traz avatar + nome + seta. Sem `flex` aqui, esses filhos ficariam
   inline dentro de um span comum: sem o espaçamento do botão entre eles, e
   quebrando linha quando não couberem. */
.btn__text {
  display: inline-flex;
  gap: var(--space-2);
  align-items: center;
  min-width: 0;
}

.btn--sm {
  min-height: var(--target-min);
  padding-block: var(--space-1);
  padding-inline: var(--space-3);
  font-size: var(--text-xs);
}

.btn--lg {
  min-height: 52px;
  padding-inline: var(--space-5);
  font-size: var(--text-base);
}

.btn--block {
  width: 100%;
}

.btn--icon-only {
  width: var(--target);
  min-width: var(--target);
  padding-inline: 0;
}

.btn--icon-only.btn--sm {
  /* O quadrado visível encolhe, mas a área de toque real segue em 44px
     graças ao ::after abaixo. */
  width: 32px;
  min-width: 32px;
}

.btn--icon-only.btn--sm::after {
  position: absolute;
  content: '';
  inset: 50% auto auto 50%;
  width: var(--target);
  height: var(--target);
  translate: -50% -50%;
}

.btn--icon-only.btn--sm {
  position: relative;
}

/* -------------------------------- variantes ------------------------------- */

.btn--primary {
  color: var(--accent-text);
  background-color: var(--accent);
}

.btn--primary:hover:not(:disabled) {
  background-color: var(--accent-hover);
}

.btn--secondary {
  color: var(--text);
  background-color: var(--surface);
  border-color: var(--border-strong);
}

.btn--secondary:hover:not(:disabled) {
  background-color: var(--surface-2);
}

.btn--ghost {
  color: var(--text);
  background-color: transparent;
}

.btn--ghost:hover:not(:disabled) {
  background-color: var(--surface-2);
}

.btn--danger {
  color: var(--danger-text);
  background-color: var(--danger);
}

.btn--danger:hover:not(:disabled) {
  background-color: var(--danger-hover);
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

/* --------------------------------- spinner -------------------------------- */

.btn__spinner {
  width: 1em;
  height: 1em;
  border: 2px solid currentcolor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: btn-spin 700ms linear infinite;
}

@keyframes btn-spin {
  to {
    rotate: 360deg;
  }
}

/* Sem animação: uma barra estática substitui o giro. O estado continua
   sendo anunciado por `aria-busy`, então nada se perde. */
@media (prefers-reduced-motion: reduce) {
  .btn__spinner {
    border-top-color: currentcolor;
    border-radius: var(--radius-sm);
    animation: none;
    opacity: 0.6;
  }
}
</style>
