<!--
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2026-02-04 15:53:26
 * @FilePath: \src\views\layers\tdt.vue
 * @Description: 
-->
<template>
  <div class="demo_panel">
    <h3 class="demo_title">天地图加载</h3>
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

  const token = 'bcc62222fc634ec736589c483de933e6'
  const provider = new Cesium.WebMapTileServiceImageryProvider({
    url: 'https://t{s}.tianditu.gov.cn/vec_w/wmts?tk=' + token,
    subdomains: ['0','1','2','3','4','5','6','7'],
    layer: 'vec',
    style: 'default',
    tileMatrixSetID: 'w',
    format: 'tiles'
  })

  const layer = viewer.imageryLayers.addImageryProvider(provider)
  imageryLayer.value = layer
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(114.3055, 30.5928, 500000)
  })
})

useCesiumCleanup(() => {
  if (viewer && imageryLayer.value) {
    viewer.imageryLayers.remove(imageryLayer.value)
  }
})
</script>
