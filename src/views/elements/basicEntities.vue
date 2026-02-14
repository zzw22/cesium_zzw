<!--
 * @Title: 基础实体 (Entity)
 * @Description: 演示 Point, Polyline, Polygon 的添加
-->
<template>
  <div class="demo_panel">
    <div class="demo_title">基础实体示例</div>
    <div class="button-group">
      <el-button class="tip-button" size="small" @click="addPoint">添加点 (Point)</el-button>
      <el-button class="tip-button" size="small" @click="addLine">添加线 (Polyline)</el-button>
      <el-button class="tip-button" size="small" @click="addPolygon">添加面 (Polygon)</el-button>
      <el-button class="tip-button" size="small" type="danger" @click="clear">清除</el-button>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useCesiumStore } from "@/store/cesiumStore";
import * as Cesium from "cesium";
import { useCesiumCleanup } from "@/hooks/useCesiumCleanup";

let viewer = null;

onMounted(() => {
  viewer = useCesiumStore().viewer;
});

const addPoint = () => {
  if (!viewer) return;
  viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(114.3, 30.6, 100),
    point: {
      pixelSize: 10,
      color: Cesium.Color.RED,
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2,
    },
    label: {
      text: "武汉",
      font: "14px sans-serif",
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      pixelOffset: new Cesium.Cartesian2(0, -20),
    },
  });
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(114.3, 30.6, 5000),
  });
};

const addLine = () => {
  if (!viewer) return;
  viewer.entities.add({
    polyline: {
      positions: Cesium.Cartesian3.fromDegreesArray([
        114.3, 30.6, 115.1, 29.8, 116.4, 30.9,
      ]),
      width: 5,
      material: new Cesium.PolylineGlowMaterialProperty({
        glowPower: 0.2,
        color: Cesium.Color.BLUE,
      }),
    },
  });
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(115.0, 30.2, 500000),
  });
};

const addPolygon = () => {
  if (!viewer) return;
  viewer.entities.add({
    polygon: {
      hierarchy: Cesium.Cartesian3.fromDegreesArray([
        114.3, 30.6, 114.3, 30.1, 113.8, 30.2, 113.5, 30.5, 113.8, 30.8,
      ]),
      material: Cesium.Color.ORANGE.withAlpha(0.5),
      outline: true,
      outlineColor: Cesium.Color.BLACK,
    },
  });
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(114.0, 30.4, 2000000),
  });
};

const clear = () => {
  if (viewer) viewer.entities.removeAll();
};

useCesiumCleanup(() => {
  if (viewer) viewer.entities.removeAll();
});
</script>

<style scoped>
.title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
}
.button-group {
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  gap: 5px;
  margin-left: 0;
}
.tip-button {
  margin-left: 0;
}
</style>
