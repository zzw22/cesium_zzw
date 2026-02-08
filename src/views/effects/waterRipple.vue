<!--
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2026-02-08 16:48:31
 * @FilePath: \src\views\effects\waterRipple.vue
 * @Description: 
-->
<template>
  <div class="effect-panel">
    <h3>水波纹</h3>
    <el-button @click="toggleEffect">切换显示</el-button>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { useCesiumStore } from '@/store/cesiumStore';
import * as Cesium from 'cesium';
import { CircleWaveMaterialProperty } from '@/utils/cesium/CircleWaveMaterialProperty';

const store = useCesiumStore();
let entity = null;

const toggleEffect = () => {
  if (entity) {
    entity.show = !entity.show;
  }
};

onMounted(() => {
  const viewer = store.viewer;
  if (!viewer) return;

  entity = viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(114.3055, 30.5928),
    ellipse: {
      semiMinorAxis: 1000,
      semiMajorAxis: 1000,
      height: 10,
      material: new CircleWaveMaterialProperty({
        color: new Cesium.Color(1.0, 1.0, 0.0, 0.7), // 黄色
        duration: 3000, // 慢速
        count: 4,
        gradient: 0.1
      })
    }
  });

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(114.3055, 30.5928, 2000)
  });
});

onUnmounted(() => {
  const viewer = store.viewer;
  if (viewer && entity) {
    viewer.entities.remove(entity);
  }
});
</script>

<style scoped>
.effect-panel {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(255, 255, 255, 0.9);
  padding: 10px;
  border-radius: 4px;
}
</style>
