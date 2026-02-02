/*
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2026-02-02 15:54:33
 * @FilePath: \src\main.js
 * @Description
 */
import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import router from './router'
import i18n from './locales'
import * as Cesium from 'cesium'
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI4YzU4N2MwOC02MTUxLTQ3ZDMtYTQ1Ny00Zjg0ZWI3ZDgzZmYiLCJpZCI6ODMyODUsImlhdCI6MTc1NDgyMDgzMn0.7S4PSXh39uNbpQcnuFDWv3s9-t1bqT2xvw9bTIab7jo'



import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import { createPinia } from 'pinia'

const app = createApp(App)
const pinia = createPinia()

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(pinia)
app.use(ElementPlus)
app.use(router)
app.use(i18n)
app.mount('#app')
