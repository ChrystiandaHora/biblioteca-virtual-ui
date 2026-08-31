<script setup>
/**
 * Tela de criação de conta.
 *
 * Sobre a confirmação de senha: é a exceção prevista em SC 3.3.7 (entrada
 * redundante) — repetir a senha é essencial para detectar erro de digitação em
 * um campo mascarado, então continua justificado.
 *
 * O botão "Mostrar senha" revela AMBOS os campos de uma vez: quem consegue ver
 * o que digitou não precisa da confirmação às cegas.
 *
 * A regra de senha aparece como dica visível ANTES do envio, e não só como erro
 * depois — instrução crucial não pode viver apenas no placeholder.
 */

import { computed, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'

import BaseButton from '@/components/BaseButton.vue'
import BaseField from '@/components/BaseField.vue'
import BaseIcon from '@/components/BaseIcon.vue'
import { ApiError } from '@/services/httpClient.js'
import { useAuthStore } from '@/stores/authStore.js'
import { useToastStore } from '@/stores/toastStore.js'

const auth = useAuthStore()
const toasts = useToastStore()
const router = useRouter()

const MIN_PASSWORD_LENGTH = 8

const name = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const showPassword = ref(false)
const isSubmitting = ref(false)
const formError = ref('')
const errorRef = ref(null)

const fieldErrors = ref({ name: '', email: '', password: '', passwordConfirmation: '' })

const passwordHint = computed(() => `Mínimo de ${MIN_PASSWORD_LENGTH} caracteres.`)

function validate() {
  const trimmedName = name.value.trim()
  const trimmedEmail = email.value.trim()

  fieldErrors.value = {
    name: trimmedName.length >= 2 ? '' : 'Informe seu nome com pelo menos 2 caracteres.',
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)
      ? ''
      : 'Informe um e-mail válido, como nome@exemplo.com.',
    password:
      password.value.length >= MIN_PASSWORD_LENGTH
        ? ''
        : `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    passwordConfirmation:
      passwordConfirmation.value === password.value ? '' : 'As duas senhas precisam ser iguais.',
  }

  return Object.values(fieldErrors.value).every((message) => !message)
}

async function handleSubmit() {
  formError.value = ''
  if (!validate()) return

  isSubmitting.value = true
  try {
    // A API devolve o token já no cadastro, então entramos direto — sem pedir
    // e-mail e senha de novo na tela seguinte.
    await auth.register({
      name: name.value.trim(),
      email: email.value.trim(),
      password: password.value,
    })
    toasts.success(`Conta criada. Boas leituras, ${auth.firstName}!`)
    await router.push({ name: 'buscar' })
  } catch (error) {
    formError.value =
      error instanceof ApiError ? error.message : 'Não foi possível criar a conta. Tente novamente.'
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
        <h1 class="auth__title">Criar sua conta</h1>
        <p class="auth__subtitle">
          Leva menos de um minuto. Depois você já pode buscar livros e montar sua estante.
        </p>
      </header>

      <form class="auth__form" novalidate @submit.prevent="handleSubmit">
        <div v-if="formError" ref="errorRef" class="auth__alert" role="alert" tabindex="-1">
          <BaseIcon name="warning" :size="18" />
          <p><span class="auth__alert-prefix">Erro:</span> {{ formError }}</p>
        </div>

        <BaseField
          v-model="name"
          label="Nome"
          autocomplete="name"
          required
          :error="fieldErrors.name"
        />

        <BaseField
          v-model="email"
          label="E-mail"
          type="email"
          autocomplete="email"
          required
          :error="fieldErrors.email"
        />

        <BaseField
          v-model="password"
          label="Senha"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="new-password"
          :hint="passwordHint"
          required
          :error="fieldErrors.password"
        />

        <BaseField
          v-model="passwordConfirmation"
          label="Confirme a senha"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="new-password"
          hint="Digite a mesma senha para confirmar."
          required
          :error="fieldErrors.passwordConfirmation"
        />

        <button type="button" class="auth__reveal" @click="showPassword = !showPassword">
          <BaseIcon :name="showPassword ? 'eyeSlash' : 'eye'" size="sm" />
          {{ showPassword ? 'Ocultar as senhas' : 'Mostrar as senhas' }}
        </button>

        <BaseButton type="submit" size="lg" block :loading="isSubmitting">
          Criar conta e entrar
        </BaseButton>
      </form>

      <p class="auth__switch">
        Já tem conta?
        <RouterLink :to="{ name: 'entrar' }">Entrar</RouterLink>
      </p>
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
  align-items: stretch;
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

.auth__reveal {
  display: inline-flex;
  gap: var(--space-2);
  align-items: center;
  align-self: flex-start;
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
</style>
