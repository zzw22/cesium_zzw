<!--
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2026-02-02 23:15:19
 * @FilePath: \src\views\base\sport.vue
 * @Description: 
-->
<template>
  <div class="demo_panel">
    <h3 class="demo_title">运动模拟</h3>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from "vue";
import { useCesiumStore } from "@/store/cesiumStore";
import * as Cesium from "cesium";
import { useCesiumCleanup } from "@/hooks/useCesiumCleanup";
import airPlaneModel from "@/assets/modules/airPlane/scene.gltf?url";
const cesiumStore = useCesiumStore();
let viewer = null;

const sportEvent = (viewer) => {
  let start = new Cesium.JulianDate.fromDate(new Date());

  // 开始时间  cesium用的JulianDate:代表天文朱利安时间,用的是世界协调时,比北京时间晚8个小时, 加上东8时，就是当前的真正时间
  start = Cesium.JulianDate.addHours(start, 8, new Cesium.JulianDate());
  // 结束时间 6分钟
  const center = Cesium.JulianDate.addSeconds(
    start,
    180,
    new Cesium.JulianDate(),
  );
  const center2 = Cesium.JulianDate.addSeconds(
    start,
    200,
    new Cesium.JulianDate(),
  );
  const stop = Cesium.JulianDate.addSeconds(
    start,
    360,
    new Cesium.JulianDate(),
  );

  // 设置时钟范围
  viewer.clock.startTime = start.clone();
  viewer.clock.stopTime = stop.clone();
  viewer.clock.currentTime = start.clone();

  // 循环结束时后续动作
  viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;

  // 时间速率控制速度，时间调快多少倍，比如原来用时360秒，调整10倍后，现在用时36秒
  viewer.clock.multiplier = 10;
  //给下方时间线设置边界
  if (viewer.timeline) {
    viewer.timeline.zoomTo(start, stop);
  }

  const position = new Cesium.SampledPositionProperty();

  const startPos = Cesium.Cartesian3.fromDegrees(-90, 20, 10000);
  const centerPos = Cesium.Cartesian3.fromDegrees(-60, 40, 1000000);
  const centerPos2 = Cesium.Cartesian3.fromDegrees(-60, 42, 1000000);
  const endPos = Cesium.Cartesian3.fromDegrees(-120, 30, 3000000);

  position.addSample(start, startPos);
  position.addSample(center, centerPos);
  position.addSample(center2, centerPos2);
  position.addSample(stop, endPos);

  const entity = viewer.entities.add({
    // 将实体availability设置为与模拟时间相同的时间间隔。
    availability: new Cesium.TimeIntervalCollection([
      new Cesium.TimeInterval({
        start: start,
        stop: stop,
      }),
    ]),
    position: position, // 计算实体位置属性
    // 基于位置移动自动计算方向.
    orientation: new Cesium.VelocityOrientationProperty(position),
    model: {
      uri: airPlaneModel,
      minimumPixelSize: 32,
    },
    label: {
      text: "飞机",
      font: "10pt monospace",
      outlineWidth: 2,
      fillColor: Cesium.Color.BLUE,
      showBackground: true,
      pixelOffset: new Cesium.Cartesian2(40, 20),
      backgroundColor: Cesium.Color.RED,
    },
    // 路径
    path: {
      show: true,
      resolution: 1,
      material: new Cesium.PolylineGlowMaterialProperty({
        glowPower: 0.1,
        color: Cesium.Color.PINK,
      }),
      width: 5,
    },
  });

  // 开启运动
  viewer.clock.shouldAnimate = true;

  // 第三人称
  // viewer.trackedEntity = entity;

  // 第一人称
  const removeListener = viewer.scene.preUpdate.addEventListener(traceHandler);

  // https://blog.csdn.net/dandan__666/article/details/115293860
  // https://blog.csdn.net/AllBluefm/article/details/137928976

  function traceHandler() {
    let center = entity.position.getValue(viewer.clock.currentTime);
    if (!center) return; // Add safety check
    let orientation = entity.orientation.getValue(viewer.clock.currentTime);
    if (!orientation) return; // Add safety check

    let transform = Cesium.Transforms.eastNorthUpToFixedFrame(center);
    transform = Cesium.Matrix4.fromRotationTranslation(
      Cesium.Matrix3.fromQuaternion(orientation),
      center,
    );
    viewer.camera.lookAtTransform(transform, new Cesium.Cartesian3(-20, 0, 30));
  }

  return removeListener;
};

let removeTraceHandler = null;

onMounted(() => {
  viewer = cesiumStore.viewer;
  if (!viewer) return;

  // 开启时间轴
  cesiumStore.setTimelineVisible(true);

  removeTraceHandler = sportEvent(viewer);
  console.log(viewer, 111);
});

useCesiumCleanup(() => {
  if (viewer) {
    viewer.entities.removeAll();
  }
  if (removeTraceHandler) {
    removeTraceHandler();
  }
});
</script>
