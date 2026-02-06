<!--
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2026-02-02 20:28:29
 * @FilePath: \src\views\base\entities.vue
 * @Description: 
-->
<template>
  <div class="bg-white h-20">111</div>
</template>

<script setup>
import { onMounted, onUnmounted } from "vue";
import { useCesiumStore } from "@/store/cesiumStore";
import * as Cesium from "cesium";
import { useCesiumCleanup } from "@/hooks/useCesiumCleanup";
let viewer = null

const addEntities = (viewer) => {
  viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(114.2055, 30.5928),
    point: {
      pixelSize: 50,
      color: Cesium.Color.RED,
      outlineColor: new Cesium.Color(0.165, 1, 0.165, 0.8),
      outlineWidth: 20,
    },
  });

  viewer.entities.add({
    polyline: {
      positions: Cesium.Cartesian3.fromDegreesArray([
        114.3055, 30.5928,
        114.4065, 30.5928,
      ]),
      width: 5,
      material: Cesium.Color.BLUE.withAlpha(0.5),
    },
  });

  viewer.entities.add({
    polygon: {
      hierarchy: Cesium.Cartesian3.fromDegreesArray([
        114.4065, 30.5938,
        114.4085, 30.5910,
        114.4045, 30.5910,
      ]),
      material: Cesium.Color.fromCssColorString("rgba(254, 129, 6, 0.75)"),
      outline: true,
      outlineColor: Cesium.Color.fromRandom({ alpha: 0.5 }),
      outlineWidth: 20,
    },
  });

  viewer.zoomTo(viewer.entities);
   viewer.scene.globe.depthTestAgainstTerrain = true;//（开启）
};

onMounted(() => {
  viewer = useCesiumStore().viewer;
  if (viewer) {
    var xyz = new Cesium.UrlTemplateImageryProvider({
      url: "//data.mars3d.cn/tile/img/{z}/{x}/{y}.jpg",
    });
    viewer.imageryLayers.addImageryProvider(xyz);
    addEntities(viewer);
  }
});
useCesiumCleanup(() => {
  if (viewer) {
    viewer.entities.removeAll();
  }
});
</script>
