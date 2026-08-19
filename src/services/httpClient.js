/**
 * Cliente HTTP único usado por todos os serviços.
 *
 * Concentra três coisas que não devem ficar espalhadas pelas telas:
 *  - a URL base da API (vinda de `VITE_API_URL`);
 *  - o cabeçalho `Authorization` com o token JWT;
 *  - a tradução de erro HTTP em `ApiError` com mensagem legível em pt-BR.
 */

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

export const TOKEN_STORAGE_KEY = 'biblioteca:token'

/** Erro de API com status e mensagem já prontos para exibição. */
export class ApiError extends Error {
  constructor(message, { status = 0, details = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }

  /** `true` quando o token expirou ou é inválido. */
  get isUnauthorized() {
    return this.status === 401
  }
}

export function readToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    // Modo privado com storage bloqueado: seguimos sem sessão persistida.
    return null
  }
}

export function writeToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token)
    else localStorage.removeItem(TOKEN_STORAGE_KEY)
  } catch {
    /* storage indisponível — a sessão vale só para esta aba */
  }
}

/**
 * O FastAPI devolve `detail` como string ou como lista de erros de validação.
 * Aqui viramos isso em uma frase única.
 */
function extractMessage(payload, status) {
  const detail = payload?.detail

  if (typeof detail === 'string' && detail.trim()) return detail

  if (Array.isArray(detail) && detail.length > 0) {
    const parts = detail
      .map((item) => {
        const field = Array.isArray(item.loc) ? item.loc.at(-1) : null
        const message = item.msg ?? 'valor inválido'
        return field ? `${field}: ${message}` : message
      })
      .filter(Boolean)
    if (parts.length > 0) return parts.join('; ')
  }

  if (status === 401) return 'Sua sessão expirou. Entre novamente.'
  if (status === 403) return 'Você não tem permissão para esta ação.'
  if (status === 404) return 'Registro não encontrado.'
  if (status === 409) return 'Este registro já existe.'
  if (status >= 500) return 'A API respondeu com um erro interno. Tente novamente.'
  return `Não foi possível concluir a operação (HTTP ${status}).`
}

/**
 * Executa uma requisição contra a API.
 *
 * @param {string} path Caminho a partir da raiz da API, ex.: `/api/library`.
 * @param {object} [options]
 * @param {string} [options.method] Método HTTP. Padrão `GET`.
 * @param {object} [options.body] Corpo serializado como JSON.
 * @param {boolean} [options.auth] Envia o token. Padrão `true`.
 * @param {AbortSignal} [options.signal] Permite cancelar buscas em digitação.
 * @returns {Promise<any>} Corpo da resposta, ou `null` em 204.
 */
export async function request(path, { method = 'GET', body, auth = true, signal } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  if (auth) {
    const token = readToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    // Falha de rede: a API pode estar fora do ar ou o CORS bloqueou.
    throw new ApiError(
      'Não foi possível falar com a API da Biblioteca Virtual. Verifique se ela está no ar.',
      { status: 0 },
    )
  }

  if (response.status === 204) return null

  let payload = null
  const isJson = response.headers.get('content-type')?.includes('application/json')
  if (isJson) {
    payload = await response.json().catch(() => null)
  }

  if (!response.ok) {
    throw new ApiError(extractMessage(payload, response.status), {
      status: response.status,
      details: payload,
    })
  }

  return payload
}

/** Monta uma query string ignorando valores vazios, nulos ou indefinidos. */
export function buildQuery(params) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') continue
    search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}
