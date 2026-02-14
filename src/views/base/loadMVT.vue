<!--
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2026-02-13 21:18:48
 * @FilePath: \src\views\base\loadMVT.vue
 * @Description: 
-->
<template>
  <div class="demo_panel">
    <h3 class="demo_title">加载MVT</h3>
  </div>
</template>

<script setup>
import { onMounted, shallowRef } from 'vue';
import { useCesiumStore } from '@/store/cesiumStore';
import * as Cesium from 'cesium';
import { useCesiumCleanup } from '@/hooks/useCesiumCleanup';

let viewer = null;
const imageryLayer = shallowRef(null);

onMounted(() => {
  const store = useCesiumStore();
  viewer = store.viewer;
  if (!viewer) return;

  const provider = new Cesium.UrlTemplateImageryProvider({
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c', 'd'],
    credit: 'Map tiles by CartoDB, under CC BY 3.0. Data by OpenStreetMap, under ODbL.'
  });

  const layer = viewer.imageryLayers.addImageryProvider(provider);
  imageryLayer.value = layer;
  
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(114.3055, 30.5928, 50000), // Wuhan
    duration: 1.5
  });
});

useCesiumCleanup(() => {
  if (viewer && imageryLayer.value) {
    viewer.imageryLayers.remove(imageryLayer.value);
  }
});
</script>
