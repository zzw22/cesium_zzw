<!--
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2026-02-02 21:45:15
 * @FilePath: \src\views\base\fly.vue
 * @Description: 
-->
<template>
  <div class="bg-white h-20">
    <div
      class="flex justify-between items-center bg-white rounded-md p-5 z-99 fixed"
    >
      <el-button class="text-lg font-bold" @click="flyTo" type="primary"
        >相机飞行</el-button
      >
      <el-button class="text-lg font-bold" @click="pause" type="primary"
        >暂停</el-button
      >
      <el-button class="text-lg font-bold" @click="resume" type="primary"
        >继续</el-button
      >
      <el-button class="text-lg font-bold" @click="cancel" type="primary"
        >取消</el-button
      >
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch, onUnmounted } from "vue";
import { useCesiumStore } from "@/store/cesiumStore";
import Roaming from "@/utils/roaming";
import * as Cesium from "cesium";
import { useCesiumCleanup } from "@/hooks/useCesiumCleanup";

const roaming = ref(null);
let viewer = null

onMounted(() => {
  viewer = useCesiumStore().viewer;
  if (viewer) {
    roaming.value = new Roaming(viewer, { time: 3 });
  }
  console.log(viewer, 111);
});

const flyTo = () => {
  roaming.value.cameraRoaming([
    Cesium.Cartesian3.fromDegrees(114.3055, 30.5928, 1000),
    Cesium.Cartesian3.fromDegrees(114.7055, 30.5928, 100),
  ]);
};

const pause = () => {
  roaming.value.pauseOrContinue(false);
};

const resume = () => {
  roaming.value.pauseOrContinue(true);
};

const cancel = () => {
  roaming.value.endRoaming();
};

useCesiumCleanup(() => {
  if (roaming.value) {
    roaming.value.endRoaming();
  }
});

</script>
