<template>
  <div class="demo_panel">
    <h3 class="demo_title">坐标信息</h3>
    <div class="position-info">
      <div class="position-item">
        <label>屏幕坐标:</label>
        <span id="screen-position">{{
          formatScreenPosition(screenPosition)
        }}</span>
      </div>
      <div class="position-item">
        <label
          >椭球面坐标:<span>（不包含地形、模型、倾斜摄影表面。）</span></label
        >
        <span id="ellipsoid-position">{{
          formatCartesian3(ellipsoidPosition)
        }}</span>
        <div v-if="ellipsoidPosition" class="latlng-info">
          ({{ formatLatLng(ellipsoidPosition) }})
        </div>
      </div>
      <div class="position-item">
        <label
          >场景坐标:<span>（包含了地形、倾斜摄影表面、模型的坐标）</span></label
        >
        <span id="scene-position">{{ formatCartesian3(scenePosition) }}</span>
        <div v-if="scenePosition" class="latlng-info">
          ({{ formatLatLng(scenePosition) }})
        </div>
      </div>
      <div class="position-item">
        <label
          >地表坐标:<span
            >（这里是地球表面的世界坐标，包含地形，不包括模型、倾斜摄影表面。）</span
          ></label
        >
        <span id="terrain-position">{{
          formatCartesian3(terrainPosition)
        }}</span>
        <div v-if="terrainPosition" class="latlng-info">
          ({{ formatLatLng(terrainPosition) }})
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import { useCesiumStore } from "@/store/cesiumStore";
import * as Cesium from "cesium";
import Transform from "@/utils/transform";

import { useCesiumCleanup } from "@/hooks/useCesiumCleanup";

let viewer = null;

let screenPosition = ref(null);
let ellipsoidPosition = ref(null);
let scenePosition = ref(null);
let terrainPosition = ref(null);

const addBaseData = () => {
  viewer.scene.globe.depthTestAgainstTerrain = true;
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(114.3055, 30.5928, 50000), // 武汉经纬度
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-90),
      roll: 0,
    },
  });
};

// 格式化屏幕坐标
const formatScreenPosition = (position) => {
  if (!position) return "点击地图获取";
  return `x: ${position.x.toFixed(2)}, y: ${position.y.toFixed(2)}`;
};

// 格式化笛卡尔坐标
const formatCartesian3 = (position) => {
  if (!position) return "点击地图获取";
  return `x: ${position.x.toFixed(6)}, y: ${position.y.toFixed(6)}, z: ${position.z.toFixed(6)}`;
};

// 格式化经纬度坐标
const formatLatLng = (cartesian3) => {
  if (!cartesian3) return "";
  const cartographic = Cesium.Cartographic.fromCartesian(cartesian3);
  const lat = Cesium.Math.toDegrees(cartographic.latitude);
  const lng = Cesium.Math.toDegrees(cartographic.longitude);
  const height = cartographic.height || 0;
  return `经度: ${lng.toFixed(6)}, 纬度: ${lat.toFixed(6)}, 高度: ${height.toFixed(2)}m`;
};

const getPosition = (viewer) => {
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction(function (movement) {
    // 1、屏幕坐标
    screenPosition.value = movement.position;

    // 2、椭球面坐标（不包含地形、模型、倾斜摄影表面。）
    const position1 = viewer.scene.camera.pickEllipsoid(
      movement.position,
      viewer.scene.globe.ellipsoid,
    );
    if (position1) {
      ellipsoidPosition.value = position1;
    } else {
      ellipsoidPosition.value = null;
    }

    // 3、场景坐标（包含了地形、倾斜摄影表面、模型的坐标）
    const position2 = viewer.scene.pickPosition(movement.position);
    scenePosition.value = position2;

    // 4、地表坐标（这里是地球表面的世界坐标，包含地形，不包括模型、倾斜摄影表面。）
    const ray = viewer.camera.getPickRay(movement.position);
    const position3 = viewer.scene.globe.pick(ray, viewer.scene);
    terrainPosition.value = position3;
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  // 扩展获取当前鼠标移动的位置
  handler.setInputAction(function (movement) {
    // 获取当前坐标
    console.log(
      Transform.getCurrentMousePosition(
        viewer.scene,
        movement.endPosition,
        null,
      ),
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
  if (!viewer) return;
  addBaseData();
  handler = getPosition(viewer);
});

useCesiumCleanup(() => {
    if (viewer) {
    viewer.entities.removeAll();
  }
  if (handler) {
    handler.destroy();
  }
});
</script>

<style scoped>

.position-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.position-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.position-item label {
  font-weight: bold;
  font-size: 14px;
  color: #333;
}

.position-item span {
  font-family: monospace;
  font-size: 12px;
  color: #666;
  word-break: break-all;
}

.latlng-info {
  font-family: monospace;
  font-size: 11px;
  color: #999;
  margin-top: 2px;
  padding-left: 10px;
  border-left: 2px solid #eee;
}
</style>
