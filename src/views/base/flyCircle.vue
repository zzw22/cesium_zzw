<template>
  <div class="bg-white/90 p-4 rounded-lg shadow-lg absolute top-4 left-4 h-auto w-80 pointer-events-auto">
    <div class="flex flex-col gap-4">
      <div class="text-lg font-bold text-gray-800 border-b pb-2">
        绕点飞行
      </div>
      
      <div class="flex flex-col gap-3">
        <div class="flex gap-2">
          <el-button type="primary" size="small" @click="pickCenter" :disabled="isRotating" class="flex-1">
            <el-icon class="mr-1"><Location /></el-icon>
            {{ hasCenter ? '重新拾取中心' : '拾取中心点' }}
          </el-button>
          <el-button 
            :type="isRotating ? 'danger' : 'success'" 
            size="small" 
            @click="toggleRotate" 
            :disabled="!hasCenter"
            class="flex-1"
          >
            <el-icon class="mr-1"><VideoPlay v-if="!isRotating"/><VideoPause v-else/></el-icon>
            {{ isRotating ? '停止旋转' : '开始旋转' }}
          </el-button>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600 w-12">速度:</span>
          <el-slider 
            v-model="speed" 
            :min="0.1" 
            :max="2" 
            :step="0.1"
            class="flex-1"
            :disabled="isRotating"
          />
          <span class="text-sm text-gray-600 w-8">{{ speed }}°</span>
        </div>

        <div v-if="message" class="text-xs text-blue-600 bg-blue-50 p-2 rounded">
          {{ message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, onUnmounted } from 'vue';
import { useCesiumStore } from '@/store/cesiumStore';
import { useCesiumCleanup } from '@/hooks/useCesiumCleanup';
import { Location, VideoPlay, VideoPause } from '@element-plus/icons-vue';
import * as Cesium from 'cesium';

const store = useCesiumStore();
const speed = ref(0.5);
const isRotating = ref(false);
const hasCenter = ref(false);
const message = ref('请先点击"拾取中心点"按钮，然后在地图上点击选择旋转中心。');

// 状态变量
let viewer = null;
let centerPoint = null; // Cartesian3
let handler = null;

// 清理钩子
useCesiumCleanup(() => {
  stopRotate();
  clearHandler();
  if (viewer && viewer.camera) {
    viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
  }
});

const clearHandler = () => {
  if (handler) {
    handler.destroy();
    handler = null;
  }
};

const pickCenter = () => {
  if (!viewer) return;
  
  message.value = '请在地图上点击选择一个点作为旋转中心...';
  
  clearHandler();
  handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  
  handler.setInputAction((movement) => {
    const cartesian = viewer.scene.pickPosition(movement.position);
    
    if (cartesian) {
      centerPoint = cartesian;
      hasCenter.value = true;
      message.value = '中心点已选定，点击"开始旋转"启动。';
      
      // 添加一个点实体作为视觉反馈
      viewer.entities.removeById('center-point');
      viewer.entities.add({
        id: 'center-point',
        position: cartesian,
        point: {
          pixelSize: 10,
          color: Cesium.Color.YELLOW,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY // 确保始终可见
        }
      });
      
      clearHandler();
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
};

const toggleRotate = () => {
  if (isRotating.value) {
    stopRotate();
  } else {
    startRotate();
  }
};

const startRotate = () => {
  if (!viewer || !centerPoint) return;
  
  // 1. 锁定相机到中心点
  // 计算当前相机位置到中心点的距离（保持距离不变）
  const distance = Cesium.Cartesian3.distance(viewer.camera.positionWC, centerPoint);
  
  // 设置相机看向中心点
  // 使用 lookAt 锁定参考系
  // 注意：lookAt 会改变相机的参考系，使得 (0,0,0) 变成 centerPoint
  // 第一个参数是目标点，第二个参数是偏移量（相机在局部坐标系中的位置）
  
  // 我们需要先将相机飞到合适的位置或者直接锁定当前视角
  // 这里选择保持当前视角的相对位置，但锁定焦点
  
  try {
    const transform = Cesium.Transforms.eastNorthUpToFixedFrame(centerPoint);
    
    // 将相机当前位置转换为局部坐标
    // 这步比较复杂，简单的方法是让相机直接看向中心，并保持当前距离
    // 或者直接使用 camera.lookAt
    
    // 获取当前相机的位置、方向等
    const heading = viewer.camera.heading;
    const pitch = viewer.camera.pitch;
    const range = distance;
    
    viewer.camera.lookAt(centerPoint, new Cesium.HeadingPitchRange(heading, pitch, range));
    
    // 禁用默认的鼠标操作，防止冲突（可选，但 lookAt 模式下通常自带交互）
    viewer.scene.screenSpaceCameraController.enableLook = false; // 旋转
    // viewer.scene.screenSpaceCameraController.enableRotate = false; // 拖拽旋转 - 实际上 lookAt 模式下这个是用来绕点旋转的，应该保留
    
    isRotating.value = true;
    message.value = '正在旋转中...';
    
    // 添加帧回调
    viewer.clock.onTick.addEventListener(onTick);
  } catch (e) {
    console.error('Start rotate failed:', e);
    message.value = '启动旋转失败';
  }
};

const stopRotate = () => {
  if (!viewer) return;
  
  isRotating.value = false;
  message.value = '旋转已停止。';
  
  // 移除帧回调
  viewer.clock.onTick.removeEventListener(onTick);
  
  // 解除锁定，恢复相机参考系到世界坐标
  viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
  
  // 恢复控制器设置
  viewer.scene.screenSpaceCameraController.enableLook = true;
  
  // 移除中心点标记
  // viewer.entities.removeById('center-point'); // 可选：保留点以便下次使用
};

const onTick = () => {
  if (viewer && isRotating.value) {
    // 每一帧让相机绕中心旋转
    // 因为使用了 lookAt，相机现在是在目标点的局部坐标系中
    // rotateRight 会绕着局部坐标系的 Up 轴（也就是目标点的法线，因为用了 eastNorthUpToFixedFrame 隐式地）
    // 实际上 lookAt 设置了 transform，所以 rotateRight 仅仅是改变 heading
    
    viewer.camera.rotateRight(Cesium.Math.toRadians(speed.value));
  }
};

onMounted(() => {
  viewer = store.viewer;
  if (!viewer) {
    message.value = 'Cesium Viewer 未初始化';
    return;
  }
});
useCesiumCleanup(() => {
  stopRotate();
  clearHandler();
  viewer.entities.removeById('center-point');
});
</script>