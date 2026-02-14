<!--
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2026-02-13 21:18:48
 * @FilePath: \src\views\elements\geoJson.vue
 * @Description: 
-->
<template>
  <div class="demo_panel">
    <h3 class="demo_title">GeoJSON 示例</h3>
    <div class="button-group">
      <div class="flex gap-2">
        <el-button size="small" @click="loadGeoJson">加载 GeoJSON</el-button>
        <el-button size="small" type="danger" @click="clear">清除</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useCesiumStore } from '@/store/cesiumStore';
import * as Cesium from 'cesium';
import { useCesiumCleanup } from '@/hooks/useCesiumCleanup';

let viewer = null;
let dataSource = null;

onMounted(() => {
  viewer = useCesiumStore().viewer;
});

const loadGeoJson = async () => {
  if (!viewer) return;
  clear();

  const data = {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": { "name": "Zone A", "color": "#ff0000" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [114.3, 30.6], [114.4, 30.6], [114.4, 30.7], [114.3, 30.7], [114.3, 30.6]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "name": "Path B" },
        "geometry": {
          "type": "LineString",
          "coordinates": [[114.45, 30.6], [114.55, 30.65]]
        }
      }
    ]
  };

  try {
    dataSource = await Cesium.GeoJsonDataSource.load(data, {
      stroke: Cesium.Color.HOTPINK,
      fill: Cesium.Color.PINK.withAlpha(0.5),
      strokeWidth: 3
    });
    viewer.dataSources.add(dataSource);
    viewer.zoomTo(dataSource);
  } catch (error) {
    console.error(error);
  }
};

const clear = () => {
  if (viewer && dataSource) {
    viewer.dataSources.remove(dataSource);
    dataSource = null;
  }
};

useCesiumCleanup(() => {
  clear();
});
</script>
