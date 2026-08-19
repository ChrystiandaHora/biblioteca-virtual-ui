<script setup>
/**
 * Capa do livro, com substituto quando não existe imagem.
 *
 * Sobre o texto alternativo: a capa é **decorativa neste contexto**, e essa é
 * uma decisão consciente, não um `alt=""` por omissão. O título e o autor
 * aparecem sempre como texto ao lado da imagem, no mesmo cartão — descrever a
 * capa de novo só produziria leitura duplicada. Quem usa leitor de tela ouve
 * "Duna, Frank Herbert" uma vez, e não "Capa de Duna. Duna. Frank Herbert".
 *
 * Se a capa passar a ser a única identificação do livro em algum lugar, o
 * `alt` precisa deixar de ser vazio ali.
 */

import { computed, ref, watch } from 'vue'

import BaseIcon from './BaseIcon.vue'

const props = defineProps({
  coverUrl: { type: String, default: null },
  coverId: { type: [Number, String], default: null },
  /** Usado apenas nas iniciais do substituto. */
  title: { type: String, default: '' },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value),
  },
})

const hasFailed = ref(false)

// Uma capa quebrada em um item não deve manchar o próximo item reciclado.
watch(
  () => [props.coverUrl, props.coverId],
  () => {
    hasFailed.value = false
  },
)

const resolvedUrl = computed(() => {
  if (props.coverUrl) return props.coverUrl
  if (props.coverId) return `https://covers.openlibrary.org/b/id/${props.coverId}-M.jpg`
  return null
})

const showImage = computed(() => Boolean(resolvedUrl.value) && !hasFailed.value)

/** Até duas iniciais do título, para o substituto não ficar vazio. */
const initials = computed(() =>
  props.title
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join(''),
)
</script>

<template>
  <div :class="['cover', `cover--${size}`]">
    <img
      v-if="showImage"
      :src="resolvedUrl"
      alt=""
      class="cover__image"
      loading="lazy"
      decoding="async"
      @error="hasFailed = true"
    />
    <!-- Substituto: também decorativo, pelo mesmo motivo da imagem real. -->
    <div v-else class="cover__fallback" aria-hidden="true">
      <span v-if="initials" class="cover__initials">{{ initials }}</span>
      <BaseIcon v-else name="books" :size="size === 'sm' ? 20 : 28" />
    </div>
  </div>
</template>

<style scoped>
.cover {
  position: relative;
  overflow: hidden;
  /* Proporção fixa evita que a página salte quando a capa carrega. */
  aspect-ratio: 2 / 3;
  background-color: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.cover--sm {
  width: 44px;
}

.cover--md {
  width: 72px;
}

.cover--lg {
  width: 100%;
  max-width: 180px;
}

.cover__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover__fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--text-muted);
}

.cover__initials {
  font-size: var(--text-lg);
  font-weight: 700;
  letter-spacing: 0.02em;
}
</style>
