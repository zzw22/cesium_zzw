<!--
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2026-02-04 15:53:14
 * @FilePath: \src\views\layers\wmts.vue
 * @Description: 
-->
<template>
  <div class="demo_panel">
    <h3 class="demo_title">WMTS 加载</h3>
  </div>
</template>

<script setup>
import { onMounted, shallowRef } from "vue";
import { useCesiumStore } from "@/store/cesiumStore";
import * as Cesium from "cesium";
import { useCesiumCleanup } from "@/hooks/useCesiumCleanup";

let viewer = null;
const imageryLayer = shallowRef(null);

const addLayer = () =>{
   // 加载天地图wmts
        let _layer = 'vec';
        let token = 'bcc62222fc634ec736589c483de933e6';
        let maxLevel = 18;
        let matrixIds = new Array(maxLevel);
        for (let z = 0; z <= maxLevel; z++) {
            matrixIds[z] = (z + 1).toString();
        }
        let _url = 'http://t{s}.tianditu.gov.cn/' + _layer + '_c/wmts?service=WMTS&version=1.0.0&request=GetTile&tilematrix={TileMatrix}&layer=' + _layer + '&style={style}&tilerow={TileRow}&tilecol={TileCol}&tilematrixset={TileMatrixSet}&format=tiles&tk=' + token;
        let wmts = new Cesium.WebMapTileServiceImageryProvider({
            url: _url,
            layer: _layer,
            credit: 'opts.credit',
            style: 'default',
            format: 'tiles',
            tileMatrixSetID: 'c',
            subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
            tileMatrixLabels: matrixIds,
            tilingScheme: new Cesium.GeographicTilingScheme(), //WebMercatorTilingScheme、GeographicTilingScheme
            maximumLevel: maxLevel
        });
        viewer.imageryLayers.addImageryProvider(wmts)

}

onMounted(() => {
  viewer = useCesiumStore().viewer;
  if (!viewer) return;
 addLayer()
});

useCesiumCleanup(() => {
  if (viewer && imageryLayer.value) {
    viewer.imageryLayers.remove(imageryLayer.value);
  }
});
</script>
