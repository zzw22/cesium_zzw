<!--
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2026-02-10 14:40:55
 * @FilePath: \src\views\skyBox\baseSkyBox.vue
 * @Description: 基础天空盒
-->
<template>
  <div class="demo_panel">
      <div class="demo_title">基础天空盒</div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { useCesiumStore } from '@/store/cesiumStore';
import * as Cesium from 'cesium';

let viewer;
let originalSkyBox;

const addInfo = () => {
  let skyBoxEntity = new Cesium.SkyBox({
    sources: {
      positiveX: new URL('@/assets/images/skyBoxImgs/tycho2t3_80_px.jpg', import.meta.url).href,
      negativeX: new URL('@/assets/images/skyBoxImgs/tycho2t3_80_mx.jpg', import.meta.url).href,
      positiveY: new URL('@/assets/images/skyBoxImgs/tycho2t3_80_py.jpg', import.meta.url).href,
      negativeY: new URL('@/assets/images/skyBoxImgs/tycho2t3_80_my.jpg', import.meta.url).href,
      positiveZ: new URL('@/assets/images/skyBoxImgs/tycho2t3_80_pz.jpg', import.meta.url).href,
      negativeZ: new URL('@/assets/images/skyBoxImgs/tycho2t3_80_mz.jpg', import.meta.url).href,
    },
  })
  viewer.scene.skyBox = skyBoxEntity;
};

onMounted(() => {
  viewer = useCesiumStore().viewer;
  if (!viewer) return;
  addInfo();
});

onUnmounted(() => {
  if (viewer && !viewer.isDestroyed()) {
    viewer.scene.skyBox = undefined;
  }
});
</script>