<!--
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2026-02-06 21:15:36
 * @FilePath: \src\views\models\primitiveMassive.vue
 * @Description: 
-->
<!--
 * @Title: Primitive加载大量模型
 * @Description: 使用ModelInstanceCollection加载大量同类模型
-->
<template>
  <div class="absolute top-4 left-4 bg-white p-4 rounded shadow z-10">
    <div class="mb-4 font-bold border-b pb-2">大量模型实例化</div>
    <div class="text-xs text-gray-500 mb-2">
      使用 PrimitiveCollection 渲染 1000 个实例（全球分布）
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from "vue";
import { useCesiumStore } from "@/store/cesiumStore";
import * as Cesium from "cesium";
import { useCesiumCleanup } from "@/hooks/useCesiumCleanup";

let viewer = null;
let primitiveCollection = null;
const modelUrl = "https://data.mars3d.cn/gltf/mars/feiji.glb";

onMounted(async () => {
  const store = useCesiumStore();
  viewer = store.viewer;
  if (!viewer) return;

  const instances = [];
  const count = 1000;

  for (let i = 0; i < count; i++) {
    const lon = Math.random() * 360 - 180;
    const lat = Math.random() * 180 - 90;
    const height = 1000 + Math.random() * 5000;

    const position = Cesium.Cartesian3.fromDegrees(lon, lat, height);
    const heading = Math.random() * Cesium.Math.TWO_PI;
    const hpr = new Cesium.HeadingPitchRoll(heading, 0, 0);
    const modelMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(
      position,
      hpr,
    );

    // 随机缩放
    const scale = 1.0 + Math.random() * 2.0;
    Cesium.Matrix4.multiplyByUniformScale(modelMatrix, scale, modelMatrix);

    instances.push({
      modelMatrix: modelMatrix,
    });
  }

  try {
    primitiveCollection = new Cesium.PrimitiveCollection();
    viewer.scene.primitives.add(primitiveCollection);

    // 批量创建模型
    // 为了防止瞬间卡顿，可以使用 batch 或者 Promise.all，但这里直接循环即可，Cesium 会处理资源缓存
    for (const instance of instances) {
      Cesium.Model.fromGltfAsync({
        url: modelUrl,
        modelMatrix: instance.modelMatrix,
        scale: 2.0, // 固定或随机缩放
        minimumPixelSize: 128, // 保证在远距离也能看到模型
        maximumScale: 20000, // 防止近距离过大
      })
        .then((model) => {
          primitiveCollection.add(model);
        })
        .catch((error) => {
          console.error("Failed to load model instance:", error);
        });
    }

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(110, 30, 10000000), // 视角拉高看地球全貌
      duration: 0, // 瞬间到达
    });
  } catch (error) {
    console.error("Failed to create models:", error);
  }
});

useCesiumCleanup(() => {
  if (viewer && primitiveCollection) {
    viewer.scene.primitives.remove(primitiveCollection);
  }
});
</script>
