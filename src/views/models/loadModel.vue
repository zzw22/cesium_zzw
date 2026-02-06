<!--
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2026-02-06 21:15:18
 * @FilePath: \src\views\models\loadModel.vue
 * @Description: 
-->
<template>
  <div class="absolute top-4 left-4 bg-white p-4 rounded shadow z-10">
    <div class="mb-4 font-bold border-b pb-2">加载模型 (Entity)</div>
    <div class="text-xs text-gray-500 mb-2">
    </div>
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

const laodData = () => {
  const position = Cesium.Cartesian3.fromDegrees(114.3055, 30.5928, 10000);
  const heading = Cesium.Math.toRadians(135);
  const pitch = 0;
  const roll = 0;
  const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
  const orientation = Cesium.Transforms.headingPitchRollQuaternion(
    position,
    hpr,
  );

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
  if (viewer && modelEntity) {
    viewer.trackedEntity = modelEntity;
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
