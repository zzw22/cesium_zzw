<!--
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2026-02-04 15:25:56
 * @FilePath: \src\views\base\transparent.vue
 * @Description: 
-->
<template>
  <div class="bg-white/90 p-4 rounded-lg shadow-lg absolute top-4 left-4 h-auto w-80 pointer-events-auto">
    <div class="flex flex-col gap-4">
      <div class="text-lg font-bold text-gray-800 border-b pb-2">
        地表透明度控制
      </div>
      
      <div class="flex items-center gap-4">
        <span class="text-sm text-gray-600 w-16">透明度:</span>
        <el-slider 
          v-model="opacity" 
          :min="0" 
          :max="1" 
          :step="0.1"
          @input="updateOpacity"
          class="flex-1"
        />
        <span class="text-sm text-gray-600 w-8">{{ opacity }}</span>
      </div>

      <div class="text-xs text-gray-500 bg-gray-100 p-2 rounded">
        提示：调整滑块可改变地表（Globe）的透明度，从而看到地下物体。
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, onUnmounted } from 'vue';
import { useCesiumStore } from '@/store/cesiumStore';
import * as Cesium from 'cesium';
import { useCesiumCleanup } from '@/hooks/useCesiumCleanup';

const opacity = ref(1.0);
let viewer = null;

// 更新透明度
const updateOpacity = (val) => {
  if (viewer && viewer.scene && viewer.scene.globe) {
    viewer.scene.globe.translucency.enabled = true;
    viewer.scene.globe.translucency.frontFaceAlpha = val;
    viewer.scene.globe.translucency.backFaceAlpha = val;
    
    // 如果想要完全透明时看到背景色，可能需要开启地下模式
    if (val < 1.0) {
      viewer.scene.screenSpaceCameraController.enableCollisionDetection = false; // 允许相机进入地下
    } else {
      viewer.scene.screenSpaceCameraController.enableCollisionDetection = true;
    }
  }
};

const initScene = () => {
  if (!viewer) return;
  
  // 开启深度检测，确保地下渲染正确
  viewer.scene.globe.depthTestAgainstTerrain = true;
  
  // 启用地表透明功能
  viewer.scene.globe.translucency.enabled = true;
  viewer.scene.globe.translucency.frontFaceAlphaByDistance = undefined; // 禁用基于距离的透明度，使用全局透明度
  
  // 添加一个地下物体作为参考
  const position = Cesium.Cartesian3.fromDegrees(114.30, 30.60, -500); // 地下500米
  viewer.entities.add({
    position: position,
    box: {
      dimensions: new Cesium.Cartesian3(400.0, 400.0, 400.0),
      material: Cesium.Color.RED.withAlpha(0.8),
      outline: true,
      outlineColor: Cesium.Color.BLACK
    },
    label: {
      text: '地下掩体 (-500m)',
      font: '14pt monospace',
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      outlineWidth: 2,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      pixelOffset: new Cesium.Cartesian2(0, -9)
    }
  });

  // 飞到目标位置
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(114.30, 30.60, 5000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-45),
      roll: 0.0
    }
  });
};

onMounted(() => {
  viewer = useCesiumStore().viewer;
  if (!viewer) return;
  initScene();
});

useCesiumCleanup(() => {
  if (viewer && !viewer.isDestroyed()) {
    // 恢复默认设置
    viewer.scene.globe.translucency.enabled = false;
    viewer.scene.screenSpaceCameraController.enableCollisionDetection = true;
  }
});
</script>