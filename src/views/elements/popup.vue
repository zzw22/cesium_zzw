<!--
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2026-02-06 11:38:16
 * @FilePath: \src\views\elements\popup.vue
 * @Description: 
-->
<template>
  <div 
    class="absolute top-4 left-4 bg-white p-4 rounded shadow z-50"
  >
    <div class="mb-2 font-bold">Popup 点击示例</div>
  </div>

  <!-- 弹窗容器 -->
  <div 
    v-show="showPopup && isVisible" 
    ref="popupRef" 
    class="popup-container"
    :style="{ top: popupPos.y + 'px', left: popupPos.x + 'px' }"
  >
    <div class="flex justify-between items-center mb-2 border-b pb-1">
      <div class="font-bold text-base">{{ popupInfo.title }}</div>
      <div class="cursor-pointer text-gray-400 hover:text-gray-600" @click="closePopup">✕</div>
    </div>
    <div class="text-sm text-gray-600 leading-relaxed">{{ popupInfo.content }}</div>
    
    <!-- 三角箭头 -->
    <div class="popup-arrow"></div>
  </div>
</template>

<script setup>
import { onMounted, ref, reactive } from 'vue';
import { useCesiumStore } from '@/store/cesiumStore';
import * as Cesium from 'cesium';
import { useCesiumCleanup } from '@/hooks/useCesiumCleanup';

let viewer = null;
let handler = null;
let selectedEntity = null;

const showPopup = ref(false);
const isVisible = ref(false);
const popupPos = ref({ x: 0, y: 0 });
const popupInfo = reactive({
  title: '',
  content: ''
});

// 模拟数据
const pointsData = [
  {
    id: 'hhl',
    name: '黄鹤楼',
    desc: '黄鹤楼位于湖北省武汉市长江南岸的武昌蛇山之巅，濒临万里长江，是国家5A级旅游景区，“江南三大名楼”之一。',
    position: [114.30, 30.55], // 近似坐标
    color: Cesium.Color.ORANGE
  }
];

onMounted(() => {
  viewer = useCesiumStore().viewer;
  if (!viewer) return;
  
  initScene();
  initInteraction();
  
  viewer.scene.postRender.addEventListener(updatePopupPos);
});

const initScene = () => {
  // 清除已有实体
  viewer.entities.removeAll();

  pointsData.forEach(item => {
    viewer.entities.add({
      id: item.id,
      position: Cesium.Cartesian3.fromDegrees(...item.position),
      point: {
        pixelSize: 12,
        color: item.color,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2
      },
      // 将数据绑定到 entity 的自定义属性中，方便拾取时获取
      properties: {
        title: item.name,
        content: item.desc
      }
    });
  });

  resetCamera();
};

const initInteraction = () => {
  handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  
  handler.setInputAction((movement) => {
    const pickedObject = viewer.scene.pick(movement.position);
    
    if (Cesium.defined(pickedObject) && pickedObject.id instanceof Cesium.Entity) {
      console.log('Picked entity:', pickedObject.id);
      const entity = pickedObject.id;
      // 更新选中状态
      selectedEntity = entity;
      
      // 更新弹窗内容 - 安全获取属性
      const currentTime = viewer.clock.currentTime;
      if (entity.properties) {
        popupInfo.title = entity.properties.title ? 
          (typeof entity.properties.title.getValue === 'function' ? entity.properties.title.getValue(currentTime) : entity.properties.title) 
          : '未知';
        popupInfo.content = entity.properties.content ? 
          (typeof entity.properties.content.getValue === 'function' ? entity.properties.content.getValue(currentTime) : entity.properties.content) 
          : '暂无描述';
      } else {
        popupInfo.title = entity.name || '未知';
        popupInfo.content = '暂无描述';
      }
      
      showPopup.value = true;
      // 立即更新一次位置
      updatePopupPos();
    } else {
      // 点击空白处关闭
      closePopup();
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  
  // 鼠标样式
  handler.setInputAction((movement) => {
    const pickedObject = viewer.scene.pick(movement.endPosition);
    if (Cesium.defined(pickedObject) && pickedObject.id instanceof Cesium.Entity) {
      viewer.container.style.cursor = 'pointer';
    } else {
      viewer.container.style.cursor = 'default';
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
};

// 复用 occluder 避免每帧创建，但在 update 中需更新位置
let occluder = null;

const updatePopupPos = () => {
  try {
    if (!viewer || !showPopup.value || !selectedEntity) {
      isVisible.value = false;
      return;
    }

    // 确保 viewer 未销毁
    if (viewer.isDestroyed()) return;

    const currentTime = viewer.clock.currentTime;
    const position = selectedEntity.position.getValue(currentTime);
    
    if (position) {
      // Cesium 1.108+ 移除了 wgs84ToWindowCoordinates，改用 worldToWindowCoordinates
      const canvasPosition = Cesium.SceneTransforms.worldToWindowCoordinates(viewer.scene, position);
      
      if (canvasPosition) {
        // 修正坐标：添加 canvas 的偏移量，解决 fixed 定位不准的问题
        const canvasRect = viewer.canvas.getBoundingClientRect();
        popupPos.value = { 
          x: canvasPosition.x + canvasRect.left, 
          y: canvasPosition.y + canvasRect.top 
        };
        
        // 地球遮挡判断
        const cameraPosition = viewer.camera.position;
        const ellipsoid = viewer.scene.globe.ellipsoid;
        
        if (!occluder) {
          occluder = new Cesium.EllipsoidalOccluder(ellipsoid, cameraPosition);
        } else {
          occluder.cameraPosition = cameraPosition;
        }
        
        isVisible.value = true; 
        
      } else {
        isVisible.value = false;
      }
    }
  } catch (error) {
    console.warn('Error updating popup position:', error);
    isVisible.value = false;
  }
};

const closePopup = () => {
  showPopup.value = false;
  selectedEntity = null;
};

const resetCamera = () => {
  const storeViewer = viewer || useCesiumStore().viewer;
  if (storeViewer) {
    // 如果 viewer 还没赋值给局部变量，进行赋值
    if (!viewer) viewer = storeViewer;
    
    console.log('Resetting camera to Wuhan...');
    storeViewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(114.33, 30.545, 10000),
      orientation: {
        heading: Cesium.Math.toRadians(0.0),
        pitch: Cesium.Math.toRadians(-90.0),
        roll: 0.0
      },
      duration: 1.5
    });
  } else {
    console.warn('Viewer not found when resetting camera');
  }
};

useCesiumCleanup(() => {
  if (viewer) {
    viewer.scene.postRender.removeEventListener(updatePopupPos);
    if (handler) {
      handler.destroy();
      handler = null;
    }
    viewer.entities.removeAll();
    viewer.container.style.cursor = 'default';
  }
});
</script>

<style scoped>
.popup-container {
  position: fixed;
  background-color: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  width: 256px;
  z-index: 9999;
  transform: translate(-50%, -100%);
  margin-top: -10px;
}

.popup-arrow {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  width: 12px;
  height: 12px;
  background-color: white;
  border-bottom: 1px solid #e5e7eb;
  border-right: 1px solid #e5e7eb;
  pointer-events: none;
}
</style>
