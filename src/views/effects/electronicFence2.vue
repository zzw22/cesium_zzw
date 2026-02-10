<!--
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2026-02-08 17:45:22
 * @FilePath: \src\views\effects\electronicFence2.vue
 * @Description: 
-->
<template>
  <div class="effect-panel">
    <h3>横向移动电子围栏</h3>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { useCesiumStore } from '@/store/cesiumStore';
import * as Cesium from 'cesium';
import { DynamicWallMaterialProperty } from '@/utils/cesium/DynamicWallMaterialProperty';
import wallImage from '@/assets/images/jt.png'; // 确保路径正确，如果没有 jt.png，可能需要回退到 wall.png

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
    [104.0185546875, 30.66235300961486]
  ];

  let coor = Array.prototype.concat.apply([], data);

  // 创建或获取 DataSource
  const datasouceName = 'wall';
  datasouce = viewer.dataSources._dataSources.find(t => t && t.name == datasouceName);
  if (!datasouce) {
    datasouce = new Cesium.CustomDataSource(datasouceName);
    viewer.dataSources.add(datasouce);
  }

  // 添加实体
  datasouce.entities.add({
    wall: {
      positions: Cesium.Cartesian3.fromDegreesArray(coor),
      maximumHeights: new Array(data.length).fill(200),
      minimumHeights: new Array(data.length).fill(0),
      
      // 使用封装好的 DynamicWallMaterialProperty
      material: new DynamicWallMaterialProperty({ 
        trailImage: wallImage, 
        color: Cesium.Color.YELLOW, 
        duration: 1500,
        freely: 'standard', // 横向运动
        count: 23.0,        // 保持 1.html 的 count 设置
        direction: '+'      // 保持 1.html 的 direction 设置
      })
    },
  });

  // 设置相机视角
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
