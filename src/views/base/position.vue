<!--
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2026-02-02 21:21:05
 * @FilePath: \src\views\base\position.vue
 * @Description: 
-->
<template>
  <div class="bg-white h-20"></div>
</template>

<script setup>
import { onMounted,onUnmounted } from "vue";
import { useCesiumStore } from "@/store/cesiumStore";
import * as Cesium from "cesium";
import Transform from "@/utils/transform";

import { useCesiumCleanup } from "@/hooks/useCesiumCleanup";



let viewer = null



const getPosition = (viewer) => {
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction(function (movement) {
    // 1、屏幕坐标
    console.log(movement.position, "屏幕坐标");

    // 2、椭球面坐标（不包含地形、模型、倾斜摄影表面。）
    const position1 = viewer.scene.camera.pickEllipsoid(
      movement.position,
      viewer.scene.globe.ellipsoid,
    );
    console.log(position1);
    // 经纬度坐标
    const cartesian3 = new Cesium.Cartesian3(
      position1.x,
      position1.y,
      position1.z,
    );
    const cartographic =
      viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian3);
    const lat = Cesium.Math.toDegrees(cartographic.latitude);
    const lng = Cesium.Math.toDegrees(cartographic.longitude);
    console.log(lng, lat, "椭球面坐标");

    // 3、场景坐标（包含了地形、倾斜摄影表面、模型的坐标）
    // 只有在开启地形深度检测viewer.scene.globe.depthTestAgainstTerrain = true，且不使用默认地形时是准确的
    const position2 = viewer.scene.pickPosition(movement.position);
    console.log(position2, "场景坐标");

    // 4、地表坐标（这里是地球表面的世界坐标，包含地形，不包括模型、倾斜摄影表面。）
    const ray = viewer.camera.getPickRay(movement.position);
    const position3 = viewer.scene.globe.pick(ray, viewer.scene);
    console.log(position3, "地表坐标");
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  // 扩展获取当前鼠标移动的位置
  handler.setInputAction(function (movement) {
    // 获取当前坐标
    console.log(
      Transform.getCurrentMousePosition(viewer.scene, movement.endPosition, null),
      "当前鼠标位置",
    );
    // 获取当前坐标并转换为经纬度
    console.log(
      Transform.cartesian3To(
        Transform.getCurrentMousePosition(
          viewer.scene,
          movement.endPosition,
          null,
        ),
        viewer,
      ).latlng,
      "当前鼠标位置经纬度",
    );
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  
  return handler;
};

let handler = null;

onMounted(() => {
  viewer = useCesiumStore().viewer;
  if (viewer) {
    viewer.scene.globe.depthTestAgainstTerrain = true;
     viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(114.3055, 30.5928, 50000), // 武汉经纬度
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-90),
        roll: 0
      }
    });
    handler = getPosition(viewer);
  }
});

useCesiumCleanup(() => {
  if (handler) {
    handler.destroy();
  }
});
</script>
