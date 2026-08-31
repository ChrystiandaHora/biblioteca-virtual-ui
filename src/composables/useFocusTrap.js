/**
 * Aprisiona o foco dentro de um elemento (diálogos modais).
 *
 * Cobre o contrato de modal exigido pelo WAI-ARIA APG:
 *  1. o foco entra no diálogo ao abrir;
 *  2. Tab e Shift+Tab circulam apenas dentro dele;
 *  3. Esc fecha;
 *  4. o foco volta para o elemento que abriu o diálogo.
 *
 * O passo 4 é o mais esquecido — sem ele, quem navega por teclado é devolvido
 * ao início da página e perde o lugar.
 */

import { onBeforeUnmount, onMounted } from 'vue'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function focusableWithin(container) {
  return Array.from(container.querySelectorAll(FOCUSABLE)).filter(
    (element) => element.offsetWidth > 0 || element.offsetHeight > 0 || element === document.activeElement,
  )
}

/**
 * @param {import('vue').Ref<HTMLElement | null>} containerRef Elemento do diálogo.
 * @param {object} options
 * @param {() => void} options.onEscape Chamado ao pressionar Esc.
 * @param {() => HTMLElement | null | undefined} options.fallbackFocus
 *   Alvo do foco quando o gatilho não sobreviveu à ação confirmada.
 */
export function useFocusTrap(containerRef, { onEscape, fallbackFocus } = {}) {
  let previouslyFocused = null

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onEscape?.()
      return
    }

    if (event.key !== 'Tab') return

    const container = containerRef.value
    if (!container) return

    const focusable = focusableWithin(container)
    if (focusable.length === 0) {
      // Diálogo sem nada focável: mantemos o foco no próprio contêiner.
      event.preventDefault()
      container.focus()
      return
    }

    const first = focusable[0]
    const last = focusable.at(-1)
    const active = document.activeElement

    // Os dois ramos precisam tratar "foco fora do contêiner": senão o Tab para
    // frente escapa para o fundo, que é justamente o que o aprisionamento
    // deveria impedir.
    if (event.shiftKey && (active === first || !container.contains(active))) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && (active === last || !container.contains(active))) {
      event.preventDefault()
      first.focus()
    }
  }

  onMounted(() => {
    previouslyFocused = document.activeElement

    const container = containerRef.value
    if (container) {
      // Preferimos o primeiro controle real; o contêiner é o plano B.
      const target = focusableWithin(container)[0] ?? container
      target.focus()
    }

    document.addEventListener('keydown', handleKeydown, true)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('keydown', handleKeydown, true)

    // Devolve o foco a quem abriu o diálogo.
    if (previouslyFocused instanceof HTMLElement && document.contains(previouslyFocused)) {
      previouslyFocused.focus()
      return
    }

    // Em confirmação destrutiva o gatilho costuma ser justamente o que a ação
    // apagou — o botão de lixeira da linha removida, por exemplo. Sem um alvo
    // de reserva o foco cai no <body> e a pessoa volta ao topo do documento
    // sem aviso nenhum.
    const fallback = fallbackFocus?.()
    if (fallback instanceof HTMLElement) fallback.focus()
  })
}
