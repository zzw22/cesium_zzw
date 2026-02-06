<!--
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2026-02-04 15:53:02
 * @FilePath: \src\views\layers\wms.vue
 * @Description: 
-->
<template></template>

<script setup>
import { onMounted, shallowRef } from "vue";
import { useCesiumStore } from "@/store/cesiumStore";
import * as Cesium from "cesium";
import { useCesiumCleanup } from "@/hooks/useCesiumCleanup";

let viewer = null;
const imageryLayer = shallowRef(null);

onMounted(() => {
  viewer = useCesiumStore().viewer;
  if (!viewer) return;

  const provider = new Cesium.WebMapServiceImageryProvider({
    url: "https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi?",
    layers: "nexrad-n0r",
    credit: "demo",
    parameters: {
      transparent: "true",
      format: "image/png",
    },
  });

  const layer = viewer.imageryLayers.addImageryProvider(provider);
  imageryLayer.value = layer;
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(-96, 37, 3000000),
  });
});

useCesiumCleanup(() => {
  if (viewer && imageryLayer.value) {
    viewer.imageryLayers.remove(imageryLayer.value);
  }
});
</script>
