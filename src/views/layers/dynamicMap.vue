<!--
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2026-02-04 17:09:51
 * @FilePath: \src\views\layers\dynamicMap.vue
 * @Description: 
-->
<template>
  <div class="demo_panel">
    <h3 class="demo_title">动态地图示例</h3>
    <div class="button-group">
      <div class="flex gap-2">
        <el-button
          type="primary"
          size="small"
          @click="openTimeMap"
          :disabled="isPlaying"
          >开始播放</el-button
        >
        <el-button
          type="danger"
          size="small"
          @click="closeTimeMap"
          :disabled="!isPlaying"
          >停止播放</el-button
        >
      </div>
    </div>
    <div class="mt-2 text-sm text-gray-600">
      当前帧: {{ currentIndex + 1 }} / {{ totalFrames }}
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, onUnmounted } from "vue";
import { useCesiumStore } from "@/store/cesiumStore";
import * as Cesium from "cesium";
import { useCesiumCleanup } from "@/hooks/useCesiumCleanup";

// 使用 import.meta.glob 动态导入图片资源
const images = import.meta.glob("@/assets/images/timeMap/*.png", {
  eager: true,
  as: "url",
});
// 转换为数组并排序
const urlArr = Object.values(images).sort();

let viewer = null;
const arrTileLayer = [];
let mapTimer = null;
const isPlaying = ref(false);
const currentIndex = ref(0);
const totalFrames = ref(urlArr.length);

// 初始化地图图层
async function initTimeMap() {
  if (!viewer) return;

  // 清理现有图层（如果有）
  clearLayers();

  const rectangle = Cesium.Rectangle.fromDegrees(
    63.8148899733,
    12.7700338517,
    143.536486117,
    56.3833398551,
  );

  try {
    const promises = urlArr.map((url) =>
      Cesium.SingleTileImageryProvider.fromUrl(url, {
        rectangle: rectangle,
      }),
    );

    const providers = await Promise.all(promises);

    providers.forEach((imageryProvider) => {
      const imageryLayer = new Cesium.ImageryLayer(imageryProvider, {
        alpha: 0, // 初始不可见
      });
      viewer.imageryLayers.add(imageryLayer);
      arrTileLayer.push(imageryLayer);
    });

    // 定位到区域
    viewer.camera.flyTo({
      destination: rectangle,
    });
  } catch (error) {
    console.error("Failed to load time map images:", error);
  }
}

function openTimeMap() {
  if (isPlaying.value) return;

  closeTimeMap(); // 确保之前的定时器清除
  isPlaying.value = true;

  mapTimer = setInterval(() => {
    let nextIndex = currentIndex.value + 1;
    if (nextIndex >= arrTileLayer.length) {
      nextIndex = 0;
    }

    const prevLayer = arrTileLayer[currentIndex.value];
    const nextLayer = arrTileLayer[nextIndex];

    if (prevLayer) prevLayer.alpha = 0;
    if (nextLayer) nextLayer.alpha = 1;

    currentIndex.value = nextIndex;
  }, 300); // 300ms 一帧
}

function closeTimeMap() {
  if (mapTimer) {
    clearInterval(mapTimer);
    mapTimer = null;
  }
  isPlaying.value = false;

  // 重置状态：隐藏当前帧，重置索引（或者保留在当前帧，这里选择重置为第一帧显示或隐藏）
  // 简单起见，保留当前显示的帧，或者可以全部隐藏
  // 为了用户体验，我们保持暂停时的状态，或者重置到初始状态
  // 这里选择：停止时保持当前画面
}

function clearLayers() {
  if (!viewer) return;
  arrTileLayer.forEach((layer) => {
    viewer.imageryLayers.remove(layer);
  });
  arrTileLayer.length = 0;
}

onMounted(() => {
  viewer = useCesiumStore().viewer;
  if (!viewer) return;
  initTimeMap();
});

// 使用 cleanup hook
useCesiumCleanup(() => {
  closeTimeMap();
  clearLayers();
});
</script>

<style scoped>
.button-group {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
