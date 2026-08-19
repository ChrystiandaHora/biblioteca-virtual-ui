import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import router from './router/index.js'
import './styles/themes.css'
import './styles/base.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
