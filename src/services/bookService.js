/**
 * Busca no catálogo. Os dados vêm da Open Library, mas SEMPRE através da
 * nossa API — a interface não conhece nem chama openlibrary.org diretamente.
 */

import { buildQuery, request } from './httpClient.js'

/**
 * @param {object} params
 * @param {string} params.q Título, autor ou assunto.
 * @param {number} [params.page]
 * @param {number} [params.pageSize]
 * @param {AbortSignal} [params.signal] Cancela a busca anterior ao digitar de novo.
 */
export function searchBooks({ q, page = 1, pageSize = 12, signal } = {}) {
  const query = buildQuery({ q, page, page_size: pageSize })
  return request(`/api/books/search${query}`, { signal })
}

/** Detalhes de uma obra, incluindo a sinopse. */
export function fetchBookDetail(workKey, { signal } = {}) {
  return request(`/api/books/${encodeURIComponent(workKey)}`, { signal })
}
