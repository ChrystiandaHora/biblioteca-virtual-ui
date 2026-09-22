<script setup>
/**
 * Minha estante — a tela que exercita os filtros, a ordenação e a paginação.
 *
 * Os filtros ficam em UMA fileira acima de tudo o que eles afetam, nunca dentro
 * dos cartões. A contagem resultante é anunciada por região viva a cada
 * mudança, porque uma lista que encurta em silêncio não comunica nada a quem
 * não vê a tela.
 *
 * A remoção passa por um `alertdialog` de confirmação: apagar um livro leva
 * embora o diário dele, e isso é irreversível.
 */

import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BaseButton from '@/components/BaseButton.vue'
import BaseIcon from '@/components/BaseIcon.vue'
import BaseModal from '@/components/BaseModal.vue'
import BaseSelect from '@/components/BaseSelect.vue'
import BookListItem from '@/components/BookListItem.vue'
import EmptyState from '@/components/EmptyState.vue'
import PaginationNav from '@/components/PaginationNav.vue'
import SkeletonList from '@/components/SkeletonList.vue'
import { useAsyncResource } from '@/composables/useAsyncResource.js'
import { ORDER_OPTIONS, READING_STATUS_LIST } from '@/domain/readingStatus.js'
import {
  fetchLibrary,
  removeLibraryItem,
  updateLibraryItem,
} from '@/services/libraryService.js'
import { useToastStore } from '@/stores/toastStore.js'

const toasts = useToastStore()
const route = useRoute()
const router = useRouter()

const PAGE_SIZE = 12

/* -------------------------------- filtros --------------------------------- */

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os estágios' },
  ...READING_STATUS_LIST.map((status) => ({ value: status.value, label: status.label })),
]

const RATING_OPTIONS = [
  { value: '', label: 'Qualquer nota' },
  { value: '5', label: '5 estrelas' },
  { value: '4', label: '4 estrelas ou mais' },
  { value: '3', label: '3 estrelas ou mais' },
  { value: '2', label: '2 estrelas ou mais' },
]

const DIRECTION_OPTIONS = [
  { value: 'desc', label: 'Decrescente' },
  { value: 'asc', label: 'Crescente' },
]

const filters = ref({
  q: typeof route.query.q === 'string' ? route.query.q : '',
  status: typeof route.query.status === 'string' ? route.query.status : '',
  minRating: typeof route.query.nota === 'string' ? route.query.nota : '',
  orderBy: typeof route.query.ordem === 'string' ? route.query.ordem : 'recentes',
  direction: route.query.dir === 'asc' ? 'asc' : 'desc',
})

const page = ref(Number(route.query.page) || 1)
const busyItemId = ref(null)
const itemPendingRemoval = ref(null)
const isRemoving = ref(false)

/**
 * Alvo de reserva do foco ao fechar a confirmação de remoção: o botão que
 * abriu o diálogo é a lixeira da linha, e a própria confirmação a apaga. Sem
 * isto o foco cairia no <body>.
 */
const resultsRef = ref(null)

const hasActiveFilters = computed(
  () =>
    Boolean(filters.value.q) ||
    Boolean(filters.value.status) ||
    Boolean(filters.value.minRating) ||
    filters.value.orderBy !== 'recentes' ||
    filters.value.direction !== 'desc',
)

const { data: libraryPage, error, isLoading, isFirstLoad, load } = useAsyncResource(({ signal }) =>
  fetchLibrary({
    q: filters.value.q.trim() || undefined,
    status: filters.value.status || undefined,
    minRating: filters.value.minRating ? Number(filters.value.minRating) : undefined,
    orderBy: filters.value.orderBy,
    direction: filters.value.direction,
    page: page.value,
    pageSize: PAGE_SIZE,
    signal,
  }),
)

/** Sincroniza os filtros com a URL para o estado sobreviver ao recarregar. */
function syncUrl() {
  router.replace({
    name: 'estante',
    query: {
      ...(filters.value.q ? { q: filters.value.q } : {}),
      ...(filters.value.status ? { status: filters.value.status } : {}),
      ...(filters.value.minRating ? { nota: filters.value.minRating } : {}),
      ...(filters.value.orderBy !== 'recentes' ? { ordem: filters.value.orderBy } : {}),
      ...(filters.value.direction !== 'desc' ? { dir: filters.value.direction } : {}),
      ...(page.value > 1 ? { page: String(page.value) } : {}),
    },
  })
}

function applyFilters() {
  page.value = 1
  syncUrl()
  load()
}

function clearFilters() {
  // Só zera os filtros: o watcher abaixo observa justamente esses campos e já
  // chama `applyFilters`. Chamar aqui também dispararia duas requisições e dois
  // `router.replace` para a mesma ação.
  filters.value = { q: '', status: '', minRating: '', orderBy: 'recentes', direction: 'desc' }
  toasts.info('Filtros limpos.')
}

function changePage(target) {
  page.value = target
  syncUrl()
  load()
}

// Mudar um seletor recarrega na hora; o campo de texto espera o submit.
watch(
  () => [filters.value.status, filters.value.minRating, filters.value.orderBy, filters.value.direction],
  applyFilters,
)

onMounted(load)

/* --------------------------- ações sobre os itens -------------------------- */

async function handleStatusChange({ item, status }) {
  busyItemId.value = item.id
  try {
    await updateLibraryItem(item.id, { status })
    toasts.success(`"${item.title}" agora está em "${status.replace('_', ' ')}".`)
    await load()
  } catch (caught) {
    toasts.error(caught.message)
  } finally {
    busyItemId.value = null
  }
}

async function confirmRemoval() {
  const item = itemPendingRemoval.value
  if (!item) return

  isRemoving.value = true
  try {
    await removeLibraryItem(item.id)
    toasts.success(`"${item.title}" foi removido da estante.`)
    itemPendingRemoval.value = null
    // Se a última linha da página foi removida, volta uma página.
    if (libraryPage.value?.items.length === 1 && page.value > 1) page.value -= 1
    await load()
  } catch (caught) {
    toasts.error(caught.message)
  } finally {
    isRemoving.value = false
  }
}

const resultAnnouncement = computed(() => {
  if (isLoading.value) return 'Atualizando a estante…'
  // Antes de `libraryPage` pelo mesmo motivo da busca: os dados antigos
  // sobrevivem ao erro, e anunciá-los contradiria o que está na tela.
  if (error.value) return 'A estante não pôde ser carregada. Tente novamente.'
  if (!libraryPage.value) return ''
  const total = libraryPage.value.total
  if (total === 0) return 'Nenhum livro corresponde aos filtros aplicados.'
  return `${total} ${total === 1 ? 'livro' : 'livros'} na estante. Página ${libraryPage.value.page} de ${libraryPage.value.total_pages}.`
})
</script>

<template>
  <div class="container library">
    <header class="library__header">
      <div>
        <h1 class="library__title">Minha estante</h1>
        <p class="library__subtitle">
          Acompanhe o progresso, dê notas e abra o diário de cada livro.
        </p>
      </div>
      <BaseButton :to="{ name: 'buscar' }" icon="plus">Adicionar livro</BaseButton>
    </header>

    <!-- Uma única fileira de filtros, acima de tudo o que ela afeta. -->
    <form class="filters panel" @submit.prevent="applyFilters">
      <h2 class="filters__title">
        <BaseIcon name="filter" size="md" class="filters__title-icon" />
        Filtrar e ordenar
      </h2>

      <div class="filters__grid">
        <div class="filters__search">
          <label class="filters__label" for="library-search">Título ou autor</label>
          <div class="filters__search-row">
            <input
              id="library-search"
              v-model="filters.q"
              class="filters__input"
              type="search"
              placeholder="Ex.: Tolkien"
            />
            <BaseButton type="submit" variant="secondary" icon="search" :loading="isLoading">
              Filtrar
            </BaseButton>
          </div>
        </div>

        <BaseSelect v-model="filters.status" label="Estágio de leitura" :options="STATUS_OPTIONS" />
        <BaseSelect v-model="filters.minRating" label="Nota mínima" :options="RATING_OPTIONS" />
        <BaseSelect v-model="filters.orderBy" label="Ordenar por" :options="ORDER_OPTIONS" />
        <BaseSelect v-model="filters.direction" label="Sentido" :options="DIRECTION_OPTIONS" />
      </div>

      <div v-if="hasActiveFilters" class="filters__actions">
        <BaseButton variant="ghost" size="sm" icon="close" @click="clearFilters">
          Limpar filtros
        </BaseButton>
      </div>
    </form>

    <p class="sr-only" role="status" aria-live="polite">{{ resultAnnouncement }}</p>

    <SkeletonList v-if="isLoading && isFirstLoad" :count="4" label="Carregando sua estante…" />

    <EmptyState
      v-else-if="error"
      tone="error"
      title="Não foi possível carregar a estante."
      :description="error.message"
    >
      <template #action>
        <BaseButton variant="secondary" @click="load()">Tentar novamente</BaseButton>
      </template>
    </EmptyState>

    <EmptyState
      v-else-if="libraryPage && libraryPage.total === 0 && hasActiveFilters"
      icon="filter"
      title="Nenhum livro corresponde a esses filtros."
      description="Tente ampliar a busca ou volte para a estante completa."
    >
      <template #action>
        <BaseButton variant="secondary" @click="clearFilters">Limpar filtros</BaseButton>
      </template>
    </EmptyState>

    <EmptyState
      v-else-if="libraryPage && libraryPage.total === 0"
      icon="books"
      title="Sua estante está vazia."
      description="Busque um livro no acervo da Open Library e adicione o primeiro."
    >
      <template #action>
        <BaseButton :to="{ name: 'buscar' }" icon="search">Buscar livros</BaseButton>
      </template>
    </EmptyState>

    <section
      v-else-if="libraryPage"
      ref="resultsRef"
      class="library__results"
      :class="{ 'library__results--refreshing': isLoading }"
      aria-label="Livros da estante"
      tabindex="-1"
    >
      <ul class="library__list">
        <BookListItem
          v-for="item in libraryPage.items"
          :key="item.id"
          :item="item"
          :busy="busyItemId === item.id"
          @change-status="handleStatusChange"
          @remove="itemPendingRemoval = $event"
        />
      </ul>

      <PaginationNav
        :page="libraryPage.page"
        :total-pages="libraryPage.total_pages"
        :total="libraryPage.total"
        item-label="livros"
        :disabled="isLoading"
        @change="changePage"
      />
    </section>

    <!-- Confirmação destrutiva: `alertdialog` porque a ação apaga dados que
         não podem ser recuperados. -->
    <BaseModal
      v-if="itemPendingRemoval"
      alert
      title="Remover este livro da estante?"
      :description="`“${itemPendingRemoval.title}” e todos os registros do diário dele serão apagados. Não há como desfazer.`"
      :return-focus-to="() => resultsRef"
      @close="itemPendingRemoval = null"
    >
      <p class="library__confirm-detail">
        <template v-if="itemPendingRemoval.diary_entry_count > 0">
          Este livro tem
          <strong>
            {{ itemPendingRemoval.diary_entry_count }}
            {{ itemPendingRemoval.diary_entry_count === 1 ? 'registro' : 'registros' }}
          </strong>
          no diário.
        </template>
        <template v-else> Este livro ainda não tem registros no diário. </template>
      </p>

      <template #footer>
        <BaseButton variant="secondary" @click="itemPendingRemoval = null">Cancelar</BaseButton>
        <BaseButton variant="danger" icon="trash" :loading="isRemoving" @click="confirmRemoval">
          Remover livro
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.library {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.library__header {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  align-items: flex-end;
  justify-content: space-between;
}

.library__title {
  font-size: var(--text-2xl);
}

.library__subtitle {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

/* --------------------------------- filtros -------------------------------- */

.filters {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.filters__title {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  font-size: var(--text-base);
}

.filters__title-icon {
  color: var(--accent);
}

.filters__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  gap: var(--space-3);
  align-items: end;
}

.filters__search {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  /* O campo de texto ocupa a linha inteira quando há espaço. */
  grid-column: 1 / -1;
}

.filters__label {
  font-size: var(--text-sm);
  font-weight: 600;
}

.filters__search-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.filters__input {
  flex: 1;
  min-width: 10rem;
  min-height: var(--target);
  padding: var(--space-2) var(--space-3);
  color: var(--text);
  background-color: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
}

.filters__input::placeholder {
  color: var(--text-muted);
  opacity: 1;
}

.filters__actions {
  display: flex;
  justify-content: flex-end;
}

/* -------------------------------- resultados ------------------------------ */

.library__results {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  transition: opacity var(--transition);
}

.library__results--refreshing {
  opacity: 0.6;
}

.library__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.library__confirm-detail {
  font-size: var(--text-sm);
  color: var(--text-muted);
}
</style>
