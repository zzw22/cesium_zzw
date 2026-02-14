<!--
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2026-02-04 15:52:51
 * @FilePath: \src\views\layers\tms.vue
 * @Description: 
-->
<template>
  <div class="demo_panel">
    <h3 class="demo_title">TMS 加载</h3>
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

  const provider = new Cesium.TileMapServiceImageryProvider({
    url: Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
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
