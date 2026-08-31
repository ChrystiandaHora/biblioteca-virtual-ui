import { config } from '@fortawesome/fontawesome-svg-core'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import router from './router/index.js'
import './styles/themes.css'
import './styles/base.css'

// O tamanho dos ícones sai dos tokens `--icon-*`, aplicados pelo BaseIcon. Sem
// isto o Font Awesome injeta uma <style> própria no <head> e passa a competir
// com eles.
config.autoAddCss = false

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
