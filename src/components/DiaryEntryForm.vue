<script setup>
/**
 * Formulário de registro no diário — serve para criar e para editar.
 *
 * O tipo do registro é um grupo de radios visíveis, não um select escondido:
 * são só três opções e ver as três de uma vez é mais rápido do que abrir uma
 * lista. Radios nativos trazem o teclado e o anúncio "2 de 3" prontos.
 */

import { computed, ref, useId, watch } from 'vue'

import { DIARY_KINDS } from '@/domain/readingStatus.js'

import BaseButton from './BaseButton.vue'
import BaseField from './BaseField.vue'
import BaseIcon from './BaseIcon.vue'

const props = defineProps({
  /** Registro existente, quando o formulário está em modo de edição. */
  entry: { type: Object, default: null },
  totalPages: { type: Number, default: null },
  submitting: { type: Boolean, default: false },
})

const emit = defineEmits(['submit', 'cancel'])

const uid = useId()
const kindGroupName = `diary-kind-${uid}`

const kind = ref(props.entry?.kind ?? 'nota')
const content = ref(props.entry?.content ?? '')
const page = ref(props.entry?.page != null ? String(props.entry.page) : '')
const contentError = ref('')
const pageError = ref('')

const isEditing = computed(() => Boolean(props.entry))

// Ao trocar qual registro está sendo editado, recarrega os campos.
watch(
  () => props.entry,
  (value) => {
    kind.value = value?.kind ?? 'nota'
    content.value = value?.content ?? ''
    page.value = value?.page != null ? String(value.page) : ''
    contentError.value = ''
    pageError.value = ''
  },
)

const pageHint = computed(() =>
  props.totalPages
    ? `Opcional. Entre 1 e ${props.totalPages.toLocaleString('pt-BR')}.`
    : 'Opcional.',
)

function validate() {
  contentError.value = content.value.trim() ? '' : 'Escreva o conteúdo do registro.'

  pageError.value = ''
  if (page.value !== '') {
    const parsed = Number(page.value)
    if (!Number.isInteger(parsed) || parsed < 0) {
      pageError.value = 'A página deve ser um número inteiro positivo.'
    } else if (props.totalPages && parsed > props.totalPages) {
      pageError.value = `Este livro tem ${props.totalPages.toLocaleString('pt-BR')} páginas.`
    }
  }

  return !contentError.value && !pageError.value
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
    kind: kind.value,
    content: content.value.trim(),
    page: page.value === '' ? null : Number(page.value),
  })
}

/** Limpa o formulário depois de um envio bem-sucedido (modo de criação). */
function reset() {
  kind.value = 'nota'
  content.value = ''
  page.value = ''
  contentError.value = ''
  pageError.value = ''
}

defineExpose({ reset })
</script>

<template>
  <form class="diary-form" novalidate @submit.prevent="handleSubmit">
    <fieldset class="diary-form__kinds">
      <legend class="diary-form__legend">Tipo de registro</legend>
      <div class="diary-form__kind-options">
        <label v-for="option in DIARY_KINDS" :key="option.value" class="kind-option">
          <input
            class="kind-option__radio sr-only"
            type="radio"
            :name="kindGroupName"
            :value="option.value"
            :checked="kind === option.value"
            @change="kind = option.value"
          />
          <span class="kind-option__body">
            <BaseIcon :name="option.icon" :size="16" />
            {{ option.label }}
          </span>
        </label>
      </div>
    </fieldset>

    <BaseField
      v-model="content"
      label="Conteúdo"
      multiline
      :rows="4"
      :maxlength="5000"
      required
      :error="contentError"
      placeholder="O que você quer guardar sobre esta leitura?"
    />

    <BaseField
      v-model="page"
      label="Página"
      type="number"
      inputmode="numeric"
      min="0"
      :max="totalPages ?? undefined"
      :hint="pageHint"
      :error="pageError"
    />

    <div class="diary-form__actions">
      <BaseButton v-if="isEditing" variant="secondary" @click="emit('cancel')">
        Cancelar
      </BaseButton>
      <!-- O rótulo diz o que está sendo salvo, e não apenas "Salvar": a mesma
           tela tem outro formulário com botão de salvar, e dois botões
           homônimos são indistinguíveis para quem navega pela lista de
           botões do leitor de tela. -->
      <BaseButton type="submit" :icon="isEditing ? 'check' : 'plus'" :loading="submitting">
        {{ isEditing ? 'Salvar registro do diário' : 'Adicionar ao diário' }}
      </BaseButton>
    </div>
  </form>
</template>

<style scoped>
.diary-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.diary-form__kinds {
  padding: 0;
  margin: 0;
  border: 0;
}

.diary-form__legend {
  padding: 0 0 var(--space-2);
  font-size: var(--text-sm);
  font-weight: 600;
}

.diary-form__kind-options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.kind-option {
  cursor: pointer;
}

.kind-option__body {
  display: inline-flex;
  gap: var(--space-2);
  align-items: center;
  min-height: var(--target);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text);
  background-color: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  transition: background-color var(--transition), border-color var(--transition);
}

.kind-option:hover .kind-option__body {
  background-color: var(--surface-2);
}

.kind-option__radio:focus-visible + .kind-option__body {
  outline: var(--focus-width) solid var(--focus);
  outline-offset: var(--focus-offset);
}

/* Selecionado: fundo + borda de 2px, além do estado do radio nativo. */
.kind-option__radio:checked + .kind-option__body {
  color: var(--text);
  background-color: var(--accent-soft-bg);
  border-color: var(--accent);
  border-width: 2px;
  padding: calc(var(--space-2) - 1px) calc(var(--space-3) - 1px);
}

.diary-form__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  justify-content: flex-end;
}
</style>
