/**
 * Acompanha a largura em pixels de um elemento.
 *
 * Serve ao gráfico em SVG: casando a largura do `viewBox` com a largura real do
 * elemento, a escala do SVG fica sempre em 1:1. Isso importa porque um SVG
 * escalado escala também o texto — um rótulo de 12 unidades em um contêiner
 * menor que o `viewBox` renderizaria abaixo do piso tipográfico de 12px.
 */

import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * @param {import('vue').Ref<HTMLElement | null>} elementRef
 * @param {object} [options]
 * @param {number} [options.min] Largura mínima devolvida; abaixo disso o
 *   contêiner deve rolar em vez de comprimir o conteúdo.
 * @param {number} [options.initial] Valor usado antes da primeira medição.
 */
export function useElementWidth(elementRef, { min = 300, initial = 720 } = {}) {
  const width = ref(initial)
  let observer = null

  function measure(value) {
    width.value = Math.max(min, Math.round(value))
  }

  onMounted(() => {
    const element = elementRef.value
    if (!element) return

    measure(element.clientWidth || initial)

    // `ResizeObserver` reage a qualquer mudança de largura — inclusive as que
    // não passam por resize da janela, como abrir o menu lateral ou o usuário
    // aumentar o zoom.
    if (typeof ResizeObserver === 'undefined') return
    observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) measure(entry.contentRect.width)
    })
    observer.observe(element)
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  return width
}
