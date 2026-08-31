<script setup>
/**
 * Detalhe de um livro da estante: progresso, nota e o diário de leitura.
 *
 * É aqui que a maior parte dos PUT acontece. A atualização de progresso usa um
 * formulário explícito com botão "Salvar" em vez de salvar a cada tecla: uma
 * requisição por caractere digitado geraria estados intermediários inválidos e
 * um enxame de anúncios em região viva.
 */

import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BaseButton from '@/components/BaseButton.vue'
import BaseField from '@/components/BaseField.vue'
import BaseIcon from '@/components/BaseIcon.vue'
import BaseModal from '@/components/BaseModal.vue'
import BaseSelect from '@/components/BaseSelect.vue'
import BookCover from '@/components/BookCover.vue'
import DiaryEntryCard from '@/components/DiaryEntryCard.vue'
import DiaryEntryForm from '@/components/DiaryEntryForm.vue'
import EmptyState from '@/components/EmptyState.vue'
import ProgressMeter from '@/components/ProgressMeter.vue'
import RatingInput from '@/components/RatingInput.vue'
import SkeletonList from '@/components/SkeletonList.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useAsyncResource } from '@/composables/useAsyncResource.js'
import { READING_STATUS_LIST } from '@/domain/readingStatus.js'
import { fetchBookDetail } from '@/services/bookService.js'
import {
  createDiaryEntry,
  deleteDiaryEntry,
  fetchLibraryItem,
  removeLibraryItem,
  updateDiaryEntry,
  updateLibraryItem,
} from '@/services/libraryService.js'
import { useToastStore } from '@/stores/toastStore.js'

const route = useRoute()
const router = useRouter()
const toasts = useToastStore()

const itemId = computed(() => Number(route.params.id))

const STATUS_OPTIONS = READING_STATUS_LIST.map((status) => ({
  value: status.value,
  label: status.label,
}))

/* ------------------------------- carregamento ------------------------------ */

const { data: item, error, isLoading, isFirstLoad, load } = useAsyncResource(({ signal }) =>
  fetchLibraryItem(itemId.value, { signal }),
)

/** Sinopse buscada na Open Library — falha aqui não impede usar a tela. */
const synopsis = ref(null)
const isLoadingSynopsis = ref(false)

async function loadSynopsis(key) {
  if (!key) return
  isLoadingSynopsis.value = true
  try {
    const detail = await fetchBookDetail(key)
    synopsis.value = detail.description
  } catch {
    synopsis.value = null
  } finally {
    isLoadingSynopsis.value = false
  }
}

onMounted(async () => {
  await load()
  if (item.value) loadSynopsis(item.value.open_library_key)
})

// Navegar entre livros sem sair da rota recarrega tudo.
watch(itemId, async () => {
  synopsis.value = null
  await load()
  if (item.value) loadSynopsis(item.value.open_library_key)
})

/* ------------------------- edição de status/progresso ---------------------- */

const draft = ref({ status: 'quero_ler', currentPage: '', totalPages: '', rating: null })
const isSavingProgress = ref(false)
const progressError = ref('')

/** Espelha o item carregado no rascunho do formulário. */
watch(
  item,
  (value) => {
    if (!value) return
    draft.value = {
      status: value.status,
      currentPage: String(value.current_page ?? 0),
      totalPages: value.total_pages != null ? String(value.total_pages) : '',
      rating: value.rating,
    }
    progressError.value = ''
  },
  { immediate: true },
)

const hasProgressChanges = computed(() => {
  if (!item.value) return false
  return (
    draft.value.status !== item.value.status ||
    Number(draft.value.currentPage || 0) !== (item.value.current_page ?? 0) ||
    (draft.value.totalPages === '' ? null : Number(draft.value.totalPages)) !==
      (item.value.total_pages ?? null) ||
    draft.value.rating !== item.value.rating
  )
})

/** Progresso calculado ao vivo, antes de salvar. */
const previewPercent = computed(() => {
  if (draft.value.status === 'lido') return 100
  const total = Number(draft.value.totalPages)
  const current = Number(draft.value.currentPage)
  if (!total || !current) return 0
  return Math.min(100, Math.round((current / total) * 100))
})

async function saveProgress() {
  progressError.value = ''

  const total = draft.value.totalPages === '' ? null : Number(draft.value.totalPages)
  const current = Number(draft.value.currentPage || 0)

  if (total !== null && (!Number.isInteger(total) || total <= 0)) {
    progressError.value = 'O total de páginas deve ser um número inteiro maior que zero.'
    return
  }
  if (!Number.isInteger(current) || current < 0) {
    progressError.value = 'A página atual deve ser um número inteiro positivo.'
    return
  }
  if (total !== null && current > total) {
    progressError.value = `A página atual não pode passar de ${total.toLocaleString('pt-BR')}.`
    return
  }

  isSavingProgress.value = true
  try {
    await updateLibraryItem(itemId.value, {
      status: draft.value.status,
      current_page: current,
      total_pages: total,
      rating: draft.value.rating,
    })
    toasts.success('Progresso de leitura atualizado.')
    await load()
  } catch (caught) {
    progressError.value = caught.message
  } finally {
    isSavingProgress.value = false
  }
}

/* --------------------------------- diário ---------------------------------- */

const diaryFormRef = ref(null)
const editingEntry = ref(null)
const isSavingEntry = ref(false)
const entryPendingDeletion = ref(null)
const isDeletingEntry = ref(false)

async function handleDiarySubmit(payload) {
  isSavingEntry.value = true
  try {
    if (editingEntry.value) {
      await updateDiaryEntry(editingEntry.value.id, payload)
      toasts.success('Registro atualizado.')
      editingEntry.value = null
    } else {
      await createDiaryEntry(itemId.value, payload)
      toasts.success('Registro adicionado ao diário.')
      diaryFormRef.value?.reset()
    }
    await load()
  } catch (caught) {
    toasts.error(caught.message)
  } finally {
    isSavingEntry.value = false
  }
}

async function confirmEntryDeletion() {
  const entry = entryPendingDeletion.value
  if (!entry) return
  isDeletingEntry.value = true
  try {
    await deleteDiaryEntry(entry.id)
    toasts.success('Registro apagado.')
    entryPendingDeletion.value = null
    if (editingEntry.value?.id === entry.id) editingEntry.value = null
    await load()
  } catch (caught) {
    toasts.error(caught.message)
  } finally {
    isDeletingEntry.value = false
  }
}

/* --------------------------- remoção do livro ------------------------------ */

const isConfirmingBookRemoval = ref(false)
const isRemovingBook = ref(false)

async function confirmBookRemoval() {
  isRemovingBook.value = true
  try {
    const title = item.value?.title ?? 'O livro'
    await removeLibraryItem(itemId.value)
    toasts.success(`"${title}" foi removido da estante.`)
    await router.push({ name: 'estante' })
  } catch (caught) {
    toasts.error(caught.message)
    isRemovingBook.value = false
  }
}

/* --------------------------------- derivados ------------------------------- */

const authorsLabel = computed(() =>
  item.value?.authors?.length ? item.value.authors.join(', ') : 'Autoria não informada',
)

const diaryEntries = computed(() => item.value?.diary_entries ?? [])
</script>

<template>
  <div class="container detail">
    <BaseButton variant="ghost" icon="arrowLeft" :to="{ name: 'estante' }" class="detail__back">
      Voltar para a estante
    </BaseButton>

    <SkeletonList v-if="isLoading && isFirstLoad" :count="2" label="Carregando o livro…" />

    <EmptyState
      v-else-if="error"
      tone="error"
      title="Não foi possível abrir este livro."
      :description="error.message"
    >
      <template #action>
        <BaseButton variant="secondary" :to="{ name: 'estante' }">Voltar para a estante</BaseButton>
      </template>
    </EmptyState>

    <template v-else-if="item">
      <!-- Cabeçalho do livro -->
      <header class="detail__header panel">
        <BookCover
          :cover-url="item.cover_url"
          :cover-id="item.cover_id"
          :title="item.title"
          size="lg"
          class="detail__cover"
        />

        <div class="detail__identity">
          <div class="detail__title-row">
            <h1 class="detail__title">{{ item.title }}</h1>
            <StatusBadge :status="item.status" :short="false" />
          </div>

          <p class="detail__authors">{{ authorsLabel }}</p>

          <dl class="detail__facts">
            <div v-if="item.first_publish_year" class="detail__fact">
              <dt>Primeira publicação</dt>
              <dd class="tabular">{{ item.first_publish_year }}</dd>
            </div>
            <div v-if="item.total_pages" class="detail__fact">
              <dt>Páginas</dt>
              <dd class="tabular">{{ item.total_pages.toLocaleString('pt-BR') }}</dd>
            </div>
            <div v-if="item.started_at" class="detail__fact">
              <dt>Início da leitura</dt>
              <dd>{{ new Date(`${item.started_at}T00:00:00`).toLocaleDateString('pt-BR') }}</dd>
            </div>
            <div v-if="item.finished_at" class="detail__fact">
              <dt>Conclusão</dt>
              <dd>{{ new Date(`${item.finished_at}T00:00:00`).toLocaleDateString('pt-BR') }}</dd>
            </div>
          </dl>

          <ul v-if="item.subjects?.length" class="detail__subjects">
            <li v-for="subject in item.subjects.slice(0, 6)" :key="subject" class="detail__subject">
              {{ subject }}
            </li>
          </ul>

          <RatingInput v-if="item.rating" :model-value="item.rating" readonly />

          <ProgressMeter
            :percent="item.progress_percent"
            :current-page="item.current_page"
            :total-pages="item.total_pages"
            class="detail__progress"
          />
        </div>
      </header>

      <!-- Sinopse vinda da API externa -->
      <section v-if="synopsis || isLoadingSynopsis" class="panel" aria-labelledby="synopsis-title">
        <h2 id="synopsis-title" class="detail__section-title">
          <BaseIcon name="review" size="md" class="detail__section-icon" />
          Sinopse
        </h2>
        <p v-if="isLoadingSynopsis" class="detail__loading" role="status">
          Buscando a sinopse na Open Library…
        </p>
        <p v-else class="detail__synopsis">{{ synopsis }}</p>
        <p class="detail__source">Texto fornecido pela Open Library.</p>
      </section>

      <!-- Atualização de leitura (PUT) -->
      <section class="panel" aria-labelledby="progress-title">
        <h2 id="progress-title" class="detail__section-title">
          <BaseIcon name="play" :size="18" class="detail__section-icon" />
          Atualizar leitura
        </h2>

        <form class="progress-form" novalidate @submit.prevent="saveProgress">
          <div v-if="progressError" class="detail__alert" role="alert">
            <BaseIcon name="warning" :size="18" />
            <p><span class="detail__alert-prefix">Erro:</span> {{ progressError }}</p>
          </div>

          <div class="progress-form__grid">
            <BaseSelect
              v-model="draft.status"
              label="Estágio de leitura"
              :options="STATUS_OPTIONS"
              hint="Marcar como concluído preenche a data de término automaticamente."
            />
            <BaseField
              v-model="draft.currentPage"
              label="Página atual"
              type="number"
              inputmode="numeric"
              min="0"
              :max="draft.totalPages || undefined"
              :disabled="draft.status === 'lido'"
            />
            <BaseField
              v-model="draft.totalPages"
              label="Total de páginas"
              type="number"
              inputmode="numeric"
              min="1"
              hint="Preencha para acompanhar a porcentagem."
            />
          </div>

          <RatingInput v-model="draft.rating" label="Sua nota para este livro" />

          <div class="progress-form__preview">
            <p class="progress-form__preview-label">Prévia do progresso</p>
            <ProgressMeter
              :percent="previewPercent"
              :current-page="Number(draft.currentPage || 0)"
              :total-pages="draft.totalPages ? Number(draft.totalPages) : null"
            />
          </div>

          <div class="progress-form__actions">
            <!-- Rótulo específico: a mesma tela tem o botão de salvar do
                 diário, e "Salvar alterações" nos dois seria ambíguo na lista
                 de botões do leitor de tela. -->
            <BaseButton
              type="submit"
              icon="check"
              :disabled="!hasProgressChanges"
              :loading="isSavingProgress"
            >
              Salvar progresso de leitura
            </BaseButton>
          </div>
        </form>
      </section>

      <!-- Diário de leitura (POST / PUT / DELETE) -->
      <section class="panel" aria-labelledby="diary-title">
        <h2 id="diary-title" class="detail__section-title">
          <BaseIcon name="note" size="md" class="detail__section-icon" />
          Diário de leitura
          <span class="detail__count tabular">
            {{ diaryEntries.length }}
            {{ diaryEntries.length === 1 ? 'registro' : 'registros' }}
          </span>
        </h2>

        <div class="diary">
          <div class="diary__form-wrapper">
            <h3 class="diary__form-title">
              {{ editingEntry ? 'Editar registro' : 'Novo registro' }}
            </h3>
            <DiaryEntryForm
              ref="diaryFormRef"
              :entry="editingEntry"
              :total-pages="item.total_pages"
              :submitting="isSavingEntry"
              @submit="handleDiarySubmit"
              @cancel="editingEntry = null"
            />
          </div>

          <div class="diary__list-wrapper">
            <h3 class="diary__list-title">Registros</h3>

            <EmptyState
              v-if="diaryEntries.length === 0"
              icon="note"
              title="Nenhum registro ainda."
              description="Anote uma impressão, guarde uma citação ou escreva a resenha ao terminar."
            />

            <ul v-else class="diary__list">
              <DiaryEntryCard
                v-for="entry in diaryEntries"
                :key="entry.id"
                :entry="entry"
                :busy="isSavingEntry || isDeletingEntry"
                @edit="editingEntry = $event"
                @delete="entryPendingDeletion = $event"
              />
            </ul>
          </div>
        </div>
      </section>

      <!-- Ação destrutiva isolada no fim da página -->
      <section class="panel detail__danger-zone" aria-labelledby="danger-title">
        <h2 id="danger-title" class="detail__section-title">
          <BaseIcon name="warning" size="md" class="detail__danger-icon" />
          Remover da estante
        </h2>
        <p class="detail__danger-text">
          Apagar este livro remove também os
          {{ diaryEntries.length }}
          {{ diaryEntries.length === 1 ? 'registro' : 'registros' }} do diário. A ação não pode ser
          desfeita.
        </p>
        <BaseButton variant="danger" icon="trash" @click="isConfirmingBookRemoval = true">
          Remover “{{ item.title }}”
        </BaseButton>
      </section>

      <BaseModal
        v-if="entryPendingDeletion"
        alert
        title="Apagar este registro do diário?"
        description="O texto será removido permanentemente."
        @close="entryPendingDeletion = null"
      >
        <blockquote class="detail__confirm-quote">
          <p>{{ entryPendingDeletion.content }}</p>
        </blockquote>
        <template #footer>
          <BaseButton variant="secondary" @click="entryPendingDeletion = null">Cancelar</BaseButton>
          <BaseButton
            variant="danger"
            icon="trash"
            :loading="isDeletingEntry"
            @click="confirmEntryDeletion"
          >
            Apagar registro
          </BaseButton>
        </template>
      </BaseModal>

      <BaseModal
        v-if="isConfirmingBookRemoval"
        alert
        title="Remover este livro da estante?"
        :description="`“${item.title}” e todo o diário dele serão apagados. Não há como desfazer.`"
        @close="isConfirmingBookRemoval = false"
      >
        <p class="detail__danger-text">
          O livro continuará existindo no acervo da Open Library — só sai da sua estante.
        </p>
        <template #footer>
          <BaseButton variant="secondary" @click="isConfirmingBookRemoval = false">
            Cancelar
          </BaseButton>
          <BaseButton variant="danger" icon="trash" :loading="isRemovingBook" @click="confirmBookRemoval">
            Remover livro
          </BaseButton>
        </template>
      </BaseModal>
    </template>
  </div>
</template>

<style scoped>
.detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.detail__back {
  align-self: flex-start;
}

/* -------------------------------- cabeçalho ------------------------------- */

.detail__header {
  display: grid;
  gap: var(--space-4);
}

@media (min-width: 42rem) {
  .detail__header {
    grid-template-columns: auto 1fr;
    align-items: start;
  }
}

.detail__cover {
  justify-self: center;
}

@media (min-width: 42rem) {
  .detail__cover {
    justify-self: start;
  }
}

.detail__identity {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-width: 0;
}

.detail__title-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: baseline;
}

.detail__title {
  font-size: var(--text-2xl);
  overflow-wrap: anywhere;
}

.detail__authors {
  font-size: var(--text-base);
  color: var(--text-muted);
}

.detail__facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  gap: var(--space-3);
  margin: 0;
}

.detail__fact dt {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--text-muted);
}

.detail__fact dd {
  margin: 0;
  font-size: var(--text-sm);
  font-weight: 600;
}

.detail__subjects {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.detail__subject {
  padding: 2px var(--space-2);
  font-size: var(--text-xs);
  color: var(--text-muted);
  background-color: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
}

.detail__progress {
  max-width: 26rem;
}

/* --------------------------------- seções --------------------------------- */

.detail__section-title {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  margin-bottom: var(--space-4);
  font-size: var(--text-lg);
}

.detail__section-icon {
  color: var(--accent);
}

.detail__count {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--text-muted);
}

.detail__synopsis {
  font-size: var(--text-sm);
  line-height: 1.7;
  white-space: pre-line;
}

.detail__loading {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.detail__source {
  margin-top: var(--space-3);
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.detail__alert {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
  padding: var(--space-3);
  font-size: var(--text-sm);
  background-color: var(--danger-soft-bg);
  border: 1px solid var(--danger);
  border-radius: var(--radius-md);
}

.detail__alert-prefix {
  font-weight: 700;
  color: var(--danger);
}

/* ---------------------------- formulário de progresso --------------------- */

.progress-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.progress-form__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: var(--space-3);
  align-items: start;
}

.progress-form__preview {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-width: 26rem;
  padding: var(--space-3);
  background-color: var(--surface-2);
  border-radius: var(--radius-md);
}

.progress-form__preview-label {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--text-muted);
}

.progress-form__actions {
  display: flex;
  justify-content: flex-end;
}

/* ---------------------------------- diário -------------------------------- */

.diary {
  display: grid;
  gap: var(--space-5);
}

@media (min-width: 60rem) {
  .diary {
    grid-template-columns: 22rem 1fr;
    align-items: start;
  }
}

.diary__form-wrapper,
.diary__list-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-width: 0;
}

.diary__form-title,
.diary__list-title {
  font-size: var(--text-base);
}

.diary__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/* ------------------------------- zona de risco ---------------------------- */

.detail__danger-zone {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  align-items: flex-start;
  border-color: var(--danger);
}

.detail__danger-icon {
  color: var(--danger);
}

.detail__danger-text {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.detail__confirm-quote {
  padding-left: var(--space-4);
  margin: 0;
  font-size: var(--text-sm);
  font-style: italic;
  border-left: 3px solid var(--border-strong);
}
</style>
