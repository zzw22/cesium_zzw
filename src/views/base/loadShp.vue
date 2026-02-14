<!--
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2026-02-03 15:13:05
 * @FilePath: \src\views\base\loadShp.vue
 * @Description: 
-->
<template>
  <div class="demo_panel">
    <h3 class="demo_title">加载Shp</h3>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from "vue";
import { useCesiumStore } from "@/store/cesiumStore";
import { useCesiumCleanup } from "@/hooks/useCesiumCleanup";
import * as Cesium from "cesium";
import * as shapefile from "shapefile";
import proj4 from "proj4";
import shpUrl from '@/assets/modules/shp/china.shp?url'
import dbfUrl from '@/assets/modules/shp/china.dbf?url'

let viewer;

// 定义源投影 (来自 china.prj) 
const sourceProjection = `PROJCS["China_Lambert_Conformal_Conic",GEOGCS["GCS_Beijing_1954",DATUM["D_Beijing_1954",SPHEROID["Krasovsky_1940",6378245.0,298.3]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Lambert_Conformal_Conic"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",105.0],PARAMETER["Standard_Parallel_1",30.0],PARAMETER["Standard_Parallel_2",62.0],PARAMETER["Latitude_Of_Origin",0.0],UNIT["Meter",1.0]]`;

// 递归转换坐标
const reprojectCoordinates = (coords) => {
  if (!Array.isArray(coords)) return coords;
  // [x, y] 或 [x, y, z]
  if (typeof coords[0] === 'number') {
    return proj4(sourceProjection, 'EPSG:4326', coords);
  }
  return coords.map(reprojectCoordinates);
};

const loadShp =  () => {

  shapefile.read(shpUrl, dbfUrl).then((geojson) => {
    // 检查 geojson 是否为空或格式不正确
    if (!geojson || !geojson.features || geojson.features.length === 0) {
      console.warn("Empty or invalid GeoJSON data");
      return;
    }

    // 转换坐标系
    try {
      geojson.features.forEach(feature => {
        if (feature.geometry && feature.geometry.coordinates) {
          feature.geometry.coordinates = reprojectCoordinates(feature.geometry.coordinates);
        }
      });
    } catch (e) {
      console.error("Reprojection failed:", e);
      return;
    }

    Cesium.GeoJsonDataSource.load(geojson, {
      stroke: Cesium.Color.BLUE,
      fill: Cesium.Color.SKYBLUE.withAlpha(0.5),
      strokeWidth: 2,
    }).then((dataSource) => {
      viewer.dataSources.add(dataSource);
      viewer.zoomTo(dataSource);
    }).catch(err => {
      console.error("Cesium GeoJsonDataSource load error:", err);
    });
  }).catch((error) => {
    console.error("Error loading shapefile:", error);
  });
};

onMounted(() => {
  viewer = useCesiumStore().viewer;
  if (!viewer) return;
  loadShp();
});

useCesiumCleanup(() => {
  if (viewer) {
    viewer.dataSources.removeAll();
  }
});
</script>
