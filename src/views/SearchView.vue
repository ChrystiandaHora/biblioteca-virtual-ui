<script setup>
/**
 * Busca no acervo da Open Library.
 *
 * A busca é submetida por formulário, não a cada tecla digitada: resultados que
 * se reescrevem sozinhos enquanto a pessoa digita são conteúdo mudando sem que
 * ela tenha pedido, e atrapalham quem usa leitor de tela ou digita devagar.
 *
 * A quantidade de resultados é anunciada por região viva, senão o retorno da
 * busca seria silencioso.
 */

import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BaseButton from '@/components/BaseButton.vue'
import BaseIcon from '@/components/BaseIcon.vue'
import BookPreviewModal from '@/components/BookPreviewModal.vue'
import EmptyState from '@/components/EmptyState.vue'
import PaginationNav from '@/components/PaginationNav.vue'
import SearchResultItem from '@/components/SearchResultItem.vue'
import SkeletonList from '@/components/SkeletonList.vue'
import { useAsyncResource } from '@/composables/useAsyncResource.js'
import { searchBooks } from '@/services/bookService.js'
import { addToLibrary, fetchLibrary } from '@/services/libraryService.js'
import { ApiError } from '@/services/httpClient.js'
import { useToastStore } from '@/stores/toastStore.js'

const toasts = useToastStore()
const route = useRoute()
const router = useRouter()

const PAGE_SIZE = 12

/** Sugestões que dão o primeiro empurrão em uma estante vazia. */
const SUGGESTIONS = ['Machado de Assis', 'ficção científica', 'Clarice Lispector', 'Duna']

const query = ref(typeof route.query.q === 'string' ? route.query.q : '')
const page = ref(Number(route.query.page) || 1)
const addingKey = ref(null)

/**
 * Livros já presentes na estante: chave da Open Library → id do item.
 *
 * Era um `Set` só de chaves, o que bastava para desabilitar o botão. Virou
 * `Map` porque a prévia oferece "Abrir na estante", e para montar esse link
 * precisamos do id do item.
 */
const ownedBooks = ref(new Map())

/** Livro exibido na prévia; `null` fecha o diálogo. */
const previewBook = ref(null)

const {
  data: results,
  error,
  isLoading,
  isFirstLoad,
  load,
} = useAsyncResource(({ signal }) =>
  searchBooks({ q: query.value.trim(), page: page.value, pageSize: PAGE_SIZE, signal }),
)

const hasSearched = ref(Boolean(query.value.trim()))

/**
 * Erro de validação do campo de busca.
 *
 * Era um toast, que aparece no canto oposto da tela — longe do campo que
 * precisa ser corrigido, e sem marcar o próprio campo como inválido. A regra
 * ("mínimo de 2 caracteres") já está escrita logo abaixo do input; o erro
 * pertence ao mesmo lugar.
 */
const queryError = ref('')

/** Para devolver o foco ao campo quando a validação falha. */
const queryInputRef = ref(null)

// O erro some assim que a pessoa começa a corrigir: manter a mensagem enquanto
// o campo já está válido seria ruído.
watch(query, () => {
  if (queryError.value) queryError.value = ''
})

/** Anúncio para leitores de tela quando a busca retorna. */
const resultAnnouncement = computed(() => {
  if (isLoading.value) return 'Buscando…'
  // O erro vem antes do resultado de propósito: `results` guarda a busca
  // anterior bem-sucedida, então sem este ramo a região viva continuaria
  // anunciando a contagem antiga enquanto a tela mostra a falha.
  if (error.value) return 'A busca não pôde ser concluída. Tente novamente.'
  if (!results.value) return ''
  const total = results.value.total
  if (total === 0) return `Nenhum livro encontrado para "${results.value.query}".`
  return `${total.toLocaleString('pt-BR')} ${total === 1 ? 'livro encontrado' : 'livros encontrados'} para "${results.value.query}". Exibindo página ${results.value.page} de ${results.value.total_pages}.`
})

/**
 * Carrega os livros da estante para marcar o que já foi adicionado.
 * Falha aqui não é bloqueante: no pior caso a API responde 409 no clique.
 */
async function loadOwnedBooks() {
  try {
    const firstPage = await fetchLibrary({ pageSize: 100 })
    ownedBooks.value = new Map(firstPage.items.map((item) => [item.open_library_key, item.id]))
  } catch {
    /* segue sem a marcação */
  }
}

function runSearch() {
  const trimmed = query.value.trim()
  if (trimmed.length < 2) {
    queryError.value = 'Digite pelo menos 2 caracteres para buscar.'
    queryInputRef.value?.focus()
    return
  }
  queryError.value = ''
  hasSearched.value = true
  // A busca fica na URL: o resultado é compartilhável e o botão "voltar" do
  // navegador se comporta como a pessoa espera.
  router.replace({ name: 'buscar', query: { q: trimmed, page: page.value } })
  load()
}

function submitSearch() {
  page.value = 1
  runSearch()
}

function changePage(target) {
  page.value = target
  runSearch()
}

function useSuggestion(suggestion) {
  query.value = suggestion
  submitSearch()
}

/** Marca o livro como presente na estante, guardando o id quando ele é conhecido. */
function rememberOwned(key, id = null) {
  ownedBooks.value = new Map(ownedBooks.value).set(key, id)
}

async function handleAdd(book) {
  addingKey.value = book.open_library_key
  try {
    // O POST devolve o item criado (LibraryItemDetail), então aproveitamos o id
    // para que "Abrir na estante" funcione sem recarregar a estante inteira.
    const created = await addToLibrary({
      open_library_key: book.open_library_key,
      title: book.title,
      authors: book.authors,
      cover_id: book.cover_id,
      first_publish_year: book.first_publish_year,
      subjects: book.subjects,
      total_pages: book.page_estimate ?? null,
    })
    rememberOwned(book.open_library_key, created?.id ?? null)
    toasts.success(`"${book.title}" foi adicionado à sua estante.`)
  } catch (caught) {
    if (caught instanceof ApiError && caught.status === 409) {
      // Já estava lá, mas o 409 não diz qual é o id: sem ele o rodapé da prévia
      // cai no estado "Na estante" desabilitado, que é honesto.
      rememberOwned(book.open_library_key, ownedBooks.value.get(book.open_library_key) ?? null)
      toasts.info(`"${book.title}" já estava na sua estante.`)
    } else {
      toasts.error(caught.message)
    }
  } finally {
    addingKey.value = null
  }
}

onMounted(() => {
  loadOwnedBooks()
  if (query.value.trim().length >= 2) load()
})

// Abrir a tela com `?q=` na URL (link compartilhado) dispara a busca.
watch(
  () => route.query.q,
  (value) => {
    if (typeof value === 'string' && value.trim() && value !== query.value) {
      query.value = value
      hasSearched.value = true
      load()
    }
  },
)
</script>

<template>
  <div class="container search">
    <header class="search__header">
      <h1 class="search__title">Buscar livros</h1>
      <p class="search__subtitle">
        Os resultados vêm do acervo aberto da Open Library, consultado pela nossa API.
      </p>
    </header>

    <form class="search__form panel" role="search" @submit.prevent="submitSearch">
      <div class="search__field">
        <label class="search__label" for="search-query">Título, autor ou assunto</label>
        <div class="search__input-row">
          <div class="search__input-wrapper">
            <BaseIcon name="search" size="md" class="search__input-icon" />
            <input
              id="search-query"
              ref="queryInputRef"
              v-model="query"
              class="search__input"
              :class="{ 'search__input--invalid': queryError }"
              type="search"
              name="q"
              autocomplete="off"
              placeholder="Ex.: Dom Casmurro"
              :aria-invalid="queryError ? 'true' : undefined"
              :aria-describedby="queryError ? 'search-error search-hint' : 'search-hint'"
            />
          </div>
          <BaseButton type="submit" icon="search" :loading="isLoading">Buscar</BaseButton>
        </div>
        <p v-if="queryError" id="search-error" class="search__error" role="alert">
          <BaseIcon name="warning" size="sm" />
          {{ queryError }}
        </p>
        <p id="search-hint" class="search__hint">
          Mínimo de 2 caracteres. A busca é feita ao enviar o formulário.
        </p>
      </div>

      <div class="search__suggestions">
        <span class="search__suggestions-label">Sugestões:</span>
        <ul class="search__suggestions-list">
          <li v-for="suggestion in SUGGESTIONS" :key="suggestion">
            <button type="button" class="search__chip" @click="useSuggestion(suggestion)">
              {{ suggestion }}
            </button>
          </li>
        </ul>
      </div>
    </form>

    <!-- Resultado da busca anunciado por região viva. -->
    <p class="sr-only" role="status" aria-live="polite">{{ resultAnnouncement }}</p>

    <SkeletonList v-if="isLoading && isFirstLoad" :count="4" label="Buscando livros…" />

    <EmptyState
      v-else-if="error"
      tone="error"
      title="A busca não pôde ser concluída."
      :description="error.message"
    >
      <template #action>
        <BaseButton variant="secondary" @click="runSearch()">Tentar novamente</BaseButton>
      </template>
    </EmptyState>

    <EmptyState
      v-else-if="!hasSearched"
      icon="search"
      title="Pesquise um livro para começar."
      description="Digite o título, o nome de quem escreveu ou um assunto. Também dá para clicar em uma das sugestões acima."
    />

    <EmptyState
      v-else-if="results && results.total === 0"
      icon="empty"
      :title="`Nenhum livro encontrado para “${results.query}”.`"
      description="Tente termos mais curtos, confira a grafia ou busque pelo nome de quem escreveu."
    />

    <section
      v-else-if="results"
      class="search__results"
      :class="{ 'search__results--refreshing': isLoading }"
      aria-labelledby="results-title"
    >
      <h2 id="results-title" class="search__results-title">
        {{ results.total.toLocaleString('pt-BR') }}
        {{ results.total === 1 ? 'resultado' : 'resultados' }}
        <span class="search__results-query">para “{{ results.query }}”</span>
      </h2>

      <ul class="search__list">
        <SearchResultItem
          v-for="book in results.results"
          :key="book.open_library_key"
          :book="book"
          :already-in-library="ownedBooks.has(book.open_library_key)"
          :busy="addingKey === book.open_library_key"
          @add="handleAdd"
          @details="previewBook = $event"
        />
      </ul>

      <PaginationNav
        :page="results.page"
        :total-pages="results.total_pages"
        :total="results.total"
        item-label="livros"
        :disabled="isLoading"
        @change="changePage"
      />
    </section>

    <!-- Fora dos ramos condicionais acima: a prévia não pertence a nenhum
         estado da lista, e o `:key` remonta o componente ao trocar de livro,
         zerando a busca da sinopse. -->
    <BookPreviewModal
      v-if="previewBook"
      :key="previewBook.open_library_key"
      :book="previewBook"
      :already-in-library="ownedBooks.has(previewBook.open_library_key)"
      :library-item-id="ownedBooks.get(previewBook.open_library_key) ?? null"
      :busy="addingKey === previewBook.open_library_key"
      @add="handleAdd"
      @close="previewBook = null"
    />
  </div>
</template>

<style scoped>
.search {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.search__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.search__title {
  font-size: var(--text-2xl);
}

.search__subtitle {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.search__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.search__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.search__label {
  font-size: var(--text-sm);
  font-weight: 600;
}

.search__input-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.search__input-wrapper {
  position: relative;
  display: flex;
  flex: 1;
  min-width: 12rem;
}

.search__input-icon {
  position: absolute;
  top: 50%;
  left: var(--space-3);
  color: var(--text-muted);
  pointer-events: none;
  translate: 0 -50%;
}

.search__input {
  width: 100%;
  min-height: var(--target);
  padding: var(--space-3) var(--space-3) var(--space-3) var(--space-6);
  color: var(--text);
  background-color: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
}

.search__input::placeholder {
  color: var(--text-muted);
  opacity: 1;
}

.search__hint {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

/* Mesma linguagem do BaseField: ícone + texto + cor, nunca só a cor. */
.search__error {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--danger);
}

.search__input--invalid {
  border-color: var(--danger);
  border-width: 2px;
}

.search__suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
}

.search__suggestions-label {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--text-muted);
}

.search__suggestions-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.search__chip {
  min-height: var(--target-min);
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--accent);
  background-color: var(--accent-soft-bg);
  border: 1px solid var(--accent);
  border-radius: var(--radius-pill);
}

.search__chip:hover {
  color: var(--accent-text);
  background-color: var(--accent);
}

.search__results {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  transition: opacity var(--transition);
}

.search__results--refreshing {
  opacity: 0.6;
}

.search__results-title {
  font-size: var(--text-lg);
}

.search__results-query {
  font-weight: 400;
  color: var(--text-muted);
}

.search__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
</style>
