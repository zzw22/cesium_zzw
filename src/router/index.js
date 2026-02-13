/*
 * @Title:
 * @Author: zhangzhiwei
 * @Date: 2025-12-26 21:34:39
 * @FilePath: \src\router\index.js
 * @Description:
 */
import { createRouter, createWebHistory, RouterView } from "vue-router";

import routerItems from "./routerItems.js";



const router = createRouter({
  history: createWebHistory(),
  routes: routerItems,
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("token");
  const tokenExpiry = localStorage.getItem("tokenExpiry");
  const now = Date.now();

  const isAuthenticated = token && tokenExpiry && parseInt(tokenExpiry) > now;

  if (to.path === "/login") {
    if (isAuthenticated) {
      next("/");
    } else {
      next();
    }
  } else {
    if (isAuthenticated) {
      next();
    } else {
      if (token) {
        localStorage.removeItem("token");
        localStorage.removeItem("tokenExpiry");
      }
      next("/login");
    }
  }
});

export default router;
