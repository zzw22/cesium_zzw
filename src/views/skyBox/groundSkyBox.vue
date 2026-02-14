<!--
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2026-02-10 14:43:14
 * @FilePath: \src\views\skyBox\groundSkyBox.vue
 * @Description: 
-->
<template>
  <div class="demo_panel">
      <h3 class="demo_title">背景图</h3>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { useCesiumStore } from '@/store/cesiumStore';
import * as Cesium from 'cesium';

let viewer;
let originalSkyBoxShow;
let originalBackgroundColor;
let originalBackgroundImage;
let originalBackgroundSize;

const addInfo = () => {
    // 保存原始状态
    originalSkyBoxShow = viewer.scene.skyBox?.show || false;
    originalBackgroundColor = viewer.scene.backgroundColor.clone();
    originalBackgroundImage = viewer.scene.canvas.style.backgroundImage;
    originalBackgroundSize = viewer.scene.canvas.style.backgroundSize;

    // 获取图片路径
    const imgUrl = new URL('../../assets/images/skyBoxImgs/backGroundImg.jpg', import.meta.url).href;
    
    // 设置背景图片
    viewer.scene.canvas.style.backgroundImage = `url(${imgUrl})`;
    viewer.scene.canvas.style.backgroundSize = 'cover';
    
    // 不显示天空盒
    viewer.scene.skyBox.show = false; 
    // 设置背景色透明，让canvas背景图透出来
    viewer.scene.backgroundColor = new Cesium.Color(0.0, 0.0, 0.0, 0.0); 
};

onMounted(() => {
  viewer = useCesiumStore().viewer;
  if (!viewer) return;
  addInfo();
});

onUnmounted(() => {
  if (viewer && !viewer.isDestroyed()) {
      // 还原状态
      viewer.scene.skyBox.show = originalSkyBoxShow;
      viewer.scene.backgroundColor = originalBackgroundColor;
      viewer.scene.canvas.style.backgroundImage = originalBackgroundImage;
      viewer.scene.canvas.style.backgroundSize = originalBackgroundSize;
  }
});
</script>