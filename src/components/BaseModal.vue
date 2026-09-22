<script setup>
/**
 * Diálogo modal acessível.
 *
 * Cumpre o contrato completo do padrão APG:
 *  - `role="dialog"` + `aria-modal="true"` + `aria-labelledby` apontando para
 *    o título real do diálogo;
 *  - foco entra ao abrir, circula preso dentro e volta ao gatilho ao fechar
 *    (ver `useFocusTrap`);
 *  - o fundo fica indisponível: `aria-modal="true"` o retira do cursor virtual
 *    do leitor de tela, o backdrop cobre a tela inteira contra o clique e o
 *    aprisionamento de foco impede que Tab saia do diálogo. (Não usamos
 *    `inert`: o diálogo é renderizado dentro do próprio `<main>`, então
 *    inertizar o fundo o inertizaria junto — e mover tudo para um Teleport
 *    também apagaria as regiões vivas dos toasts enquanto o modal estivesse
 *    aberto.);
 *  - Esc e o clique no fundo fecham;
 *  - a rolagem do body é travada enquanto o diálogo está aberto.
 *
 * Para confirmações destrutivas use `role="alertdialog"` via a prop `alert`.
 */

import { onBeforeUnmount, onMounted, ref, useId } from 'vue'

import { useFocusTrap } from '@/composables/useFocusTrap.js'

import BaseButton from './BaseButton.vue'

// As props são consumidas apenas no template, então não há necessidade de
// guardar o retorno de `defineProps` em uma variável.
const props = defineProps({
  title: { type: String, required: true },
  /** Texto de apoio lido junto com o título. */
  description: { type: String, default: '' },
  /** `true` para confirmações destrutivas (role="alertdialog"). */
  alert: { type: Boolean, default: false },
  /**
   * Para onde mandar o foco quando o gatilho não sobrevive à ação — o caso
   * normal em confirmação de exclusão, em que o botão que abriu o diálogo é
   * removido junto com o item.
   */
  returnFocusTo: { type: Function, default: null },
})

const emit = defineEmits(['close'])

const uid = useId()
const titleId = `dialog-title-${uid}`
const descriptionId = `dialog-description-${uid}`

const dialogRef = ref(null)

useFocusTrap(dialogRef, {
  onEscape: () => emit('close'),
  fallbackFocus: () => props.returnFocusTo?.(),
})

let previousOverflow = ''

let previousScrollbarGutter = ''

onMounted(() => {
  previousOverflow = document.body.style.overflow
  previousScrollbarGutter = document.body.style.scrollbarGutter
  document.body.style.overflow = 'hidden'
  // Só esconder o overflow devolve a largura da barra de rolagem ao layout, e
  // a página inteira salta para o lado ao abrir o diálogo. `scrollbar-gutter`
  // mantém o espaço reservado.
  document.body.style.scrollbarGutter = 'stable'
})

onBeforeUnmount(() => {
  document.body.style.overflow = previousOverflow
  document.body.style.scrollbarGutter = previousScrollbarGutter
})

/** Fecha só quando o clique nasce no próprio fundo, não em um filho. */
function onBackdropPointerDown(event) {
  if (event.target === event.currentTarget) emit('close')
}
</script>

<template>
  <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions -->
  <div class="backdrop" @pointerdown="onBackdropPointerDown">
    <div
      ref="dialogRef"
      class="dialog"
      :role="alert ? 'alertdialog' : 'dialog'"
      aria-modal="true"
      :aria-labelledby="titleId"
      :aria-describedby="description ? descriptionId : undefined"
      tabindex="-1"
    >
      <header class="dialog__header">
        <div class="dialog__heading">
          <h2 :id="titleId" class="dialog__title">{{ title }}</h2>
          <p v-if="description" :id="descriptionId" class="dialog__description">
            {{ description }}
          </p>
        </div>
        <BaseButton
          variant="ghost"
          icon="close"
          icon-only
          label="Fechar diálogo"
          @click="emit('close')"
        />
      </header>

      <div class="dialog__body">
        <slot />
      </div>

      <footer v-if="$slots.footer" class="dialog__footer">
        <slot name="footer" />
      </footer>
    </div>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  z-index: 60;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: var(--space-4);
  background-color: var(--scrim);
  inset: 0;
}

@media (min-width: 40rem) {
  .backdrop {
    align-items: center;
  }
}

.dialog {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
  max-width: 34rem;
  /* `max-height` + rolagem interna: em telas baixas ou com zoom a 200% o
     diálogo rola por dentro em vez de estourar a viewport. */
  max-height: min(88vh, 46rem);
  padding: var(--space-5);
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

@media (prefers-reduced-motion: no-preference) {
  .dialog {
    animation: dialog-in 180ms ease-out;
  }
}

@keyframes dialog-in {
  from {
    translate: 0 12px;
    opacity: 0;
  }
}

.dialog__header {
  /* O corpo do diálogo é que rola (`flex: 1` + `min-height: 0`); cabeçalho e
     rodapé precisam de `flex-shrink: 0` para não serem comprimidos quando o
     conteúdo passa da altura máxima. */
  display: flex;
  flex-shrink: 0;
  gap: var(--space-4);
  align-items: flex-start;
  justify-content: space-between;
}

.dialog__heading {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.dialog__title {
  font-size: var(--text-xl);
}

.dialog__description {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.dialog__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.dialog__footer {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: var(--space-3);
  justify-content: flex-end;
  padding-top: var(--space-4);
  border-top: 1px solid var(--border);
}
</style>
