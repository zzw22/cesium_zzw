<script setup>
import * as Cesium from 'cesium';
import { onMounted, ref, onUnmounted } from 'vue';
import { useCesiumStore } from '@/store/cesiumStore';

const cesiumContainer = ref(null);
const cesiumStore = useCesiumStore();
let viewer = null;

onMounted(() => {
  if (!cesiumContainer.value) return;
  
  viewer = new Cesium.Viewer(cesiumContainer.value, {
    animation: false, // 隐藏动画控件
    timeline: false, // 隐藏时间轴控件
    infoBox: false, // 隐藏信息框
    geocoder: false, // 隐藏地理编码搜索框
    homeButton: false, // 隐藏首页按钮
    sceneModePicker: false, // 隐藏场景模式选择器
    baseLayerPicker: false, // 隐藏图层选择器
    navigationHelpButton: false, // 隐藏导航帮助按钮
  });
  
  // 隐藏版权信息
  viewer._cesiumWidget._creditContainer.style.display = "none";
  
  // 将 viewer 实例存入 Store
  cesiumStore.setViewer(viewer);
}) 

onUnmounted(() => {
  if (viewer) {
    viewer.destroy();
    viewer = null;
    cesiumStore.setViewer(null);
  }
});
</script>

<template>
  <div ref="cesiumContainer" class="cesium-container"></div>
</template>

<style scoped>
.cesium-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
