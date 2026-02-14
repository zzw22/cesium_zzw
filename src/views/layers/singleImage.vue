<!--
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2026-02-04 15:52:08
 * @FilePath: \src\views\layers\singleImage.vue
 * @Description: 
-->
<template>
  <div class="demo_panel">
    <h3 class="demo_title">单图加载</h3>
  </div>
</template>

<script setup>
import { onMounted, shallowRef } from "vue";
import { useCesiumStore } from "@/store/cesiumStore";
import * as Cesium from "cesium";
import { useCesiumCleanup } from "@/hooks/useCesiumCleanup";

let viewer = null;
const imageryLayer = shallowRef(null);

async function addImageLayer() {
  try {
    const provider = await Cesium.SingleTileImageryProvider.fromUrl(
      "../../../src/assets/images/world.jpg",
      {
        rectangle: Cesium.Rectangle.fromDegrees(-180, -90, 180, 90),
      },
    );

    imageryLayer.value = viewer.imageryLayers.addImageryProvider(provider);
    // 可选：飞行定位到该图片
    viewer.camera.flyTo({
      destination: Cesium.Rectangle.fromDegrees(110, 30, 120, 40),
    });
  } catch (error) {
    console.error("加载单图失败:", error);
  }
}

onMounted(() => {
  viewer = useCesiumStore().viewer;
  if (!viewer) return;
  addImageLayer();
});

useCesiumCleanup(() => {
  if (viewer && imageryLayer.value) {
    viewer.imageryLayers.remove(imageryLayer.value);
  }
});
</script>
