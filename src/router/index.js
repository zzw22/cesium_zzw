/*
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2025-12-26 21:34:39
 * @FilePath: \src\router\index.js
 * @Description: 
 */
import { createRouter, createWebHistory } from 'vue-router'
import Layout from '../layout/index.vue'
import Login from '../views/Login.vue'
import Home from '../views/Home.vue'
import UserManagement from '../views/UserManagement.vue'
import RoleManagement from '../views/RoleManagement.vue'
import MenuManagement from '../views/MenuManagement.vue'
import ProjectManagement from '../views/ProjectManagement.vue'
import DataAnalysis from '../views/DataAnalysis.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: Layout,
    children: [
      { 
        path: '', 
        name: 'Home', 
        component: Home, 
        meta: { title: 'menu.home', icon: 'House' } 
      },
      {
        path: '/system',
        meta: { title: 'menu.system', icon: 'Setting' },
        children: [
          { path: '/user-management', name: 'UserManagement', component: UserManagement, meta: { title: 'menu.user' } },
          { path: '/role-management', name: 'RoleManagement', component: RoleManagement, meta: { title: 'menu.role' } },
          { path: '/menu-management', name: 'MenuManagement', component: MenuManagement, meta: { title: 'menu.menu' } }
        ]
      },
      { 
        path: '/project-management', 
        name: 'ProjectManagement', 
        component: ProjectManagement, 
        meta: { title: 'menu.project', icon: 'Document' } 
      },
      { 
        path: '/data-analysis', 
        name: 'DataAnalysis', 
        component: DataAnalysis, 
        meta: { title: 'menu.analysis', icon: 'DataBoard' } 
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const tokenExpiry = localStorage.getItem('tokenExpiry')
  const now = Date.now()

  const isAuthenticated = token && tokenExpiry && parseInt(tokenExpiry) > now

  if (to.path === '/login') {
    if (isAuthenticated) {
      next('/')
    } else {
      next()
    }
  } else {
    if (isAuthenticated) {
      next()
    } else {
      // Clear potentially invalid token
      if (token) {
        localStorage.removeItem('token')
        localStorage.removeItem('tokenExpiry')
      }
      next('/login')
    }
  }
})

export default router