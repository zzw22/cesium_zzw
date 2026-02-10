<!--
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2026-02-02 17:22:35
 * @FilePath: \src\components\cesiumCom\index.vue
 * @Description: 封装cesium组件
-->
<script setup>
import * as Cesium from 'cesium';
import { onMounted, ref, onUnmounted } from 'vue';
import { useCesiumStore } from '@/store/cesiumStore';

const cesiumContainer = ref(null);
const cesiumStore = useCesiumStore();
let viewer = null;
const props = defineProps({
  // 隐藏动画控件
  animation: {
    type: Boolean,
    default: false
  },
  // 隐藏时间轴控件
  timeline: {
    type: Boolean,
    default: false
  },
  // 隐藏信息框
  infoBox: {
    type: Boolean,
    default: false
  },
// 隐藏地理编码搜索框
  geocoder: {
    type: Boolean,
    default: false
  },

  homeButton: {
    type: Boolean,
    default: false
  },
  // 隐藏首页按钮
  sceneModePicker: {
    type: Boolean,
    default: false
  },
  // 隐藏图层选择器
  baseLayerPicker: {
    type: Boolean,
    default: false
  },
  // 隐藏导航帮助按钮
  navigationHelpButton: {
    type: Boolean,
    default: false
  }
})

onMounted(() => {
  if (!cesiumContainer.value) return;
  
  viewer = new Cesium.Viewer(cesiumContainer.value, {
    ...props,
    timeline: true,
    animation: true,
    contextOptions: {
      webgl: {
        alpha: true,
      }
    },
    orderIndependentTranslucency: false,// 关闭有序不透明渲染，否则会导致天空盒和模型的透明度问题
  });
  
  // 隐藏版权信息
  viewer._cesiumWidget._creditContainer.style.display = "none";
  
  // 将 viewer 实例存入 Store
  cesiumStore.setViewer(viewer);
  // 初始化控件可见性 (默认隐藏)
  cesiumStore._updateWidgetVisibility();
}) 

onUnmounted(() => {
  if (viewer) {
    viewer.destroy();
    viewer = null;
  }
});
</script>

<template>
  <div ref="cesiumContainer" class="cesium-container"></div>
</template>

<style scoped>
.cesium-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
