<template>
  <div class="demo_panel">
    <h3 class="demo_title">自动移动的视锥体</h3>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from "vue";
import { useCesiumStore } from "@/store/cesiumStore";
import * as Cesium from "cesium";

const store = useCesiumStore();
let entity = null;
let primitive = null;
let removeListener = null;
let originalClockViewModel = null;

onMounted(() => {
  const viewer = store.viewer;
  if (!viewer) return;

  originalClockViewModel = {
    startTime: viewer.clock.startTime.clone(),
    stopTime: viewer.clock.stopTime.clone(),
    currentTime: viewer.clock.currentTime.clone(),
    clockRange: viewer.clock.clockRange,
    multiplier: viewer.clock.multiplier,
    shouldAnimate: viewer.clock.shouldAnimate,
  };

  const start = Cesium.JulianDate.now();
  const stop = Cesium.JulianDate.addSeconds(
    start,
    360,
    new Cesium.JulianDate(),
  );

  viewer.clock.startTime = start.clone();
  viewer.clock.stopTime = stop.clone();
  viewer.clock.currentTime = start.clone();
  viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
  viewer.clock.multiplier = 10;
  viewer.clock.shouldAnimate = true;

  const property = new Cesium.SampledPositionProperty();
  const center = Cesium.Cartesian3.fromDegrees(114.3055, 30.5928);

  for (let i = 0; i <= 360; i += 10) {
    const time = Cesium.JulianDate.addSeconds(
      start,
      i,
      new Cesium.JulianDate(),
    );
    const radians = Cesium.Math.toRadians(i);

    const offset = new Cesium.Cartesian3(
      Math.cos(radians) * 2000,
      Math.sin(radians) * 2000,
      500,
    );
    const transform = Cesium.Transforms.eastNorthUpToFixedFrame(center);
    const pos = Cesium.Matrix4.multiplyByPoint(
      transform,
      offset,
      new Cesium.Cartesian3(),
    );

    property.addSample(time, pos);
  }

  entity = viewer.entities.add({
    position: property,
    orientation: new Cesium.VelocityOrientationProperty(property),
    box: {
      dimensions: new Cesium.Cartesian3(20, 10, 10),
      material: Cesium.Color.RED,
    },
    path: {
      resolution: 1,
      material: Cesium.Color.CYAN,
      width: 2,
    },
  });

  const scratchCamera = new Cesium.Camera(viewer.scene);
  scratchCamera.frustum.fov = Cesium.Math.toRadians(60.0);
  scratchCamera.frustum.aspectRatio = 1.33;
  scratchCamera.frustum.near = 10.0;
  scratchCamera.frustum.far = 1000.0;

  primitive = new Cesium.DebugCameraPrimitive({
    camera: scratchCamera,
    color: Cesium.Color.CYAN,
  });
  viewer.scene.primitives.add(primitive);

  removeListener = viewer.scene.preUpdate.addEventListener(() => {
    const time = viewer.clock.currentTime;
    const position = property.getValue(time);
    const orientation = entity.orientation.getValue(time);

    if (position && orientation) {
      scratchCamera.position = position;

      // 获取当前位置的地表法向量（指向天空的方向）
      const surfaceNormal =
        Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(position);

      // direction 指向正上方（地表法向量方向的反方向，即天空方向）
      const direction = Cesium.Cartesian3.negate(
        surfaceNormal,
        new Cesium.Cartesian3(),
      );

      // 计算 right 向量：与 direction 垂直，指向运动方向的右侧
      // 使用 entity 的速度方向作为参考
      const velocity = property.getValue(time, new Cesium.Cartesian3());
      let right;
      if (
        velocity &&
        !Cesium.Cartesian3.equalsEpsilon(
          velocity,
          Cesium.Cartesian3.ZERO,
          Cesium.Math.EPSILON10,
        )
      ) {
        const velocityDirection = Cesium.Cartesian3.normalize(
          velocity,
          new Cesium.Cartesian3(),
        );
        // right = direction × velocity（叉乘）
        right = Cesium.Cartesian3.cross(
          direction,
          velocityDirection,
          new Cesium.Cartesian3(),
        );
        if (Cesium.Cartesian3.magnitudeSquared(right) < Cesium.Math.EPSILON10) {
          // 如果 velocity 与 direction 平行，使用默认的东方向
          const east = Cesium.Cartesian3.cross(
            Cesium.Cartesian3.UNIT_Z,
            direction,
            new Cesium.Cartesian3(),
          );
          right = Cesium.Cartesian3.normalize(east, new Cesium.Cartesian3());
        } else {
          Cesium.Cartesian3.normalize(right, right);
        }
      } else {
        // 默认使用东方向
        const east = Cesium.Cartesian3.cross(
          Cesium.Cartesian3.UNIT_Z,
          direction,
          new Cesium.Cartesian3(),
        );
        right = Cesium.Cartesian3.normalize(east, new Cesium.Cartesian3());
      }

      // up = right × direction（确保 up 与 direction 和 right 都垂直）
      const up = Cesium.Cartesian3.cross(
        right,
        direction,
        new Cesium.Cartesian3(),
      );

      scratchCamera.direction = direction;
      scratchCamera.up = up;
      scratchCamera.right = right;
    }
  });

  viewer.trackedEntity = entity;
});

onUnmounted(() => {
  const viewer = store.viewer;
  if (viewer) {
    if (removeListener) {
      removeListener();
      removeListener = null;
    }
    if (entity) {
      viewer.entities.remove(entity);
      viewer.trackedEntity = undefined;
    }
    if (primitive) viewer.scene.primitives.remove(primitive);

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

