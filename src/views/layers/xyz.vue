<!--
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2026-02-04 15:52:38
 * @FilePath: \src\views\layers\xyz.vue
 * @Description: 
-->
<template></template>

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

  const provider = new Cesium.UrlTemplateImageryProvider({
    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maximumLevel: 19
  })

  const layer = viewer.imageryLayers.addImageryProvider(provider)
  imageryLayer.value = layer
  viewer.camera.flyHome(1.2)
})

useCesiumCleanup(() => {
  if (viewer && imageryLayer.value) {
    viewer.imageryLayers.remove(imageryLayer.value)
  }
})
</script>

