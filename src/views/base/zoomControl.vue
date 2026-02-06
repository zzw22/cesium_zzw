<template>
  <div class="bg-white h-20"></div>
</template>

<script setup>
import { onMounted, onUnmounted } from "vue";
import { useCesiumStore } from "@/store/cesiumStore";
import * as Cesium from "cesium";
import CesiumNavigation from "cesium-navigation-es6";
import { useCesiumCleanup } from "@/hooks/useCesiumCleanup";

let viewer;
let navigationInstance = null;

const addInfo = () => {
  if (!viewer) return;

  const options = {
    enableCompass: true,
    enableZoomControls: true,
    enableDistanceLegend: true,
    enableCompassOuterRing: true,
  };

  // 初始化导航控件
  navigationInstance = new CesiumNavigation(viewer, options);
};

onMounted(() => {
  viewer = useCesiumStore().viewer;
  if (!viewer) return;
  addInfo();
});
useCesiumCleanup(()=>{
  if(navigationInstance){
    navigationInstance.destroy();
    navigationInstance = null;
  }
})
</script>
