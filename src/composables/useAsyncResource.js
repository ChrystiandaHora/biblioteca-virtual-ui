/**
 * Carregamento assíncrono com os três estados que toda tela precisa tratar:
 * carregando, erro e conteúdo.
 *
 * Centraliza também dois cuidados fáceis de esquecer:
 *  - cancelar a requisição anterior quando uma nova começa (evita que uma
 *    resposta atrasada sobrescreva a mais recente);
 *  - manter os dados antigos visíveis durante o recarregamento, em vez de
 *    piscar um esqueleto e fazer a página saltar.
 */

import { onBeforeUnmount, ref, shallowRef } from 'vue'

/**
 * @param {(options: { signal: AbortSignal }) => Promise<any>} loader
 * @param {object} [options]
 * @param {any} [options.initialData]
 */
export function useAsyncResource(loader, { initialData = null } = {}) {
  const data = shallowRef(initialData)
  const error = ref(null)
  const isLoading = ref(false)
  /** `true` só na primeira carga — é quando o esqueleto faz sentido. */
  const isFirstLoad = ref(true)

  let controller = null

  async function load(...args) {
    controller?.abort()
    controller = new AbortController()
    const { signal } = controller

    isLoading.value = true
    error.value = null

    try {
      const result = await loader({ signal }, ...args)
      if (signal.aborted) return null
      data.value = result
      return result
    } catch (caught) {
      if (caught?.name === 'AbortError' || signal.aborted) return null
      error.value = caught
      return null
    } finally {
      if (!signal.aborted) {
        isLoading.value = false
        isFirstLoad.value = false
      }
    }
  }

  onBeforeUnmount(() => controller?.abort())

  return { data, error, isLoading, isFirstLoad, load }
}
