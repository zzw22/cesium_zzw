<!--
 * @Title: Mapbox 卫星地图
 * @Author: zhangzhiwei
 * @Date: 2026-02-04
 * @Description: Mapbox 卫星地图示例 - 需要配置密钥
-->
<template>
  <div class="demo_panel">
    <h3 class="demo_title">Mapbox 卫星地图</h3>
    <p class="text-sm text-gray-500">请在 config.js 中配置密钥</p>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useCesiumStore } from "@/store/cesiumStore";
import * as Cesium from "cesium";
import { useCesiumCleanup } from "@/hooks/useCesiumCleanup";

let viewer;

onMounted(() => {
  viewer = useCesiumStore().viewer;
  if (!viewer) return;
  loadMapboxLayer();
});

const loadMapboxLayer = async () => {
  try {
    // 动态加载配置文件（该文件被 .gitignore 忽略）
    const {MAPBOX_TOKEN} = await import("@/token.js");
    
    if (!MAPBOX_TOKEN) {
      console.warn("Mapbox token 未配置");
      return;
    }
    
    const provider = new Cesium.UrlTemplateImageryProvider({
      credit: "Mapbox",
      url: buildMapboxUrl(MAPBOX_TOKEN),
    });
    
    viewer.imageryLayers.addImageryProvider(provider);
  } catch (err) {
    console.error("加载 Mapbox 图层失败:", err);
  }
};

// 构建 Mapbox URL
const buildMapboxUrl = (token) => {
  const params = new URLSearchParams({ access_token: token });
  return `https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.webp?${params}`;
};

useCesiumCleanup(() => {
  // 清理逻辑
});
</script>
