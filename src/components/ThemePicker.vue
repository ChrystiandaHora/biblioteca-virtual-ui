<script setup>
/**
 * Seletor de tema.
 *
 * É um `radiogroup` de radios nativos escondidos visualmente, com rótulos
 * estilizados — o teclado (setas para circular, Espaço para escolher) e o
 * anúncio "3 de 4" saem prontos do elemento nativo.
 *
 * Cada opção mostra uma amostra das cores reais do tema, mas o nome do tema
 * também está escrito: a escolha nunca depende de distinguir os quadradinhos.
 */

import { useId } from 'vue'

import { useThemeStore } from '@/stores/themeStore.js'

import BaseIcon from './BaseIcon.vue'

const themeStore = useThemeStore()

const uid = useId()
const groupName = `theme-${uid}`

const ICONS = {
  claro: 'sun',
  escuro: 'moon',
  tinta: 'paper',
  vibrante: 'sparkle',
}
</script>

<template>
  <fieldset class="theme-picker">
    <legend class="theme-picker__legend">
      <BaseIcon name="sparkle" :size="16" />
      Tema visual
    </legend>

    <div class="theme-picker__options">
      <label
        v-for="theme in themeStore.themes"
        :key="theme.value"
        class="theme-option"
        :data-theme="theme.value"
      >
        <input
          class="theme-option__radio sr-only"
          type="radio"
          :name="groupName"
          :value="theme.value"
          :checked="themeStore.current === theme.value"
          @change="themeStore.apply(theme.value)"
        />
        <span class="theme-option__body">
          <span class="theme-option__swatch" aria-hidden="true">
            <span class="theme-option__swatch-bg" />
            <span class="theme-option__swatch-accent" />
            <span class="theme-option__swatch-text" />
          </span>
          <span class="theme-option__labels">
            <span class="theme-option__name">
              <BaseIcon :name="ICONS[theme.value]" :size="15" />
              {{ theme.label }}
            </span>
            <span class="theme-option__description">{{ theme.description }}</span>
          </span>
          <BaseIcon
            v-if="themeStore.current === theme.value"
            name="check"
            :size="18"
            class="theme-option__check"
          />
        </span>
      </label>
    </div>
  </fieldset>
</template>

<style scoped>
.theme-picker {
  padding: 0;
  margin: 0;
  border: 0;
}

.theme-picker__legend {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  padding: 0 0 var(--space-3);
  font-size: var(--text-sm);
  font-weight: 650;
}

.theme-picker__options {
  display: grid;
  gap: var(--space-2);
}

.theme-option {
  display: block;
  cursor: pointer;
  border-radius: var(--radius-md);
}

.theme-option__body {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  min-height: var(--target);
  padding: var(--space-2) var(--space-3);
  /* O `data-theme` no próprio label faz cada opção se pintar inteira com as
     cores do tema que ela representa — é uma prévia real, não uma amostra
     aproximada. Como todos os pares de um mesmo tema já passam pelo
     `check:contrast`, cada cartão fica legível por construção. */
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  transition: border-color var(--transition), background-color var(--transition);
}

.theme-option:hover .theme-option__body {
  border-color: var(--border-strong);
}

.theme-option__radio:focus-visible + .theme-option__body {
  outline: var(--focus-width) solid var(--focus);
  outline-offset: var(--focus-offset);
}

/* Selecionado: borda de 2px + marca de verificação, não só a cor. */
.theme-option__radio:checked + .theme-option__body {
  background-color: var(--accent-soft-bg);
  border-color: var(--accent);
  border-width: 2px;
  padding: calc(var(--space-2) - 1px) calc(var(--space-3) - 1px);
}

.theme-option__swatch {
  display: flex;
  overflow: hidden;
  width: 34px;
  height: 34px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
}

.theme-option__swatch-bg {
  flex: 2;
  background-color: var(--bg);
}

.theme-option__swatch-accent {
  flex: 1;
  background-color: var(--accent);
}

.theme-option__swatch-text {
  flex: 1;
  background-color: var(--text);
}

.theme-option__labels {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.theme-option__name {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  font-size: var(--text-sm);
  font-weight: 650;
  color: var(--text);
}

.theme-option__description {
  font-size: var(--text-xs);
  line-height: 1.45;
  color: var(--text-muted);
}

.theme-option__check {
  color: var(--accent);
}
</style>
