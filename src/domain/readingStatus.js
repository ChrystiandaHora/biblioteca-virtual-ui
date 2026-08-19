/**
 * Catálogo dos estágios de leitura.
 *
 * Cada estágio carrega rótulo, ícone e token de cor. Os três andam juntos de
 * propósito: a regra de acessibilidade adotada é **ícone + texto + cor**, então
 * nenhum estado desta interface é comunicado só pela cor. No tema "tinta",
 * que é monocromático, ícone e rótulo continuam distinguindo tudo.
 */

export const READING_STATUS = Object.freeze({
  QUERO_LER: 'quero_ler',
  LENDO: 'lendo',
  LIDO: 'lido',
  ABANDONADO: 'abandonado',
})

/** Ordem de exibição em filtros e resumos: acompanha a jornada da leitura. */
export const READING_STATUS_LIST = Object.freeze([
  {
    value: READING_STATUS.QUERO_LER,
    label: 'Quero ler',
    short: 'Quero ler',
    icon: 'bookmark',
    colorToken: '--st-quero',
    bgToken: '--st-quero-bg',
    description: 'Na fila de espera, ainda sem leitura iniciada.',
  },
  {
    value: READING_STATUS.LENDO,
    label: 'Lendo agora',
    short: 'Lendo',
    icon: 'play',
    colorToken: '--st-lendo',
    bgToken: '--st-lendo-bg',
    description: 'Leitura em andamento, com progresso registrado.',
  },
  {
    value: READING_STATUS.LIDO,
    label: 'Concluídos',
    short: 'Lido',
    icon: 'check',
    colorToken: '--st-lido',
    bgToken: '--st-lido-bg',
    description: 'Leitura finalizada.',
  },
  {
    value: READING_STATUS.ABANDONADO,
    label: 'Abandonados',
    short: 'Abandonado',
    icon: 'stop',
    colorToken: '--st-abandonado',
    bgToken: '--st-abandonado-bg',
    description: 'Leitura interrompida sem previsão de retomada.',
  },
])

const BY_VALUE = new Map(READING_STATUS_LIST.map((item) => [item.value, item]))

/** Metadados de um estágio; devolve o de "quero ler" para valores desconhecidos. */
export function describeStatus(value) {
  return BY_VALUE.get(value) ?? READING_STATUS_LIST[0]
}

/** Opções do diário de leitura. */
export const DIARY_KINDS = Object.freeze([
  { value: 'nota', label: 'Anotação', icon: 'note' },
  { value: 'citacao', label: 'Citação', icon: 'quote' },
  { value: 'resenha', label: 'Resenha', icon: 'review' },
])

const DIARY_BY_VALUE = new Map(DIARY_KINDS.map((item) => [item.value, item]))

export function describeDiaryKind(value) {
  return DIARY_BY_VALUE.get(value) ?? DIARY_KINDS[0]
}

/** Campos de ordenação aceitos pela API, na ordem em que aparecem no seletor. */
export const ORDER_OPTIONS = Object.freeze([
  { value: 'recentes', label: 'Adicionados recentemente' },
  { value: 'titulo', label: 'Título' },
  { value: 'autor', label: 'Autor' },
  { value: 'nota', label: 'Nota' },
  { value: 'progresso', label: 'Progresso' },
  { value: 'ano', label: 'Ano de publicação' },
])
