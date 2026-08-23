<script setup>
/**
 * Cabeçalho e navegação principal.
 *
 * Pontos de acessibilidade que moldaram este componente:
 *  - a navegação é um `<nav>` com `aria-label`, e o item atual é marcado com
 *    `aria-current="page"` — não apenas com uma cor de destaque;
 *  - o menu de conta é um botão com `aria-expanded`/`aria-controls`, fechado
 *    por Esc e por clique fora, com o foco devolvido ao gatilho;
 *  - o cabeçalho é fixo, mas usa `scroll-margin-top` nos alvos de foco para
 *    que ele nunca cubra o elemento focado (SC 2.4.11);
 *  - em telas estreitas a navegação vira uma barra inferior — os alvos ficam ao
 *    alcance do polegar e continuam com 44px.
 */

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/authStore.js'
import { useToastStore } from '@/stores/toastStore.js'

import BaseButton from './BaseButton.vue'
import BaseIcon from './BaseIcon.vue'
import ThemePicker from './ThemePicker.vue'

const auth = useAuthStore()
const toasts = useToastStore()
const route = useRoute()
const router = useRouter()

const NAV_ITEMS = [
  { name: 'painel', label: 'Painel', icon: 'chart' },
  { name: 'estante', label: 'Estante', icon: 'books' },
  { name: 'buscar', label: 'Buscar', icon: 'search' },
]

const isMenuOpen = ref(false)
const menuTriggerRef = ref(null)
const menuRef = ref(null)

const initials = computed(() => {
  const name = auth.user?.name ?? ''
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? '')
      .join('') || '?'
  )
})

function closeMenu({ restoreFocus = true } = {}) {
  if (!isMenuOpen.value) return
  isMenuOpen.value = false
  if (restoreFocus) menuTriggerRef.value?.$el?.focus?.()
}

function onDocumentPointerDown(event) {
  if (!isMenuOpen.value) return
  const trigger = menuTriggerRef.value?.$el
  if (menuRef.value?.contains(event.target) || trigger?.contains(event.target)) return
  closeMenu({ restoreFocus: false })
}

function onDocumentKeydown(event) {
  if (event.key === 'Escape') closeMenu()
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown)
  document.addEventListener('keydown', onDocumentKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  document.removeEventListener('keydown', onDocumentKeydown)
})

// Trocar de página fecha o menu sem roubar o foco: o roteador já vai
// reposicioná-lo no título da nova tela.
watch(
  () => route.fullPath,
  () => closeMenu({ restoreFocus: false }),
)

function handleLogout() {
  closeMenu({ restoreFocus: false })
  auth.logout()
  toasts.info('Você saiu da sua conta.')
  router.push({ name: 'entrar' })
}
</script>

<template>
  <header class="header">
    <div class="container header__inner">
      <RouterLink :to="{ name: 'painel' }" class="brand">
        <BaseIcon name="books" :size="24" class="brand__icon" />
        <span class="brand__text">
          <span class="brand__name">Biblioteca Virtual</span>
          <span class="brand__tagline">Diário de leitura</span>
        </span>
      </RouterLink>

      <nav class="nav" aria-label="Navegação principal">
        <ul class="nav__list">
          <li v-for="item in NAV_ITEMS" :key="item.name">
            <RouterLink
              :to="{ name: item.name }"
              class="nav__link"
              :aria-current="route.name === item.name ? 'page' : undefined"
            >
              <BaseIcon :name="item.icon" :size="20" />
              <span class="nav__label">{{ item.label }}</span>
            </RouterLink>
          </li>
        </ul>
      </nav>

      <div class="account">
        <BaseButton
          ref="menuTriggerRef"
          variant="secondary"
          class="account__trigger"
          aria-haspopup="true"
          :aria-expanded="isMenuOpen ? 'true' : 'false'"
          aria-controls="account-menu"
          @click="isMenuOpen = !isMenuOpen"
        >
          <span class="account__avatar" aria-hidden="true">{{ initials }}</span>
          <span class="account__name">{{ auth.firstName || 'Conta' }}</span>
          <!-- Seta que acompanha o estado do menu: o `aria-expanded` já
               comunica isso a leitores de tela, e a rotação faz o mesmo
               visualmente. Um ícone de pessoa aqui não indicava nada. -->
          <BaseIcon
            name="chevronDown"
            :size="16"
            class="account__caret"
            :class="{ 'account__caret--open': isMenuOpen }"
          />
        </BaseButton>

        <div v-if="isMenuOpen" id="account-menu" ref="menuRef" class="account__menu">
          <p class="account__identity">
            <span class="account__identity-name">{{ auth.user?.name }}</span>
            <span class="account__identity-email">{{ auth.user?.email }}</span>
          </p>

          <hr class="account__divider" />

          <ThemePicker />

          <hr class="account__divider" />

          <BaseButton variant="ghost" icon="logout" block @click="handleLogout">
            Sair da conta
          </BaseButton>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 40;
  background-color: var(--surface);
  border-bottom: 1px solid var(--border);
}

.header__inner {
  display: flex;
  gap: var(--space-4);
  align-items: center;
  justify-content: space-between;
  min-height: 64px;
}

/* ---------------------------------- marca --------------------------------- */

.brand {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  color: var(--text);
  text-decoration: none;
}

.brand__icon {
  color: var(--accent);
}

.brand__text {
  display: flex;
  flex-direction: column;
}

.brand__name {
  font-size: var(--text-base);
  font-weight: 700;
  line-height: 1.2;
}

.brand__tagline {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

/* Em telas muito estreitas fica só o ícone; o nome continua no leitor de tela
   porque o texto permanece no DOM. */
@media (max-width: 26rem) {
  .brand__text {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
}

/* -------------------------------- navegação ------------------------------- */

.nav__list {
  display: flex;
  gap: var(--space-1);
}

.nav__link {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
  justify-content: center;
  min-width: var(--target);
  min-height: var(--target);
  padding-inline: var(--space-3);
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--text-muted);
  text-decoration: none;
  border-radius: var(--radius-md);
}

.nav__link:hover {
  color: var(--text);
  background-color: var(--surface-2);
}

/* Página atual: cor + fundo + sublinhado espesso. O `aria-current` no template
   é o que comunica o estado a quem não vê a diferença visual. */
.nav__link[aria-current='page'] {
  color: var(--accent);
  background-color: var(--accent-soft-bg);
  box-shadow: inset 0 -3px 0 0 var(--accent);
}

@media (min-width: 48rem) {
  .nav__link {
    flex-direction: row;
    gap: var(--space-2);
    font-size: var(--text-sm);
  }
}

/* Abaixo de 48rem a navegação desce para uma barra inferior fixa. */
@media (max-width: 47.999rem) {
  .nav {
    position: fixed;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 40;
    padding: var(--space-2);
    background-color: var(--surface);
    border-top: 1px solid var(--border);
    /* Respeita a área segura de aparelhos com barra de gestos. */
    padding-bottom: max(var(--space-2), env(safe-area-inset-bottom));
  }

  .nav__list {
    justify-content: space-around;
  }

  .nav__link {
    flex: 1;
    max-width: 8rem;
  }
}

/* ---------------------------------- conta --------------------------------- */

.account {
  position: relative;
}

.account__trigger {
  white-space: nowrap;
}

.account__avatar {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--accent-text);
  background-color: var(--accent);
  border-radius: 50%;
}

.account__name {
  max-width: 8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account__caret {
  color: var(--text-muted);
  transition: rotate var(--transition);
}

.account__caret--open {
  rotate: 180deg;
}

@media (prefers-reduced-motion: reduce) {
  .account__caret {
    transition: none;
  }
}

@media (max-width: 32rem) {
  .account__name,
  .account__caret {
    display: none;
  }
}

.account__menu {
  position: absolute;
  top: calc(100% + var(--space-2));
  right: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: min(20rem, calc(100vw - 2rem));
  max-height: min(70vh, 32rem);
  padding: var(--space-4);
  overflow-y: auto;
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.account__identity {
  display: flex;
  flex-direction: column;
}

.account__identity-name {
  font-size: var(--text-sm);
  font-weight: 650;
}

.account__identity-email {
  font-size: var(--text-xs);
  overflow-wrap: anywhere;
  color: var(--text-muted);
}

.account__divider {
  /* `flex-shrink: 0` é obrigatório aqui: o menu tem `max-height` com rolagem,
     e como o conteúdo transborda, os itens flex encolhem — uma linha de 1px
     colapsava para 0 e o divisor simplesmente não aparecia. */
  flex-shrink: 0;
  height: 1px;
  background-color: var(--border);
  border: 0;
}
</style>
