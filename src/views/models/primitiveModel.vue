<!--
 * @Title: 加载Primitive模型
 * @Description: 使用Primitive API加载glTF模型
-->
<template>
  <div class="absolute top-4 left-4 bg-white p-4 rounded shadow z-10">
    <div class="mb-4 font-bold border-b pb-2">加载模型 (Primitive)</div>
    <div class="text-xs text-gray-500 mb-2"></div>
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

const addData = async () => {
  const position = Cesium.Cartesian3.fromDegrees(114.3055, 30.5928, 5000);
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
