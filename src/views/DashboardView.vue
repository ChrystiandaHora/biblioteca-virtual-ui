<script setup>
/**
 * Painel de leitura.
 *
 * Estrutura escolhida seguindo a regra "o número é o gráfico": os totais são
 * blocos de número, não gráficos de uma barra; só a série temporal (concluídos
 * por mês) vira gráfico de verdade, porque aí existe mudança ao longo do tempo
 * para mostrar.
 *
 * Há exatamente UM número em escala de destaque na tela (páginas lidas).
 */

import { computed, onMounted } from 'vue'

import BaseButton from '@/components/BaseButton.vue'
import EmptyState from '@/components/EmptyState.vue'
import MonthlyChart from '@/components/MonthlyChart.vue'
import SkeletonList from '@/components/SkeletonList.vue'
import StatTile from '@/components/StatTile.vue'
import StatusBreakdown from '@/components/StatusBreakdown.vue'
import { useAsyncResource } from '@/composables/useAsyncResource.js'
import { fetchReadingStats } from '@/services/statsService.js'
import { useAuthStore } from '@/stores/authStore.js'

const auth = useAuthStore()

const { data: stats, error, isLoading, isFirstLoad, load } = useAsyncResource(({ signal }) =>
  fetchReadingStats({ signal }),
)

onMounted(load)

const hasBooks = computed(() => (stats.value?.total_books ?? 0) > 0)

/** "Sem nota" em vez de um travessão solto, que ficava lido como um valor. */
const averageRatingLabel = computed(() =>
  stats.value?.average_rating === null || stats.value?.average_rating === undefined
    ? 'Sem nota'
    : stats.value.average_rating.toLocaleString('pt-BR', { minimumFractionDigits: 1 }),
)

const topAuthors = computed(() => stats.value?.top_authors ?? [])

/** Maior contagem entre os autores, base da largura das barras. */
const topAuthorMax = computed(() => Math.max(1, ...topAuthors.value.map((a) => a.count)))
</script>

<template>
  <div class="container dashboard">
    <header class="dashboard__header">
      <div>
        <h1 class="dashboard__title">
          Olá, {{ auth.firstName || 'leitor' }}
        </h1>
        <p class="dashboard__subtitle">Um resumo de como vai a sua leitura.</p>
      </div>
      <BaseButton :to="{ name: 'buscar' }" icon="search">Buscar livros</BaseButton>
    </header>

    <SkeletonList v-if="isFirstLoad && isLoading" :count="3" label="Carregando o painel…" />

    <EmptyState
      v-else-if="error"
      tone="error"
      title="Não foi possível carregar o painel."
      :description="error.message"
    >
      <template #action>
        <BaseButton variant="secondary" @click="load()">Tentar novamente</BaseButton>
      </template>
    </EmptyState>

    <template v-else-if="stats">
      <!-- Recarregando: o conteúdo antigo fica em opacidade reduzida em vez de
           ser trocado por esqueleto, para a página não saltar. -->
      <div class="dashboard__content" :class="{ 'dashboard__content--refreshing': isLoading }">
        <EmptyState
          v-if="!hasBooks"
          icon="books"
          title="Sua estante está vazia."
          description="Busque um livro no acervo da Open Library e adicione o primeiro à sua estante — os números deste painel se preenchem sozinhos a partir daí."
        >
          <template #action>
            <BaseButton :to="{ name: 'buscar' }" icon="search">Buscar meu primeiro livro</BaseButton>
          </template>
        </EmptyState>

        <template v-else>
          <section aria-labelledby="numbers-title" class="dashboard__section">
            <h2 id="numbers-title" class="sr-only">Números da sua leitura</h2>
            <!-- Só quatro blocos: as contagens por estágio (concluídos, lendo,
                 etc.) já aparecem no painel "Estante por estágio" logo abaixo, e
                 repeti-las aqui diria a mesma coisa duas vezes. -->
            <div class="dashboard__tiles">
              <StatTile
                label="Páginas lidas"
                :value="stats.pages_read"
                icon="page"
                hint="Soma dos livros concluídos e do progresso atual."
                hero
              />
              <StatTile
                label="Livros na estante"
                :value="stats.total_books"
                icon="books"
                :hint="`${stats.total_finished} concluídos · ${stats.total_reading} em leitura`"
              />
              <StatTile
                label="Nota média"
                :value="averageRatingLabel"
                :unit="stats.average_rating === null ? '' : 'de 5'"
                icon="star"
                :hint="stats.average_rating === null ? 'Nenhum livro avaliado ainda.' : ''"
              />
              <StatTile
                label="Registros no diário"
                :value="stats.diary_entries"
                icon="note"
                hint="Anotações, citações e resenhas."
              />
            </div>
          </section>

          <div class="dashboard__panels">
            <section class="panel dashboard__chart-panel" aria-labelledby="chart-heading">
              <h2 id="chart-heading" class="sr-only">Evolução mensal</h2>
              <MonthlyChart :data="stats.finished_by_month" />
            </section>

            <div class="dashboard__side">
              <div class="panel">
                <StatusBreakdown :items="stats.by_status" />
              </div>

              <section v-if="topAuthors.length" class="panel" aria-labelledby="authors-title">
                <h3 id="authors-title" class="dashboard__panel-title">Autores mais presentes</h3>
                <ul class="authors">
                  <li v-for="author in topAuthors" :key="author.author" class="authors__row">
                    <span class="authors__name">{{ author.author }}</span>
                    <span class="authors__track">
                      <span
                        class="authors__fill"
                        :style="{ width: `${(author.count / topAuthorMax) * 100}%` }"
                      />
                    </span>
                    <span class="authors__count tabular">{{ author.count }}</span>
                  </li>
                </ul>
              </section>
            </div>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.dashboard__header {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  align-items: flex-end;
  justify-content: space-between;
}

.dashboard__title {
  font-size: var(--text-2xl);
}

.dashboard__subtitle {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.dashboard__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  transition: opacity var(--transition);
}

.dashboard__content--refreshing {
  opacity: 0.6;
}

.dashboard__section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.dashboard__tiles {
  display: grid;
  /* `auto-fit` + `minmax` reflui de 1 a 3 colunas sem media query, e o mínimo
     de 14rem garante que os números caibam a 200% de zoom. */
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: var(--space-3);
}

.dashboard__panels {
  display: grid;
  gap: var(--space-4);
}

@media (min-width: 64rem) {
  .dashboard__panels {
    grid-template-columns: 1.6fr 1fr;
    align-items: start;
  }
}

.dashboard__chart-panel {
  min-width: 0;
}

.dashboard__side {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 0;
}

.dashboard__panel-title {
  margin-bottom: var(--space-3);
  font-size: var(--text-lg);
}

/* ------------------------------ top autores ------------------------------- */

.authors {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.authors__row {
  display: grid;
  grid-template-areas:
    'name count'
    'track track';
  grid-template-columns: 1fr auto;
  gap: var(--space-1) var(--space-3);
  align-items: center;
}

.authors__name {
  grid-area: name;
  font-size: var(--text-sm);
  overflow-wrap: anywhere;
}

.authors__track {
  grid-area: track;
  height: 8px;
  overflow: hidden;
  background-color: var(--chart-track);
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
}

.authors__fill {
  display: block;
  height: 100%;
  background-color: var(--chart);
  border-radius: var(--radius-pill);
}

.authors__count {
  grid-area: count;
  font-size: var(--text-sm);
  font-weight: 700;
}
</style>
