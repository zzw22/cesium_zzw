<template>
  <div class="analysis-panel">
    <div class="panel-header">日照分析</div>
    <div class="panel-content">
       <div class="mb-2">
         <span>日期: </span>
         <el-date-picker v-model="date" type="date" placeholder="选择日期" size="small" @change="updateTime"></el-date-picker>
       </div>
       <div class="mb-2">
         <span>时间: </span>
         <el-slider v-model="hour" :min="0" :max="24" :step="0.1" @input="updateTime"></el-slider>
       </div>
       <div class="mb-2">
         <el-checkbox v-model="shadowsEnabled" @change="toggleShadows">开启阴影</el-checkbox>
       </div>
       <el-button size="small" type="primary" @click="play">播放</el-button>
       <el-button size="small" @click="stop">停止</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useCesiumStore } from '@/store/cesiumStore';
import { useCesiumCleanup } from '@/hooks/useCesiumCleanup';
import * as Cesium from 'cesium';

const date = ref(new Date());
const hour = ref(12);
const shadowsEnabled = ref(true);
let viewer = null;
let animationFrame = null;
let isPlaying = false;

onMounted(() => {
  const store = useCesiumStore();
  viewer = store.viewer;
  if (viewer) {
      viewer.shadows = shadowsEnabled.value;
      updateTime();
  }
});

useCesiumCleanup(() => {
   stop();
   if (viewer) {
       viewer.shadows = false;
   }
});

const updateTime = () => {
    if (!viewer) return;
    const d = new Date(date.value);
    d.setHours(Math.floor(hour.value));
    d.setMinutes(Math.floor((hour.value % 1) * 60));
    const julianDate = Cesium.JulianDate.fromDate(d);
    viewer.clock.currentTime = julianDate;
};

const toggleShadows = () => {
    if (viewer) {
        viewer.shadows = shadowsEnabled.value;
        viewer.terrainShadows = shadowsEnabled.value ? Cesium.ShadowMode.ENABLED : Cesium.ShadowMode.DISABLED;
    }
};

const play = () => {
    if (isPlaying) return;
    isPlaying = true;
    animate();
};

const stop = () => {
    isPlaying = false;
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }
};

const animate = () => {
    if (!isPlaying) return;
    hour.value += 0.1;
    if (hour.value > 24) hour.value = 0;
    updateTime();
    animationFrame = requestAnimationFrame(animate);
};
</script>

<style scoped>
.analysis-panel {
  position: absolute;
  top: 10px;
  left: 10px;
  background: white;
  padding: 10px;
  border-radius: 4px;
  z-index: 100;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  width: 250px;
}
.panel-header {
  font-weight: bold;
  margin-bottom: 10px;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}
.mb-2 {
    margin-bottom: 8px;
    font-size: 12px;
}
</style>
