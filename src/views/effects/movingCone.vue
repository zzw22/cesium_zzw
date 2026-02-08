<template>
  <div class="effect-panel">
    <h3>自动移动的圆锥体</h3>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { useCesiumStore } from '@/store/cesiumStore';
import * as Cesium from 'cesium';

const store = useCesiumStore();
let entity = null;
let originalClockViewModel = null;

onMounted(() => {
  const viewer = store.viewer;
  if (!viewer) return;

  // Save original clock settings
  originalClockViewModel = {
    startTime: viewer.clock.startTime.clone(),
    stopTime: viewer.clock.stopTime.clone(),
    currentTime: viewer.clock.currentTime.clone(),
    clockRange: viewer.clock.clockRange,
    multiplier: viewer.clock.multiplier,
    shouldAnimate: viewer.clock.shouldAnimate
  };

  const start = Cesium.JulianDate.now();
  const stop = Cesium.JulianDate.addSeconds(start, 360, new Cesium.JulianDate());

  // Set time
  viewer.clock.startTime = start.clone();
  viewer.clock.stopTime = stop.clone();
  viewer.clock.currentTime = start.clone();
  viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
  viewer.clock.multiplier = 10;
  viewer.clock.shouldAnimate = true;

  // Calculate path
  const property = new Cesium.SampledPositionProperty();
  
  // Circular motion
  for (let i = 0; i <= 360; i += 10) {
      const time = Cesium.JulianDate.addSeconds(start, i, new Cesium.JulianDate());
      const radians = Cesium.Math.toRadians(i);
      // Use proper ENU offset
      const center = Cesium.Cartesian3.fromDegrees(114.3055, 30.5928);
      const offset = new Cesium.Cartesian3(Math.cos(radians) * 2000, Math.sin(radians) * 2000, 500); // 2km radius
      
      const transform = Cesium.Transforms.eastNorthUpToFixedFrame(center);
      const pos = Cesium.Matrix4.multiplyByPoint(transform, offset, new Cesium.Cartesian3());
      
      property.addSample(time, pos);
  }

  entity = viewer.entities.add({
      position: property,
      orientation: new Cesium.VelocityOrientationProperty(property),
      cylinder: {
          length: 400,
          topRadius: 0,
          bottomRadius: 200,
          material: new Cesium.ColorMaterialProperty(new Cesium.CallbackProperty((time) => {
              // Pulse effect
              const tick = Cesium.JulianDate.secondsDifference(time, start);
              const alpha = (Math.sin(tick * 5.0) + 1.0) / 2.0 * 0.6 + 0.2;
              return Cesium.Color.YELLOW.withAlpha(alpha);
          }, false))
      },

  });

  viewer.trackedEntity = entity;
});

onUnmounted(() => {
  const viewer = store.viewer;
  if (viewer) {
    if (entity) {
      viewer.entities.remove(entity);
    }
    viewer.trackedEntity = undefined;
    
    // Restore clock
    if (originalClockViewModel) {
        viewer.clock.startTime = originalClockViewModel.startTime;
        viewer.clock.stopTime = originalClockViewModel.stopTime;
        viewer.clock.currentTime = originalClockViewModel.currentTime;
        viewer.clock.clockRange = originalClockViewModel.clockRange;
        viewer.clock.multiplier = originalClockViewModel.multiplier;
        viewer.clock.shouldAnimate = originalClockViewModel.shouldAnimate;
    }
  }
});
</script>

<style scoped>
.effect-panel {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(255, 255, 255, 0.9);
  padding: 10px;
  border-radius: 4px;
}
</style>
