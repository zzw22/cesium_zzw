<!--
 * @Title: 流动线
 * @Author: zhangzhiwei
 * @Date: 2026-02-08 17:45:22
 * @FilePath: \src\views\effects\flowLine.vue
 * @Description: 流动线
-->
<template>
  <div class="demo_panel">
    <h3 class="demo_title">流动线</h3>
    <el-button @click="toggleEffect">{{ isVisible ? '隐藏' : '显示' }}</el-button>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import { useCesiumStore } from "@/store/cesiumStore";
import * as Cesium from "cesium";
import {
  PolylineLinkPulseMaterialProperty,
  PolylineArrowMaterialProperty,
  PolylineTrialFlowMaterialProperty,
} from "@/utils/cesium";

// 导入材质图片
import LinkPulseImg from "@/assets/images/polylinematerial/LinkPulse.png";
import ArrowOpacityImg from "@/assets/images/polylinematerial/arrowopacity.png";

const store = useCesiumStore();
let viewer = null;
let isVisible = ref(true);
let entities = []; // 存储所有创建的实体

// 武汉中心坐标 (经度, 纬度)
const wuhanCenter = [114.3055, 30.5928];

// 将经纬度数组转换为 Cartesian3 坐标
const degreesToCartesian = (lon, lat, height = 0) => {
  return Cesium.Cartesian3.fromDegrees(lon, lat, height);
};

// 创建武汉的线数据
const createWuhanLines = () => {
  // 脉冲线 - 从武汉中心向两个方向延伸
  const linkPulseLines = [
    [
      degreesToCartesian(wuhanCenter[0] - 0.05, wuhanCenter[1] + 0.02),
      degreesToCartesian(wuhanCenter[0], wuhanCenter[1] + 0.02),
      degreesToCartesian(wuhanCenter[0] + 0.05, wuhanCenter[1] + 0.02),
    ],
    [
      degreesToCartesian(wuhanCenter[0] - 0.05, wuhanCenter[1] - 0.02),
      degreesToCartesian(wuhanCenter[0], wuhanCenter[1] - 0.02),
      degreesToCartesian(wuhanCenter[0] + 0.05, wuhanCenter[1] - 0.02),
    ],
  ];

  // 尾迹流动线 - 从武汉中心向两个方向延伸
  const trialFlowLines = [
    [
      degreesToCartesian(wuhanCenter[0] - 0.05, wuhanCenter[1] + 0.06),
      degreesToCartesian(wuhanCenter[0], wuhanCenter[1] + 0.06),
      degreesToCartesian(wuhanCenter[0] + 0.05, wuhanCenter[1] + 0.06),
    ],
    [
      degreesToCartesian(wuhanCenter[0] - 0.05, wuhanCenter[1] - 0.06),
      degreesToCartesian(wuhanCenter[0], wuhanCenter[1] - 0.06),
      degreesToCartesian(wuhanCenter[0] + 0.05, wuhanCenter[1] - 0.06),
    ],
  ];

  // 箭头线 - 从武汉中心向两个方向延伸
  const arrowLines = [
    [
      degreesToCartesian(wuhanCenter[0] - 0.05, wuhanCenter[1] + 0.10),
      degreesToCartesian(wuhanCenter[0] + 0.05, wuhanCenter[1] + 0.10),
    ],
    [
      degreesToCartesian(wuhanCenter[0] - 0.05, wuhanCenter[1] - 0.10),
      degreesToCartesian(wuhanCenter[0] + 0.05, wuhanCenter[1] - 0.10),
    ],
  ];

  return { linkPulseLines, trialFlowLines, arrowLines };
};

// 清除所有实体
const clearEntities = () => {
  if (!viewer) return;
  entities.forEach(entity => {
    viewer.entities.remove(entity);
  });
  entities = [];
};

// 添加所有流动线
const addData = () => {
  if (!viewer) return;
  
  // 先清除已有实体
  clearEntities();
  
  const { linkPulseLines, trialFlowLines, arrowLines } = createWuhanLines();
  
  addPolylineLinkPulse(linkPulseLines);
  addPolylineTrialFlow(trialFlowLines);
  addPolylineArrowOpacity(arrowLines);
  
  // 飞行到武汉
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(wuhanCenter[0], wuhanCenter[1]-0.40, 50000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-45),
      roll: 0,
    },
  });
};

// 脉冲线
const addPolylineLinkPulse = (lines) => {
  let colors = [Cesium.Color.RED, Cesium.Color.AQUA];
  lines.forEach((item, index) => {
    const entity = viewer.entities.add({
      polyline: {
        positions: item,
        width: 8,
        material: new PolylineLinkPulseMaterialProperty({
          color: colors[index],
          duration: 10000,
          url: LinkPulseImg,
        }),
        clampToGround: true,
      },
    });
    entities.push(entity);
  });
};

// 尾迹流动线
const addPolylineTrialFlow = (lines) => {
  let colors = [Cesium.Color.RED, Cesium.Color.AQUA];
  lines.forEach((item, index) => {
    const entity = viewer.entities.add({
      polyline: {
        positions: item,
        width: 8,
        material: new PolylineTrialFlowMaterialProperty({
          color: colors[index],
          duration: 2000,
        }),
        clampToGround: true,
      },
    });
    entities.push(entity);
  });
};

// 箭头线
const addPolylineArrowOpacity = (lines) => {
  let colors = [Cesium.Color.YELLOW, Cesium.Color.AQUA];
  lines.forEach((item, index) => {
    const entity = viewer.entities.add({
      polyline: {
        positions: item,
        width: 8,
        material: new PolylineArrowMaterialProperty({
          color: colors[index],
          duration: 800,
          count: 3,
          url: ArrowOpacityImg,
        }),
        clampToGround: true,
      },
    });
    entities.push(entity);
  });
};

// 切换显示/隐藏
const toggleEffect = () => {
  isVisible.value = !isVisible.value;
  if (isVisible.value) {
    addData();
  } else {
    clearEntities();
  }
};

onMounted(() => {
  viewer = store.viewer;
  if (!viewer) return;
  addData();
});

onUnmounted(() => {
  clearEntities();
});
</script>
