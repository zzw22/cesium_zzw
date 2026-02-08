<template>
  <div class="analysis-panel">
    <div class="panel-header">方量分析</div>
    <div class="panel-content">
       <div class="mb-2">
         <span>基准高度: </span>
         <el-input-number v-model="baseHeight" :min="0" :max="5000" size="small"></el-input-number>
       </div>
       <el-button size="small" type="primary" @click="startAnalysis">绘制区域</el-button>
       <el-button size="small" @click="clearAnalysis">清除</el-button>
       <div v-if="result" class="mt-2 p-2 bg-gray-50 rounded">
           <div>挖方体积: {{ result.cut }} m³</div>
           <div>填方体积: {{ result.fill }} m³</div>
           <div>总面积: {{ result.area }} m²</div>
       </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useCesiumStore } from '@/store/cesiumStore';
import { useCesiumCleanup } from '@/hooks/useCesiumCleanup';
import * as Cesium from 'cesium';

const baseHeight = ref(0);
const result = ref(null);
let viewer = null;
let handler = null;
let activeShapePoints = [];
let activeShape = null;
let floatingPoint = null;

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
    
    // Simple Polygon Draw Logic
    handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((event) => {
        const earthPosition = viewer.scene.pickPosition(event.position);
        if (Cesium.defined(earthPosition)) {
            if (activeShapePoints.length === 0) {
                floatingPoint = createPoint(earthPosition);
                activeShapePoints.push(earthPosition);
                const dynamicPositions = new Cesium.CallbackProperty(function () {
                    return activeShapePoints;
                }, false);
                activeShape = drawShape(dynamicPositions);
            }
            activeShapePoints.push(earthPosition);
            createPoint(earthPosition);
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    
    handler.setInputAction((event) => {
        if (Cesium.defined(floatingPoint)) {
            const newPosition = viewer.scene.pickPosition(event.endPosition);
            if (Cesium.defined(newPosition)) {
                floatingPoint.position.setValue(newPosition);
                activeShapePoints.pop();
                activeShapePoints.push(newPosition);
            }
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    
    handler.setInputAction(() => {
        finishDrawing();
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
};

function createPoint(worldPosition) {
    return viewer.entities.add({
        position: worldPosition,
        point: { color: Cesium.Color.WHITE, pixelSize: 5 }
    });
}

function drawShape(positionData) {
    return viewer.entities.add({
        polygon: {
            hierarchy: positionData,
            material: Cesium.Color.RED.withAlpha(0.3),
            perPositionHeight: true
        }
    });
}

function finishDrawing() {
    activeShapePoints.pop();
    if(activeShapePoints.length < 3) return;
    
    // Mock Calculation
    // Real volume calculation requires sampling terrain/models height vs baseHeight within polygon
    const area = 1000 + Math.random() * 500;
    const avgHeight = 50 + Math.random() * 20;
    const diff = avgHeight - baseHeight.value;
    
    result.value = {
        area: area.toFixed(2),
        cut: diff > 0 ? (area * diff).toFixed(2) : 0,
        fill: diff < 0 ? (area * Math.abs(diff)).toFixed(2) : 0
    };
    
    if (handler) {
        handler.destroy();
        handler = null;
    }
    viewer.entities.remove(floatingPoint);
    floatingPoint = null;
}

const clearAnalysis = () => {
    if (viewer) {
        viewer.entities.removeAll();
    }
    result.value = null;
    activeShapePoints = [];
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
.mb-2 {
    margin-bottom: 8px;
    font-size: 12px;
}
</style>
