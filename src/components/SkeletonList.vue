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
 */

defineProps({
  count: { type: Number, default: 4 },
  label: { type: String, default: 'Carregando…' },
})
</script>

<template>
  <div class="skeleton-list">
    <p class="sr-only" role="status" aria-live="polite">{{ label }}</p>
    <ul class="skeleton-list__items" aria-hidden="true">
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
