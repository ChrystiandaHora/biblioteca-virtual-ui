/**
 * Rotas da interface.
 *
 * Em uma SPA a navegação não recarrega a página, então duas coisas que o
 * navegador normalmente faz de graça passam a ser nossa responsabilidade:
 * atualizar o título do documento e reposicionar o foco. As duas acontecem
 * aqui e em `App.vue`.
 */

import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/stores/authStore.js'

const routes = [
  {
    path: '/',
    name: 'painel',
    component: () => import('@/views/DashboardView.vue'),
    meta: { title: 'Painel de leitura', requiresAuth: true },
  },
  {
    path: '/estante',
    name: 'estante',
    component: () => import('@/views/LibraryView.vue'),
    meta: { title: 'Minha estante', requiresAuth: true },
  },
  {
    path: '/buscar',
    name: 'buscar',
    component: () => import('@/views/SearchView.vue'),
    meta: { title: 'Buscar livros', requiresAuth: true },
  },
  {
    path: '/estante/:id',
    name: 'livro',
    component: () => import('@/views/BookDetailView.vue'),
    meta: { title: 'Detalhes do livro', requiresAuth: true },
  },
  {
    path: '/entrar',
    name: 'entrar',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: 'Entrar', guestOnly: true },
  },
  {
    path: '/criar-conta',
    name: 'criar-conta',
    component: () => import('@/views/RegisterView.vue'),
    meta: { title: 'Criar conta', guestOnly: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'nao-encontrado',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: 'Página não encontrada' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // Voltar/avançar restaura a posição anterior; navegação nova começa no topo.
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, top: 80 }
    // Filtros e paginação gravam seu estado na URL com `router.replace`, o que
    // é uma navegação de verdade para o roteador. Rolar ao topo aqui arrancaria
    // a pessoa da lista que ela acabou de filtrar, então só rolamos quando a
    // rota realmente muda. Comparamos `path` (e não `name`) porque abrir outro
    // livro reusa o nome `livro` e é, sim, uma tela nova.
    if (to.path === from.path) return false
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // Ao abrir a aplicação direto em uma rota protegida, revalidamos o token
  // salvo antes de decidir para onde mandar a pessoa.
  if (auth.token && !auth.user) {
    await auth.restoreSession().catch(() => {})
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    // `redirect` devolve a pessoa ao destino original depois do login, em vez
    // de largá-la no painel.
    return { name: 'entrar', query: to.fullPath === '/' ? {} : { redirect: to.fullPath } }
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'painel' }
  }

  return true
})

export default router
