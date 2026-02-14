<!--
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2026-02-02 23:55:22
 * @FilePath: \src\views\base\tip.vue
 * @Description: 
-->
<template>
  <div class="demo_panel">
    <h3 class="demo_title">提示信息</h3>
    <div
      ref="tipRef"
      class="tip-box"
      :class="{ 'tip-hidden': !isVisible, 'tip-visible': isVisible }"
    >
      你好
      <div class="tip-arrow"></div>
    </div>
  </div>
</template>



<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { useCesiumStore } from '@/store/cesiumStore';
import * as Cesium from 'cesium';
import { useCesiumCleanup } from '@/hooks/useCesiumCleanup';

const tipRef = ref(null);
const isVisible = ref(false);

let viewer = null;
let removeListener = null;

const targetPosition = Cesium.Cartesian3.fromDegrees(114.3055, 30.5928, 300);

const updateTipPosition = () => {
  if (!viewer || !tipRef.value) return;
  const canvasPosition = viewer.scene.cartesianToCanvasCoordinates(targetPosition);
  if (!canvasPosition) {
    isVisible.value = false;
    return;
  }
  const occluder = new Cesium.EllipsoidalOccluder(viewer.scene.globe.ellipsoid, viewer.camera.position);
  const isVisiblePosition = occluder.isPointVisible(targetPosition);
  if (!isVisiblePosition) {
    isVisible.value = false;
    return;
  }
  isVisible.value = true;
  tipRef.value.style.left = `${canvasPosition.x}px`;
  tipRef.value.style.top = `${canvasPosition.y}px`;
};

onMounted(() => {
  viewer = useCesiumStore().viewer;
  if (!viewer) return;
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(114.3055, 30.5928, 5000),
    duration: 1.2
  });
  removeListener = viewer.scene.postRender.addEventListener(updateTipPosition);
});

useCesiumCleanup(() => {
  if (removeListener) removeListener();
  if (viewer) {
    viewer.entities.removeAll();
  }
});
</script>

<style scoped>


.tip-box {
  position: absolute;
  background-color: rgba(255, 255, 255, 0.9);
  color: #333;
  font-size: 14px;
  padding: 8px 12px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  pointer-events: auto;
  transform: translate(-50%, -100%);
  transition: opacity 0.3s ease;
}

.tip-hidden {
  opacity: 0;
  pointer-events: none;
}

.tip-visible {
  opacity: 1;
  pointer-events: auto;
}

.tip-arrow {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid rgba(255, 255, 255, 0.9);
  pointer-events: none;
}
</style>