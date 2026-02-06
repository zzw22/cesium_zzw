<template>
  <div class="relative h-full w-full pointer-events-none" style="pointer-events: none">
    <div
      ref="tipRef"
      class="absolute bg-white/90 text-gray-800 text-sm px-3 py-2 rounded shadow pointer-events-auto"
      :class="{ 'opacity-0': !isVisible, 'opacity-100': isVisible }"
      style="transform: translate(-50%, -100%); pointer-events: auto"
    >
      你好
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
