<script>
/**
 * Sinopses já buscadas nesta sessão, por chave da obra.
 *
 * Precisa viver no escopo do MÓDULO, e não dentro do `<script setup>`: o modal
 * é montado e desmontado a cada abertura, então um Map criado no setup morreria
 * junto e o cache nunca valeria de nada. Com 10 segundos por consulta, reabrir
 * um livro já visto precisa ser instantâneo.
 */
const synopsisCache = new Map()

export default { name: 'BookPreviewModal' }
</script>

<script setup>
/**
 * Prévia de um livro do resultado da busca: ficha + sinopse, antes de decidir
 * adicioná-lo à estante.
 *
 * Duas restrições da API moldam este componente:
 *
 *  1. `GET /api/books/{work_key}` NÃO é um superset do item de busca. Ele
 *     acrescenta `description`, mas devolve `page_estimate`, `edition_count` e
 *     `languages` vazios, e quase sempre `first_publish_year` nulo — o
 *     documento de work da Open Library costuma não ter `first_publish_date`.
 *     Por isso a ficha é montada com o `book` que já veio da busca, e da
 *     resposta do detalhe aproveitamos só a sinopse.
 *
 *  2. Essa chamada é lenta: a API pede a obra e depois UMA requisição por
 *     autor, em série, sem cache. Medido contra a openlibrary.org, "Duna"
 *     leva cerca de 10 segundos. Esperar por isso para abrir o diálogo seria
 *     inaceitável, então o modal abre na hora com o que já temos e só a área
 *     da sinopse fica carregando.
 */

import { computed, onMounted, useId } from 'vue'

import { fetchBookDetail } from '@/services/bookService.js'
import { useAsyncResource } from '@/composables/useAsyncResource.js'

import BaseButton from './BaseButton.vue'
import BaseIcon from './BaseIcon.vue'
import BaseModal from './BaseModal.vue'
import BookCover from './BookCover.vue'

const props = defineProps({
  /** Item do resultado da busca (`BookSummary`). */
  book: { type: Object, required: true },
  alreadyInLibrary: { type: Boolean, default: false },
  /** Id do item na estante, quando já adicionado — habilita o link do rodapé. */
  libraryItemId: { type: [Number, String], default: null },
  /** `true` enquanto a adição deste livro está em voo. */
  busy: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'add'])

const synopsisTitleId = useId()

const { data: detail, error, isLoading, load } = useAsyncResource(({ signal }) =>
  fetchBookDetail(props.book.open_library_key, { signal }),
)

const cachedSynopsis = computed(() => synopsisCache.get(props.book.open_library_key))

const synopsis = computed(() =>
  cachedSynopsis.value !== undefined ? cachedSynopsis.value : (detail.value?.description ?? null),
)

const isLoadingSynopsis = computed(() => cachedSynopsis.value === undefined && isLoading.value)

const synopsisError = computed(() =>
  cachedSynopsis.value === undefined && error.value ? error.value.message : '',
)

onMounted(async () => {
  if (synopsisCache.has(props.book.open_library_key)) return
  const result = await load()
  // `load` devolve null quando a requisição foi cancelada (o modal fechou antes
  // da resposta chegar); guardar isso no cache envenenaria a próxima abertura.
  if (result) synopsisCache.set(props.book.open_library_key, result.description ?? null)
})

const authorsLabel = computed(() =>
  props.book.authors?.length ? props.book.authors.join(', ') : 'Autoria não informada',
)

/**
 * A Open Library mistura assuntos de verdade com lixo de catalogação
 * (`award:hugo_award=1966`, `nyt:mass-market-monthly=2021-11-07`). A API trunca
 * em 8 sem filtrar, então a limpeza fica aqui.
 */
const subjects = computed(() =>
  (props.book.subjects ?? []).filter((subject) => !/[:=]/.test(subject)),
)

const facts = computed(() =>
  [
    props.book.first_publish_year && {
      label: 'Primeira publicação',
      value: String(props.book.first_publish_year),
    },
    props.book.page_estimate && {
      label: 'Páginas (estimativa)',
      value: `~${props.book.page_estimate.toLocaleString('pt-BR')}`,
    },
    props.book.edition_count && {
      label: 'Edições',
      value: props.book.edition_count.toLocaleString('pt-BR'),
    },
  ].filter(Boolean),
)
</script>

<template>
  <BaseModal :title="book.title" :description="authorsLabel" @close="emit('close')">
    <div class="preview">
      <div class="preview__header">
        <BookCover
          :cover-url="book.cover_url"
          :cover-id="book.cover_id"
          :title="book.title"
          size="lg"
          class="preview__cover"
        />

        <dl v-if="facts.length" class="preview__facts">
          <div v-for="fact in facts" :key="fact.label" class="preview__fact">
            <dt>{{ fact.label }}</dt>
            <dd class="tabular">{{ fact.value }}</dd>
          </div>
        </dl>
      </div>

      <ul v-if="subjects.length" class="preview__subjects">
        <li v-for="subject in subjects" :key="subject" class="preview__subject">
          {{ subject }}
        </li>
      </ul>

      <section class="preview__synopsis-section" :aria-labelledby="synopsisTitleId">
        <h3 :id="synopsisTitleId" class="preview__synopsis-title">
          <BaseIcon name="review" size="sm" />
          Sinopse
        </h3>

        <p v-if="isLoadingSynopsis" class="preview__note" role="status">
          Buscando a sinopse na Open Library…
        </p>

        <!-- O BookDetailView engole a falha num catch mudo e simplesmente não
             mostra a seção. Aqui a sinopse é a razão de o diálogo existir, então
             o silêncio não serve: a API distingue 404, 502 e 504, e a mensagem
             já vem traduzida no ApiError. -->
        <p v-else-if="synopsisError" class="preview__note preview__note--error" role="alert">
          <BaseIcon name="warning" size="sm" />
          {{ synopsisError }}
        </p>

        <p v-else-if="synopsis" class="preview__synopsis">{{ synopsis }}</p>

        <p v-else class="preview__note">A Open Library não tem sinopse para esta obra.</p>

        <p class="preview__source">Dados fornecidos pela Open Library.</p>
      </section>
    </div>

    <template #footer>
      <BaseButton variant="secondary" @click="emit('close')">Fechar</BaseButton>

      <BaseButton
        v-if="alreadyInLibrary && libraryItemId"
        variant="primary"
        icon="arrowRight"
        icon-position="end"
        :to="{ name: 'livro', params: { id: libraryItemId } }"
      >
        Abrir na estante
      </BaseButton>
      <BaseButton v-else-if="alreadyInLibrary" variant="secondary" icon="check" disabled>
        Na estante
      </BaseButton>
      <BaseButton
        v-else
        variant="primary"
        icon="plus"
        :loading="busy"
        @click="emit('add', book)"
      >
        Adicionar à estante
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.preview {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.preview__header {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  align-items: flex-start;
}

.preview__cover {
  flex-shrink: 0;
  width: 110px;
}

.preview__facts {
  display: grid;
  flex: 1;
  grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
  gap: var(--space-3);
  min-width: 10rem;
  margin: 0;
}

.preview__fact dt {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--text-muted);
}

.preview__fact dd {
  margin: 0;
  font-size: var(--text-sm);
  font-weight: 600;
}

.preview__subjects {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.preview__subject {
  padding: 2px var(--space-2);
  font-size: var(--text-xs);
  color: var(--text-muted);
  background-color: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
}

.preview__synopsis-title {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  margin-bottom: var(--space-2);
  font-size: var(--text-base);
}

/* O texto vem cru da Open Library: traz quebras de linha próprias e não há
   garantia de espaços, então `pre-line` preserva os parágrafos e
   `overflow-wrap` impede que uma URL colada estoure o diálogo. */
.preview__synopsis {
  font-size: var(--text-sm);
  line-height: 1.7;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.preview__note {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.preview__note--error {
  font-weight: 600;
  color: var(--danger);
}

.preview__source {
  margin-top: var(--space-3);
  font-size: var(--text-xs);
  color: var(--text-muted);
}
</style>
