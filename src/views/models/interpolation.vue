<!--
 * @Title: 模型差值运动
 * @Description: 使用SampledPositionProperty实现模型平滑移动
-->
<template>
  <div class="demo_panel">
    <h3 class="demo_title">模型差值运动</h3>
    <div class="text-xs text-gray-500 mb-2">
      基于时间样本的位置插值
    </div>
    <div class="flex space-x-2">
      <el-button size="small" type="primary" @click="toggleAnimate">
        {{ shouldAnimate ? '暂停' : '播放' }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useCesiumStore } from '@/store/cesiumStore';
import * as Cesium from 'cesium';
import { useCesiumCleanup } from '@/hooks/useCesiumCleanup';

let viewer = null;
let entity = null;
const shouldAnimate = ref(true);
const modelUrl = 'https://data.mars3d.cn/gltf/mars/qiche.gltf';

onMounted(() => {
  const store = useCesiumStore();
  viewer = store.viewer;
  if (!viewer) return;

  // 设置时间范围
  const start = Cesium.JulianDate.fromDate(new Date(2023, 1, 1, 10));
  const stop = Cesium.JulianDate.addSeconds(start, 360, new Cesium.JulianDate());

  viewer.clock.startTime = start.clone();
  viewer.clock.stopTime = stop.clone();
  viewer.clock.currentTime = start.clone();
  viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
  viewer.clock.multiplier = 10;
  viewer.clock.shouldAnimate = true;

  // 创建路径属性
  const positionProperty = new Cesium.SampledPositionProperty();
  
  // 生成路径点
  const centerLon = 114.3055;
  const centerLat = 30.5928;
  
  for (let i = 0; i <= 360; i += 30) {
    const time = Cesium.JulianDate.addSeconds(start, i, new Cesium.JulianDate());
    const radians = Cesium.Math.toRadians(i);
    const lon = centerLon + 0.01 * Math.cos(radians);
    const lat = centerLat + 0.01 * Math.sin(radians);
    const position = Cesium.Cartesian3.fromDegrees(lon, lat, 0);
    positionProperty.addSample(time, position);
  }

  // 设置插值算法
  positionProperty.setInterpolationOptions({
    interpolationDegree: 2,
    interpolationAlgorithm: Cesium.HermitePolynomialApproximation
  });

  entity = viewer.entities.add({
    availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
      start: start,
      stop: stop
    })]),
    position: positionProperty,
    orientation: new Cesium.VelocityOrientationProperty(positionProperty),
    model: {
      uri: modelUrl,
      minimumPixelSize: 64,
      scale: 1.0 // 汽车模型可能需要调整大小
    },
    path: {
      resolution: 1,
      material: new Cesium.PolylineGlowMaterialProperty({
        glowPower: 0.1,
        color: Cesium.Color.YELLOW
      }),
      width: 10
    }
  });

  viewer.trackedEntity = entity;
});

const toggleAnimate = () => {
  if (viewer) {
    viewer.clock.shouldAnimate = !viewer.clock.shouldAnimate;
    shouldAnimate.value = viewer.clock.shouldAnimate;
  }
};

useCesiumCleanup(() => {
  if (viewer) {
    if (entity) {
      viewer.entities.remove(entity);
    }
    viewer.trackedEntity = undefined;
    // 恢复默认时钟设置 (可选，视需求而定，这里简单重置一下倍速)
    viewer.clock.multiplier = 1;
  }
});
</script>
