/*
 * @Title:
 * @Author: zhangzhiwei
 * @Date: 2025-12-26 21:34:39
 * @FilePath: \src\router\index.js
 * @Description:
 */
import { createRouter, createWebHistory, RouterView } from "vue-router";
import Layout from "../layout/index.vue";
import Login from "../views/Login.vue";
import Home from "../views/Home.vue";
import CesiumViewer from "../views/CesiumViewer.vue";
import BaseEntities from "../views/base/entities.vue";
import BasePosition from "../views/base/position.vue";
import BaseFly from "../views/base/fly.vue";
import BaseSport from "../views/base/sport.vue";
import BaseTip from "../views/base/tip.vue";



const routes = [
  {
    path: "/login",
    name: "Login",
    component: Login,
    meta: { title: "登录" },
  },
  {
    path: "/",
    component: Layout,
    children: [
      {
        path: "",
        name: "Home",
        component: Home,
        meta: { title: "menu.home", icon: "House" },
      },
      {
        path: "/cesium",
        name: "CesiumViewer",
        component: CesiumViewer,
        meta: { title: "menu.cesium", icon: "DataBoard" },
      },
      {
        path: "/base",
        name: "Base",
        component: RouterView,
        meta: { title: "menu.base", icon: "DataBoard" },
        children: [
          {
            path: "/entities",
            name: "BaseEntities",
            component: BaseEntities,
            meta: { title: "menu.baseEntities", icon: "DataBoard" },
          },
          {
            path: "/position",
            name: "BasePosition",
            component: () => import("../views/base/position.vue"),
            meta: { title: "menu.basePosition", icon: "DataBoard" },
          },
          {
            path: "/fly",
            name: "BaseFly",
            component: BaseFly,
            meta: { title: "menu.baseFly", icon: "DataBoard" },
          },
          {
            path: "/sport",
            name: "BaseSport",
            component: () => import("../views/base/sport.vue"),
            meta: { title: "menu.baseSport", icon: "DataBoard" },
          },
          {
            path: "/tip",
            name: "BaseTip",
            component: BaseTip,
            meta: { title: "menu.baseTip", icon: "DataBoard" },
          },
        ],
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
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
      // Clear potentially invalid token
      if (token) {
        localStorage.removeItem("token");
        localStorage.removeItem("tokenExpiry");
      }
      next("/login");
    }
  }
});

export default router;
