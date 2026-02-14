<!--
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2026-02-06 11:39:35
 * @FilePath: \src\views\elements\gif.vue
 * @Description: 
-->

<template>
  <div class="demo_panel">
    <h3 class="demo_title">GIF/动画示例</h3>
    <div class="button-group">
      <div class="flex gap-2">
        <el-button size="small" @click="addAnimatedBillboard">添加动画图标</el-button>
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

onMounted(() => {
  viewer = useCesiumStore().viewer;
});

const addAnimatedBillboard = () => {
  if (!viewer) return;

  // 模拟3帧动画 (使用 Canvas 绘制不同颜色的圆)
  const frames = [];
  const colors = ['red', 'yellow', 'blue'];
  
  colors.forEach(color => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(32, 32, 30, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 4;
    ctx.stroke();
    frames.push(canvas.toDataURL());
  });

  let frameIndex = 0;
  let lastTime = Date.now();

  viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(114.30, 30.60, 100),
    billboard: {
      image: new Cesium.CallbackProperty(() => {
        const now = Date.now();
        if (now - lastTime > 500) { // 每500ms切换一帧
          frameIndex = (frameIndex + 1) % frames.length;
          lastTime = now;
        }
        return frames[frameIndex];
      }, false),
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM
    }
  });

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(114.30, 30.60, 5000)
  });
};

useCesiumCleanup(() => {
  if (viewer) viewer.entities.removeAll();
});
</script>
