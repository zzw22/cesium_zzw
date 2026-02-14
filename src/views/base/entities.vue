<!--
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2026-02-02 20:28:29
 * @FilePath: \src\views\base\entities.vue
 * @Description: 
-->
<template>
  <div class="demo_panel">
    <h3 class="demo_title">实体加载</h3>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from "vue";
import { useCesiumStore } from "@/store/cesiumStore";
import * as Cesium from "cesium";
import { useCesiumCleanup } from "@/hooks/useCesiumCleanup";
let viewer = null;

const addEntities = () => {
 viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(114.2055, 30.5928),
  ellipse: {
    semiMajorAxis: 1000, // 长半轴（米）
    semiMinorAxis: 1000, // 短半轴（米）
    material: Cesium.Color.RED.withAlpha(0.5),
    outline: true,
    outlineColor: Cesium.Color.GREEN,
    outlineWidth: 10
  }
});

  viewer.entities.add({
    polyline: {
      positions: Cesium.Cartesian3.fromDegreesArray([
        114.3055, 30.5928, 114.4065, 30.5928,
      ]),
      width: 5,
      material: Cesium.Color.BLUE.withAlpha(0.5),
    },
  });

  viewer.entities.add({
    polygon: {
      hierarchy: Cesium.Cartesian3.fromDegreesArray([
        114.4065, 30.5938, 114.4085, 30.591, 114.4045, 30.591,
      ]),
      material: Cesium.Color.fromCssColorString("rgba(254, 129, 6, 0.75)"),
      outline: true,
      outlineColor: Cesium.Color.fromRandom({ alpha: 0.5 }),
      outlineWidth: 20,
    },
  });

  viewer.zoomTo(viewer.entities);
  viewer.scene.globe.depthTestAgainstTerrain = true; //（开启）
};

onMounted(() => {
  viewer = useCesiumStore().viewer;
  if (!viewer) return;
  addEntities();
});
useCesiumCleanup(() => {
  if (viewer) {
    viewer.entities.removeAll();
  }
});
</script>

<style scoped>
.panel {
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: rgba(255, 255, 255, 1.0);
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}
</style>
