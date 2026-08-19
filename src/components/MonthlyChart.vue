<script setup>
/**
 * Livros concluídos por mês nos últimos 12 meses.
 *
 * Decisões de forma (uma série só, então nada de legenda — o título já diz o
 * que está plotado):
 *  - colunas, porque o dado é contagem em períodos discretos;
 *  - colunas finas (máx. 24px) com topo arredondado em 4px e base reta,
 *    crescendo de uma única linha de base;
 *  - grade em linha sólida de 1px, um passo fora da superfície, recessiva;
 *  - rótulo direto apenas no valor máximo — número em toda coluna vira ruído;
 *  - eixo Y com ticks inteiros e dígitos tabulares.
 *
 * Acessibilidade:
 *  - o texto alternativo do gráfico é **o próprio dado**: existe uma tabela
 *    equivalente, sempre presente, aberta por `<details>`;
 *  - cada coluna é focável por teclado e mostra a mesma dica que aparece no
 *    hover — o valor nunca depende de conseguir apontar o mouse;
 *  - `role="img"` com `aria-label` resume o gráfico em uma frase.
 */

import { computed, ref } from 'vue'

import { useElementWidth } from '@/composables/useElementWidth.js'

const props = defineProps({
  /** `[{ month: '2026-03', count: 2 }]`, do mês mais antigo ao atual. */
  data: { type: Array, required: true },
})

/* ---------------------------------------------------------------------------
   Geometria.

   A largura do `viewBox` acompanha a largura real do elemento, medida por
   `ResizeObserver`. Como as duas coincidem, a escala do SVG é sempre 1:1 e uma
   unidade equivale a um pixel — é isso que garante que o texto de 12 unidades
   apareça com 12px de verdade, em qualquer viewport.

   Abaixo de MIN_WIDTH o contêiner rola na horizontal em vez de comprimir o
   desenho (comportamento previsto na exceção de SC 1.4.10 para gráficos).
   --------------------------------------------------------------------------- */
const HEIGHT = 240
const PADDING = { top: 16, right: 10, bottom: 40, left: 36 }
const PLOT_HEIGHT = HEIGHT - PADDING.top - PADDING.bottom
const MAX_BAR_WIDTH = 24
const BAR_RADIUS = 4
/**
 * Largura mínima da faixa de cada mês.
 *
 * Cada faixa é a área de acionamento de uma coluna, então precisa respeitar o
 * mínimo de 24px de SC 2.5.8 — 26 dá alguma folga. É daqui que sai a largura
 * mínima do gráfico: abaixo dela o contêiner rola em vez de comprimir as
 * faixas até ficarem pequenas demais para acertar.
 */
const MIN_BAND_WIDTH = 26
/** Espaço mínimo por rótulo do eixo X antes de começar a pular rótulos. */
const MIN_LABEL_SPACE = 48

const plotRef = ref(null)
const containerWidth = useElementWidth(plotRef, { min: 0, initial: 720 })

/** Largura abaixo da qual as faixas ficariam menores que o alvo mínimo. */
const minChartWidth = computed(
  () => PADDING.left + PADDING.right + MIN_BAND_WIDTH * Math.max(1, props.data.length),
)

const width = computed(() => Math.max(containerWidth.value, minChartWidth.value))

const plotWidth = computed(() => width.value - PADDING.left - PADDING.right)

const MONTH_NAMES = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
]

const hoveredIndex = ref(null)

function formatMonth(key) {
  const [year, month] = key.split('-')
  return `${MONTH_NAMES[Number(month) - 1]}/${year.slice(2)}`
}

function formatMonthLong(key) {
  const [year, month] = key.split('-')
  const names = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
  ]
  return `${names[Number(month) - 1]} de ${year}`
}

const maxCount = computed(() => Math.max(1, ...props.data.map((d) => d.count)))

/** Ticks inteiros: contagem de livros não tem meio livro. */
const ticks = computed(() => {
  const max = maxCount.value
  const step = max <= 4 ? 1 : Math.ceil(max / 4)
  const values = []
  for (let value = 0; value <= max; value += step) values.push(value)
  if (values.at(-1) !== max) values.push(max)
  return values
})

const scaleMax = computed(() => ticks.value.at(-1) ?? 1)

const bandWidth = computed(() => plotWidth.value / Math.max(1, props.data.length))
const barWidth = computed(() => Math.min(MAX_BAR_WIDTH, bandWidth.value * 0.55))

const bars = computed(() =>
  props.data.map((entry, index) => {
    const height = entry.count === 0 ? 0 : (entry.count / scaleMax.value) * PLOT_HEIGHT
    const bandCenter = PADDING.left + bandWidth.value * (index + 0.5)
    return {
      ...entry,
      index,
      x: bandCenter - barWidth.value / 2,
      y: PADDING.top + PLOT_HEIGHT - height,
      width: barWidth.value,
      height,
      bandCenter,
      bandX: PADDING.left + bandWidth.value * index,
      label: formatMonth(entry.month),
      longLabel: formatMonthLong(entry.month),
    }
  }),
)

/** Índice do maior valor — o único que recebe rótulo direto. */
const peakIndex = computed(() => {
  const peak = props.data.reduce(
    (best, entry, index) => (entry.count > (props.data[best]?.count ?? -1) ? index : best),
    0,
  )
  return props.data[peak]?.count > 0 ? peak : null
})

const totalFinished = computed(() => props.data.reduce((sum, entry) => sum + entry.count, 0))

const isEmpty = computed(() => totalFinished.value === 0)

/**
 * De quantos em quantos meses um rótulo do eixo X é exibido.
 *
 * Em larguras apertadas, "set/25" ao lado de "out/25" colidiria. Em vez de
 * encolher a fonte abaixo do piso de 12px, pulamos rótulos — o valor de cada
 * coluna continua acessível pelo foco do teclado, pela dica e pela tabela.
 */
const labelStep = computed(() => Math.max(1, Math.ceil(MIN_LABEL_SPACE / bandWidth.value)))

function shouldShowXLabel(index) {
  // O último mês (o atual) é sempre rotulado: é a referência da série.
  if (index === props.data.length - 1) return true
  return index % labelStep.value === 0
}

const chartSummary = computed(() => {
  if (isEmpty.value) return 'Gráfico de colunas sem dados: nenhum livro concluído nos últimos 12 meses.'
  const peak = peakIndex.value === null ? null : bars.value[peakIndex.value]
  return (
    `Gráfico de colunas com livros concluídos por mês nos últimos 12 meses. ` +
    `Total de ${totalFinished.value} ${totalFinished.value === 1 ? 'livro' : 'livros'}` +
    (peak ? `, com máximo de ${peak.count} em ${peak.longLabel}` : '') +
    '. Os valores exatos estão na tabela abaixo do gráfico.'
  )
})

function yFor(value) {
  return PADDING.top + PLOT_HEIGHT - (value / scaleMax.value) * PLOT_HEIGHT
}

const hoveredBar = computed(() =>
  hoveredIndex.value === null ? null : bars.value[hoveredIndex.value],
)
</script>

<template>
  <figure class="chart">
    <figcaption class="chart__caption">
      <h3 class="chart__title">Livros concluídos por mês</h3>
      <p class="chart__subtitle">
        Últimos 12 meses ·
        <strong class="tabular">{{ totalFinished }}</strong>
        {{ totalFinished === 1 ? 'livro' : 'livros' }} no período
      </p>
    </figcaption>

    <div ref="plotRef" class="chart__plot scroll-x">
      <svg
        class="chart__svg"
        :viewBox="`0 0 ${width} ${HEIGHT}`"
        :width="width"
        :height="HEIGHT"
        role="img"
        :aria-label="chartSummary"
      >
        <!-- Grade e eixo: linhas sólidas de 1px, um passo fora da superfície. -->
        <g class="chart__grid" aria-hidden="true">
          <line
            v-for="tick in ticks"
            :key="`grid-${tick}`"
            :x1="PADDING.left"
            :x2="width - PADDING.right"
            :y1="yFor(tick)"
            :y2="yFor(tick)"
          />
        </g>

        <g class="chart__axis-labels" aria-hidden="true">
          <text
            v-for="tick in ticks"
            :key="`tick-${tick}`"
            :x="PADDING.left - 8"
            :y="yFor(tick)"
            text-anchor="end"
            dominant-baseline="middle"
          >
            {{ tick }}
          </text>
        </g>

        <!-- Colunas. Cada uma é um <g> focável, com a faixa inteira como área
             de acionamento — bem maior que a coluna fina. -->
        <g
          v-for="bar in bars"
          :key="bar.month"
          class="chart__bar-group"
          tabindex="0"
          role="button"
          :aria-label="`${bar.longLabel}: ${bar.count} ${bar.count === 1 ? 'livro concluído' : 'livros concluídos'}`"
          @mouseenter="hoveredIndex = bar.index"
          @mouseleave="hoveredIndex = null"
          @focus="hoveredIndex = bar.index"
          @blur="hoveredIndex = null"
        >
          <rect
            class="chart__hit"
            :x="bar.bandX"
            :y="PADDING.top"
            :width="bandWidth"
            :height="PLOT_HEIGHT"
          />
          <rect
            v-if="bar.height > 0"
            class="chart__bar"
            :class="{ 'chart__bar--active': hoveredIndex === bar.index }"
            :x="bar.x"
            :y="bar.y"
            :width="bar.width"
            :height="bar.height"
            :rx="Math.min(BAR_RADIUS, bar.height / 2)"
          />
          <!-- Base reta: um retângulo sem raio cobre a metade inferior. -->
          <rect
            v-if="bar.height > BAR_RADIUS"
            class="chart__bar-foot"
            :class="{ 'chart__bar--active': hoveredIndex === bar.index }"
            :x="bar.x"
            :y="bar.y + BAR_RADIUS"
            :width="bar.width"
            :height="bar.height - BAR_RADIUS"
          />
          <!-- Marca de mês vazio: um traço na linha de base deixa claro que o
               mês existe e o valor é zero, em vez de sumir do gráfico. -->
          <rect
            v-else-if="bar.height === 0"
            class="chart__zero"
            :x="bar.x"
            :y="PADDING.top + PLOT_HEIGHT - 2"
            :width="bar.width"
            height="2"
          />
        </g>

        <!-- Rótulo direto só no pico. -->
        <text
          v-if="peakIndex !== null"
          class="chart__peak-label"
          :x="bars[peakIndex].bandCenter"
          :y="bars[peakIndex].y - 6"
          text-anchor="middle"
        >
          {{ bars[peakIndex].count }}
        </text>

        <g class="chart__x-labels" aria-hidden="true">
          <text
            v-for="bar in bars"
            v-show="shouldShowXLabel(bar.index)"
            :key="`x-${bar.month}`"
            :x="bar.bandCenter"
            :y="HEIGHT - PADDING.bottom + 20"
            text-anchor="middle"
          >
            {{ bar.label }}
          </text>
        </g>
      </svg>

      <!-- Dica compartilhada por hover e foco. Fica fora do SVG para poder usar
           tipografia normal e não escalar junto com o viewBox. -->
      <p v-if="hoveredBar" class="chart__tooltip" aria-hidden="true">
        <strong>{{ hoveredBar.longLabel }}</strong>
        <span class="tabular">
          {{ hoveredBar.count }} {{ hoveredBar.count === 1 ? 'livro' : 'livros' }}
        </span>
      </p>
    </div>

    <!-- A alternativa textual de um gráfico é o dado, não a descrição do
         desenho. Esta tabela é o par acessível do SVG acima. -->
    <details class="chart__table-toggle">
      <summary class="chart__table-summary">Ver dados em tabela</summary>
      <div class="scroll-x">
        <table class="chart__table">
          <caption class="sr-only">
            Livros concluídos por mês nos últimos 12 meses
          </caption>
          <thead>
            <tr>
              <th scope="col">Mês</th>
              <th scope="col" class="chart__table-number">Livros concluídos</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="bar in bars" :key="`row-${bar.month}`">
              <th scope="row" class="chart__table-month">{{ bar.longLabel }}</th>
              <td class="chart__table-number tabular">{{ bar.count }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Total</th>
              <td class="chart__table-number tabular">{{ totalFinished }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </details>
  </figure>
</template>

<style scoped>
.chart {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin: 0;
}

.chart__caption {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.chart__title {
  font-size: var(--text-lg);
}

.chart__subtitle {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.chart__plot {
  position: relative;
}

.chart__svg {
  /* As dimensões vêm dos atributos `width`/`height`, que acompanham a medição
     do contêiner — por isso o viewBox nunca é reescalado e uma unidade do
     desenho equivale a um pixel de tela. Sem isso, os rótulos de 12px
     apareceriam menores em contêineres estreitos.

     A altura já inclui a faixa do eixo X, então a legenda do eixo nunca fica
     fora de um scroll aninhado. */
  display: block;

  /* Anula o `svg { max-width: 100% }` do reset. Aqui ele seria contraproducente:
     em vez de deixar o contêiner rolar, ele encolheria o SVG para caber — e
     encolher o SVG encolhe o texto junto, abaixo do piso de 12px. Preferimos a
     rolagem, que a exceção de SC 1.4.10 para gráficos permite. */
  max-width: none;
}

.chart__grid line {
  stroke: var(--border);
  stroke-width: 1;
}

.chart__axis-labels text,
.chart__x-labels text {
  /* 12px é o piso tipográfico do perfil AA. Como o SVG não escala (ver
     .chart__svg), este valor é o tamanho real na tela. */
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  /* Texto do gráfico usa token de texto, nunca a cor da série. */
  fill: var(--text-muted);
}

.chart__bar,
.chart__bar-foot {
  fill: var(--chart);
  transition: fill var(--transition);
}

.chart__bar--active {
  fill: var(--accent-hover);
}

.chart__zero {
  fill: var(--border-strong);
}

.chart__hit {
  fill: transparent;
}

.chart__bar-group {
  cursor: pointer;
}

.chart__bar-group:hover .chart__hit,
.chart__bar-group:focus-visible .chart__hit {
  fill: var(--surface-2);
}

.chart__bar-group:focus-visible {
  outline: var(--focus-width) solid var(--focus);
  outline-offset: 1px;
}

.chart__peak-label {
  font-size: 13px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  fill: var(--text);
}

.chart__tooltip {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-xs);
  background-color: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}

@media (prefers-reduced-motion: reduce) {
  .chart__bar,
  .chart__bar-foot {
    transition: none;
  }
}

/* --------------------------------- tabela --------------------------------- */

.chart__table-toggle {
  font-size: var(--text-sm);
}

.chart__table-summary {
  display: inline-flex;
  gap: var(--space-2);
  align-items: center;
  min-height: var(--target-min);
  padding: var(--space-1) var(--space-2);
  font-weight: 600;
  color: var(--accent);
  /* O sublinhado é o que mantém a afordância de "isto abre algo" no tema
     monocromático, onde --accent é quase preto e a cor não diferencia nada. */
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.2em;
  cursor: pointer;
  border-radius: var(--radius-sm);
}

/* `display: inline-flex` remove o triângulo nativo do <summary>, então
   desenhamos um marcador próprio — sem ele, o controle não anuncia
   visualmente que expande. */
.chart__table-summary {
  list-style: none;
}

.chart__table-summary::-webkit-details-marker {
  display: none;
}

.chart__table-summary::before {
  width: 0;
  height: 0;
  content: '';
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  border-left: 7px solid currentcolor;
  transition: rotate var(--transition);
}

.chart__table-toggle[open] .chart__table-summary::before {
  rotate: 90deg;
}

@media (prefers-reduced-motion: reduce) {
  .chart__table-summary::before {
    transition: none;
  }
}

.chart__table-summary:hover {
  background-color: var(--surface-2);
}

.chart__table {
  width: 100%;
  margin-top: var(--space-3);
  border-collapse: collapse;
}

.chart__table th,
.chart__table td {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.chart__table thead th {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.chart__table-month {
  font-weight: 500;
}

.chart__table-number {
  text-align: right;
}

.chart__table tfoot th,
.chart__table tfoot td {
  font-weight: 700;
  border-bottom: 0;
}
</style>
