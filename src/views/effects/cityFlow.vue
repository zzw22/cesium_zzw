<template>
  <div class="demo_panel">
    <h3 class="demo_title">城市流向图</h3>
    <div class="info">
      <p>展示城市间的流向连接线效果</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import * as Cesium from 'cesium';
import { useCesiumStore } from '@/store/cesiumStore';
import { PolylineTrailMaterialProperty } from '@/utils/cesium';
import { CircleWaveMaterialProperty } from '@/utils/cesium';

let viewer = null;
const createdEntities = [];

const cities = [
  { name: '北京', lon: 116.4074, lat: 39.9042 },
  { name: '上海', lon: 121.4737, lat: 31.2304 },
  { name: '深圳', lon: 114.0579, lat: 22.5431 },
  { name: '广州', lon: 113.2644, lat: 23.1291 },
  { name: '成都', lon: 104.0668, lat: 30.5728 },
  { name: '乌鲁木齐', lon: 87.6168, lat: 43.8256 },
  { name: '拉萨', lon: 91.1172, lat: 29.6469 },
  { name: '西安', lon: 108.9398, lat: 34.3416 },
  { name: '哈尔滨', lon: 126.5349, lat: 45.8038 },
  { name: '昆明', lon: 102.8329, lat: 24.8801 },
];

const centerCity = { name: '武汉', lon: 114.3054, lat: 30.5928 };

// 生成贝塞尔曲线点
function getLinkedPointList(start, end, height, count) {
  const result = [];
  
  const startPoint = Cesium.Cartesian3.fromDegrees(start.lon, start.lat, 0);
  const endPoint = Cesium.Cartesian3.fromDegrees(end.lon, end.lat, 0);
  
  const addPointCartesian = Cesium.Cartesian3.add(startPoint, endPoint, new Cesium.Cartesian3());
  const midPointCartesian = Cesium.Cartesian3.divideByScalar(addPointCartesian, 2, new Cesium.Cartesian3());
  
  const midPointCartographic = Cesium.Cartographic.fromCartesian(midPointCartesian);
  midPointCartographic.height = height;
  
  const midPoint = Cesium.Cartographic.toCartesian(midPointCartographic);
  
  const spline = new Cesium.CatmullRomSpline({
    times: [0.0, 0.5, 1.0],
    points: [startPoint, midPoint, endPoint]
  });
  
  for (let i = 0; i <= count; i++) {
    result.push(spline.evaluate(i / count));
  }
  return result;
}

onMounted(() => {
  viewer = useCesiumStore().viewer;
  if (!viewer) return;
  
  // 开启深度检测
  viewer.scene.globe.depthTestAgainstTerrain = true;

  // 添加中心城市
  addCityPoint(centerCity, Cesium.Color.CYAN);

  // 添加其他城市及连线
  cities.forEach(city => {
    addCityPoint(city, Cesium.Color.ORANGE);
    addFlowLine(centerCity, city);
  });

  // 飞向中心城市视图
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(centerCity.lon, centerCity.lat, 2500000),
    duration: 2
  });
});

function addCityPoint(city, color) {
  // 添加波纹圈
  createdEntities.push(viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(city.lon, city.lat),
    ellipse: {
      semiMinorAxis: 50000.0,
      semiMajorAxis: 50000.0,
      material: new CircleWaveMaterialProperty({
        duration: 2000,
        gradient: 0,
        color: color,
        count: 3
      })
    }
  }));

  // 添加文字标签
  createdEntities.push(viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(city.lon, city.lat),
    label: {
      text: city.name,
      font: '16px sans-serif',
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      fillColor: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 2,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      pixelOffset: new Cesium.Cartesian2(0, -20)
    }
  }));
}

function addFlowLine(start, end) {
  const points = getLinkedPointList(start, end, 500000, 50); // 高度 500km
  
  createdEntities.push(viewer.entities.add({
    polyline: {
      positions: points,
      width: 2,
      material: new PolylineTrailMaterialProperty({
        speed: 2.0,
        color: Cesium.Color.CYAN,
      })
    }
  }));
}

onUnmounted(() => {
  if (!viewer) return;
  for (const entity of createdEntities) {
    viewer.entities.remove(entity);
  }
  createdEntities.length = 0;
});
</script>

<style scoped>

.info {
  margin-top: 10px;
  font-size: 14px;
  color: #ccc;
}
</style>
