<script setup>
/**
 * Rota inexistente.
 *
 * Mantém um `<h1>` de verdade e caminhos de saída — uma página de erro sem
 * navegação deixa a pessoa presa.
 */

import BaseButton from '@/components/BaseButton.vue'
import EmptyState from '@/components/EmptyState.vue'
</script>

<template>
  <div class="container not-found">
    <h1 class="not-found__title">Página não encontrada</h1>
    <EmptyState
      icon="empty"
      title="Este endereço não existe na Biblioteca Virtual."
      description="O link pode estar incompleto ou a página pode ter sido removida."
    >
      <template #action>
        <div class="not-found__actions">
          <BaseButton :to="{ name: 'painel' }" icon="chart">Ir para o painel</BaseButton>
          <BaseButton variant="secondary" :to="{ name: 'estante' }" icon="books">
            Ver minha estante
          </BaseButton>
        </div>
      </template>
    </EmptyState>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding-block: var(--space-5);
}

.not-found__title {
  font-size: var(--text-2xl);
}

.not-found__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  justify-content: center;
}
</style>
