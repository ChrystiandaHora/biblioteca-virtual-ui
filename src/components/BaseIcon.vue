<script setup>
/**
 * Ícones em SVG inline.
 *
 * Todos são decorativos por padrão (`aria-hidden`): eles acompanham um rótulo
 * textual visível, e duplicar essa informação no leitor de tela só geraria
 * repetição. Quando um ícone for a única fonte de significado, passe `label` —
 * aí ele ganha `role="img"` e um nome acessível.
 *
 * `currentColor` faz o ícone herdar a cor do texto ao redor, então ele
 * acompanha os quatro temas sem regra extra.
 */

const props = defineProps({
  name: { type: String, required: true },
  /** Tamanho em pixels do lado do quadrado. */
  size: { type: [Number, String], default: 20 },
  /** Nome acessível. Preencha só quando o ícone não tiver texto ao lado. */
  label: { type: String, default: '' },
})

// Cada traçado usa fill="none" + stroke, então a espessura fica consistente.
const PATHS = {
  bookmark: 'M6 3h12v18l-6-4.5L6 21V3z',
  play: 'M7 4l12 8-12 8V4z',
  check: 'M4 12.5l5.5 5.5L20 7',
  stop: 'M6 6h12v12H6z',
  search: 'M10.5 3a7.5 7.5 0 105.3 12.8L21 21M10.5 3a7.5 7.5 0 00-7.5 7.5',
  books: 'M4 4h5v16H4V4zm6 0h5v16h-5V4zm7.5.6l4 15.2-1.4.4-4-15.2 1.4-.4z',
  chart: 'M4 20V10m5 10V4m5 16v-7m5 7V7',
  note: 'M5 3h9l5 5v13H5V3zm9 0v5h5',
  quote: 'M9 7c-2.5 1-4 3-4 6h3.5v4H4v-4c0-4 2-7 5-8v2zm10 0c-2.5 1-4 3-4 6h3.5v4H14v-4c0-4 2-7 5-8v2z',
  review: 'M4 5h16M4 10h16M4 15h10M4 20h7',
  plus: 'M12 5v14M5 12h14',
  trash: 'M4 7h16M9 7V4h6v3m-8 0l1 14h8l1-14',
  pencil: 'M4 20h4L20 8l-4-4L4 16v4z',
  close: 'M6 6l12 12M18 6L6 18',
  sun: 'M12 4V2m0 20v-2m8-8h2M2 12h2m13.7-5.7l1.4-1.4M4.9 19.1l1.4-1.4m11.4 0l1.4 1.4M4.9 4.9l1.4 1.4M16 12a4 4 0 11-8 0 4 4 0 018 0z',
  moon: 'M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 100 17 8.5 8.5 0 0010.5-6.5z',
  paper: 'M5 3h14v18H5V3zm3 5h8M8 12h8M8 16h5',
  sparkle: 'M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z',
  logout: 'M15 5V3H4v18h11v-2m3-11l4 4-4 4m4-4H9',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zm-8 9a8 8 0 0116 0',
  star: 'M12 3.5l2.7 5.6 6.1.9-4.4 4.3 1 6.2-5.4-2.9-5.4 2.9 1-6.2L3.2 10l6.1-.9L12 3.5z',
  chevronDown: 'M6 9l6 6 6-6',
  arrowLeft: 'M19 12H5m0 0l6-6m-6 6l6 6',
  arrowRight: 'M5 12h14m0 0l-6-6m6 6l-6 6',
  clock: 'M12 7v5l3.5 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  filter: 'M4 5h16l-6 7v7l-4-2v-5L4 5z',
  page: 'M6 3h8l4 4v14H6V3zm8 0v4h4',
  warning: 'M12 4l9 16H3l9-16zm0 5v5m0 3v.5',
  info: 'M12 11v6m0-9.5V8M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  empty: 'M4 7l8-4 8 4v10l-8 4-8-4V7zm8-4v18M4 7l8 4 8-4',
}
</script>

<template>
  <svg
    class="icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    :role="label ? 'img' : undefined"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : 'true'"
    focusable="false"
  >
    <title v-if="label">{{ label }}</title>
    <path :d="PATHS[props.name] ?? PATHS.info" />
  </svg>
</template>

<style scoped>
.icon {
  flex-shrink: 0;
}
</style>
