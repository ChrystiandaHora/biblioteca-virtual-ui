<script setup>
/**
 * Esqueleto de carregamento.
 *
 * O esqueleto é puramente visual (`aria-hidden`) e vem acompanhado de um texto
 * em região viva, porque uma sequência de retângulos cinzas não diz nada a
 * quem usa leitor de tela.
 *
 * Só aparece na PRIMEIRA carga. Em recarregamentos mantemos o conteúdo antigo
 * em opacidade reduzida — trocar conteúdo por esqueleto faz a página saltar.
 *
 * A prop `variant` existe porque um esqueleto que promete o layout errado
 * causa justamente o salto que ele deveria evitar: o painel carrega métricas e
 * um gráfico, não cartões de livro com capa.
 */

defineProps({
  count: { type: Number, default: 4 },
  label: { type: String, default: 'Carregando…' },
  variant: {
    type: String,
    default: 'cards',
    validator: (value) => ['cards', 'dashboard', 'detail'].includes(value),
  },
})
</script>

<template>
  <div class="skeleton-list">
    <p class="sr-only" role="status" aria-live="polite">{{ label }}</p>
    <!-- Painel: uma fileira de métricas e o bloco do gráfico. -->
    <div v-if="variant === 'dashboard'" class="skeleton-dashboard" aria-hidden="true">
      <div class="skeleton-dashboard__tiles">
        <span v-for="index in 4" :key="index" class="shimmer skeleton-dashboard__tile" />
      </div>
      <span class="shimmer skeleton-dashboard__chart" />
    </div>

    <!-- Detalhe do livro: capa grande ao lado do bloco de identificação. -->
    <div v-else-if="variant === 'detail'" class="skeleton-detail" aria-hidden="true">
      <span class="shimmer skeleton-detail__cover" />
      <span class="skeleton-detail__lines">
        <span class="shimmer skeleton-card__line skeleton-card__line--title" />
        <span class="shimmer skeleton-card__line skeleton-card__line--author" />
        <span class="shimmer skeleton-card__line skeleton-card__line--meta" />
        <span class="shimmer skeleton-detail__bar" />
      </span>
    </div>

    <ul v-else class="skeleton-list__items" aria-hidden="true">
      <li v-for="index in count" :key="index" class="skeleton-card">
        <span class="skeleton-card__cover shimmer" />
        <span class="skeleton-card__lines">
          <span class="shimmer skeleton-card__line skeleton-card__line--title" />
          <span class="shimmer skeleton-card__line skeleton-card__line--author" />
          <span class="shimmer skeleton-card__line skeleton-card__line--meta" />
        </span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.skeleton-list__items {
  display: grid;
  gap: var(--space-3);
}

.skeleton-card {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4);
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.skeleton-card__cover {
  flex-shrink: 0;
  width: 60px;
  aspect-ratio: 2 / 3;
  border-radius: var(--radius-md);
}

.skeleton-card__lines {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-2);
  justify-content: center;
}

.skeleton-card__line {
  height: 0.85rem;
  border-radius: var(--radius-sm);
}

.skeleton-card__line--title {
  width: 65%;
  height: 1.1rem;
}

.skeleton-card__line--author {
  width: 40%;
}

.skeleton-card__line--meta {
  width: 25%;
}

/* ------------------------------- painel ---------------------------------- */

.skeleton-dashboard {
  display: grid;
  gap: var(--space-5);
}

.skeleton-dashboard__tiles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: var(--space-4);
}

.skeleton-dashboard__tile {
  height: 7.5rem;
  border-radius: var(--radius-lg);
}

.skeleton-dashboard__chart {
  height: 18rem;
  border-radius: var(--radius-lg);
}

/* --------------------------- detalhe do livro ----------------------------- */

.skeleton-detail {
  display: flex;
  gap: var(--space-5);
  padding: var(--space-5);
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.skeleton-detail__cover {
  flex-shrink: 0;
  width: 120px;
  aspect-ratio: 2 / 3;
  border-radius: var(--radius-md);
}

.skeleton-detail__lines {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-3);
}

.skeleton-detail__bar {
  height: 0.6rem;
  margin-top: var(--space-3);
  border-radius: var(--radius-pill);
}

.shimmer {
  background-color: var(--surface-2);
}

/* O brilho deslizante só existe para quem não pediu redução de movimento;
   caso contrário fica um bloco estático, que comunica a mesma coisa. */
@media (prefers-reduced-motion: no-preference) {
  .shimmer {
    background-image: linear-gradient(
      90deg,
      var(--surface-2) 0%,
      var(--surface) 50%,
      var(--surface-2) 100%
    );
    background-size: 200% 100%;
    animation: shimmer 1.4s ease-in-out infinite;
  }
}

@keyframes shimmer {
  from {
    background-position: 200% 0;
  }

  to {
    background-position: -200% 0;
  }
}
</style>
