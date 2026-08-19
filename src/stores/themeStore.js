/**
 * Store do tema visual.
 *
 * São quatro temas escolhidos, não um claro invertido automaticamente:
 * cada um tem os próprios passos de cor, validados contra o próprio fundo
 * por `npm run check:contrast`.
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const THEME_STORAGE_KEY = 'biblioteca:tema'

export const THEMES = Object.freeze([
  {
    value: 'claro',
    label: 'Claro',
    description: 'Fundo branco com texto escuro.',
  },
  {
    value: 'escuro',
    label: 'Escuro',
    description: 'Fundo escuro para ambientes com pouca luz.',
  },
  {
    value: 'tinta',
    label: 'Tinta',
    description: 'Papel monocromático sem saturação, no estilo de leitores de tinta eletrônica.',
  },
  {
    value: 'vibrante',
    label: 'Vibrante',
    description: 'Violeta profundo com destaques em turquesa.',
  },
])

const VALID = new Set(THEMES.map((theme) => theme.value))

function readStored() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    return VALID.has(saved) ? saved : null
  } catch {
    return null
  }
}

function systemPreference() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro'
}

export const useThemeStore = defineStore('theme', () => {
  // O index.html já aplicou o tema antes da primeira pintura; aqui apenas
  // lemos de volta o que ficou no atributo para não divergir do DOM.
  const fromDom = document.documentElement.dataset.theme
  const current = ref(VALID.has(fromDom) ? fromDom : (readStored() ?? systemPreference()))

  const currentTheme = computed(
    () => THEMES.find((theme) => theme.value === current.value) ?? THEMES[0],
  )

  function apply(value) {
    if (!VALID.has(value)) return
    current.value = value
    document.documentElement.dataset.theme = value
    try {
      localStorage.setItem(THEME_STORAGE_KEY, value)
    } catch {
      /* storage bloqueado: o tema vale só para esta sessão */
    }
  }

  // Garante que o DOM reflita o estado inicial mesmo se o script inline falhar.
  apply(current.value)

  return { current, currentTheme, themes: THEMES, apply }
})
