
<template>
  <div class="absolute top-4 left-4 bg-white p-4 rounded shadow z-10">
    <div class="mb-2 font-bold">SVG 图标示例</div>
    <el-button size="small" @click="addSvg">添加 SVG</el-button>
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
