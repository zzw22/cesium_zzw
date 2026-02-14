<!--
 * @Title: 地形夸张效果
 * @Author: zhangzhiwei
 * @Date: 2026-02-06
 * @Description: 演示 ArcGIS 地形数据与动态调整地形夸张程度
-->
<template>
  <div class="demo_panel">
    <h3 class="demo_title">地形图加载</h3>
    <div class="mb-2">
      <div class="flex justify-between text-sm mb-1">
        <span>地形夸张程度</span>
        <span class="font-bold text-blue-600">{{ exaggeration }}x</span>
      </div>
      <el-slider
        v-model="exaggeration"
        :min="1"
        :max="8"
        :step="1"
        @input="updateExaggerationVal"
      />
    </div>

    <div class="mt-4 pt-2 border-t flex justify-end">
      <el-button link type="primary" size="small" @click="reloadTerrain">
        重新加载地形
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useCesiumStore } from "@/store/cesiumStore";
import * as Cesium from "cesium";
import { useCesiumCleanup } from "@/hooks/useCesiumCleanup";
import { ElMessage } from "element-plus";

const exaggeration = ref(3.0);
let viewer = null;

// 初始化底图 - 使用高德地图
const initImageryLayer = () => {
  if (!viewer) return;

  viewer.imageryLayers.removeAll();

  const imageryProvider = new Cesium.UrlTemplateImageryProvider({
    url: "https://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",
  });
  viewer.imageryLayers.addImageryProvider(imageryProvider);
};

// 初始化地形 - 使用 ArcGIS 在线地形
const initTerrain = async () => {
  if (!viewer) return;

  try {
    const terrainProvider =
      await Cesium.ArcGISTiledElevationTerrainProvider.fromUrl(
        "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer",
      );
    viewer.terrainProvider = terrainProvider;
    
    // 使用新的 API 设置地形夸张
    viewer.scene.verticalExaggeration = exaggeration.value;
    viewer.scene.verticalExaggerationRelativeHeight = 0;

    ElMessage.success("地形加载成功");
  } catch (error) {
    console.error("地形加载失败:", error);
    ElMessage.error("地形加载失败，使用默认地形");
    viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
  }
};

// 重新加载地形
const reloadTerrain = async () => {
  if (!viewer) return;
  await initTerrain();
  flyToDemoArea();
};

// 更新夸张程度
const updateExaggerationVal = (val) => {
  if (viewer) {
    exaggeration.value = val;
    // 使用新的 API 设置地形夸张
    viewer.scene.verticalExaggeration = val;
    viewer.scene.verticalExaggerationRelativeHeight = 0;
    viewer.scene.requestRender();
  }
};

// 飞到演示区域
const flyToDemoArea = () => {
  if (!viewer) return;

  viewer.scene.camera.flyTo({
    destination: {
      x: -1135832.2500233247,
      y: 5482646.852955472,
      z: 3124157.6677550175,
    },
    orientation: {
      heading: 0.9231787775159015,
      pitch: -0.409062086563442,
      roll: 0.002490493263910487,
    },
    duration: 1,
  });
};

onMounted(async () => {
  viewer = useCesiumStore().viewer;
  if (!viewer) return;

  initImageryLayer();
  await initTerrain();
  flyToDemoArea();

  viewer.scene.globe.depthTestAgainstTerrain = false;
});

// 清理函数
useCesiumCleanup(() => {
  if (viewer) {
    viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
    viewer.scene.verticalExaggeration = 1.0;
  }
});
</script>

<style scoped>
:deep(.el-slider__runway) {
  margin: 12px 0;
}
</style>
