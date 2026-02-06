<!--
 * @Title: Entity 交互事件
 * @Description: 演示点击和悬停拾取 Entity
-->
<template>
  <div class="absolute top-4 left-4 bg-white p-4 rounded shadow z-10">
    <div class="mb-2 font-bold">交互事件示例</div>
    <div class="text-sm mb-2">尝试点击或悬停在红色球体上</div>
    <div v-if="message" class="text-red-500 font-bold">{{ message }}</div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useCesiumStore } from '@/store/cesiumStore';
import * as Cesium from 'cesium';
import { useCesiumCleanup } from '@/hooks/useCesiumCleanup';

let viewer = null;
let handler = null;
const message = ref('');

onMounted(() => {
  viewer = useCesiumStore().viewer;
  initScene();
});

const initScene = () => {
  if (!viewer) return;

  // 添加一个测试实体
  const entity = viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(114.30, 30.60, 100),
    ellipsoid: {
      radii: new Cesium.Cartesian3(5000, 5000, 5000),
      material: Cesium.Color.RED
    }
  });
  
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(114.30, 30.60, 20000)
  });

  // 注册事件处理器
  handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

  let isHovering = false;

  // 左键点击
  handler.setInputAction((movement) => {
    const pickedObject = viewer.scene.pick(movement.position);
    if (Cesium.defined(pickedObject) && pickedObject.id === entity) {
      message.value = '点击了红色球体!';
      // 点击闪烁效果
      entity.ellipsoid.material = Cesium.Color.BLUE;
      setTimeout(() => {
        // 恢复为当前状态颜色（如果还在悬停就是黄色，否则红色）
        entity.ellipsoid.material = isHovering ? Cesium.Color.YELLOW : Cesium.Color.RED;
      }, 200);
    } else {
      message.value = '点击了空白区域';
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  // 鼠标移动
  handler.setInputAction((movement) => {
    const pickedObject = viewer.scene.pick(movement.endPosition);
    if (Cesium.defined(pickedObject) && pickedObject.id === entity) {
      if (!isHovering) {
        isHovering = true;
        viewer.container.style.cursor = 'pointer';
        entity.ellipsoid.material = Cesium.Color.YELLOW;
        message.value = '悬停状态';
      }
    } else {
      if (isHovering) {
        isHovering = false;
        viewer.container.style.cursor = 'default';
        entity.ellipsoid.material = Cesium.Color.RED;
        message.value = '';
      }
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
};

useCesiumCleanup(() => {
  if (handler) {
    handler.destroy();
    handler = null;
  }
  if (viewer) {
    viewer.entities.removeAll();
    viewer.container.style.cursor = 'default';
  }
});
</script>
