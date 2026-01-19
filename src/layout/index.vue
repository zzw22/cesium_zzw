<!--
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2025-12-26 21:34:21
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
          'bg-white dark:bg-gray-800 text-gray-800 dark:text-white transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'w-12' : 'w-48',
        ]"
      >
        <el-menu
          default-active="1"
          class="h-full bg-white flex-direction-column dark:bg-gray-800 border-none !w-[100%]"
          router
          :collapse="sidebarCollapsed"
        >
          <header class="bg-white dark:bg-gray-800 py-3 px-4">
            <h1
              class="text-xl font-bold text-gray-800 dark:text-white flex items-center"
            >
              <img
                src="@/assets/comments/header_logo.svg"
                alt="logo"
                class="w-8 h-8 mr-2"
              />
              <span
                v-show="!sidebarCollapsed"
                class="text-[16px] font-bold text-gray-800 dark:text-white"
                >Vue3 Admin</span
              >
            </h1>
          </header>
          <div class="flex-1 overflow-y-auto">
            <el-menu-item index="/">
              <el-icon><House /></el-icon>
              <span v-show="!sidebarCollapsed">{{ t("menu.home") }}</span>
            </el-menu-item>
            <el-sub-menu index="2">
              <template #title>
                <el-icon><Setting /></el-icon>
                <span v-show="!sidebarCollapsed">{{ t("menu.system") }}</span>
              </template>
              <el-menu-item index="/user-management">{{
                t("menu.user")
              }}</el-menu-item>
              <el-menu-item index="/role-management">{{
                t("menu.role")
              }}</el-menu-item>
              <el-menu-item index="/menu-management">{{
                t("menu.menu")
              }}</el-menu-item>
            </el-sub-menu>
            <el-menu-item index="/project-management">
              <el-icon><Document /></el-icon>
              <span v-show="!sidebarCollapsed">{{ t("menu.project") }}</span>
            </el-menu-item>
            <el-menu-item index="/data-analysis">
              <el-icon><DataBoard /></el-icon>
              <span v-show="!sidebarCollapsed">{{ t("menu.analysis") }}</span>
            </el-menu-item>
          </div>
        </el-menu>
      </aside>
      <div
        class="flex flex-col transition-all duration-300 ease-in-out flex-1 min-w-0"
      >
        <header
          class="bg-white dark:bg-gray-800 flex flex-col px-4 transition-colors duration-300"
        >
          <!-- 面包屑导航 -->
          <div
            class="flex items-center h-12 border-b border-gray-200 dark:border-gray-700 w-full"
          >
            <button
              @click="toggleSidebar"
              class="mr-4 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white flex items-center"
            >
              <el-icon v-if="sidebarCollapsed"><Expand /></el-icon>
              <el-icon v-else><Fold /></el-icon>
            </button>
            <el-breadcrumb separator="/">
              <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
                <span class="text-[17px] dark:text-gray-300">{{
                  t(item.title)
                }}</span>
              </el-breadcrumb-item>
            </el-breadcrumb>

            <div class="flex-1"></div>

            <div class="flex items-center space-x-4 mr-4">
              <span
                class="cursor-pointer flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
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
                  class="cursor-pointer flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
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
          class="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-6 w-full transition-colors duration-300"
        >
          <router-view />
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useRoute } from "vue-router";
import {
  User,
  House,
  Setting,
  Document,
  DataBoard,
  Menu,
  Fold,
  Expand,
  ArrowDown,
  Moon,
  Sunny,
  FullScreen,
} from "@element-plus/icons-vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useDark, useFullscreen } from "@vueuse/core";
import fullScreenImg from "@/assets/comments/full_screen.svg";
import unFullScreenImg from "@/assets/comments/unfull_screen.svg";

const router = useRouter();
const route = useRoute();
const { t, locale } = useI18n();
const isDark = useDark();
const { isFullscreen, toggle } = useFullscreen();

// Get routes for menu
const menuRoutes = computed(() => {
  const layoutRoute = router.options.routes.find((r) => r.path === "/");
  if (layoutRoute && layoutRoute.children) {
    return layoutRoute.children;
  }
  return [];
});



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
  const validRoutes = matched.filter(item => item.meta && item.meta.title);
  
  // 生成面包屑数组
  validRoutes.forEach(item => {
    crumbs.push({
      title: item.meta.title,
      path: item.path
    });
  });
  
  // 确保始终包含首页
  if (crumbs.length === 0 || crumbs[0].path !== '') {
    crumbs.unshift({
      title: 'menu.home',
      path: ''
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
    (view) => view.path !== tag.path
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
  { immediate: true }
);
</script>

<style scoped>
.el-menu {
  display: flex;
  flex-direction: column;
}
.el-menu-item {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

/* 所有菜单项和子菜单标题背景色为白色 */
:deep(.el-menu-item),
:deep(.el-sub-menu__title),
:deep(.el-sub-menu__title:hover),
:deep(.el-menu-item:hover),
:deep(.el-sub-menu.is-active > .el-sub-menu__title),
:deep(.el-menu-item.is-active) {
  background-color: white !important;
}

.dark :deep(.el-menu-item),
.dark :deep(.el-sub-menu__title),
.dark :deep(.el-sub-menu__title:hover),
.dark :deep(.el-menu-item:hover),
.dark :deep(.el-sub-menu.is-active > .el-sub-menu__title),
.dark :deep(.el-menu-item.is-active) {
  background-color: #1e293b !important;
}

/* 只有子菜单下的菜单项使用浅色背景 */
:deep(.el-sub-menu .el-menu-item),
:deep(.el-sub-menu .el-menu-item:hover),
:deep(.el-sub-menu .el-menu-item.is-active) {
  background-color: #00000005 !important;
}

.dark :deep(.el-sub-menu .el-menu-item),
.dark :deep(.el-sub-menu .el-menu-item:hover),
.dark :deep(.el-sub-menu .el-menu-item.is-active) {
  background-color: rgb(0, 12, 23) !important;
}
</style>
