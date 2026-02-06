<!--
 * @Title: 离线地形加载与夸张效果
 * @Author: zhangzhiwei
 * @Date: 2026-02-06
 * @Description: 演示如何加载离线地形数据，并动态调整地形夸张程度
-->
<template>
  <div class="absolute top-4 left-4 bg-white p-4 rounded shadow z-10 w-80">
    <div class="mb-4 font-bold text-lg border-b pb-2">离线地形控制</div>
    <div class="mb-4">
      <div class="text-sm text-gray-600 mb-1">
        地形数据路径 (Public目录相对路径)
      </div>
      <div class="flex gap-2">
        <el-input v-model="terrainPath" size="small" placeholder="/terrain" />
        <el-button type="primary" size="small" @click="loadTerrain"
          >加载</el-button
        >
      </div>
      <div class="text-xs text-gray-400 mt-1">
        注：请确保 public/terrain 目录下包含 layer.json
      </div>
    </div>

    <div class="mb-2">
      <div class="flex justify-between text-sm mb-1">
        <span>地形夸张程度</span>
        <span class="font-bold text-blue-600">{{ exaggeration }}x</span>
      </div>
      <el-slider
        v-model="exaggeration"
        :min="1"
        :max="20"
        :step="1"
        @input="updateExaggerationVal"
      />
    </div>

    <div class="mt-4 pt-2 border-t flex justify-end">
      <el-button link type="primary" size="small" @click="loadDemoTerrain">
        无法加载? 试用在线地形演示
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, onUnmounted } from "vue";
import { useCesiumStore } from "@/store/cesiumStore";
import * as Cesium from "cesium";
import { useCesiumCleanup } from "@/hooks/useCesiumCleanup";
import { ElMessage } from "element-plus";

const terrainPath = ref("/terrain");
const exaggeration = ref(1.0);
let viewer = null;

// 加载离线地形
const loadTerrain = async () => {
  if (!viewer) return;

  try {
    // 使用 fromUrl 异步加载地形提供者 (Cesium 1.104+)
    const provider = await Cesium.CesiumTerrainProvider.fromUrl(
      terrainPath.value,
      {
        requestVertexNormals: true, // 请求顶点法线以支持光照效果
      },
    );

    viewer.terrainProvider = provider;
    ElMessage.success("地形加载成功");

    // 尝试飞到地形数据的大致区域（如果有 boundingSphere）
    // 这里简单飞到一个多山区域演示
    flyToDemoArea();
  } catch (error) {
    console.error("地形加载失败:", error);
    ElMessage.error("地形加载失败，请检查路径或文件是否存在");
  }
};

// 加载在线演示地形（WorldTerrain）
const loadDemoTerrain = async () => {
  if (!viewer) return;
  try {
    // viewer.terrainProvider = await Cesium.Terrain.fromWorldTerrain({
    //   requestVertexNormals: true
    // });
    const terrainProvider =
      await Cesium.ArcGISTiledElevationTerrainProvider.fromUrl(
        "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer",
      );
    viewer.terrainProvider = terrainProvider;
    ElMessage.success("已切换至在线 WorldTerrain");
    flyToDemoArea();
  } catch (e) {
    ElMessage.error("在线地形加载失败");
  }
};

// 更新夸张程度
const updateExaggerationVal = (val) => {
  if (viewer) {
   viewer.scene.globe.terrainExaggeration = val*5;
    viewer.scene.requestRender();
  }
};

// 飞到演示区域（珠穆朗玛峰附近，地形起伏大，夸张效果明显）
const flyToDemoArea = () => {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(86.925, 27.9881, 20000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-25),
      roll: 0,
    },
  });
};

onMounted(() => {
  viewer = useCesiumStore().viewer;
  if (!viewer) return;

  // 初始化夸张程度
  exaggeration.value = viewer.scene.globe.terrainExaggeration || 1.0;

  // 开启深度检测，确保地形遮挡效果正确
  viewer.scene.globe.depthTestAgainstTerrain = true;
  
  // 强制设置地形夸张，某些情况下需要设置 exaggeratedHeight 
  if (viewer.scene.verticalExaggeration !== undefined) {
    viewer.scene.verticalExaggeration = exaggeration.value;
    viewer.scene.verticalExaggerationRelativeHeight = 0;
  } else {
    viewer.scene.globe.terrainExaggeration = exaggeration.value;
  }
});

// 清理函数
useCesiumCleanup(() => {
  if (viewer) {
    // 恢复默认椭球体地形
    viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
    // 恢复夸张程度
    if (viewer.scene.verticalExaggeration !== undefined) {
      viewer.scene.verticalExaggeration = 1.0;
    } else {
      viewer.scene.globe.terrainExaggeration = 1.0;
    }
    // 关闭深度检测（可选，视项目默认设置而定）
    viewer.scene.globe.depthTestAgainstTerrain = false;
  }
});
</script>

<style scoped>
/* 覆盖 Element Plus Slider 样式以适应紧凑布局 */
:deep(.el-slider__runway) {
  margin: 12px 0;
}
</style>
