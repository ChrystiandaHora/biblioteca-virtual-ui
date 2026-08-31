<script setup>
/**
 * Região de mensagens dinâmicas.
 *
 * Sem isto, uma confirmação de "livro adicionado" seria puramente visual: quem
 * usa leitor de tela não saberia que a ação deu certo (SC 4.1.3).
 *
 * Existem duas regiões vivas separadas, e não uma só, porque a urgência muda o
 * comportamento: `role="status"` (polite) espera uma pausa na fala, enquanto
 * `role="alert"` (assertive) interrompe. Trocar o `aria-live` de um mesmo
 * elemento em tempo de execução é ignorado por vários leitores de tela.
 */

import { computed } from 'vue'

import { useToastStore } from '@/stores/toastStore.js'

import BaseButton from './BaseButton.vue'
import BaseIcon from './BaseIcon.vue'

const toastStore = useToastStore()

const politeToasts = computed(() => toastStore.toasts.filter((t) => t.politeness === 'polite'))
const assertiveToasts = computed(() => toastStore.toasts.filter((t) => t.politeness === 'assertive'))

const ICONS = { success: 'check', error: 'warning', info: 'info' }
const PREFIXES = { success: 'Sucesso:', error: 'Erro:', info: 'Aviso:' }
</script>

<template>
  <div class="toast-region">
    <!-- Mensagens tranquilas (sucesso/informação). -->
    <ul class="toast-list" role="status" aria-live="polite" aria-relevant="additions">
      <li v-for="toast in politeToasts" :key="toast.id" :class="['toast', `toast--${toast.tone}`]">
        <BaseIcon :name="ICONS[toast.tone]" size="md" class="toast__icon" />
        <p class="toast__message">
          <!-- O prefixo textual é o que garante que o significado não venha
               apenas da cor do ícone. -->
          <span class="toast__prefix">{{ PREFIXES[toast.tone] }}</span>
          {{ toast.message }}
        </p>
        <BaseButton
          variant="ghost"
          size="sm"
          icon="close"
          icon-only
          label="Fechar mensagem"
          @click="toastStore.dismiss(toast.id)"
        />
      </li>
    </ul>

    <!-- Mensagens urgentes (erros). -->
    <ul class="toast-list" role="alert" aria-live="assertive" aria-relevant="additions">
      <li v-for="toast in assertiveToasts" :key="toast.id" :class="['toast', `toast--${toast.tone}`]">
        <BaseIcon :name="ICONS[toast.tone]" size="md" class="toast__icon" />
        <p class="toast__message">
          <span class="toast__prefix">{{ PREFIXES[toast.tone] }}</span>
          {{ toast.message }}
        </p>
        <BaseButton
          variant="ghost"
          size="sm"
          icon="close"
          icon-only
          label="Fechar mensagem"
          @click="toastStore.dismiss(toast.id)"
        />
      </li>
    </ul>
  </div>
</template>

<style scoped>
.toast-region {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 70;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
  pointer-events: none;
}

@media (min-width: 40rem) {
  .toast-region {
    left: auto;
    max-width: 28rem;
  }
}

.toast-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.toast {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
  padding: var(--space-3) var(--space-3) var(--space-3) var(--space-4);
  pointer-events: auto;
  background-color: var(--surface);
  /* A borda espessa lateral funciona como segundo canal junto ao ícone. */
  border: 1px solid var(--border);
  border-left-width: 4px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}

.toast--success {
  border-left-color: var(--success);
}

.toast--success .toast__icon {
  color: var(--success);
}

.toast--error {
  border-left-color: var(--danger);
}

.toast--error .toast__icon {
  color: var(--danger);
}

.toast--info {
  border-left-color: var(--accent);
}

.toast--info .toast__icon {
  color: var(--accent);
}

.toast__message {
  flex: 1;
  font-size: var(--text-sm);
}

.toast__prefix {
  font-weight: 700;
}

@media (prefers-reduced-motion: no-preference) {
  .toast {
    animation: toast-in 180ms ease-out;
  }
}

@keyframes toast-in {
  from {
    translate: 0 10px;
    opacity: 0;
  }
}
</style>
