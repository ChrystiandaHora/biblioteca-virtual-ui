<script setup>
/**
 * Tela de entrada.
 *
 * Cuidados de autenticação acessível (SC 3.3.8) aplicados aqui:
 *  - o campo de senha NÃO bloqueia colar — travar o `paste` reintroduz
 *    justamente o teste de memória que o critério existe para eliminar, e
 *    inutiliza gerenciadores de senha;
 *  - `autocomplete="email"` e `autocomplete="current-password"` deixam o
 *    preenchimento automático funcionar;
 *  - há um botão para revelar a senha, com o estado dito em texto;
 *  - o erro de credencial aparece em um alerta com ícone + texto e recebe foco.
 */

import { nextTick, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BaseButton from '@/components/BaseButton.vue'
import BaseField from '@/components/BaseField.vue'
import BaseIcon from '@/components/BaseIcon.vue'
import ThemePicker from '@/components/ThemePicker.vue'
import { ApiError } from '@/services/httpClient.js'
import { useAuthStore } from '@/stores/authStore.js'
import { useToastStore } from '@/stores/toastStore.js'

const auth = useAuthStore()
const toasts = useToastStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const isSubmitting = ref(false)
const formError = ref('')
const errorRef = ref(null)

const fieldErrors = ref({ email: '', password: '' })

const formRef = ref(null)

/**
 * Leva o foco ao primeiro campo inválido.
 *
 * Sem isto, enviar o formulário vazio era completamente silencioso para quem
 * usa leitor de tela: as mensagens apareciam nos campos, mas o foco continuava
 * no botão e nada entrava em região viva. O caminho de erro da API já fazia
 * isso; a validação local não fazia.
 */
async function focusFirstInvalidField() {
  await nextTick()
  formRef.value?.querySelector('[aria-invalid="true"]')?.focus()
}


function validate() {
  fieldErrors.value = {
    email: email.value.trim() ? '' : 'Informe o e-mail cadastrado.',
    password: password.value ? '' : 'Informe sua senha.',
  }
  return !fieldErrors.value.email && !fieldErrors.value.password
}

async function handleSubmit() {
  formError.value = ''
  if (!validate()) {
    await focusFirstInvalidField()
    return
  }

  isSubmitting.value = true
  try {
    await auth.login({ email: email.value.trim(), password: password.value })
    toasts.success(`Bem-vindo de volta, ${auth.firstName}!`)
    // `redirect` devolve a pessoa à tela que ela tentou abrir antes do login.
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null
    await router.push(redirect ?? { name: 'painel' })
  } catch (error) {
    formError.value =
      error instanceof ApiError ? error.message : 'Não foi possível entrar. Tente novamente.'
    // O foco vai ao alerta para que a mensagem seja lida imediatamente.
    await nextTick()
    errorRef.value?.focus()
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="container auth">
    <div class="auth__card panel">
      <header class="auth__header">
        <span class="auth__logo">
          <BaseIcon name="books" size="xl" />
        </span>
        <h1 class="auth__title">Entrar na Biblioteca Virtual</h1>
        <p class="auth__subtitle">
          Sua estante, seu progresso de leitura e seu diário de anotações em um só lugar.
        </p>
      </header>

      <!-- `novalidate` porque validamos e exibimos as mensagens por conta
           própria, em português e ligadas ao campo por aria-describedby. -->
      <form ref="formRef" class="auth__form" novalidate @submit.prevent="handleSubmit">
        <div
          v-if="formError"
          ref="errorRef"
          class="auth__alert"
          role="alert"
          tabindex="-1"
        >
          <BaseIcon name="warning" size="md" />
          <p><span class="auth__alert-prefix">Erro:</span> {{ formError }}</p>
        </div>

        <BaseField
          v-model="email"
          label="E-mail"
          type="email"
          autocomplete="email"
          required
          :error="fieldErrors.email"
        />

        <div class="auth__password">
          <BaseField
            v-model="password"
            label="Senha"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            required
            :error="fieldErrors.password"
          />
          <button type="button" class="auth__reveal" @click="showPassword = !showPassword">
            <BaseIcon :name="showPassword ? 'eyeSlash' : 'eye'" size="sm" />
            {{ showPassword ? 'Ocultar senha' : 'Mostrar senha' }}
          </button>
        </div>

        <BaseButton type="submit" size="lg" block :loading="isSubmitting">
          Entrar
        </BaseButton>
      </form>

      <p class="auth__switch">
        Ainda não tem conta?
        <RouterLink :to="{ name: 'criar-conta' }">Criar uma conta gratuita</RouterLink>
      </p>

      <hr class="auth__divider" />

      <ThemePicker />
    </div>
  </div>
</template>

<style scoped>
.auth {
  display: flex;
  justify-content: center;
  padding-block: var(--space-5);
}

.auth__card {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  width: 100%;
  max-width: 30rem;
}

.auth__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.auth__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  color: var(--accent-text);
  background-color: var(--accent);
  border-radius: var(--radius-md);
}

.auth__title {
  font-size: var(--text-2xl);
}

.auth__subtitle {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.auth__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.auth__alert {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
  padding: var(--space-3);
  font-size: var(--text-sm);
  color: var(--text);
  background-color: var(--danger-soft-bg);
  border: 1px solid var(--danger);
  border-radius: var(--radius-md);
}

.auth__alert-prefix {
  font-weight: 700;
  color: var(--danger);
}

.auth__password {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  align-items: flex-start;
}

.auth__reveal {
  display: inline-flex;
  gap: var(--space-2);
  align-items: center;
  min-height: var(--target-min);
  padding: var(--space-1) var(--space-2);
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--accent);
  background: none;
  border: 0;
  border-radius: var(--radius-sm);
}

.auth__reveal:hover {
  background-color: var(--surface-2);
}

.auth__switch {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.auth__divider {
  height: 1px;
  background-color: var(--border);
  border: 0;
}
</style>
