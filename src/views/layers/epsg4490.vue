<!--
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2026-02-04 15:53:40
 * @FilePath: \src\views\layers\epsg4490.vue
 * @Description: 
-->
<template>
  <div class="demo_panel">
    <h3 class="demo_title">EPSG:4490 投影示例</h3>
  </div>
</template>

<script setup>
import { onMounted, shallowRef } from 'vue'
import { useCesiumStore } from '@/store/cesiumStore'
import * as Cesium from 'cesium'
import { useCesiumCleanup } from '@/hooks/useCesiumCleanup'

let viewer = null
const imageryLayer = shallowRef(null)

onMounted(() => {
  viewer = useCesiumStore().viewer
  if (!viewer) return

  const token = '6c99c7793f41fccc4bd595b03711913e'
  const provider = new Cesium.WebMapTileServiceImageryProvider({
    url: 'https://t{s}.tianditu.gov.cn/vec_c/wmts?tk=' + token,
    subdomains: ['0','1','2','3','4','5','6','7'],
    layer: 'vec',
    style: 'default',
    tileMatrixSetID: 'c',
    format: 'tiles'
  })

  const layer = viewer.imageryLayers.addImageryProvider(provider)
  imageryLayer.value = layer
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(105, 35, 5000000)
  })
})

useCesiumCleanup(() => {
  if (viewer && imageryLayer.value) {
    viewer.imageryLayers.remove(imageryLayer.value)
  }
})
</script>
