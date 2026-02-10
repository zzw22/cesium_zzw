<!--
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2026-02-02 16:48:30
 * @FilePath: \src\layout\index.vue
 * @Description: 
-->

<template>
  <div class="h-screen flex flex-col">
    <!-- Header -->

    <!-- Main Content -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar -->
      <aside
        :class="[
          'layout-sidebar',
          sidebarCollapsed ? 'layout-sidebar--collapsed' : 'layout-sidebar--expanded',
        ]"
      >
        <el-menu
          default-active="1"
          class="layout-menu"
          router
          :collapse="sidebarCollapsed"
        >
          <header class="layout-menu-header">
            <h1 class="layout-logo">
              <img
                src="@/assets/comments/header_logo.svg"
                alt="logo"
                class="w-8 h-8 mr-2"
              />
              <span
                v-show="!sidebarCollapsed"
                class="layout-logo-text"
                >Vue3 Admin</span
              >
            </h1>
          </header>
          <div class="flex-1 overflow-y-auto">
            <template v-for="item in menuRoutes" :key="item.path">
              <!-- Check if the item has children -->
              <el-sub-menu
                v-if="item.children && item.children.length > 0"
                :index="item.path"
              >
                <template #title>
                  <el-icon v-if="item.meta && item.meta.icon">
                    <component :is="item.meta.icon" />
                  </el-icon>
                  <span v-show="!sidebarCollapsed">{{
                    t(item.meta.title)
                  }}</span>
                </template>
                <el-menu-item
                  v-for="child in item.children"
                  :key="child.path"
                  :index="child.path"
                >
                  <span v-show="!sidebarCollapsed">{{
                    t(child.meta.title)
                  }}</span>
                </el-menu-item>
              </el-sub-menu>

              <!-- If no children, render as a regular menu item -->
              <el-menu-item v-else :index="resolvePath(item.path)">
                <el-icon v-if="item.meta && item.meta.icon">
                  <component :is="item.meta.icon" />
                </el-icon>
                <span v-show="!sidebarCollapsed">{{ t(item.meta.title) }}</span>
              </el-menu-item>
            </template>
          </div>
        </el-menu>
      </aside>
      <div
        class="relative flex flex-col transition-all duration-300 ease-in-out flex-1 min-w-0"
      >
        <header
          class="layout-topbar"
        >
          <!-- 面包屑导航 -->
          <div
            class="layout-breadcrumb-row"
          >
            <button
              @click="toggleSidebar"
              class="layout-icon-button"
            >
              <el-icon v-if="sidebarCollapsed"><Expand /></el-icon>
              <el-icon v-else><Fold /></el-icon>
            </button>
            <el-breadcrumb separator="/">
              <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
                <span class="layout-breadcrumb-text">{{
                  t(item.title)
                }}</span>
              </el-breadcrumb-item>
            </el-breadcrumb>

            <div class="flex-1"></div>

            <div class="layout-actions">
           <el-autocomplete
                v-model="searchText"
                :fetch-suggestions="querySearch"
                placeholder="请输入功能名称"
                class="layout-search"
                @select="handleSelect"
                :trigger-on-focus="false"
                clearable
              >
                <template #suffix>
                  <el-icon class="el-input__icon"><Search /></el-icon>
                </template>
                <template #default="{ item }">
                  <div class="value">{{ item.value }}</div>
                </template>
              </el-autocomplete>
              <span
                class="layout-action"
                @click="toggle"
              >
                <img
                  :src="isFullscreen ? unFullScreenImg : fullScreenImg"
                  class="w-4 h-4"
                  alt="fullscreen"
                />
              </span>
              <el-switch
                v-model="isDark"
                inline-prompt
                :active-icon="Moon"
                :inactive-icon="Sunny"
              />
              <el-dropdown @command="toggleLanguage">
                <span
                  class="layout-action"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                    />
                  </svg>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="zh">中文</el-dropdown-item>
                    <el-dropdown-item command="en">English</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>

            <el-dropdown trigger="click" @command="handleCommand">
              <span
                class="el-dropdown-link cursor-pointer flex items-center outline-none"
              >
                <el-avatar :size="32" class="mr-2 bg-emerald-500">A</el-avatar>
                <span class="mr-1">Admin</span>
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="logout">{{
                    t("common.logout")
                  }}</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
          <!-- 标签页 -->
          <div class="flex items-center h-9 mt-1">
            <el-tag
              v-for="tag in visitedViews"
              :key="tag.path"
              :closable="visitedViews.length > 1"
              :type="isActive(tag) ? '' : 'info'"
              @click="$router.push(tag.path)"
              @close="closeTag(tag)"
              class="mr-2 cursor-pointer px-3 py-1 mb-1"
              size="large"
            >
              {{ t(tag.title) }}
            </el-tag>
          </div>
        </header>
        <!-- Content Area -->
        <main
          class="relative z-10 flex-1 bg-transparent w-full transition-colors duration-300 pointer-events-none overflow-hidden"
        >
        <CesiumComponent class="absolute inset-0 z-0 pointer-events-auto" />
          <router-view v-slot="{ Component }">
            <component
              :is="Component"
              class="pointer-events-auto"
            />
          </router-view>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Expand, Fold, Moon, Sunny, Search } from "@element-plus/icons-vue";
import { useI18n } from "vue-i18n";
import CesiumComponent from "@/components/cesiumCom/index.vue";

import { useFullscreen } from "@vueuse/core";
import { useTheme } from "@/hooks/useTheme";
import fullScreenImg from "@/assets/comments/full_screen.svg";
import unFullScreenImg from "@/assets/comments/unfull_screen.svg";

const router = useRouter();
const route = useRoute();
const { t, locale } = useI18n();
const { isDark } = useTheme();
const { isFullscreen, toggle } = useFullscreen();

// Helper to resolve path for menu index
const resolvePath = (routePath) => {
  if (routePath === "") return "/";
  return routePath;
};

// Get routes for menu
const menuRoutes = computed(() => {
  const layoutRoute = router.options.routes.find((r) => r.path === "/");
  if (layoutRoute && layoutRoute.children) {
    return layoutRoute.children;
  }
  return [];
});

// 功能搜索逻辑
const searchText = ref("");

const allRoutes = computed(() => {
  const options = [];
  
  const traverse = (routes) => {
    routes.forEach(route => {
      let path = route.path;
      // Handle Home route
      if (path === "") path = "/";
      
      if (route.meta && route.meta.title) {
        options.push({
          value: t(route.meta.title),
          path: path
        });
      }
      
      if (route.children && route.children.length > 0) {
        traverse(route.children);
      }
    });
  };
  
  if (menuRoutes.value) {
    traverse(menuRoutes.value);
  }
  return options;
});

const querySearch = (queryString, cb) => {
  const results = queryString
    ? allRoutes.value.filter(createFilter(queryString))
    : allRoutes.value;
  cb(results);
};

const createFilter = (queryString) => {
  return (item) => {
    return (
      item.value.toLowerCase().indexOf(queryString.toLowerCase()) !== -1
    );
  };
};

const handleSelect = (item) => {
  if (item.path) {
    router.push(item.path);
    searchText.value = ""; 
  }
};

const sidebarCollapsed = ref(false);
const visitedViews = ref([]);

const toggleLanguage = (lang) => {
  locale.value = lang;
  localStorage.setItem("language", lang);
};

// 面包屑导航
const breadcrumbs = computed(() => {
  const crumbs = [];

  // 从根路由开始，获取完整的路由层级
  const matched = route.matched;

  // 过滤掉没有meta.title的路由
  const validRoutes = matched.filter((item) => item.meta && item.meta.title);

  // 生成面包屑数组
  validRoutes.forEach((item) => {
    crumbs.push({
      title: item.meta.title,
      path: item.path,
    });
  });

  // 确保始终包含首页
  if (crumbs.length === 0 || crumbs[0].path !== "") {
    crumbs.unshift({
      title: "menu.home",
      path: "",
    });
  }

  return crumbs;
});

// 添加访问的页面到标签页
const addVisitedView = () => {
  const { path, meta } = route;
  if (
    meta &&
    meta.title &&
    !visitedViews.value.some((view) => view.path === path)
  ) {
    visitedViews.value.push({
      title: meta.title,
      path: path,
    });
  }
};

// 关闭标签页
const closeTag = (tag) => {
  visitedViews.value = visitedViews.value.filter(
    (view) => view.path !== tag.path,
  );
  if (isActive(tag)) {
    const latestView = visitedViews.value.slice(-1)[0];
    if (latestView) {
      $router.push(latestView.path);
    }
  }
};

// 判断标签页是否激活
const isActive = (tag) => {
  return tag.path === route.path;
};

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
};

const handleCommand = (command) => {
  if (command === "logout") {
    localStorage.removeItem("token");
    localStorage.removeItem("tokenExpiry");
    router.push("/login");
  }
};

// 监听路由变化
watch(
  route,
  () => {
    addVisitedView();
  },
  { immediate: true },
);
</script>

<style scoped>
.layout-sidebar {
  background: #ffffff;
  color: #1f2937;
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.dark .layout-sidebar {
  background: #1f2937;
  color: #ffffff;
}

.layout-sidebar--collapsed {
  width: 3rem;
}

.layout-sidebar--expanded {
  width: 12rem;
}

.layout-menu {
  height: 100%;
  width: 100%;
  border-right: none;
  background: transparent;
  display: flex;
  flex-direction: column;
}

.layout-menu-header {
  background: transparent;
  padding: 0.75rem 1rem;
}

.layout-logo {
  display: flex;
  align-items: center;
  font-size: 1.25rem;
  line-height: 1.75rem;
  font-weight: 700;
}

.layout-logo-text {
  font-size: 16px;
  font-weight: 700;
}

.layout-topbar {
  position: relative;
  z-index: 10;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  padding: 0 1rem;
  transition: background-color 300ms;
}

.dark .layout-topbar {
  background: #1f2937;
}

.layout-breadcrumb-row {
  display: flex;
  align-items: center;
  height: 3rem;
  width: 100%;
  border-bottom: 1px solid #e5e7eb;
}

.dark .layout-breadcrumb-row {
  border-bottom-color: #374151;
}

.layout-icon-button {
  margin-right: 1rem;
  color: #4b5563;
  display: inline-flex;
  align-items: center;
}

.layout-icon-button:hover {
  color: #111827;
}

.dark .layout-icon-button {
  color: #d1d5db;
}

.dark .layout-icon-button:hover {
  color: #ffffff;
}

.layout-breadcrumb-text {
  font-size: 17px;
}

.dark .layout-breadcrumb-text {
  color: #d1d5db;
}

.layout-actions {
  display: flex;
  align-items: center;
  column-gap: 1rem;
  margin-right: 1rem;
}

.layout-action {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  color: #4b5563;
}

.layout-action:hover {
  color: #111827;
}

.dark .layout-action {
  color: #d1d5db;
}

.dark .layout-action:hover {
  color: #ffffff;
}

.el-menu {
  display: flex;
  flex-direction: column;
}
.el-menu-item {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.layout-search {
  width: 200px;
  transition: width 0.3s;
}

.layout-search:focus-within {
  width: 300px;
}
</style>
