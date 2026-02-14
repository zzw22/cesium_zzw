<!--
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2026-02-10 14:40:55
 * @FilePath: \src\views\skyBox\nearEarthSkyBox.vue
 * @Description: 近地天空盒
-->
<template>
  <div class="demo_panel">
      <h3 class="demo_title">近地天空盒</h3>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from "vue";
import { useCesiumStore } from "@/store/cesiumStore";
import * as Cesium from "cesium";

let viewer;
let originalSkyBox;
let originalSkyAtmosphereShow;
let postRenderListener;

const addInfo = () => {
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(-95.166493, 39.9060534, 3336.6),
    orientation: {
      heading: Cesium.Math.toRadians(351.2), // 水平旋转，围绕Y轴，0为正北方向
      pitch: Cesium.Math.toRadians(-6.7), // 上下旋转，围绕X轴，-90为俯视地面
      roll: 0.0, // 视口的翻滚角度，围绕Z轴，0为不翻转
    },
  });

  originalSkyBox = viewer.scene.skyBox;
  originalSkyAtmosphereShow = viewer.scene.skyAtmosphere.show;

  // 创建近地天空盒
  const groundSkyBox = new Cesium.SkyBox({
      sources: {
        positiveX: new URL('../../assets/images/skyBoxImgs/Right.jpg', import.meta.url).href,
        negativeX: new URL('../../assets/images/skyBoxImgs/Left.jpg', import.meta.url).href,
        positiveY: new URL('../../assets/images/skyBoxImgs/Front.jpg', import.meta.url).href,
        negativeY: new URL('../../assets/images/skyBoxImgs/Back.jpg', import.meta.url).href,
        positiveZ: new URL('../../assets/images/skyBoxImgs/Up.jpg', import.meta.url).href,
        negativeZ: new URL('../../assets/images/skyBoxImgs/Down.jpg', import.meta.url).href
      }
  });

  // 监听渲染事件，根据高度切换天空盒
  postRenderListener = viewer.scene.postRender.addEventListener(() => {
      const cameraPosition = viewer.camera.position;
      const cartographic = Cesium.Cartographic.fromCartesian(cameraPosition);
      // 高度阈值，例如250000米
      if (cartographic.height < 30000) {
           if (viewer.scene.skyBox !== groundSkyBox) {
               viewer.scene.skyBox = groundSkyBox;
               viewer.scene.skyAtmosphere.show = false;
           }
      } else {
           if (viewer.scene.skyBox !== originalSkyBox) {
               viewer.scene.skyBox = originalSkyBox;
               viewer.scene.skyAtmosphere.show = true;
           }
      }
  });
};

onMounted(() => {
  viewer = useCesiumStore().viewer;
  if (!viewer) return;
  addInfo();
});

onUnmounted(() => {
  if (postRenderListener) {
    postRenderListener(); // 移除事件监听
    postRenderListener = null;
  }
  if (viewer && !viewer.isDestroyed()) {
    if (originalSkyBox) {
      viewer.scene.skyBox = originalSkyBox;
    }
    if (originalSkyAtmosphereShow !== undefined) {
      viewer.scene.skyAtmosphere.show = originalSkyAtmosphereShow;
    }
  }
});
</script>
