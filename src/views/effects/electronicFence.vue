
<template>
  <div class="effect-panel">
    <h3>电子围栏 </h3>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from "vue";
import { useCesiumStore } from "@/store/cesiumStore";
import * as Cesium from "cesium";
import { DynamicWallMaterialProperty } from "@/utils/cesium/DynamicWallMaterialProperty";
import wallImage from '@/assets/images/wall.png'; 

const store = useCesiumStore();
let datasouce = null;

onMounted(() => {
  const viewer = store.viewer;
  if (!viewer) return;

  let data = [
    [104.0185546875, 30.66235300961486],
    [104.01589393615723, 30.65652022496456],
    [104.029541015625, 30.65053940942565],
    [104.0397548675537, 30.65777541087788],
    [104.03829574584961, 30.66604446357028],
    [104.0255069732666, 30.667963963897005],
    [104.0185546875, 30.66235300961486],
  ];
  let coor = Array.prototype.concat.apply([], data);

  const datasouceName = "wall";
  datasouce = viewer.dataSources._dataSources.find((t) => {
    return t && t.name == datasouceName;
  });
  if (!datasouce) {
    datasouce = new Cesium.CustomDataSource(datasouceName);
    viewer.dataSources.add(datasouce);
  }

  datasouce.entities.add({
    wall: {
      positions: Cesium.Cartesian3.fromDegreesArray(coor),
      maximumHeights: new Array(data.length).fill(500),
      minimumHeights: new Array(data.length).fill(0),

      // 动态
      material: new DynamicWallMaterialProperty({
        trailImage: wallImage,
        color: Cesium.Color.CYAN,
        duration: 1500,
        count: 3.0, // 保持原有的 count 默认值
        freely: 'vertical',
        direction: '-'
      }),
    },
  });

  //设置相机位置及方向
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(104.02, 30.655, 5000),
    duration: 2,
  });
});

onUnmounted(() => {
  const viewer = store.viewer;
  if (viewer && datasouce) {
    viewer.dataSources.remove(datasouce);
    datasouce = null;
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
