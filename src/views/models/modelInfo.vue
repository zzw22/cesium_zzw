<!--
 * @Title: 点击获取模型信息
 * @Description: 点击模型显示其属性信息
-->
<template>
  <div class="demo_panel">
    <h3 class="demo_title">模型交互</h3>
    <div class="text-xs text-gray-500 mb-2">
      点击场景中的模型查看信息
    </div>
    <div v-if="selectedInfo" class="bg-gray-50 p-2 rounded text-sm">
      <div>名称: {{ selectedInfo.name }}</div>
      <div>ID: {{ selectedInfo.id }}</div>
      <div>位置: {{ selectedInfo.position }}</div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useCesiumStore } from '@/store/cesiumStore';
import * as Cesium from 'cesium';
import { useCesiumCleanup } from '@/hooks/useCesiumCleanup';

let viewer = null;
let handler = null;
let entities = [];
const selectedInfo = ref(null);
const modelUrl = 'https://data.mars3d.cn/gltf/mars/qiche.gltf';

onMounted(() => {
  const store = useCesiumStore();
  viewer = store.viewer;
  if (!viewer) return;

  // 添加几个模型
  const centerLon = 114.3055;
  const centerLat = 30.5928;
  
  for (let i = 0; i < 5; i++) {
    const position = Cesium.Cartesian3.fromDegrees(
      centerLon + i * 0.001,
      centerLat,
      0
    );
    
    const entity = viewer.entities.add({
      name: `汽车模型 ${i + 1}`,
      id: `car_${i}`,
      position: position,
      model: {
        uri: modelUrl,
        scale: 1.0
      },
      description: `这是一辆编号为 ${i + 1} 的汽车模型`
    });
    entities.push(entity);
  }

  viewer.zoomTo(entities);

  // 添加点击事件
  handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction((movement) => {
    const pickedObject = viewer.scene.pick(movement.position);
    
    if (Cesium.defined(pickedObject)) {
        // Handle Entity
        if (pickedObject.id instanceof Cesium.Entity) {
            const entity = pickedObject.id;
            const cartographic = Cesium.Cartographic.fromCartesian(entity.position.getValue(viewer.clock.currentTime));
            
            selectedInfo.value = {
                name: entity.name,
                id: entity.id,
                position: `[${Cesium.Math.toDegrees(cartographic.longitude).toFixed(4)}, ${Cesium.Math.toDegrees(cartographic.latitude).toFixed(4)}]`
            };
        }
        // Handle Primitive (if needed, e.g. model primitive)
        else if (pickedObject.primitive instanceof Cesium.Model) {
             selectedInfo.value = {
                name: 'Primitive Model',
                id: pickedObject.id || 'Unknown',
                position: 'Unknown'
            };
        }
    } else {
        selectedInfo.value = null;
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
});

useCesiumCleanup(() => {
  if (viewer) {
    entities.forEach(e => viewer.entities.remove(e));
    if (handler) {
      handler.destroy();
    }
  }
});
</script>
