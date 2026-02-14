<!--
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2026-02-02 15:41:05
 * @FilePath: \src\views\Home.vue
 * @Description: 
-->
<template>
  <div class="home-container">
    <div
      v-for="moduleItem in menuModules"
      :key="moduleItem.path"
      class="module-section"
    >
      <h2 class="module-title">
        {{ $t(moduleItem.meta?.title) || moduleItem.meta?.title }}
      </h2>
      <div class="card-grid">
        <div
          v-for="child in moduleItem.children"
          :key="child.path"
          class="feature-card"
          @click="handleNavigate(child)"
        >
          <div class="image-wrapper">
            <el-image :src="getImageUrl(child)" fit="cover" class="card-image">
              <template #error>
                <div class="image-slot">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
          </div>
          <div class="card-info">
            <span class="card-title">{{
              $t(child.meta?.title) || child.meta?.title
            }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import routerItems from "@/router/routerItems";

const router = useRouter();

const mainImgs = import.meta.glob("@/assets/images/mainImgs/*.png", {
  eager: true,
});

const menuModules = computed(() => {
  const rootRoute = routerItems.find((item) => item.path === "/");
  if (!rootRoute || !rootRoute.children) return [];

  return rootRoute.children.filter((route) => {
    return route.path !== "" && route.children && route.children.length > 0;
  });
});

const getImageUrl = (route) => {
  if (route.img) {
    const imagePath = Object.keys(mainImgs).find((path) =>
      path.endsWith("/" + route.img),
    );
    if (imagePath) return mainImgs[imagePath].default;
  }

  if (!route.meta || !route.meta.title) return "";

  const titleKey = route.meta.title.split(".").pop();

  const imagePath = Object.keys(mainImgs).find((path) => {
    return path.includes(`/${titleKey}.png`);
  });

  return imagePath ? mainImgs[imagePath].default : "";
};

const handleNavigate = (route) => {
  if (route.name) {
    router.push({ name: route.name });
  } else {
    console.warn("Route name missing", route);
  }
};
</script>

<style scoped>
.home-container {
  padding: 20px;
  background-color: #f1f1f1;
  width: -webkit-fill-available;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  overflow: auto;
}

.module-section {
  margin-bottom: 30px;
}

.module-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 15px;
  padding-left: 10px;
  border-left: 4px solid #409eff;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.feature-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.image-wrapper {
  height: 160px;
  width: 100%;
  background-color: #eef1f6;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}

.card-image {
  width: 100%;
  height: 100%;
  display: block;
}

.card-image :deep(.el-image__inner) {
  object-position: left top;
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
  font-size: 30px;
}

.card-info {
  padding: 15px;
  border-top: 1px solid #ebeef5;
}

.card-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  display: block;
  text-align: center;
}
</style>
