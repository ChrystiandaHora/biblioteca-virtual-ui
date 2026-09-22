<script setup>
/**
 * Casca da aplicação.
 *
 * Assume três responsabilidades que o navegador cumpriria sozinho em um site
 * de múltiplas páginas, mas que em uma SPA passam a ser nossas:
 *
 *  1. **Título do documento** — atualizado a cada rota, senão a aba e o
 *     histórico ficam presos no primeiro título carregado.
 *  2. **Reposicionamento do foco** — depois de trocar de rota, o foco é
 *     enviado ao cabeçalho da nova tela. Sem isso ele fica no link clicado (ou
 *     volta ao topo do documento) e a navegação por teclado se perde.
 *  3. **Anúncio da navegação** — uma região `aria-live` informa qual tela
 *     abriu, porque a troca de conteúdo por si só é silenciosa.
 */

import { nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import AppHeader from '@/components/AppHeader.vue'
import ToastRegion from '@/components/ToastRegion.vue'
import { useAuthStore } from '@/stores/authStore.js'

const route = useRoute()
const auth = useAuthStore()

const mainRef = ref(null)
/** Frase lida pelo leitor de tela ao concluir a navegação. */
const routeAnnouncement = ref('')

/**
 * Caminho da última tela vista, usado para separar "abrir a aplicação" de
 * "navegar dentro dela".
 *
 * Mover o foco para o `<main>` no carregamento inicial seria errado: o foco
 * passaria à frente do skip link, que é justamente o primeiro elemento
 * tabulável da página, e atropelaria a restauração de foco que o navegador faz
 * ao recarregar. Só reposicionamos o foco em navegação de verdade.
 *
 * O roteador aciona este watcher duas vezes ao subir — primeiro com a rota
 * inicial vazia (`route.name === undefined`) e depois com a rota resolvida —
 * então um simples "pule a primeira vez" não bastaria.
 *
 * Também é por isso que comparamos o **nome** da rota, e não o `fullPath`:
 * mudar um filtro reescreve a query na mesma tela, e isso não é navegação.
 */
let lastScreenPath = null

const BASE_TITLE = 'Biblioteca Virtual'

onMounted(() => {
  // Revalida o token salvo ao abrir a aplicação. O guard do roteador também
  // faz isso; aqui cobrimos o caso da primeira rota pública.
  auth.restoreSession().catch(() => {})
})

watch(
  () => route.fullPath,
  async () => {
    const title = route.meta.title
    document.title = title ? `${title} · ${BASE_TITLE}` : BASE_TITLE

    const isOpeningTheApp = lastScreenPath === null
    // Filtros e paginação reescrevem só a query, com `router.replace`, sem sair
    // da tela. Tratar isso como navegação arrancaria o foco do `<select>` que a
    // pessoa acabou de usar e anunciaria uma carga que não aconteceu.
    // `path` (e não `name`) porque abrir outro livro reusa o nome `livro`.
    const isSameScreen = !isOpeningTheApp && route.path === lastScreenPath
    if (route.name !== undefined) lastScreenPath = route.path
    if (isOpeningTheApp || isSameScreen || route.name === undefined) return

    await nextTick()

    // `tabindex="-1"` no <main> permite focá-lo por script sem inseri-lo na
    // ordem de tabulação. `preventScroll` evita um salto duplo, já que o
    // `scrollBehavior` do roteador cuida da rolagem.
    mainRef.value?.focus({ preventScroll: true })

    routeAnnouncement.value = title ? `${title} carregada.` : 'Página carregada.'
  },
  { immediate: true },
)
</script>

<template>
  <!-- Primeiro elemento focável da página: permite pular a navegação repetida. -->
  <a class="skip-link" href="#conteudo">Pular para o conteúdo principal</a>

  <AppHeader v-if="auth.isAuthenticated" />

  <main id="conteudo" ref="mainRef" class="main" tabindex="-1">
    <RouterView v-slot="{ Component }">
      <component :is="Component" />
    </RouterView>
  </main>

  <footer class="footer">
    <div class="container footer__inner">
      <p class="footer__text">
        Dados de catálogo fornecidos pela
        <a href="https://openlibrary.org/developers/api" target="_blank" rel="noopener noreferrer">
          Open Library API
          <span class="sr-only">(abre em nova aba)</span>
        </a>
        — projeto do Internet Archive.
      </p>
      <p class="footer__text footer__text--muted">
        Ícones por
        <a href="https://fontawesome.com/license/free" target="_blank" rel="noopener noreferrer">
          Font Awesome Free
          <span class="sr-only">(abre em nova aba)</span>
        </a>
        — CC BY 4.0.
      </p>
      <p class="footer__text footer__text--muted">
        MVP acadêmico · Interface Vue 3 + API FastAPI + PostgreSQL
      </p>
    </div>
  </footer>

  <!-- Região viva só para anunciar a mudança de rota. Fica fora do <main>
       para que trocar o conteúdo do main não a remova do DOM. -->
  <p class="sr-only" role="status" aria-live="polite">{{ routeAnnouncement }}</p>

  <ToastRegion />
</template>

<style scoped>
/* ---------------------------------------------------------------------------
   Skip link: escondido até receber foco, e então totalmente visível.
   Nunca usamos `display: none`, que o tiraria da ordem de tabulação.
   --------------------------------------------------------------------------- */
.skip-link {
  position: fixed;
  top: var(--space-2);
  left: var(--space-2);
  z-index: 100;
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-sm);
  font-weight: 650;
  color: var(--accent-text);
  text-decoration: none;
  background-color: var(--accent);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  /* Fora da tela, mas ainda focável. */
  translate: 0 -200%;
}

.skip-link:focus-visible {
  translate: 0 0;
}

@media (prefers-reduced-motion: no-preference) {
  .skip-link {
    transition: translate 140ms ease-out;
  }
}

.main {
  /* O cabeçalho é fixo: esta margem impede que ele cubra o elemento focado
     quando a navegação por teclado rola a página até ele (SC 2.4.11). */
  scroll-margin-top: 80px;
  padding-block: var(--space-5) var(--space-7);
}

/* O <main> recebe foco por script; o anel nesse caso seria ruído visual, já
   que o anúncio em aria-live comunica a mudança. */
.main:focus {
  outline: none;
}

/* Espaço para a barra de navegação inferior das telas estreitas. */
@media (max-width: 47.999rem) {
  .main {
    padding-bottom: calc(var(--space-7) + var(--nav-mobile-height));
  }
}

.footer {
  padding-block: var(--space-5);
  border-top: 1px solid var(--border);
}

@media (max-width: 47.999rem) {
  .footer {
    padding-bottom: calc(var(--space-5) + 72px);
  }
}

.footer__inner {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.footer__text {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.footer__text--muted {
  opacity: 0.85;
}
</style>
