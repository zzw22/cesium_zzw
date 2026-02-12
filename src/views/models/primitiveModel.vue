<!--
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2026-02-06 21:15:22
 * @FilePath: \src\views\models\primitiveModel.vue
 * @Description: 
-->
<template>
  <div class="control-panel">
    <div class="panel-title">加载模型 (Primitive)</div>
    <div class="panel-content">
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
let modelPrimitive = null;
const modelUrl = "https://data.mars3d.cn/gltf/mars/feiji.glb";
const position = Cesium.Cartesian3.fromDegrees(114.3055, 30.5928, 5000);

const addData = async () => {
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(position);

  try {
    modelPrimitive = await Cesium.Model.fromGltfAsync({
      url: modelUrl,
      modelMatrix: modelMatrix,
      scale: 10.0,
    });

    viewer.scene.primitives.add(modelPrimitive);

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(114.3055, 30.5028, 15000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-45),
        roll: 0,
      },
    });
  } catch (error) {
    console.error("Failed to load primitive model:", error);
  }
};

const resetView = () => {
  if (viewer && modelPrimitive) {
    // 使用 camera.flyTo 直接设置相机位置
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(114.3055, 30.5028, 15000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-45),
        roll: 0,
      },
      duration: 1.5,
    });
  }
};

onMounted(async () => {
  const store = useCesiumStore();
  viewer = store.viewer;
  if (!viewer) return;
  await addData();
});

useCesiumCleanup(() => {
  if (viewer && modelPrimitive) {
    viewer.scene.primitives.remove(modelPrimitive);
  }
});
</script>

<style scoped>
.control-panel {
  position: absolute;
  top: 16px;
  left: 16px;
  background-color: #ffffff;
  padding: 16px;
  border-radius: 4px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  z-index: 10;
}

.panel-title {
  margin-bottom: 16px;
  font-weight: bold;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 8px;
}

.panel-content {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
}
</style>
