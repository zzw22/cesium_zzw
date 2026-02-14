<!--
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2026-02-13 21:18:48
 * @FilePath: \src\views\elements\svg.vue
 * @Description: 
-->

<template>
  <div class="demo_panel">
    <h3 class="demo_title">SVG 图标示例</h3>
    <div class="button-group">
      <div class="flex gap-2">
        <el-button size="small" @click="addSvg">添加 SVG</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useCesiumStore } from '@/store/cesiumStore';
import * as Cesium from 'cesium';
import { useCesiumCleanup } from '@/hooks/useCesiumCleanup';

let viewer = null;

onMounted(() => {
  viewer = useCesiumStore().viewer;
});

const addSvg = () => {
  if (!viewer) return;
  
  // 简单的 SVG 字符串
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="30" fill="rgba(255, 0, 0, 0.5)" stroke="red" stroke-width="4"/>
      <text x="32" y="38" font-size="20" text-anchor="middle" fill="white">SVG</text>
    </svg>
  `;
  
  const svgUrl = 'data:image/svg+xml;base64,' + btoa(svgString);

  viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(114.30, 30.60, 100),
    billboard: {
      image: svgUrl,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM
    }
  });

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(114.30, 30.60, 5000)
  });
};

useCesiumCleanup(() => {
  if (viewer) viewer.entities.removeAll();
});
</script>
