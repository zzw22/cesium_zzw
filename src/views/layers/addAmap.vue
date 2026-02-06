<!--
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2026-02-04 16:49:56
 * @FilePath: \src\views\layers\addLayers\addAmap.vue
 * @Description: 
-->
<template>
  <div class="bg-white h-20"></div>
</template>

<script setup>
import { onMounted } from "vue";
import { useCesiumStore } from "@/store/cesiumStore";
import * as Cesium from "cesium";
let viewer;
const addInfo = () => {
  const options = {
    style: "elec", // style: img、elec、cva
    crs: "WGS84", // 使用84坐标系，默认为：GCJ02
  };
  const providers = [];
  if (options.style === "elec") {
    providers.push(
      new Cesium.UrlTemplateImageryProvider({
        url:
          "https://wprd{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&style=7&x={x}&y={y}&z={z}",
        subdomains: ["01", "02", "03", "04"],
      }),
    );
  } else if (options.style === "img") {
    providers.push(
      new Cesium.UrlTemplateImageryProvider({
        url:
          "https://webst{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",
        subdomains: ["01", "02", "03", "04"],
      }),
    );
  } else if (options.style === "cva") {
    providers.push(
      new Cesium.UrlTemplateImageryProvider({
        url:
          "https://wprd{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&style=8&x={x}&y={y}&z={z}",
        subdomains: ["01", "02", "03", "04"],
      }),
    );
  }
  providers.forEach((p) => viewer.imageryLayers.addImageryProvider(p));
};
onMounted(() => {
  viewer = useCesiumStore().viewer;
  if (!viewer) return;
  addInfo();
});
</script>
