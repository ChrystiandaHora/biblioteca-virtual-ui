/** Estante pessoal e diário de leitura — os 4 métodos HTTP do CRUD. */

import { buildQuery, request } from './httpClient.js'

/* --------------------------------- estante -------------------------------- */

/**
 * Lista a estante com filtros combináveis.
 *
 * @param {object} [filters]
 * @param {string} [filters.status] Estágio de leitura.
 * @param {string} [filters.q] Busca por título ou autor.
 * @param {string} [filters.subject] Assunto/gênero.
 * @param {number} [filters.minRating] Nota mínima.
 * @param {string} [filters.orderBy] Campo de ordenação.
 * @param {string} [filters.direction] `asc` ou `desc`.
 * @param {number} [filters.page]
 * @param {number} [filters.pageSize]
 */
export function fetchLibrary({
  status,
  q,
  subject,
  minRating,
  orderBy = 'recentes',
  direction = 'desc',
  page = 1,
  pageSize = 12,
  signal,
} = {}) {
  const query = buildQuery({
    status,
    q,
    subject,
    min_rating: minRating,
    order_by: orderBy,
    direction,
    page,
    page_size: pageSize,
  })
  return request(`/api/library${query}`, { signal })
}

export function fetchLibraryItem(itemId, { signal } = {}) {
  return request(`/api/library/${itemId}`, { signal })
}

/** Adiciona à estante um livro trazido da busca. */
export function addToLibrary(book) {
  return request('/api/library', {
    method: 'POST',
    body: {
      open_library_key: book.open_library_key,
      title: book.title,
      authors: book.authors ?? [],
      cover_id: book.cover_id ?? null,
      first_publish_year: book.first_publish_year ?? null,
      subjects: book.subjects ?? [],
      status: book.status ?? 'quero_ler',
      total_pages: book.total_pages ?? null,
    },
  })
}

/** Atualiza status, progresso, nota ou datas. Só envie o que mudou. */
export function updateLibraryItem(itemId, changes) {
  return request(`/api/library/${itemId}`, { method: 'PUT', body: changes })
}

export function removeLibraryItem(itemId) {
  return request(`/api/library/${itemId}`, { method: 'DELETE' })
}

/* ---------------------------------- diário -------------------------------- */

export function fetchDiaryEntries(itemId, { signal } = {}) {
  return request(`/api/library/${itemId}/diary`, { signal })
}

export function createDiaryEntry(itemId, { kind, content, page }) {
  return request(`/api/library/${itemId}/diary`, {
    method: 'POST',
    body: { kind, content, page: page ?? null },
  })
}

export function updateDiaryEntry(entryId, changes) {
  return request(`/api/diary/${entryId}`, { method: 'PUT', body: changes })
}

export function deleteDiaryEntry(entryId) {
  return request(`/api/diary/${entryId}`, { method: 'DELETE' })
}
