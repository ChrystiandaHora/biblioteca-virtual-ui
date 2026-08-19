/**
 * Store das mensagens de retorno (toasts).
 *
 * O componente `ToastRegion` renderiza esta fila dentro de uma região
 * `aria-live`, para que confirmações e erros sejam anunciados por leitor de
 * tela — e não apenas apareçam na tela.
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'

let nextId = 1

/** Sucessos somem sozinhos; erros ficam até o usuário fechar. */
const DEFAULT_DURATION = 6000

export const useToastStore = defineStore('toast', () => {
  const toasts = ref([])
  const timers = new Map()

  function dismiss(id) {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
    const timer = timers.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.delete(id)
    }
  }

  /**
   * @param {object} toast
   * @param {'success'|'error'|'info'} toast.tone
   * @param {string} toast.message
   * @param {number} [toast.duration] `0` mantém a mensagem na tela.
   */
  function push({ tone = 'info', message, duration }) {
    if (!message) return null
    const id = nextId++
    // Erros usam `role="alert"` (interrompe a leitura); o resto usa
    // `role="status"`, que espera uma pausa natural.
    const politeness = tone === 'error' ? 'assertive' : 'polite'
    toasts.value = [...toasts.value, { id, tone, message, politeness }]

    const ttl = duration ?? (tone === 'error' ? 0 : DEFAULT_DURATION)
    if (ttl > 0) {
      timers.set(
        id,
        setTimeout(() => dismiss(id), ttl),
      )
    }
    return id
  }

  const success = (message, options) => push({ ...options, tone: 'success', message })
  const error = (message, options) => push({ ...options, tone: 'error', message })
  const info = (message, options) => push({ ...options, tone: 'info', message })

  function clearAll() {
    for (const timer of timers.values()) clearTimeout(timer)
    timers.clear()
    toasts.value = []
  }

  return { toasts, push, success, error, info, dismiss, clearAll }
})
