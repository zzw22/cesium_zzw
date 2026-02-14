<!--
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2026-02-06 21:15:18
 * @FilePath: \src\views\models\loadModel.vue
 * @Description: 
-->
<template>
  <div class="demo_panel">
    <h3 class="demo_title">加载模型 (Entity)</h3>
    <div class="text-xs text-gray-500 mb-2"></div>
    <div class="flex space-x-2">
      <el-button size="small" type="primary" @click="resetView"
        >重置视角</el-button
      >
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from "vue";
import { useCesiumStore } from "@/store/cesiumStore";
import * as Cesium from "cesium";
import { useCesiumCleanup } from "@/hooks/useCesiumCleanup";

let viewer = null;
let modelEntity = null;
const modelUrl = "https://data.mars3d.cn/gltf/mars/feiji.glb";
const position = Cesium.Cartesian3.fromDegrees(114.3055, 30.5928, 10000);
const heading = Cesium.Math.toRadians(135);
const pitch = 0;
const roll = 0;
const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

const laodData = () => {
  modelEntity = viewer.entities.add({
    name: "飞机模型",
    position: position,
    orientation: orientation,
    model: {
      uri: modelUrl,
      minimumPixelSize: 130,
      maximumScale: 20000,
    },
  });

  viewer.trackedEntity = modelEntity;
};

onMounted(async () => {
  const store = useCesiumStore();
  viewer = store.viewer;
  if (!viewer) return;
  laodData();
});

const resetView = () => {
  if (viewer) {
    // 获取模型当前位置
    if (modelEntity) {
      // 定义初始的观察角度
      const heading = Cesium.Math.toRadians(0); // 正北
      const pitch = Cesium.Math.toRadians(-45); // 俯视45度
      const range = 1000.0; // 距离模型1000米

      // 使用 HeadingPitchRange 封装视角参数
      const hpr = new Cesium.HeadingPitchRange(heading, pitch, range);

      // 执行平滑飞行复原
      viewer.flyTo(modelEntity, {
        duration: 2.0, // 飞行耗时（秒）
        offset: hpr, // 应用视角参数
      });
    }
  }
};

useCesiumCleanup(() => {
  if (viewer) {
    if (modelEntity) {
      viewer.entities.remove(modelEntity);
    }
    viewer.trackedEntity = undefined;
  }
});
</script>
