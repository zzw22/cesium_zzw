<!--
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2026-02-04 16:55:35
 * @FilePath: \src\views\layers\mkt.vue
 * @Description: 
-->
<template>
  <div class="bg-white h-20"></div>
</template>

<script setup>
import { onMounted } from "vue";
import { useCesiumStore } from "@/store/cesiumStore";
import * as Cesium from "cesium";
let viewer;
const addInfo = () => {
  // 加载xyz
  const xyz = new Cesium.UrlTemplateImageryProvider({
    credit: "mapbox",
    url: "https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.webp?sku=1016Ab1dNMw2X&access_token=pk.eyJ1IjoidHJhbXBqd2wiLCJhIjoiY2xhYXIxbHExMDN3dzN3cGliOHdrMThxMiJ9.6er2aYb1EBjSsK1-t9d2-w",
  });
  viewer.imageryLayers.addImageryProvider(xyz);
};
onMounted(() => {
  viewer = useCesiumStore().viewer;
  if (!viewer) return;
  addInfo();
});

import { useCesiumCleanup } from "@/hooks/useCesiumCleanup";
useCesiumCleanup(() => {
  // 使用 store.resetViewer 统一清理（组件卸载时调用）
});
</script>
