<!--
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2026-02-08 16:48:41
 * @FilePath: \src\views\effects\diffusionPoint.vue
 * @Description: 
-->
<template>
  <div class="effect-panel">
    <h3>动态扩散点</h3>
    <el-button @click="toggleEffect">切换显示</el-button>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { useCesiumStore } from '@/store/cesiumStore';
import * as Cesium from 'cesium';
import { EllipsoidFadeMaterialProperty } from '@/utils/cesium/EllipsoidFadeMaterialProperty';

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
      semiMajorAxis: 2000.0,
      semiMinorAxis: 2000.0,
      height: 10,
      material: new EllipsoidFadeMaterialProperty(Cesium.Color.RED, 3000)
    }
  });

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(114.3055, 30.5928, 5000)
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
