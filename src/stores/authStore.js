/** Store da sessão do leitor: token JWT, usuário logado e restauração da sessão. */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import * as authService from '@/services/authService.js'
import { ApiError, readToken, writeToken } from '@/services/httpClient.js'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(readToken())
  const user = ref(null)
  const isRestoring = ref(false)

  const isAuthenticated = computed(() => Boolean(token.value && user.value))

  /** Primeiro nome, usado na saudação do cabeçalho. */
  const firstName = computed(() => user.value?.name?.split(' ')[0] ?? '')

  function persist(session) {
    token.value = session.access_token
    user.value = session.user
    writeToken(session.access_token)
  }

  function clear() {
    token.value = null
    user.value = null
    writeToken(null)
  }

  /**
   * Cadastra e já autentica: a API devolve o token no register, então quem
   * acabou de digitar e-mail e senha não precisa digitá-los outra vez.
   */
  async function register(credentials) {
    persist(await authService.register(credentials))
  }

  async function login(credentials) {
    persist(await authService.login(credentials))
  }

  function logout() {
    clear()
  }

  /**
   * Revalida o token salvo no localStorage ao abrir a aplicação.
   * Token expirado ou inválido é descartado em silêncio — a pessoa
   * simplesmente cai na tela de entrada.
   */
  async function restoreSession() {
    if (!token.value || user.value) return
    isRestoring.value = true
    try {
      user.value = await authService.fetchCurrentUser()
    } catch (error) {
      if (error instanceof ApiError && error.isUnauthorized) clear()
      else throw error
    } finally {
      isRestoring.value = false
    }
  }

  return {
    token,
    user,
    isRestoring,
    isAuthenticated,
    firstName,
    register,
    login,
    logout,
    restoreSession,
  }
})
