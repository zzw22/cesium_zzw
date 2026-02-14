<!--
 * @Title: 图标 (Billboard)
 * @Description: 演示使用 Billboard 加载图标和 PinBuilder
-->
<template>
  <div class="demo_panel">
    <div class="demo_title">图标示例</div>
    <div class="button-group">
      <el-button size="small" @click="addBillboard">添加图标</el-button>
      <el-button size="small" @click="addPin">添加 Pin</el-button>
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

onMounted(() => {
  viewer = useCesiumStore().viewer;
});

const addBillboard = () => {
  if (!viewer) return;
  viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(114.30, 30.60, 100),
    billboard: {
      image: Cesium.buildModuleUrl('Assets/Textures/waterNormals.jpg'), // 使用内置资源演示
      width: 32,
      height: 32,
      color: Cesium.Color.CYAN,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM
    }
  });
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(114.30, 30.60, 5000)
  });
};

const addPin = () => {
  if (!viewer) return;
  const pinBuilder = new Cesium.PinBuilder();
  viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(114.35, 30.60, 100),
    billboard: {
      image: pinBuilder.fromText('?', Cesium.Color.BLACK, 48).toDataURL(),
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM
    }
  });
};

const clear = () => {
  if (viewer) viewer.entities.removeAll();
};

useCesiumCleanup(() => {
  if (viewer) viewer.entities.removeAll();
});
</script>
