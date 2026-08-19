#!/usr/bin/env node
/**
 * Valida o contraste de TODOS os pares de cor usados pelos 4 temas.
 *
 * Lê os valores direto de `src/styles/themes.css` — não há paleta duplicada
 * aqui, então o script falha se alguém mexer no CSS e quebrar um limite.
 *
 * Limites (WCAG 2.1 AA, perfil "Standard"):
 *   texto ....................... >= 4.5:1
 *   componentes de UI e bordas ... >= 3.0:1
 *
 * Uso: npm run check:contrast
 */

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const THEMES_CSS = resolve(dirname(fileURLToPath(import.meta.url)), '../src/styles/themes.css')

const TEXT_MIN = 4.5
const UI_MIN = 3.0
/**
 * As 4 cores de status também devem se separar em escala de cinza. Não é
 * exigência WCAG — cada badge já traz ícone + rótulo textual — mas evita que
 * o resumo por status vire um bloco uniforme para quem não distingue matiz.
 */
const STATUS_PAIRWISE_MIN = 1.2

/** Pares verificados em todos os temas: [primeiro-plano, fundo, mínimo, descrição]. */
const CHECKS = [
  ['text', 'bg', TEXT_MIN, 'texto sobre a página'],
  ['text', 'surface', TEXT_MIN, 'texto sobre cartão'],
  ['text', 'surface-2', TEXT_MIN, 'texto sobre superfície elevada'],
  ['text-muted', 'bg', TEXT_MIN, 'texto secundário sobre a página'],
  ['text-muted', 'surface', TEXT_MIN, 'texto secundário sobre cartão'],
  ['text-muted', 'surface-2', TEXT_MIN, 'texto secundário sobre superfície elevada'],
  ['accent-text', 'accent', TEXT_MIN, 'rótulo do botão primário'],
  ['accent-text', 'accent-hover', TEXT_MIN, 'rótulo do botão primário em hover'],
  ['accent', 'surface', TEXT_MIN, 'link/realce sobre cartão'],
  ['accent', 'bg', TEXT_MIN, 'link/realce sobre a página'],
  ['text', 'accent-soft-bg', TEXT_MIN, 'texto em destaque suave'],
  ['border-strong', 'surface', UI_MIN, 'borda de campo de formulário'],
  ['border-strong', 'bg', UI_MIN, 'borda sobre a página'],
  ['border-strong', 'surface-2', UI_MIN, 'borda sobre superfície elevada'],
  // O anel de foco usa outline + outline-offset, então sempre aparece sobre um
  // dos fundos — nunca sobre a cor do próprio botão.
  ['focus', 'bg', UI_MIN, 'anel de foco sobre a página'],
  ['focus', 'surface', UI_MIN, 'anel de foco sobre cartão'],
  ['focus', 'surface-2', UI_MIN, 'anel de foco sobre superfície elevada'],
  ['danger-text', 'danger', TEXT_MIN, 'rótulo do botão destrutivo'],
  ['danger-text', 'danger-hover', TEXT_MIN, 'rótulo do botão destrutivo em hover'],
  ['danger', 'surface', TEXT_MIN, 'mensagem de erro sobre cartão'],
  ['text', 'danger-soft-bg', TEXT_MIN, 'texto em alerta de erro'],
  ['success', 'surface', TEXT_MIN, 'mensagem de sucesso sobre cartão'],
  ['text', 'success-soft-bg', TEXT_MIN, 'texto em alerta de sucesso'],
  ['warning', 'surface', TEXT_MIN, 'mensagem de aviso sobre cartão'],
  ['text', 'warning-soft-bg', TEXT_MIN, 'texto em alerta de aviso'],
  ['chart', 'surface', UI_MIN, 'colunas do gráfico mensal'],
  ['chart', 'chart-track', UI_MIN, 'preenchimento sobre a trilha da barra'],
  ['st-quero', 'surface', UI_MIN, "cor do status 'quero ler' sobre cartão"],
  ['st-lendo', 'surface', UI_MIN, "cor do status 'lendo' sobre cartão"],
  ['st-lido', 'surface', UI_MIN, "cor do status 'lido' sobre cartão"],
  ['st-abandonado', 'surface', UI_MIN, "cor do status 'abandonado' sobre cartão"],
  ['st-quero', 'st-quero-bg', UI_MIN, "ícone 'quero ler' sobre seu fundo suave"],
  ['st-lendo', 'st-lendo-bg', UI_MIN, "ícone 'lendo' sobre seu fundo suave"],
  ['st-lido', 'st-lido-bg', UI_MIN, "ícone 'lido' sobre seu fundo suave"],
  ['st-abandonado', 'st-abandonado-bg', UI_MIN, "ícone 'abandonado' sobre seu fundo suave"],
  ['text', 'st-quero-bg', TEXT_MIN, "rótulo 'quero ler' no badge"],
  ['text', 'st-lendo-bg', TEXT_MIN, "rótulo 'lendo' no badge"],
  ['text', 'st-lido-bg', TEXT_MIN, "rótulo 'lido' no badge"],
  ['text', 'st-abandonado-bg', TEXT_MIN, "rótulo 'abandonado' no badge"],
]

const STATUS_TOKENS = ['st-quero', 'st-lendo', 'st-lido', 'st-abandonado']

/** Converte um canal sRGB (0–1) para luz linear. */
function toLinear(channel) {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
}

/** Luminância relativa de uma cor `#rrggbb`, conforme WCAG. */
function luminance(hex) {
  const value = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => toLinear(parseInt(value.slice(i, i + 2), 16) / 255))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Razão de contraste entre duas cores (1:1 a 21:1). */
function contrast(a, b) {
  const [la, lb] = [luminance(a), luminance(b)]
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** Extrai `{ tema: { token: '#rrggbb' } }` do arquivo de tokens. */
function parseThemes(css) {
  const themes = {}
  const blockPattern = /\[data-theme='([a-z]+)'\]\s*\{([^}]*)\}/g
  for (const [, name, body] of css.matchAll(blockPattern)) {
    const tokens = themes[name] ?? (themes[name] = {})
    const tokenPattern = /--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g
    for (const [, token, hex] of body.matchAll(tokenPattern)) {
      tokens[token] = hex.toLowerCase()
    }
  }
  return themes
}

const themes = parseThemes(readFileSync(THEMES_CSS, 'utf8'))
const themeNames = Object.keys(themes)

if (themeNames.length === 0) {
  console.error(`Nenhum tema encontrado em ${THEMES_CSS}.`)
  process.exit(1)
}

let failures = 0
let missing = 0

for (const name of themeNames) {
  const tokens = themes[name]
  console.log(`\n=== tema: ${name} ===`)

  for (const [fg, bg, min, label] of CHECKS) {
    if (!tokens[fg] || !tokens[bg]) {
      missing += 1
      console.log(`  ????  token ausente: --${tokens[fg] ? bg : fg}  (${label})`)
      continue
    }
    const ratio = contrast(tokens[fg], tokens[bg])
    const ok = ratio >= min
    if (!ok) failures += 1
    console.log(
      `  ${ok ? 'OK  ' : 'FAIL'} ${ratio.toFixed(2).padStart(5)}:1 (min ${min.toFixed(1)}) ` +
        `${label.padEnd(44)} --${fg} / --${bg}`,
    )
  }

  console.log(`  -- separação em escala de cinza entre status (min ${STATUS_PAIRWISE_MIN}:1) --`)
  for (let i = 0; i < STATUS_TOKENS.length; i += 1) {
    for (let j = i + 1; j < STATUS_TOKENS.length; j += 1) {
      const [a, b] = [STATUS_TOKENS[i], STATUS_TOKENS[j]]
      const ratio = contrast(tokens[a], tokens[b])
      const ok = ratio >= STATUS_PAIRWISE_MIN
      if (!ok) failures += 1
      console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ratio.toFixed(2).padStart(5)}:1 --${a} vs --${b}`)
    }
  }
}

const total = themeNames.length * (CHECKS.length + 6)
console.log(`\n${themeNames.length} temas · ${total} pares verificados`)

if (missing > 0) {
  console.error(`${missing} token(s) ausente(s) — verifique themes.css.`)
}
if (failures > 0) {
  console.error(`${failures} par(es) abaixo do limite AA.`)
  process.exit(1)
}
if (missing > 0) {
  process.exit(1)
}
console.log('PALETA VALIDADA — todos os pares atendem ao WCAG 2.1 AA.')
