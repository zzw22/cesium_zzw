<!--
 * @Title: 风力发电机
 * @Description: 加载并播放风力发电机模型动画
-->
<template>
  <div class="absolute top-4 left-4 bg-white p-4 rounded shadow z-10">
    <div class="mb-4 font-bold border-b pb-2">风力发电机</div>
    <div class="text-xs text-gray-500 mb-2">
      展示带动画的风机模型
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useCesiumStore } from '@/store/cesiumStore';
import * as Cesium from 'cesium';
import { useCesiumCleanup } from '@/hooks/useCesiumCleanup';

let viewer = null;
let entity = null;
const modelUrl = 'https://data.mars3d.cn/gltf/mars/fengche.gltf';

const addData = () =>{
  const position = Cesium.Cartesian3.fromDegrees(114.6055, 30.5928, 0);
  const heading = Cesium.Math.toRadians(0);
  const pitch = 0;
  const roll = 0;
  const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
  const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

  entity = viewer.entities.add({
    name: '风力发电机',
    position: position,
    orientation: orientation,
    model: {
      uri: modelUrl,
      minimumPixelSize: 128,
      maximumScale: 20000,
      runAnimations: true, // 自动播放动画
      scale: 5.0
    },
  });
  viewer.trackedEntity = entity;
}

onMounted(() => {
  const store = useCesiumStore();
  viewer = store.viewer;
  if (!viewer) return;
  // 开启场景动画，否则模型动画不会播放
  viewer.clock.shouldAnimate = true;
  
  addData();
  
});

useCesiumCleanup(() => {
  if (viewer) {
    if (entity) {
      viewer.entities.remove(entity);
    }
    viewer.trackedEntity = undefined;
    // 离开时停止动画，节省性能（可选）
    // viewer.clock.shouldAnimate = false; 
  }
});
</script>
