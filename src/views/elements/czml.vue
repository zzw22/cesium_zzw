<!--
 * @Title: CZML加载示例
 * @Description: 演示加载和播放CZML格式的动画数据
-->
<template>
  <div class="absolute top-4 left-4 bg-white p-4 rounded shadow z-10">
    <div class="mb-4 font-bold border-b pb-2">CZML加载</div>
    <div class="text-xs text-gray-500 mb-2">演示加载本地CZML文件</div>
    <div class="flex space-x-2">
      <el-button size="small" type="primary" @click="resetView"
        >重置视角</el-button
      >
      <el-button size="small" @click="toggleAnimation">{{
        isAnimating ? "暂停" : "播放"
      }}</el-button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, onUnmounted } from "vue";
import { useCesiumStore } from "@/store/cesiumStore";
import * as Cesium from "cesium";
import { useCesiumCleanup } from "@/hooks/useCesiumCleanup";

const isAnimating = ref(true);
let dataSource = null;
let viewer = null;
const wuhanPosition = Cesium.Cartesian3.fromDegrees(114.3055, 30.5928, 9000000);

onMounted(async () => {
  const store = useCesiumStore();
  viewer = store.viewer;

  if (!viewer) return;

  try {
    dataSource = await Cesium.CzmlDataSource.load(
      "/src/assets/modules/wx.czml",
    );
    viewer.dataSources.add(dataSource);
    viewer.clock.shouldAnimate = true;

    // 初始飞向目标
    viewer.camera.flyTo({
      destination: wuhanPosition,
    });
  } catch (error) {
    console.error("Failed to load CZML:", error);
  }
});

const onTick = () => {
  if (viewer) {
    isAnimating.value = viewer.clock.shouldAnimate;
  }
};

const resetView = () => {
  if (viewer) {
    viewer.camera.flyTo({
      destination: wuhanPosition,
    });
  }
};

const toggleAnimation = () => {
  if (viewer) {
    viewer.clock.shouldAnimate = !viewer.clock.shouldAnimate;
    isAnimating.value = viewer.clock.shouldAnimate;
  }
};

useCesiumCleanup(() => {
  if (viewer) {
    if (dataSource) {
      viewer.dataSources.remove(dataSource);
    }
    viewer.clock.onTick.removeEventListener(onTick);
  }
});
</script>
