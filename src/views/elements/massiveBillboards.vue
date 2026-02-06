<!--
 * @Title: 海量点 (PointPrimitiveCollection)
 * @Author: zhangzhiwei
 * @Date: 2026-02-06 11:38:00
 * @FilePath: \src\views\elements\massiveBillboards.vue
 * @Description: 
-->
<template>
  <div class="absolute top-4 left-4 bg-white p-4 rounded shadow z-10">
    <div class="mb-2 font-bold">海量点示例 (10000个)</div>
    <div class="flex gap-2">
      <el-button size="small" @click="addMassive">生成点数据</el-button>
      <el-button size="small" type="danger" @click="clear">清除</el-button>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useCesiumStore } from '@/store/cesiumStore';
import * as Cesium from 'cesium';
import { useCesiumCleanup } from '@/hooks/useCesiumCleanup';

let viewer = null;
let pointCollection = null;

onMounted(() => {
  viewer = useCesiumStore().viewer;
});

const addMassive = () => {
  if (!viewer) return;
  clear();

  // 创建点集合
  pointCollection = viewer.scene.primitives.add(new Cesium.PointPrimitiveCollection());

  for (let i = 0; i < 10000; i++) {
    const lon = 114.0 + Math.random();
    const lat = 30.0 + Math.random();
    pointCollection.add({
      position: Cesium.Cartesian3.fromDegrees(lon, lat),
      pixelSize: 4,
      color: Cesium.Color.fromRandom({ alpha: 1.0 }),
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 1
    });
  }

  viewer.camera.flyTo({
    destination: Cesium.Rectangle.fromDegrees(114.0, 30.0, 115.0, 31.0)
  });
};

const clear = () => {
  if (viewer && pointCollection) {
    viewer.scene.primitives.remove(pointCollection);
    pointCollection = null;
  }
};

useCesiumCleanup(() => {
  clear();
});
</script>
