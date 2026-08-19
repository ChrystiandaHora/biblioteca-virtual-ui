/** Estatísticas consolidadas que alimentam o painel. */

import { request } from './httpClient.js'

export function fetchReadingStats({ signal } = {}) {
  return request('/api/stats', { signal })
}
