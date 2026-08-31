<script setup>
/**
 * Ícones da interface, vindos do Font Awesome Free (CC BY 4.0).
 *
 * A geometria costumava ser desenhada à mão aqui, um `<path>` por ícone. Isso
 * produziu erros silenciosos — a lupa, por exemplo, fechava só 270° do círculo
 * e aparecia como meia-lua sem cabo em quatro telas. O registro abaixo mapeia
 * os mesmos nomes de sempre para ícones de um conjunto mantido, então a API
 * pública deste componente (`name`, `size`, `label`) não mudou: nem o catálogo
 * de domínio nem os 19 consumidores precisaram ser tocados.
 *
 * Todos são decorativos por padrão (`aria-hidden`): eles acompanham um rótulo
 * textual visível, e duplicar essa informação no leitor de tela só geraria
 * repetição. Quando um ícone for a única fonte de significado, passe `label` —
 * aí ele ganha `role="img"` e um nome acessível.
 *
 * `fill="currentColor"` faz o ícone herdar a cor do texto ao redor, então ele
 * acompanha os quatro temas sem regra extra.
 */

import { computed } from 'vue'

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faAlignLeft,
  faArrowLeft,
  faArrowRight,
  faBookOpen,
  faBookmark,
  faBoxOpen,
  faChartColumn,
  faCheck,
  faChevronDown,
  faCircleInfo,
  faClock,
  faEye,
  faEyeSlash,
  faFileLines,
  faFilter,
  faMagnifyingGlass,
  faMoon,
  faNewspaper,
  faNoteSticky,
  faPencil,
  faPlay,
  faPlus,
  faQuoteLeft,
  faRightFromBracket,
  faStar,
  faStop,
  faSun,
  faTrashCan,
  faTriangleExclamation,
  faWandMagicSparkles,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { faStar as faStarOutline } from '@fortawesome/free-regular-svg-icons'

const props = defineProps({
  name: { type: String, required: true },
  /**
   * Palavra-chave da escala (`xs`|`sm`|`md`|`lg`|`xl`) ou um número em pixels.
   * O número existe para a migração ser incremental; prefira a palavra-chave.
   */
  size: { type: [Number, String], default: 'md' },
  /** Nome acessível. Preencha só quando o ícone não tiver texto ao lado. */
  label: { type: String, default: '' },
})

const ICONS = {
  // Navegação e marca
  books: faBookOpen,
  chart: faChartColumn,
  search: faMagnifyingGlass,
  // Estágios de leitura (ver readingStatus.js e A11Y-DECISIONS.md#d8)
  bookmark: faBookmark,
  play: faPlay,
  check: faCheck,
  stop: faStop,
  // Diário
  note: faNoteSticky,
  quote: faQuoteLeft,
  review: faAlignLeft,
  page: faFileLines,
  // Ações
  plus: faPlus,
  trash: faTrashCan,
  pencil: faPencil,
  close: faXmark,
  filter: faFilter,
  logout: faRightFromBracket,
  // Visibilidade de senha
  eye: faEye,
  eyeSlash: faEyeSlash,
  // Indicadores
  clock: faClock,
  warning: faTriangleExclamation,
  info: faCircleInfo,
  empty: faBoxOpen,
  // A estrela cheia e a vazia são ícones diferentes de propósito: o
  // preenchimento é o segundo canal da nota, além da cor (A11Y-DECISIONS.md#d6).
  star: faStar,
  starOutline: faStarOutline,
  // Setas
  chevronDown: faChevronDown,
  arrowLeft: faArrowLeft,
  arrowRight: faArrowRight,
  // Temas
  sun: faSun,
  moon: faMoon,
  paper: faNewspaper,
  sparkle: faWandMagicSparkles,
}

const SIZES = {
  xs: 'var(--icon-xs)',
  sm: 'var(--icon-sm)',
  md: 'var(--icon-md)',
  lg: 'var(--icon-lg)',
  xl: 'var(--icon-xl)',
}

const icon = computed(() => {
  const found = ICONS[props.name]
  if (!found && import.meta.env.DEV) {
    // O fallback silencioso da versão anterior escondia erros de digitação até
    // alguém reparar num ícone errado na tela.
    console.warn(`[BaseIcon] Ícone desconhecido: "${props.name}". Usando "info".`)
  }
  return found ?? ICONS.info
})

/**
 * A caixa é sempre quadrada; o `preserveAspectRatio` padrão do SVG centraliza
 * os ícones mais estreitos (o `viewBox` do FA varia entre 384 e 640 de largura).
 * É isso que mantém o alinhamento em listas, sem depender do CSS do Font Awesome.
 */
const box = computed(() => {
  const value = SIZES[props.size] ?? (typeof props.size === 'number' ? `${props.size}px` : null)
  return value ?? SIZES.md
})
</script>

<template>
  <FontAwesomeIcon
    class="icon"
    :icon="icon"
    :style="{ width: box, height: box }"
    :role="label ? 'img' : undefined"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : 'true'"
    focusable="false"
  />
</template>

<style scoped>
.icon {
  flex-shrink: 0;
}
</style>
