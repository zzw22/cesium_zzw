<template>
  <div class="analysis-panel">
    <div class="panel-header">透视分析(通视)</div>
    <div class="panel-content">
       <el-button size="small" type="primary" @click="startAnalysis">绘制视线</el-button>
       <el-button size="small" @click="clearAnalysis">清除</el-button>
       <div v-if="result" class="mt-2 text-sm" :class="result.visible ? 'text-green-500' : 'text-red-500'">
           {{ result.visible ? '可见' : '不可见' }}
       </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useCesiumStore } from '@/store/cesiumStore';
import { useCesiumCleanup } from '@/hooks/useCesiumCleanup';
import * as Cesium from 'cesium';

const result = ref(null);
let viewer = null;
let handler = null;
let startPoint = null;
let endPoint = null;

onMounted(() => {
  const store = useCesiumStore();
  viewer = store.viewer;
});

useCesiumCleanup(() => {
   clearAnalysis();
});

const startAnalysis = () => {
    if (!viewer) return;
    clearAnalysis();
    
    handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click) => {
        const cartesian = viewer.scene.pickPosition(click.position);
        if (cartesian) {
            if (!startPoint) {
                startPoint = cartesian;
                viewer.entities.add({
                    position: startPoint,
                    point: { pixelSize: 10, color: Cesium.Color.GREEN }
                });
            } else {
                endPoint = cartesian;
                viewer.entities.add({
                    position: endPoint,
                    point: { pixelSize: 10, color: Cesium.Color.RED }
                });
                
                analyzeVisibility();
                
                handler.destroy();
                handler = null;
            }
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
};

const analyzeVisibility = () => {
    // Simplified Visibility Check
    // Ray cast from start to end
    const direction = Cesium.Cartesian3.subtract(endPoint, startPoint, new Cesium.Cartesian3());
    const distance = Cesium.Cartesian3.magnitude(direction);
    Cesium.Cartesian3.normalize(direction, direction);
    
    const ray = new Cesium.Ray(startPoint, direction);
    const resultObj = viewer.scene.pickFromRay(ray);
    
    let isVisible = true;
    if (Cesium.defined(resultObj) && resultObj.object) {
        // If hit something, check distance
        const hitDistance = Cesium.Cartesian3.distance(startPoint, resultObj.position);
        if (hitDistance < distance) {
            isVisible = false;
        }
    }
    
    result.value = { visible: isVisible };
    
    // Draw line
    viewer.entities.add({
        polyline: {
            positions: [startPoint, endPoint],
            width: 2,
            material: isVisible ? Cesium.Color.GREEN : Cesium.Color.RED,
            depthFailMaterial: Cesium.Color.RED
        }
    });
};

const clearAnalysis = () => {
    if (viewer) {
        viewer.entities.removeAll();
    }
    startPoint = null;
    endPoint = null;
    result.value = null;
    if (handler) {
        handler.destroy();
        handler = null;
    }
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
}
.panel-header {
  font-weight: bold;
  margin-bottom: 10px;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}
</style>
