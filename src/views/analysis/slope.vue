<template>
  <div class="analysis-panel">
    <div class="panel-header">坡度分析</div>
    <div class="panel-content">
       <el-checkbox v-model="enabled" @change="toggleAnalysis">开启坡度分析</el-checkbox>
       <div class="mt-2 text-xs text-gray-500">
           注：需要地形数据支持
       </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useCesiumStore } from '@/store/cesiumStore';
import { useCesiumCleanup } from '@/hooks/useCesiumCleanup';
import * as Cesium from 'cesium';

const enabled = ref(false);
let viewer = null;

onMounted(() => {
  const store = useCesiumStore();
  viewer = store.viewer;
});

useCesiumCleanup(() => {
   if (viewer) {
       viewer.scene.globe.material = undefined;
   }
});

const toggleAnalysis = () => {
    if (!viewer) return;
    
    if (enabled.value) {
        // Requires Cesium 1.98+
        // Simplified Slope Ramp
        const material = Cesium.Material.fromType('SlopeRamp');
        const shadingUniforms = material.uniforms;
        shadingUniforms.image = getRamp([0.0, 0.29, 0.5, Math.sqrt(2)/2, 0.87], [
            [0, 255, 0, 255], 
            [255, 255, 0, 255], 
            [255, 0, 0, 255], 
            [255, 0, 255, 255], 
            [0, 0, 255, 255]
        ]); 
        
        viewer.scene.globe.material = material;
    } else {
        viewer.scene.globe.material = undefined;
    }
};

function getRamp(elevationRamp, colorRamp) {
    const ramp = document.createElement('canvas');
    ramp.width = 100;
    ramp.height = 1;
    const ctx = ramp.getContext('2d');
    
    const grd = ctx.createLinearGradient(0, 0, 100, 0);
    for (let i = 0; i < elevationRamp.length; i++) {
        const color = colorRamp[i];
        grd.addColorStop(elevationRamp[i], `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]/255})`);
    }
    
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 100, 1);
    
    return ramp;
}
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
}
.panel-header {
  font-weight: bold;
  margin-bottom: 10px;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}
</style>
