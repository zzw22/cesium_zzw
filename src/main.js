import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import router from './router'
import i18n from './locales'

const app = createApp(App)
app.use(ElementPlus)
app.use(router)
app.use(i18n)
app.mount('#app')
